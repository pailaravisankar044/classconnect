import { Router, Request, Response } from 'express';
import { dbHelper } from '../db/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { AttendanceService } from '../services/attendanceService.js';

const router = Router();
router.use(authenticateToken);
router.use(requireRole(['student', 'admin']));

// GET /api/student/dashboard
router.get('/dashboard', (req: Request, res: Response) => {
  const studentId = req.user!.studentId;
  const batchId = req.user!.batchId;

  // 1. Next / Today's Class (Prioritize LIVE class first, then today's class, then closest upcoming)
  let nextClass = dbHelper.get(`
    SELECT 
      c.*,
      u.name as teacher_name,
      t.specialization as teacher_specialization,
      b.name as batch_name,
      crs.name as course_name
    FROM classes c
    JOIN teachers t ON t.id = c.teacher_id
    JOIN users u ON u.id = t.user_id
    LEFT JOIN batches b ON b.id = c.batch_id
    LEFT JOIN courses crs ON crs.id = c.course_id
    WHERE (c.batch_id = ? OR c.batch_id IS NULL)
      AND (c.status = 'live' OR (c.date >= date('now') AND c.status != 'cancelled' AND c.status != 'completed'))
    ORDER BY 
      CASE WHEN c.status = 'live' THEN 0 ELSE 1 END,
      c.date ASC,
      c.start_time ASC
    LIMIT 1
  `, [batchId || null]);

  // If no upcoming class found, fetch most recent class
  if (!nextClass) {
    nextClass = dbHelper.get(`
      SELECT 
        c.*,
        u.name as teacher_name,
        t.specialization as teacher_specialization,
        b.name as batch_name,
        crs.name as course_name
      FROM classes c
      JOIN teachers t ON t.id = c.teacher_id
      JOIN users u ON u.id = t.user_id
      LEFT JOIN batches b ON b.id = c.batch_id
      LEFT JOIN courses crs ON crs.id = c.course_id
      WHERE (c.batch_id = ? OR c.batch_id IS NULL)
      ORDER BY c.date DESC, c.start_time DESC
      LIMIT 1
    `, [batchId || null]);
  }

  // 2. Upcoming Classes (next 5)
  const upcomingClasses = dbHelper.all(`
    SELECT 
      c.*,
      u.name as teacher_name,
      b.name as batch_name,
      crs.name as course_name
    FROM classes c
    JOIN teachers t ON t.id = c.teacher_id
    JOIN users u ON u.id = t.user_id
    LEFT JOIN batches b ON b.id = c.batch_id
    LEFT JOIN courses crs ON crs.id = c.course_id
    WHERE (c.batch_id = ? OR c.batch_id IS NULL)
      AND c.id != ?
      AND (c.date >= date('now') AND c.status != 'cancelled')
    ORDER BY c.date ASC, c.start_time ASC
    LIMIT 5
  `, [batchId || null, nextClass ? nextClass.id : -1]);

  // 3. Attendance Statistics
  const attendanceStats = studentId ? AttendanceService.getStudentStats(studentId) : {
    totalClasses: 0,
    attendedClasses: 0,
    presentCount: 0,
    partialCount: 0,
    attendancePercentage: 0
  };

  // 4. Announcements
  const announcements = dbHelper.all(`
    SELECT a.*, u.name as author_name
    FROM announcements a
    JOIN users u ON u.id = a.author_id
    WHERE a.target_type = 'all' 
       OR (a.target_type = 'batch' AND a.target_id = ?)
    ORDER BY a.created_at DESC
    LIMIT 4
  `, [batchId || null]);

  return res.json({
    success: true,
    data: {
      student: req.user,
      nextClass,
      upcomingClasses,
      attendance: attendanceStats,
      announcements
    }
  });
});

// GET /api/student/classes
router.get('/classes', (req: Request, res: Response) => {
  const batchId = req.user!.batchId;
  const studentId = req.user!.studentId;

  const classes = dbHelper.all(`
    SELECT 
      c.*,
      u.name as teacher_name,
      b.name as batch_name,
      crs.name as course_name,
      att.status as attendance_status,
      att.duration_minutes as attended_duration,
      att.attendance_percentage
    FROM classes c
    JOIN teachers t ON t.id = c.teacher_id
    JOIN users u ON u.id = t.user_id
    LEFT JOIN batches b ON b.id = c.batch_id
    LEFT JOIN courses crs ON crs.id = c.course_id
    LEFT JOIN attendance att ON att.class_id = c.id AND att.student_id = ?
    WHERE (c.batch_id = ? OR c.batch_id IS NULL)
    ORDER BY c.date DESC, c.start_time DESC
  `, [studentId || -1, batchId || null]);

  return res.json({ success: true, classes });
});

// GET /api/student/attendance
router.get('/attendance', (req: Request, res: Response) => {
  const studentId = req.user!.studentId;
  if (!studentId) {
    return res.status(400).json({ success: false, message: 'Student record not found.' });
  }

  const stats = AttendanceService.getStudentStats(studentId);

  const history = dbHelper.all(`
    SELECT 
      a.*,
      c.title as class_title,
      c.class_code,
      c.date as class_date,
      c.start_time,
      c.end_time,
      c.duration_minutes as scheduled_duration,
      u.name as teacher_name
    FROM attendance a
    JOIN classes c ON c.id = a.class_id
    JOIN teachers t ON t.id = c.teacher_id
    JOIN users u ON u.id = t.user_id
    WHERE a.student_id = ?
    ORDER BY c.date DESC, a.joined_at DESC
  `, [studentId]);

  return res.json({ success: true, stats, history });
});

// GET /api/student/materials
router.get('/materials', (req: Request, res: Response) => {
  const batchId = req.user!.batchId;
  const courseId = req.user!.courseId;

  const materials = dbHelper.all(`
    SELECT 
      m.*,
      u.name as teacher_name,
      c.title as class_title,
      crs.name as course_name
    FROM materials m
    JOIN teachers t ON t.id = m.teacher_id
    JOIN users u ON u.id = t.user_id
    LEFT JOIN classes c ON c.id = m.class_id
    LEFT JOIN courses crs ON crs.id = m.course_id
    WHERE m.course_id IS NULL 
       OR m.course_id = ?
       OR m.class_id IN (SELECT id FROM classes WHERE batch_id = ?)
    ORDER BY m.created_at DESC
  `, [courseId || null, batchId || null]);

  return res.json({ success: true, materials });
});

export default router;
