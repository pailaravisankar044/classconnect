import { Router, Request, Response } from 'express';
import { dbHelper } from '../db/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

// GET /api/announcements
router.get('/', (req: Request, res: Response) => {
  const user = req.user!;
  let sql = `
    SELECT 
      a.*,
      u.name as author_name,
      u.role as author_role,
      b.name as batch_name,
      crs.name as course_name
    FROM announcements a
    JOIN users u ON u.id = a.author_id
    LEFT JOIN batches b ON b.id = a.target_id AND a.target_type = 'batch'
    LEFT JOIN courses crs ON crs.id = a.target_id AND a.target_type = 'course'
    WHERE 1=1
  `;
  const params: any[] = [];

  if (user.role === 'student') {
    sql += ` AND (a.target_type = 'all' OR (a.target_type = 'batch' AND a.target_id = ?) OR (a.target_type = 'course' AND a.target_id = ?))`;
    params.push(user.batchId || -1, user.courseId || -1);
  }

  sql += ' ORDER BY a.created_at DESC';

  const announcements = dbHelper.all(sql, params);
  return res.json({ success: true, announcements });
});

// POST /api/announcements (Teacher or Admin)
router.post('/', requireRole(['teacher', 'admin']), (req: Request, res: Response) => {
  const { title, message, targetType, targetId } = req.body;
  const authorId = req.user!.id;

  if (!title || !message) {
    return res.status(400).json({ success: false, message: 'Title and message content are required.' });
  }

  const result = dbHelper.run(`
    INSERT INTO announcements (title, message, target_type, target_id, author_id)
    VALUES (?, ?, ?, ?, ?)
  `, [title.trim(), message.trim(), targetType || 'all', targetId || null, authorId]);

  // Create notifications for students
  let studentQuery = 'SELECT user_id FROM students WHERE 1=1';
  const queryParams: any[] = [];
  if (targetType === 'batch' && targetId) {
    studentQuery += ' AND batch_id = ?';
    queryParams.push(targetId);
  } else if (targetType === 'course' && targetId) {
    studentQuery += ' AND course_id = ?';
    queryParams.push(targetId);
  }

  const targetStudents = dbHelper.all(studentQuery, queryParams);
  const insertNotif = dbHelper.prepare(`
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (?, 'New Announcement', ?, 'announcement', '/student/announcements')
  `);

  for (const s of targetStudents) {
    insertNotif.run(s.user_id, title.trim());
  }

  return res.status(201).json({
    success: true,
    message: 'Announcement published successfully.',
    announcementId: Number(result.lastInsertRowid)
  });
});

// DELETE /api/announcements/:id
router.delete('/:id', requireRole(['teacher', 'admin']), (req: Request, res: Response) => {
  const announcementId = parseInt(req.params.id, 10);
  dbHelper.run('DELETE FROM announcements WHERE id = ?', [announcementId]);
  return res.json({ success: true, message: 'Announcement deleted.' });
});

export default router;
