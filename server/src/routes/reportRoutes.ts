import { Router, Request, Response } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { ReportService } from '../services/reportService.js';

const router = Router();
router.use(authenticateToken);
router.use(requireRole(['admin']));

// GET /api/reports/students/csv
router.get('/students/csv', (_req: Request, res: Response) => {
  const csv = ReportService.getStudentAttendanceReportCSV();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="student-attendance-report.csv"');
  return res.send(csv);
});

// GET /api/reports/classes/csv
router.get('/classes/csv', (req: Request, res: Response) => {
  const classId = req.query.classId ? parseInt(req.query.classId as string, 10) : undefined;
  const csv = ReportService.getClassAttendanceReportCSV(classId);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="class-attendance-report.csv"');
  return res.send(csv);
});

// GET /api/reports/teachers/csv
router.get('/teachers/csv', (_req: Request, res: Response) => {
  const csv = ReportService.getTeacherReportCSV();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="teacher-performance-report.csv"');
  return res.send(csv);
});

export default router;
