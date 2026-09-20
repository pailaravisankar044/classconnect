import { Router, Request, Response } from 'express';
import { dbHelper } from '../db/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);
router.use(requireRole(['teacher', 'admin']));

// GET /api/teacher/dashboard
router.get('/dashboard', (req: Request, res: Response) => {
  const teacherId = req.user!.teacherId;

  // Get teacher's classes
  const classes = dbHelper.all(`
    SELECT 
      c.*,
      b.name as batch_name,
      crs.name as course_name,
      (SELECT COUNT(DISTINCT a.student_id) FROM attendance a WHERE a.class_id = c.id) as joined_count,
      (SELECT COUNT(s.id) FROM students s WHERE s.batch_id = c.batch_id) as total_batch_students
    FROM classes c
    LEFT JOIN batches b ON b.id = c.batch_id
    LEFT JOIN courses crs ON crs.id = c.course_id
    WHERE c.teacher_id = ?
    ORDER BY c.date DESC, c.start_time DESC
  `, [teacherId || -1]);

  const today = new Date().toISOString().split('T')[0];
  const todayClasses = classes.filter(c => c.date === today || c.status === 'live');
  const upcomingClasses = classes.filter(c => c.date > today && c.status !== 'completed' && c.status !== 'cancelled');
  const completedClasses = classes.filter(c => c.status === 'completed');

  // Stats
  const totalStudents = dbHelper.get(`
    SELECT COUNT(DISTINCT s.id) as count
    FROM students s
    JOIN classes c ON c.batch_id = s.batch_id
    WHERE c.teacher_id = ?
  `, [teacherId || -1])?.count || 0;

  const totalMaterials = dbHelper.get(`
    SELECT COUNT(*) as count FROM materials WHERE teacher_id = ?
  `, [teacherId || -1])?.count || 0;

  return res.json({
    success: true,
    data: {
      stats: {
        totalClasses: classes.length,
        liveClasses: classes.filter(c => c.status === 'live').length,
        todayClassesCount: todayClasses.length,
        completedClassesCount: completedClasses.length,
        totalStudents,
        totalMaterials
      },
      todayClasses,
      upcomingClasses,
      completedClasses,
      allClasses: classes
    }
  });
});

// POST /api/teacher/classes/:id/start
router.post('/classes/:id/start', (req: Request, res: Response) => {
  const classId = parseInt(req.params.id, 10);
  const teacherId = req.user!.teacherId;

  const cls = dbHelper.get('SELECT * FROM classes WHERE id = ?', [classId]);
  if (!cls) {
    return res.status(404).json({ success: false, message: 'Class not found.' });
  }

  if (req.user!.role !== 'admin' && cls.teacher_id !== teacherId) {
    return res.status(403).json({ success: false, message: 'You can only start your assigned classes.' });
  }

  dbHelper.run("UPDATE classes SET status = 'live' WHERE id = ?", [classId]);

  // Create in-app notifications for students enrolled in this batch
  if (cls.batch_id) {
    const students = dbHelper.all('SELECT user_id FROM students WHERE batch_id = ?', [cls.batch_id]);
    const insertNotif = dbHelper.prepare(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, 'Class is LIVE!', ?, 'class_starting', ?)
    `);
    for (const stu of students) {
      insertNotif.run(stu.user_id, `Class "${cls.title}" has started. Click here to join.`, `/classroom/${cls.class_code}`);
    }
  }

  return res.json({ success: true, message: 'Class is now LIVE!', status: 'live' });
});

// POST /api/teacher/classes/:id/end
router.post('/classes/:id/end', (req: Request, res: Response) => {
  const classId = parseInt(req.params.id, 10);
  const teacherId = req.user!.teacherId;

  const cls = dbHelper.get('SELECT * FROM classes WHERE id = ?', [classId]);
  if (!cls) {
    return res.status(404).json({ success: false, message: 'Class not found.' });
  }

  if (req.user!.role !== 'admin' && cls.teacher_id !== teacherId) {
    return res.status(403).json({ success: false, message: 'You can only end your assigned classes.' });
  }

  dbHelper.run("UPDATE classes SET status = 'completed' WHERE id = ?", [classId]);

  return res.json({ success: true, message: 'Class ended successfully.', status: 'completed' });
});

// GET /api/teacher/classes/:id/attendance
router.get('/classes/:id/attendance', (req: Request, res: Response) => {
  const classId = parseInt(req.params.id, 10);

  const cls = dbHelper.get(`
    SELECT c.*, b.name as batch_name, crs.name as course_name
    FROM classes c
    LEFT JOIN batches b ON b.id = c.batch_id
    LEFT JOIN courses crs ON crs.id = c.course_id
    WHERE c.id = ?
  `, [classId]);

  if (!cls) {
    return res.status(404).json({ success: false, message: 'Class not found.' });
  }

  // Get all students in the batch and their attendance status
  const students = dbHelper.all(`
    SELECT 
      s.id as student_id,
      s.student_code,
      u.name as student_name,
      u.email,
      u.phone,
      a.joined_at,
      a.left_at,
      a.duration_minutes,
      a.attendance_percentage,
      COALESCE(a.status, 'ABSENT') as attendance_status
    FROM students s
    JOIN users u ON u.id = s.user_id
    LEFT JOIN attendance a ON a.student_id = s.id AND a.class_id = ?
    WHERE s.batch_id = ?
    ORDER BY s.student_code ASC
  `, [classId, cls.batch_id]);

  const presentCount = students.filter(s => s.attendance_status === 'PRESENT').length;
  const partialCount = students.filter(s => s.attendance_status === 'PARTIAL').length;
  const absentCount = students.filter(s => s.attendance_status === 'ABSENT').length;

  return res.json({
    success: true,
    classDetails: cls,
    students,
    summary: {
      total: students.length,
      present: presentCount,
      partial: partialCount,
      absent: absentCount,
      attendanceRate: students.length > 0 ? Math.round(((presentCount + partialCount) / students.length) * 100) : 0
    }
  });
});

// GET /api/teacher/students
router.get('/students', (req: Request, res: Response) => {
  const teacherId = req.user!.teacherId;

  const students = dbHelper.all(`
    SELECT DISTINCT
      s.id,
      s.student_code,
      u.name,
      u.email,
      u.phone,
      b.name as batch_name,
      crs.name as course_name
    FROM students s
    JOIN users u ON u.id = s.user_id
    JOIN classes c ON c.batch_id = s.batch_id
    LEFT JOIN batches b ON b.id = s.batch_id
    LEFT JOIN courses crs ON crs.id = s.course_id
    WHERE c.teacher_id = ?
    ORDER BY s.student_code ASC
  `, [teacherId || -1]);

  return res.json({ success: true, students });
});

export default router;
