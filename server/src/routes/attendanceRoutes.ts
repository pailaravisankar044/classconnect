import { Router, Request, Response } from 'express';
import { dbHelper } from '../db/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { AttendanceService } from '../services/attendanceService.js';

const router = Router();
router.use(authenticateToken);

// POST /api/attendance/join
router.post('/join', (req: Request, res: Response) => {
  const { classId } = req.body;
  const studentId = req.user?.studentId;

  if (!classId || !studentId) {
    return res.status(400).json({ success: false, message: 'Class ID and Student identity required.' });
  }

  const attendanceId = AttendanceService.recordJoin(Number(classId), studentId);
  return res.json({ success: true, attendanceId });
});

// POST /api/attendance/leave
router.post('/leave', (req: Request, res: Response) => {
  const { classId } = req.body;
  const studentId = req.user?.studentId;

  if (!classId || !studentId) {
    return res.status(400).json({ success: false, message: 'Class ID and Student identity required.' });
  }

  const result = AttendanceService.recordLeave(Number(classId), studentId);
  return res.json({ success: true, result });
});

// GET /api/attendance/class/:classId - View attendance for a class (Teacher or Admin)
router.get('/class/:classId', requireRole(['teacher', 'admin']), (req: Request, res: Response) => {
  const classId = parseInt(req.params.classId, 10);

  const records = dbHelper.all(`
    SELECT 
      a.*,
      s.student_code,
      u.name as student_name,
      u.email,
      u.phone
    FROM attendance a
    JOIN students s ON s.id = a.student_id
    JOIN users u ON u.id = s.user_id
    WHERE a.class_id = ?
    ORDER BY a.joined_at ASC
  `, [classId]);

  return res.json({ success: true, attendance: records });
});

// PUT /api/attendance/:id - Admin manually override status
router.put('/:id', requireRole(['admin']), (req: Request, res: Response) => {
  const attendanceId = parseInt(req.params.id, 10);
  const { status, durationMinutes } = req.body;

  if (!status || !['PRESENT', 'PARTIAL', 'ABSENT'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Valid status (PRESENT, PARTIAL, ABSENT) required.' });
  }

  dbHelper.run(`
    UPDATE attendance
    SET status = ?,
        duration_minutes = COALESCE(?, duration_minutes)
    WHERE id = ?
  `, [status, durationMinutes || null, attendanceId]);

  return res.json({ success: true, message: 'Attendance record updated successfully.' });
});

export default router;
