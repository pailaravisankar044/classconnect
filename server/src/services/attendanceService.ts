import { dbHelper } from '../db/database.js';

export class AttendanceService {
  /**
   * Records or updates a student join event.
   */
  static recordJoin(classId: number, studentId: number) {
    const existing = dbHelper.get(`
      SELECT id, joined_at FROM attendance
      WHERE class_id = ? AND student_id = ?
    `, [classId, studentId]);

    const now = new Date().toISOString();

    if (existing) {
      // If student previously joined and left, or re-joined, update leave time to null
      dbHelper.run(`
        UPDATE attendance
        SET left_at = NULL
        WHERE id = ?
      `, [existing.id]);
      return existing.id;
    }

    // Insert new attendance join record
    const result = dbHelper.run(`
      INSERT INTO attendance (class_id, student_id, joined_at, status)
      VALUES (?, ?, ?, 'PARTIAL')
    `, [classId, studentId, now]);

    return Number(result.lastInsertRowid);
  }

  /**
   * Records student leave event and computes duration and status
   */
  static recordLeave(classId: number, studentId: number) {
    const record = dbHelper.get(`
      SELECT a.id, a.joined_at, c.duration_minutes
      FROM attendance a
      JOIN classes c ON c.id = a.class_id
      WHERE a.class_id = ? AND a.student_id = ?
      ORDER BY a.id DESC LIMIT 1
    `, [classId, studentId]);

    if (!record || !record.joined_at) return null;

    const leaveTime = new Date();
    const joinTime = new Date(record.joined_at);
    const durationMinutes = Math.max(1, Math.round((leaveTime.getTime() - joinTime.getTime()) / 60000));
    const classDuration = record.duration_minutes || 60;
    const percentage = Math.min(100, Math.round((durationMinutes / classDuration) * 1000) / 10);

    // Get configurable threshold from settings
    const thresholdSetting = dbHelper.get("SELECT value FROM settings WHERE key = 'attendance_threshold'");
    const threshold = thresholdSetting ? parseFloat(thresholdSetting.value) : 75;

    let status: 'PRESENT' | 'PARTIAL' | 'ABSENT' = 'ABSENT';
    if (percentage >= threshold) {
      status = 'PRESENT';
    } else if (durationMinutes > 0) {
      status = 'PARTIAL';
    }

    dbHelper.run(`
      UPDATE attendance
      SET left_at = ?,
          duration_minutes = ?,
          attendance_percentage = ?,
          status = ?
      WHERE id = ?
    `, [leaveTime.toISOString(), durationMinutes, percentage, status, record.id]);

    return {
      durationMinutes,
      percentage,
      status
    };
  }

  /**
   * Get student attendance stats
   */
  static getStudentStats(studentId: number) {
    const totalAssignedClasses = dbHelper.get(`
      SELECT COUNT(DISTINCT c.id) as count
      FROM classes c
      JOIN students s ON s.batch_id = c.batch_id
      WHERE s.id = ? AND c.status IN ('completed', 'live')
    `, [studentId])?.count || 0;

    const attendanceRecords = dbHelper.all(`
      SELECT status, attendance_percentage, duration_minutes
      FROM attendance
      WHERE student_id = ?
    `, [studentId]);

    const presentCount = attendanceRecords.filter(r => r.status === 'PRESENT').length;
    const partialCount = attendanceRecords.filter(r => r.status === 'PARTIAL').length;
    const attendedCount = presentCount + (partialCount > 0 ? 1 : 0);

    const attendancePercent = totalAssignedClasses > 0
      ? Math.round((attendedCount / totalAssignedClasses) * 100)
      : 0;

    return {
      totalClasses: totalAssignedClasses,
      attendedClasses: attendedCount,
      presentCount,
      partialCount,
      attendancePercentage: attendancePercent
    };
  }
}
