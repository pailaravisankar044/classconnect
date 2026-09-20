import bcrypt from 'bcryptjs';
import { db, initDatabase } from './database.js';

export async function seedDatabase() {
  console.log('🌱 Starting database seeding...');
  initDatabase();

  // Clear existing records to allow re-seeding
  db.exec(`
    DELETE FROM notifications;
    DELETE FROM materials;
    DELETE FROM messages;
    DELETE FROM announcements;
    DELETE FROM attendance;
    DELETE FROM classes;
    DELETE FROM students;
    DELETE FROM teachers;
    DELETE FROM admins;
    DELETE FROM batches;
    DELETE FROM courses;
    DELETE FROM users;
  `);

  const passwordHash = await bcrypt.hash('admin123', 10);
  const teacherPasswordHash = await bcrypt.hash('teacher123', 10);
  const studentPasswordHash = await bcrypt.hash('student123', 10);

  // 1. Create Users
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, phone, password_hash, role, status)
    VALUES (?, ?, ?, ?, ?, 'active')
  `);

  // Admin User
  const adminRes = insertUser.run('System Administrator', 'admin@classconnect.com', '+91 98765 43210', passwordHash, 'admin');
  const adminUserId = Number(adminRes.lastInsertRowid);
  db.prepare('INSERT INTO admins (user_id) VALUES (?)').run(adminUserId);

  // Teacher User: Demo Trainer
  const teacherRes = insertUser.run('Demo Trainer', 'teacher@classconnect.com', '+91 98765 43211', teacherPasswordHash, 'teacher');
  const teacherUserId = Number(teacherRes.lastInsertRowid);
  const teacherProfileRes = db.prepare(`
    INSERT INTO teachers (user_id, teacher_code, specialization, bio)
    VALUES (?, 'TRN00001', 'Artificial Intelligence & Modern Web Technologies', 'Senior Technical Instructor with 10+ years of digital skills training.')
  `).run(teacherUserId);
  const teacherId = Number(teacherProfileRes.lastInsertRowid);

  // 2. Create Course
  const courseRes = db.prepare(`
    INSERT INTO courses (code, name, description, status)
    VALUES ('CRS-DSAI', 'Digital Skills & AI Starter', 'Comprehensive foundational training in artificial intelligence, digital productivity, and web technologies.', 'active')
  `).run();
  const courseId = Number(courseRes.lastInsertRowid);

  // 3. Create Batch
  const batchRes = db.prepare(`
    INSERT INTO batches (course_id, name, start_date, end_date, status)
    VALUES (?, 'Batch 6', '2026-09-01', '2026-10-15', 'active')
  `).run(courseId);
  const batchId = Number(batchRes.lastInsertRowid);

  // 4. Create Students (At least 10 demo students)
  const studentNames = [
    { name: 'Rahul Sharma', email: 'student@classconnect.com', phone: '+91 91234 56780', code: 'STU00001' },
    { name: 'Priya Patel', email: 'priya.patel@example.com', phone: '+91 91234 56781', code: 'STU00002' },
    { name: 'Aarav Mehta', email: 'aarav.mehta@example.com', phone: '+91 91234 56782', code: 'STU00003' },
    { name: 'Sneha Rao', email: 'sneha.rao@example.com', phone: '+91 91234 56783', code: 'STU00004' },
    { name: 'Rohan Gupta', email: 'rohan.gupta@example.com', phone: '+91 91234 56784', code: 'STU00005' },
    { name: 'Ananya Verma', email: 'ananya.verma@example.com', phone: '+91 91234 56785', code: 'STU00006' },
    { name: 'Vikram Singh', email: 'vikram.singh@example.com', phone: '+91 91234 56786', code: 'STU00007' },
    { name: 'Kavita Nair', email: 'kavita.nair@example.com', phone: '+91 91234 56787', code: 'STU00008' },
    { name: 'Arjun Das', email: 'arjun.das@example.com', phone: '+91 91234 56788', code: 'STU00009' },
    { name: 'Diya Joshi', email: 'diya.joshi@example.com', phone: '+91 91234 56789', code: 'STU00010' }
  ];

  const studentIds: number[] = [];
  const insertStudentProfile = db.prepare(`
    INSERT INTO students (user_id, student_code, course_id, batch_id)
    VALUES (?, ?, ?, ?)
  `);

  for (const s of studentNames) {
    const sRes = insertUser.run(s.name, s.email, s.phone, studentPasswordHash, 'student');
    const sUserId = Number(sRes.lastInsertRowid);
    const stuProfRes = insertStudentProfile.run(sUserId, s.code, courseId, batchId);
    studentIds.push(Number(stuProfRes.lastInsertRowid));
  }

  // 5. Create 5+ Classes
  // Dates relative to today
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const insertClass = db.prepare(`
    INSERT INTO classes (
      class_code, course_id, batch_id, teacher_id, title, description,
      date, start_time, end_time, duration_minutes, meeting_type, meeting_url, max_students, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Class 1: Completed (Two days ago)
  const c1Res = insertClass.run(
    'CLS20260918001', courseId, batchId, teacherId,
    'Digital Skills & AI – Day 1: Course Orientation & Foundations',
    'Introduction to course structure, digital mindset, and essential collaboration tools.',
    twoDaysAgo, '10:00', '11:30', 90, 'internal', null, 50, 'completed'
  );
  const class1Id = Number(c1Res.lastInsertRowid);

  // Class 2: Completed (Yesterday)
  const c2Res = insertClass.run(
    'CLS20260919001', courseId, batchId, teacherId,
    'Digital Skills & AI – Day 2: Generative AI & Prompt Engineering',
    'Practical prompt engineering with ChatGPT, Gemini, and AI productivity assistants.',
    yesterday, '10:00', '11:30', 90, 'internal', null, 50, 'completed'
  );
  const class2Id = Number(c2Res.lastInsertRowid);

  // Class 3: LIVE NOW (Today)
  const c3Res = insertClass.run(
    'CLS20260920001', courseId, batchId, teacherId,
    'Digital Skills & AI – Day 3: Modern Web Technology & AI Tools',
    'Interactive live classroom covering modern full-stack web applications and AI integration.',
    today, '10:00', '11:30', 90, 'internal', null, 50, 'live'
  );
  const class3Id = Number(c3Res.lastInsertRowid);

  // Class 4: Starting Soon / Scheduled Today afternoon or Tomorrow
  const c4Res = insertClass.run(
    'CLS20260921001', courseId, batchId, teacherId,
    'Digital Skills & AI – Day 4: Building Intelligent Student Portfolios',
    'Hands-on session designing personal project showcases and GitHub presence.',
    tomorrow, '14:00', '15:30', 90, 'internal', null, 50, 'scheduled'
  );

  // Class 5: External Meeting Example (Zoom)
  const c5Res = insertClass.run(
    'CLS20260923001', courseId, batchId, teacherId,
    'Digital Skills & AI – Day 5: Industry Masterclass with Guest Speaker',
    'Special guest speaker session hosted on Zoom. Click join to enter room.',
    nextWeek, '11:00', '12:30', 90, 'zoom', 'https://zoom.us/j/9876543210?pwd=ClassConnectDemo2026', 100, 'scheduled'
  );

  // Class 6: External Meeting Example (Google Meet)
  insertClass.run(
    'CLS20260925001', courseId, batchId, teacherId,
    'Digital Skills & AI – Day 6: Capstone Project Reviews & AMA',
    'Final cohort capstone evaluation session on Google Meet.',
    nextWeek, '15:00', '16:30', 90, 'google_meet', 'https://meet.google.com/xyz-uvwx-rst', 100, 'scheduled'
  );

  // 6. Attendance records for completed classes (Demonstrating PRESENT, PARTIAL, ABSENT)
  const insertAttendance = db.prepare(`
    INSERT INTO attendance (class_id, student_id, joined_at, left_at, duration_minutes, attendance_percentage, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // Class 1 attendance for students (Rahul attended 85 mins out of 90 -> 94.4% PRESENT)
  insertAttendance.run(class1Id, studentIds[0], `${twoDaysAgo}T10:02:00`, `${twoDaysAgo}T11:27:00`, 85, 94.4, 'PRESENT');
  insertAttendance.run(class1Id, studentIds[1], `${twoDaysAgo}T10:00:00`, `${twoDaysAgo}T11:30:00`, 90, 100.0, 'PRESENT');
  insertAttendance.run(class1Id, studentIds[2], `${twoDaysAgo}T10:15:00`, `${twoDaysAgo}T11:05:00`, 50, 55.5, 'PARTIAL');
  insertAttendance.run(class1Id, studentIds[3], `${twoDaysAgo}T10:05:00`, `${twoDaysAgo}T11:25:00`, 80, 88.8, 'PRESENT');

  // Class 2 attendance
  insertAttendance.run(class2Id, studentIds[0], `${yesterday}T10:01:00`, `${yesterday}T11:29:00`, 88, 97.7, 'PRESENT');
  insertAttendance.run(class2Id, studentIds[1], `${yesterday}T10:04:00`, `${yesterday}T11:30:00`, 86, 95.5, 'PRESENT');
  insertAttendance.run(class2Id, studentIds[2], `${yesterday}T10:45:00`, `${yesterday}T11:15:00`, 30, 33.3, 'PARTIAL');
  insertAttendance.run(class2Id, studentIds[4], `${yesterday}T10:02:00`, `${yesterday}T11:28:00`, 86, 95.5, 'PRESENT');

  // 7. Announcements
  const insertAnnouncement = db.prepare(`
    INSERT INTO announcements (title, message, target_type, target_id, author_id)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertAnnouncement.run(
    'Welcome to ClassConnect & Batch 6!',
    'Welcome everyone! Please verify your microphone and camera before each class. All class recordings and materials will be uploaded after each live session.',
    'all', null, adminUserId
  );

  insertAnnouncement.run(
    'Important: AI Masterclass Link & Preparation',
    'For Day 5, please make sure you have created your free accounts on the platforms listed in the learning materials.',
    'batch', batchId, teacherUserId
  );

  // 8. Learning Materials
  const insertMaterial = db.prepare(`
    INSERT INTO materials (title, description, file_url, file_type, file_size, class_id, course_id, teacher_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertMaterial.run(
    'Day 1 Lecture Slides & Syllabus (PDF)',
    'Official slide deck covering foundations, weekly schedules, and assignment guidelines.',
    '/uploads/materials/sample_day1_foundations.pdf',
    'pdf',
    2450000,
    class1Id,
    courseId,
    teacherId
  );

  insertMaterial.run(
    'Prompt Engineering Handbook & Cheat Sheet',
    'Quick-reference guide for system prompts, few-shot examples, and chain-of-thought prompting.',
    '/uploads/materials/prompt_engineering_guide.pdf',
    'pdf',
    1800000,
    class2Id,
    courseId,
    teacherId
  );

  insertMaterial.run(
    'Recommended AI & Web Dev Resources (Links)',
    'Curated links to documentation, interactive playgrounds, and video tutorials.',
    'https://developer.mozilla.org',
    'link',
    0,
    class3Id,
    courseId,
    teacherId
  );

  // 9. Sample In-App Notifications
  const insertNotification = db.prepare(`
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertNotification.run(
    studentNames[0].email === 'student@classconnect.com' ? 3 : 1, // Student user id
    'Class Starting Soon',
    'Your class "Digital Skills & AI – Day 3" is LIVE NOW. Tap to join!',
    'class_starting',
    '/classroom/CLS20260920001'
  );

  console.log('✅ Database seeded successfully!');
  console.log('----------------------------------------------------');
  console.log('Demo Credentials:');
  console.log('Admin:   admin@classconnect.com   / admin123');
  console.log('Teacher: teacher@classconnect.com / teacher123');
  console.log('Student: student@classconnect.com / student123');
  console.log('----------------------------------------------------');
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase().catch(console.error);
}
