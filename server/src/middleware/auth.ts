import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { dbHelper } from '../db/database.js';

export interface AuthUser {
  id: number;
  userId: number; // same as id
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  studentId?: number;
  teacherId?: number;
  studentCode?: string;
  teacherCode?: string;
  batchId?: number;
  courseId?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as any;
    
    // Validate that user still exists and is active
    const user = dbHelper.get('SELECT id, name, email, role, status FROM users WHERE id = ?', [payload.id]);
    if (!user || user.status !== 'active') {
      return res.status(401).json({ success: false, message: 'Invalid session or account deactivated.' });
    }

    const authUser: AuthUser = {
      id: user.id,
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    if (user.role === 'student') {
      const student = dbHelper.get('SELECT id, student_code, course_id, batch_id FROM students WHERE user_id = ?', [user.id]);
      if (student) {
        authUser.studentId = student.id;
        authUser.studentCode = student.student_code;
        authUser.courseId = student.course_id;
        authUser.batchId = student.batch_id;
      }
    } else if (user.role === 'teacher') {
      const teacher = dbHelper.get('SELECT id, teacher_code FROM teachers WHERE user_id = ?', [user.id]);
      if (teacher) {
        authUser.teacherId = teacher.id;
        authUser.teacherCode = teacher.teacher_code;
      }
    }

    req.user = authUser;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
}

export function requireRole(roles: Array<'admin' | 'teacher' | 'student'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to view this resource.'
      });
    }

    next();
  };
}
