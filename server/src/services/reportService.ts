import { dbHelper } from '../db/database.js';

export class ReportService {
  /**
   * Generates CSV string for Student Attendance Report
   */
  static getStudentAttendanceReportCSV() {
    const rows = dbHelper.all(`
      SELECT 
        s.student_code,
        u.name as student_name,
        u.email,
        u.phone,
        b.name as batch_name,
        c.name as course_name,
        COUNT(a.id) as classes_attended,
        SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN a.status = 'PARTIAL' THEN 1 ELSE 0 END) as partial_count,
        ROUND(AVG(a.attendance_percentage), 1) as avg_attendance_pct
      FROM students s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN batches b ON b.id = s.batch_id
      LEFT JOIN courses c ON c.id = s.course_id
      LEFT JOIN attendance a ON a.student_id = s.id
      GROUP BY s.id
      ORDER BY s.student_code ASC
    `);

    const headers = ['Student ID', 'Student Name', 'Email', 'Phone', 'Course', 'Batch', 'Total Sessions Attended', 'Present', 'Partial', 'Average Attendance %'];
    const csvLines = [headers.join(',')];

    for (const r of rows) {
      csvLines.push([
        `"${r.student_code || ''}"`,
        `"${r.student_name || ''}"`,
        `"${r.email || ''}"`,
        `"${r.phone || ''}"`,
        `"${r.course_name || 'N/A'}"`,
        `"${r.batch_name || 'N/A'}"`,
        r.classes_attended || 0,
        r.present_count || 0,
        r.partial_count || 0,
        r.avg_attendance_pct || 0
      ].join(','));
    }

    return csvLines.join('\n');
  }

  /**
   * Generates CSV for Class Specific Attendance Report
   */
  static getClassAttendanceReportCSV(classId?: number) {
    let sql = `
      SELECT 
        c.class_code,
        c.title as class_title,
        c.date,
        c.start_time,
        c.end_time,
        s.student_code,
        u.name as student_name,
        u.email,
        a.joined_at,
        a.left_at,
        a.duration_minutes,
        a.attendance_percentage,
        a.status
      FROM attendance a
      JOIN classes c ON c.id = a.class_id
      JOIN students s ON s.id = a.student_id
      JOIN users u ON u.id = s.user_id
    `;
    const params: any[] = [];
    if (classId) {
      sql += ' WHERE c.id = ?';
      params.push(classId);
    }
    sql += ' ORDER BY c.date DESC, a.joined_at ASC';

    const rows = dbHelper.all(sql, params);
    const headers = ['Class Code', 'Class Title', 'Date', 'Time Window', 'Student Code', 'Student Name', 'Email', 'Joined At', 'Left At', 'Duration (mins)', 'Attendance %', 'Status'];
    const csvLines = [headers.join(',')];

    for (const r of rows) {
      csvLines.push([
        `"${r.class_code}"`,
        `"${r.class_title}"`,
        `"${r.date}"`,
        `"${r.start_time} - ${r.end_time}"`,
        `"${r.student_code}"`,
        `"${r.student_name}"`,
        `"${r.email}"`,
        `"${r.joined_at || ''}"`,
        `"${r.left_at || ''}"`,
        r.duration_minutes || 0,
        r.attendance_percentage || 0,
        `"${r.status}"`
      ].join(','));
    }

    return csvLines.join('\n');
  }

  /**
   * Generates CSV for Teacher Performance & Classes Report
   */
  static getTeacherReportCSV() {
    const rows = dbHelper.all(`
      SELECT 
        t.teacher_code,
        u.name as teacher_name,
        u.email,
        t.specialization,
        COUNT(DISTINCT c.id) as total_classes,
        SUM(CASE WHEN c.status = 'completed' THEN 1 ELSE 0 END) as completed_classes,
        SUM(CASE WHEN c.status = 'live' THEN 1 ELSE 0 END) as live_classes,
        COUNT(a.id) as total_student_attendances
      FROM teachers t
      JOIN users u ON u.id = t.user_id
      LEFT JOIN classes c ON c.teacher_id = t.id
      LEFT JOIN attendance a ON a.class_id = c.id
      GROUP BY t.id
      ORDER BY t.teacher_code ASC
    `);

    const headers = ['Teacher ID', 'Teacher Name', 'Email', 'Specialization', 'Total Classes Scheduled', 'Completed Classes', 'Live Classes', 'Total Student Attendances'];
    const csvLines = [headers.join(',')];

    for (const r of rows) {
      csvLines.push([
        `"${r.teacher_code}"`,
        `"${r.teacher_name}"`,
        `"${r.email}"`,
        `"${r.specialization || ''}"`,
        r.total_classes || 0,
        r.completed_classes || 0,
        r.live_classes || 0,
        r.total_student_attendances || 0
      ].join(','));
    }

    return csvLines.join('\n');
  }
}
