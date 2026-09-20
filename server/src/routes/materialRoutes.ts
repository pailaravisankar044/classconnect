import { Router, Request, Response } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { dbHelper } from '../db/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { uploadMaterial } from '../middleware/upload.js';

const router = Router();
router.use(authenticateToken);

// GET /api/materials
router.get('/', (req: Request, res: Response) => {
  const { classId, courseId } = req.query;

  let sql = `
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
    WHERE 1=1
  `;
  const params: any[] = [];

  if (classId) {
    sql += ' AND m.class_id = ?';
    params.push(classId);
  }
  if (courseId) {
    sql += ' AND m.course_id = ?';
    params.push(courseId);
  }

  sql += ' ORDER BY m.created_at DESC';

  const materials = dbHelper.all(sql, params);
  return res.json({ success: true, materials });
});

// POST /api/materials - Upload file or link (Teacher or Admin)
router.post('/', requireRole(['teacher', 'admin']), uploadMaterial.single('file'), (req: Request, res: Response) => {
  try {
    const { title, description, classId, courseId, fileType, externalUrl } = req.body;
    const teacherId = req.user?.role === 'teacher' ? req.user.teacherId : 1;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Material title is required.' });
    }

    let fileUrl = '';
    let detectedType = fileType || 'document';
    let fileSize = 0;

    if (req.file) {
      fileUrl = `/uploads/materials/${req.file.filename}`;
      fileSize = req.file.size;
      const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
      detectedType = ['pdf', 'ppt', 'pptx', 'doc', 'docx', 'png', 'jpg', 'mp4'].includes(ext) ? ext : 'file';
    } else if (externalUrl) {
      fileUrl = externalUrl;
      detectedType = 'link';
    } else {
      return res.status(400).json({ success: false, message: 'Please upload a file or provide a valid link.' });
    }

    const result = dbHelper.run(`
      INSERT INTO materials (title, description, file_url, file_type, file_size, class_id, course_id, teacher_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title.trim(),
      description || null,
      fileUrl,
      detectedType,
      fileSize,
      classId ? Number(classId) : null,
      courseId ? Number(courseId) : null,
      teacherId
    ]);

    return res.status(201).json({
      success: true,
      message: 'Learning material added successfully.',
      materialId: Number(result.lastInsertRowid)
    });
  } catch (err: any) {
    console.error('Error uploading material:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to upload material.' });
  }
});

// DELETE /api/materials/:id
router.delete('/:id', requireRole(['teacher', 'admin']), (req: Request, res: Response) => {
  const materialId = parseInt(req.params.id, 10);
  const material = dbHelper.get('SELECT * FROM materials WHERE id = ?', [materialId]);

  if (!material) {
    return res.status(404).json({ success: false, message: 'Material not found.' });
  }

  // If local file, delete from disk
  if (material.file_url.startsWith('/uploads/materials/')) {
    const filename = path.basename(material.file_url);
    const fullPath = path.join(process.cwd(), 'uploads', 'materials', filename);
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
      } catch (e) {
        console.warn('Could not delete physical file:', e);
      }
    }
  }

  dbHelper.run('DELETE FROM materials WHERE id = ?', [materialId]);
  return res.json({ success: true, message: 'Material deleted successfully.' });
});

export default router;
