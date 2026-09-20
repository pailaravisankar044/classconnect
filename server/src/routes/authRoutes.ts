import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { dbHelper } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, role = 'student', specialization } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone ? phone.trim() : null;
    const assignedRole = role === 'teacher' ? 'teacher' : 'student';

    // Check if user already exists
    const existing = dbHelper.get('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists. Please log in.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const userRes = dbHelper.run(`
      INSERT INTO users (name, email, phone, password_hash, role, status)
      VALUES (?, ?, ?, ?, ?, 'active')
    `, [name.trim(), cleanEmail, cleanPhone, passwordHash, assignedRole]);

    const userId = Number(userRes.lastInsertRowid);
    let roleDetails: any = {};

    if (assignedRole === 'student') {
      const maxIdRes = dbHelper.get('SELECT MAX(id) as maxId FROM students');
      const nextNum = (maxIdRes?.maxId || 0) + 1;
      const studentCode = `STU${String(nextNum).padStart(5, '0')}`;

      // Optionally attach to default active course/batch if available
      const defaultCourse = dbHelper.get("SELECT id FROM courses WHERE status = 'active' ORDER BY id ASC LIMIT 1");
      const defaultBatch = defaultCourse 
        ? dbHelper.get("SELECT id FROM batches WHERE course_id = ? AND status = 'active' ORDER BY id ASC LIMIT 1", [defaultCourse.id])
        : null;

      const studentRes = dbHelper.run(`
        INSERT INTO students (user_id, student_code, course_id, batch_id)
        VALUES (?, ?, ?, ?)
      `, [userId, studentCode, defaultCourse?.id || null, defaultBatch?.id || null]);

      const studentId = Number(studentRes.lastInsertRowid);
      roleDetails = {
        studentId,
        studentCode,
        courseId: defaultCourse?.id || null,
        batchId: defaultBatch?.id || null
      };
    } else if (assignedRole === 'teacher') {
      const maxIdRes = dbHelper.get('SELECT MAX(id) as maxId FROM teachers');
      const nextNum = (maxIdRes?.maxId || 0) + 1;
      const teacherCode = `TRN${String(nextNum).padStart(5, '0')}`;

      const teacherRes = dbHelper.run(`
        INSERT INTO teachers (user_id, teacher_code, specialization, bio)
        VALUES (?, ?, ?, ?)
      `, [userId, teacherCode, specialization?.trim() || 'Online Educator', '']);

      const teacherId = Number(teacherRes.lastInsertRowid);
      roleDetails = {
        teacherId,
        teacherCode,
        specialization: specialization?.trim() || 'Online Educator'
      };
    }

    // Auto-generate JWT token
    const token = jwt.sign(
      { id: userId, email: cleanEmail, role: assignedRole, name: name.trim(), ...roleDetails },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        id: userId,
        name: name.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        role: assignedRole,
        ...roleDetails
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create account. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body; // email or phone
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email/phone and password.' });
    }

    const user = dbHelper.get(`
      SELECT * FROM users
      WHERE (email = ? OR phone = ?) AND status = 'active'
    `, [identifier.trim().toLowerCase(), identifier.trim()]);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Please check your email and password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Please check your email and password.' });
    }

    // Role-specific payload
    let roleDetails: any = {};
    if (user.role === 'student') {
      const student = dbHelper.get('SELECT id, student_code, course_id, batch_id FROM students WHERE user_id = ?', [user.id]);
      if (student) {
        roleDetails = {
          studentId: student.id,
          studentCode: student.student_code,
          courseId: student.course_id,
          batchId: student.batch_id
        };
      }
    } else if (user.role === 'teacher') {
      const teacher = dbHelper.get('SELECT id, teacher_code, specialization FROM teachers WHERE user_id = ?', [user.id]);
      if (teacher) {
        roleDetails = {
          teacherId: teacher.id,
          teacherCode: teacher.teacher_code,
          specialization: teacher.specialization
        };
      }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, ...roleDetails },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatarUrl: user.avatar_url,
        ...roleDetails
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred during login. Please try again.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req: Request, res: Response) => {
  return res.json({
    success: true,
    user: req.user
  });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Please provide your registered email address.' });
  }

  // Simulate password reset link dispatched
  return res.json({
    success: true,
    message: 'If an account exists with this email, password reset instructions have been dispatched.'
  });
});

// POST /api/auth/update-profile
router.post('/update-profile', authenticateToken, async (req: Request, res: Response) => {
  const { name, phone, password } = req.body;
  const userId = req.user!.id;

  try {
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      dbHelper.run('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
    }

    dbHelper.run(`
      UPDATE users
      SET name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          updated_at = datetime('now')
      WHERE id = ?
    `, [name || null, phone || null, userId]);

    return res.json({ success: true, message: 'Profile updated successfully.' });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

export default router;
