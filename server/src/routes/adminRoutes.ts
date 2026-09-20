import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { dbHelper } from '../db/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);
router.use(requireRole(['admin']));

// GET /api/admin/dashboard
router.get('/dashboard', (_req: Request, res: Response) => {
  const totalStudents = dbHelper.get('SELECT COUNT(*) as count FROM students')?.count || 0;
  const totalTeachers = dbHelper.get('SELECT COUNT(*) as count FROM teachers')?.count || 0;
  const totalCourses = dbHelper.get('SELECT COUNT(*) as count FROM courses')?.count || 0;
  const totalBatches = dbHelper.get('SELECT COUNT(*) as count FROM batches')?.count || 0;

  const today = new Date().toISOString().split('T')[0];
  const todayClasses = dbHelper.get('SELECT COUNT(*) as count FROM classes WHERE date = ?', [today])?.count || 0;
  const liveClasses = dbHelper.get("SELECT COUNT(*) as count FROM classes WHERE status = 'live'")?.count || 0;

  // Compute overall attendance rate
  const totalAttendanceRecords = dbHelper.get('SELECT COUNT(*) as count FROM attendance')?.count || 0;
  const presentRecords = dbHelper.get("SELECT COUNT(*) as count FROM attendance WHERE status = 'PRESENT'")?.count || 0;
  const attendanceRate = totalAttendanceRecords > 0 ? Math.round((presentRecords / totalAttendanceRecords) * 100) : 0;

  // Recent 5 classes
  const recentClasses = dbHelper.all(`
    SELECT c.*, u.name as teacher_name, b.name as batch_name
    FROM classes c
    JOIN teachers t ON t.id = c.teacher_id
    JOIN users u ON u.id = t.user_id
    LEFT JOIN batches b ON b.id = c.batch_id
    ORDER BY c.date DESC, c.start_time DESC
    LIMIT 6
  `);

  return res.json({
    success: true,
    data: {
      stats: {
        totalStudents,
        totalTeachers,
        totalCourses,
        totalBatches,
        todayClasses,
        liveClasses,
        attendanceRate
      },
      recentClasses
    }
  });
});

// --- STUDENT MANAGEMENT ---

// GET /api/admin/students
router.get('/students', (req: Request, res: Response) => {
  const search = (req.query.search as string || '').trim().toLowerCase();
  const batchId = req.query.batchId ? parseInt(req.query.batchId as string, 10) : null;

  let sql = `
    SELECT 
      s.id,
      s.student_code,
      s.registration_date,
      s.course_id,
      s.batch_id,
      u.id as user_id,
      u.name,
      u.email,
      u.phone,
      u.status,
      b.name as batch_name,
      crs.name as course_name
    FROM students s
    JOIN users u ON u.id = s.user_id
    LEFT JOIN batches b ON b.id = s.batch_id
    LEFT JOIN courses crs ON crs.id = s.course_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (search) {
    sql += ` AND (LOWER(u.name) LIKE ? OR LOWER(u.email) LIKE ? OR LOWER(s.student_code) LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (batchId) {
    sql += ` AND s.batch_id = ?`;
    params.push(batchId);
  }

  sql += ' ORDER BY s.id DESC';

  const students = dbHelper.all(sql, params);
  return res.json({ success: true, students });
});

// POST /api/admin/students
router.post('/students', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, courseId, batchId } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required.' });
    }

    const existingUser = dbHelper.get('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'A user with this email already exists.' });
    }

    // Auto-generate student code like STU00012
    const maxIdRes = dbHelper.get('SELECT MAX(id) as maxId FROM students');
    const nextNum = (maxIdRes?.maxId || 0) + 1;
    const studentCode = `STU${String(nextNum).padStart(5, '0')}`;

    const defaultPass = password || 'student123';
    const passwordHash = await bcrypt.hash(defaultPass, 10);

    const userRes = dbHelper.run(`
      INSERT INTO users (name, email, phone, password_hash, role, status)
      VALUES (?, ?, ?, ?, 'student', 'active')
    `, [name.trim(), email.toLowerCase().trim(), phone || null, passwordHash]);

    const userId = Number(userRes.lastInsertRowid);

    dbHelper.run(`
      INSERT INTO students (user_id, student_code, course_id, batch_id)
      VALUES (?, ?, ?, ?)
    `, [userId, studentCode, courseId || null, batchId || null]);

    return res.status(201).json({
      success: true,
      message: 'Student created successfully.',
      studentCode
    });
  } catch (err: any) {
    console.error('Error creating student:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to create student.' });
  }
});

// PUT /api/admin/students/:id
router.put('/students/:id', async (req: Request, res: Response) => {
  const studentId = parseInt(req.params.id, 10);
  const { name, email, phone, status, courseId, batchId, password } = req.body;

  const student = dbHelper.get('SELECT user_id FROM students WHERE id = ?', [studentId]);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found.' });
  }

  if (password) {
    const passwordHash = await bcrypt.hash(password, 10);
    dbHelper.run('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, student.user_id]);
  }

  dbHelper.run(`
    UPDATE users
    SET name = COALESCE(?, name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        status = COALESCE(?, status),
        updated_at = datetime('now')
    WHERE id = ?
  `, [name || null, email ? email.toLowerCase().trim() : null, phone || null, status || null, student.user_id]);

  dbHelper.run(`
    UPDATE students
    SET course_id = ?,
        batch_id = ?
    WHERE id = ?
  `, [courseId !== undefined ? courseId : null, batchId !== undefined ? batchId : null, studentId]);

  return res.json({ success: true, message: 'Student updated successfully.' });
});

// DELETE /api/admin/students/:id
router.delete('/students/:id', (req: Request, res: Response) => {
  const studentId = parseInt(req.params.id, 10);
  const student = dbHelper.get('SELECT user_id FROM students WHERE id = ?', [studentId]);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found.' });
  }

  dbHelper.run('DELETE FROM users WHERE id = ?', [student.user_id]);
  return res.json({ success: true, message: 'Student deleted successfully.' });
});

// --- TEACHER MANAGEMENT ---

// GET /api/admin/teachers
router.get('/teachers', (req: Request, res: Response) => {
  const search = (req.query.search as string || '').trim().toLowerCase();

  let sql = `
    SELECT 
      t.id,
      t.teacher_code,
      t.specialization,
      t.bio,
      u.id as user_id,
      u.name,
      u.email,
      u.phone,
      u.status
    FROM teachers t
    JOIN users u ON u.id = t.user_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (search) {
    sql += ` AND (LOWER(u.name) LIKE ? OR LOWER(u.email) LIKE ? OR LOWER(t.teacher_code) LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  sql += ' ORDER BY t.id DESC';

  const teachers = dbHelper.all(sql, params);
  return res.json({ success: true, teachers });
});

// POST /api/admin/teachers
router.post('/teachers', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, specialization, bio } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required.' });
    }

    const existingUser = dbHelper.get('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'A user with this email already exists.' });
    }

    const maxIdRes = dbHelper.get('SELECT MAX(id) as maxId FROM teachers');
    const nextNum = (maxIdRes?.maxId || 0) + 1;
    const teacherCode = `TRN${String(nextNum).padStart(5, '0')}`;

    const defaultPass = password || 'teacher123';
    const passwordHash = await bcrypt.hash(defaultPass, 10);

    const userRes = dbHelper.run(`
      INSERT INTO users (name, email, phone, password_hash, role, status)
      VALUES (?, ?, ?, ?, 'teacher', 'active')
    `, [name.trim(), email.toLowerCase().trim(), phone || null, passwordHash]);

    const userId = Number(userRes.lastInsertRowid);

    dbHelper.run(`
      INSERT INTO teachers (user_id, teacher_code, specialization, bio)
      VALUES (?, ?, ?, ?)
    `, [userId, teacherCode, specialization || null, bio || null]);

    return res.status(201).json({
      success: true,
      message: 'Teacher created successfully.',
      teacherCode
    });
  } catch (err: any) {
    console.error('Error creating teacher:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to create teacher.' });
  }
});

// PUT /api/admin/teachers/:id
router.put('/teachers/:id', async (req: Request, res: Response) => {
  const teacherId = parseInt(req.params.id, 10);
  const { name, email, phone, status, specialization, bio, password } = req.body;

  const teacher = dbHelper.get('SELECT user_id FROM teachers WHERE id = ?', [teacherId]);
  if (!teacher) {
    return res.status(404).json({ success: false, message: 'Teacher not found.' });
  }

  if (password) {
    const passwordHash = await bcrypt.hash(password, 10);
    dbHelper.run('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, teacher.user_id]);
  }

  dbHelper.run(`
    UPDATE users
    SET name = COALESCE(?, name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        status = COALESCE(?, status),
        updated_at = datetime('now')
    WHERE id = ?
  `, [name || null, email ? email.toLowerCase().trim() : null, phone || null, status || null, teacher.user_id]);

  dbHelper.run(`
    UPDATE teachers
    SET specialization = COALESCE(?, specialization),
        bio = COALESCE(?, bio)
    WHERE id = ?
  `, [specialization || null, bio || null, teacherId]);

  return res.json({ success: true, message: 'Teacher updated successfully.' });
});

// DELETE /api/admin/teachers/:id
router.delete('/teachers/:id', (req: Request, res: Response) => {
  const teacherId = parseInt(req.params.id, 10);
  const teacher = dbHelper.get('SELECT user_id FROM teachers WHERE id = ?', [teacherId]);
  if (!teacher) {
    return res.status(404).json({ success: false, message: 'Teacher not found.' });
  }

  dbHelper.run('DELETE FROM users WHERE id = ?', [teacher.user_id]);
  return res.json({ success: true, message: 'Teacher deleted successfully.' });
});

// --- COURSES & BATCHES ---

// GET /api/admin/courses
router.get('/courses', (_req: Request, res: Response) => {
  const courses = dbHelper.all(`
    SELECT c.*, 
      (SELECT COUNT(*) FROM batches WHERE course_id = c.id) as batch_count,
      (SELECT COUNT(*) FROM students WHERE course_id = c.id) as student_count
    FROM courses c
    ORDER BY c.id DESC
  `);
  return res.json({ success: true, courses });
});

// POST /api/admin/courses
router.post('/courses', (req: Request, res: Response) => {
  const { name, code, description } = req.body;
  if (!name || !code) {
    return res.status(400).json({ success: false, message: 'Course name and code are required.' });
  }

  try {
    const result = dbHelper.run(`
      INSERT INTO courses (code, name, description, status)
      VALUES (?, ?, ?, 'active')
    `, [code.toUpperCase().trim(), name.trim(), description || null]);

    return res.status(201).json({ success: true, message: 'Course created.', courseId: Number(result.lastInsertRowid) });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/admin/batches
router.get('/batches', (_req: Request, res: Response) => {
  const batches = dbHelper.all(`
    SELECT b.*, c.name as course_name,
      (SELECT COUNT(*) FROM students WHERE batch_id = b.id) as student_count
    FROM batches b
    JOIN courses c ON c.id = b.course_id
    ORDER BY b.id DESC
  `);
  return res.json({ success: true, batches });
});

// POST /api/admin/batches
router.post('/batches', (req: Request, res: Response) => {
  const { courseId, name, startDate, endDate } = req.body;
  if (!courseId || !name) {
    return res.status(400).json({ success: false, message: 'Course and Batch name are required.' });
  }

  try {
    const result = dbHelper.run(`
      INSERT INTO batches (course_id, name, start_date, end_date, status)
      VALUES (?, ?, ?, ?, 'active')
    `, [courseId, name.trim(), startDate || null, endDate || null]);

    return res.status(201).json({ success: true, message: 'Batch created.', batchId: Number(result.lastInsertRowid) });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
