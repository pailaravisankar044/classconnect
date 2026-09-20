import { Router, Request, Response } from 'express';
import { dbHelper } from '../db/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { AttendanceService } from '../services/attendanceService.js';

const router = Router();

// GET /api/classes/:identifier (Can be class_code like CLS20260920001 or numeric id) - Accessible with auth
router.get('/:identifier', authenticateToken, (req: Request, res: Response) => {
  const { identifier } = req.params;

  let cls = dbHelper.get(`
    SELECT 
      c.*,
      u.name as teacher_name,
      u.email as teacher_email,
      t.specialization as teacher_specialization,
      t.bio as teacher_bio,
      b.name as batch_name,
      crs.name as course_name
    FROM classes c
    JOIN teachers t ON t.id = c.teacher_id
    JOIN users u ON u.id = t.user_id
    LEFT JOIN batches b ON b.id = c.batch_id
    LEFT JOIN courses crs ON crs.id = c.course_id
    WHERE c.class_code = ? OR c.id = ?
  `, [identifier, isNaN(Number(identifier)) ? -1 : Number(identifier)]);

  if (!cls) {
    return res.status(404).json({ success: false, message: 'Class session not found.' });
  }

  // If student, also get their attendance status if any
  let userAttendance = null;
  if (req.user?.role === 'student' && req.user.studentId) {
    userAttendance = dbHelper.get(`
      SELECT * FROM attendance
      WHERE class_id = ? AND student_id = ?
      ORDER BY id DESC LIMIT 1
    `, [cls.id, req.user.studentId]);
  }

  return res.json({
    success: true,
    class: cls,
    userAttendance
  });
});

// GET /api/classes - List all classes
router.get('/', authenticateToken, (req: Request, res: Response) => {
  const { date, batchId, status, teacherId } = req.query;

  let sql = `
    SELECT 
      c.*,
      u.name as teacher_name,
      b.name as batch_name,
      crs.name as course_name,
      (SELECT COUNT(DISTINCT a.student_id) FROM attendance a WHERE a.class_id = c.id) as attended_count
    FROM classes c
    JOIN teachers t ON t.id = c.teacher_id
    JOIN users u ON u.id = t.user_id
    LEFT JOIN batches b ON b.id = c.batch_id
    LEFT JOIN courses crs ON crs.id = c.course_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (date) {
    sql += ' AND c.date = ?';
    params.push(date);
  }
  if (batchId) {
    sql += ' AND c.batch_id = ?';
    params.push(batchId);
  }
  if (status) {
    sql += ' AND c.status = ?';
    params.push(status);
  }
  if (teacherId) {
    sql += ' AND c.teacher_id = ?';
    params.push(teacherId);
  }

  sql += ' ORDER BY c.date DESC, c.start_time DESC';

  const classes = dbHelper.all(sql, params);
  return res.json({ success: true, classes });
});

// POST /api/classes - Create new class (Admin or Teacher)
router.post('/', authenticateToken, requireRole(['admin', 'teacher']), (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      teacherId,
      courseId,
      batchId,
      date,
      startTime,
      endTime,
      durationMinutes,
      meetingType,
      meetingUrl,
      maxStudents
    } = req.body;

    if (!title || !date || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'Title, date, start time, and end time are required.' });
    }

    const assignedTeacherId = req.user?.role === 'teacher' ? req.user.teacherId : teacherId;
    if (!assignedTeacherId) {
      return res.status(400).json({ success: false, message: 'A valid teacher must be assigned.' });
    }

    // Auto-generate Class Code: CLSYYYYMMDDxxx
    const dateFormatted = date.replace(/-/g, '');
    const countToday = dbHelper.get("SELECT COUNT(*) as count FROM classes WHERE date = ?", [date])?.count || 0;
    const classCode = `CLS${dateFormatted}${String(countToday + 1).padStart(3, '0')}`;

    // Calculate duration in minutes if not explicitly provided
    let duration = durationMinutes;
    if (!duration) {
      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      duration = (endH * 60 + endM) - (startH * 60 + startM);
      if (duration <= 0) duration = 60;
    }

    const result = dbHelper.run(`
      INSERT INTO classes (
        class_code, course_id, batch_id, teacher_id, title, description,
        date, start_time, end_time, duration_minutes, meeting_type, meeting_url, max_students, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')
    `, [
      classCode,
      courseId || null,
      batchId || null,
      assignedTeacherId,
      title.trim(),
      description || null,
      date,
      startTime,
      endTime,
      duration,
      meetingType || 'internal',
      meetingUrl || null,
      maxStudents || 100
    ]);

    const newClassId = Number(result.lastInsertRowid);

    return res.status(201).json({
      success: true,
      message: 'Class scheduled successfully.',
      classId: newClassId,
      classCode
    });
  } catch (err: any) {
    console.error('Error creating class:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to create class.' });
  }
});

// PUT /api/classes/:id - Update class
router.put('/:id', authenticateToken, requireRole(['admin', 'teacher']), (req: Request, res: Response) => {
  const classId = parseInt(req.params.id, 10);
  const {
    title,
    description,
    teacherId,
    courseId,
    batchId,
    date,
    startTime,
    endTime,
    durationMinutes,
    meetingType,
    meetingUrl,
    maxStudents,
    status
  } = req.body;

  const cls = dbHelper.get('SELECT * FROM classes WHERE id = ?', [classId]);
  if (!cls) {
    return res.status(404).json({ success: false, message: 'Class not found.' });
  }

  // Teacher can only update their own classes
  if (req.user?.role === 'teacher' && cls.teacher_id !== req.user.teacherId) {
    return res.status(403).json({ success: false, message: 'You can only edit your assigned classes.' });
  }

  dbHelper.run(`
    UPDATE classes
    SET title = COALESCE(?, title),
        description = COALESCE(?, description),
        teacher_id = COALESCE(?, teacher_id),
        course_id = COALESCE(?, course_id),
        batch_id = COALESCE(?, batch_id),
        date = COALESCE(?, date),
        start_time = COALESCE(?, start_time),
        end_time = COALESCE(?, end_time),
        duration_minutes = COALESCE(?, duration_minutes),
        meeting_type = COALESCE(?, meeting_type),
        meeting_url = COALESCE(?, meeting_url),
        max_students = COALESCE(?, max_students),
        status = COALESCE(?, status)
    WHERE id = ?
  `, [
    title || null,
    description || null,
    teacherId || null,
    courseId || null,
    batchId || null,
    date || null,
    startTime || null,
    endTime || null,
    durationMinutes || null,
    meetingType || null,
    meetingUrl || null,
    maxStudents || null,
    status || null,
    classId
  ]);

  return res.json({ success: true, message: 'Class updated successfully.' });
});

// DELETE /api/classes/:id
router.delete('/:id', authenticateToken, requireRole(['admin']), (req: Request, res: Response) => {
  const classId = parseInt(req.params.id, 10);
  dbHelper.run('DELETE FROM classes WHERE id = ?', [classId]);
  return res.json({ success: true, message: 'Class deleted successfully.' });
});

// POST /api/classes/:id/join-log - Logs student joining (crucial for external links like Zoom / Google Meet)
router.post('/:id/join-log', authenticateToken, (req: Request, res: Response) => {
  const classId = parseInt(req.params.id, 10);
  const studentId = req.user?.studentId;

  if (req.user?.role === 'student' && studentId) {
    AttendanceService.recordJoin(classId, studentId);
  }

  const cls = dbHelper.get('SELECT * FROM classes WHERE id = ?', [classId]);
  return res.json({
    success: true,
    message: 'Join attendance recorded.',
    meetingType: cls?.meeting_type,
    meetingUrl: cls?.meeting_url
  });
});

export default router;
