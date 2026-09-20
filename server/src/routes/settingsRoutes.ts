import { Router, Request, Response } from 'express';
import { dbHelper } from '../db/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/settings - Public or authenticated
router.get('/', (_req: Request, res: Response) => {
  const rows = dbHelper.all('SELECT key, value FROM settings');
  const settings: Record<string, string> = {};
  for (const r of rows) {
    settings[r.key] = r.value;
  }
  return res.json({ success: true, settings });
});

// PUT /api/settings - Admin only
router.put('/', authenticateToken, requireRole(['admin']), (req: Request, res: Response) => {
  const { settings } = req.body;
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ success: false, message: 'Settings object is required.' });
  }

  const upsert = dbHelper.prepare(`
    INSERT INTO settings (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);

  dbHelper.transaction(() => {
    for (const [key, value] of Object.entries(settings)) {
      upsert.run(key, String(value));
    }
  });

  return res.json({ success: true, message: 'Settings updated successfully.' });
});

export default router;
