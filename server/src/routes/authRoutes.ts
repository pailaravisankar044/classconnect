import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { dbHelper } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

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
