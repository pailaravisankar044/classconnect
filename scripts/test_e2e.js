const BASE_URL = 'http://localhost:5000';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n🧪 ========================================================');
  console.log('🧪 Starting ClassConnect Automated E2E Verification Suite');
  console.log('🧪 ========================================================\n');

  // Test 1: Health Check
  console.log('Test Group 1: System Health & Base Configuration');
  const health = await request('/api/health');
  assert(health.ok && health.data?.status === 'ok', 'API health check responds with 200 OK');

  // Test 2: Student Login
  console.log('\nTest Group 2: Role Authentication');
  const studentAuth = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: 'student@classconnect.com', password: 'student123' })
  });
  assert(studentAuth.ok && studentAuth.data?.user?.role === 'student', 'Student logs in successfully with role=student');
  const studentToken = studentAuth.data.token;
  const studentUser = studentAuth.data.user;

  // Test 3: Teacher Login
  const teacherAuth = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: 'teacher@classconnect.com', password: 'teacher123' })
  });
  assert(teacherAuth.ok && teacherAuth.data?.user?.role === 'teacher', 'Teacher logs in successfully with role=teacher');
  const teacherToken = teacherAuth.data.token;

  // Test 4: Admin Login
  const adminAuth = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: 'admin@classconnect.com', password: 'admin123' })
  });
  assert(adminAuth.ok && adminAuth.data?.user?.role === 'admin', 'Admin logs in successfully with role=admin');
  const adminToken = adminAuth.data.token;

  // Test 5: Role Security & Access Control (Requirement 25, 44)
  console.log('\nTest Group 3: Role Security & RBAC Enforcement');
  const studentAdminAttempt = await request('/api/admin/dashboard', {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert(studentAdminAttempt.status === 403, 'Student attempting /api/admin/dashboard is DENIED (403 Forbidden)');

  const teacherAdminAttempt = await request('/api/admin/dashboard', {
    headers: { Authorization: `Bearer ${teacherToken}` }
  });
  assert(teacherAdminAttempt.status === 403, 'Teacher attempting /api/admin/dashboard is DENIED (403 Forbidden)');

  const unauthAttempt = await request('/api/student/dashboard');
  assert(unauthAttempt.status === 401, 'Unauthenticated request to protected route is DENIED (401 Unauthorized)');

  // Test 6: Student Dashboard & Next Class
  console.log('\nTest Group 4: Student Dashboard & Live Class Discovery');
  const studentDash = await request('/api/student/dashboard', {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert(studentDash.ok && studentDash.data?.data?.nextClass, 'Student dashboard delivers NEXT CLASS data');
  const nextClass = studentDash.data.data.nextClass;
  assert(nextClass.status === 'live', `Next class status is correctly identified as LIVE (${nextClass.title})`);
  assert(studentDash.data?.data?.upcomingClasses?.length > 0, 'Upcoming classes list is populated');
  assert(studentDash.data?.data?.attendance?.attendancePercentage >= 0, 'Attendance statistics calculated and delivered');

  // Test 7: Student Class Details & Join Flow
  console.log('\nTest Group 5: Student Join Gateway & Attendance Logging');
  const classDetails = await request(`/api/classes/${nextClass.class_code}`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert(classDetails.ok && classDetails.data?.class?.id === nextClass.id, 'Class details retrieved via friendly code URL');

  // Join Log
  const joinLog = await request(`/api/classes/${nextClass.id}/join-log`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert(joinLog.ok && joinLog.data?.success, 'Student joining class logs attendance record');

  // Leave Log & Calculation
  const leaveLog = await request('/api/attendance/leave', {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({ classId: nextClass.id })
  });
  assert(leaveLog.ok && leaveLog.data?.result?.status, `Student leaving class calculates attendance percentage & status (${leaveLog.data?.result?.status})`);

  // Test 8: External Meeting Provider Integration (Zoom / Google Meet)
  console.log('\nTest Group 6: External Meeting Provider Handling (Zoom/GMeet)');
  const zoomClass = await request('/api/classes/CLS20260923001', {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert(zoomClass.ok && zoomClass.data?.class?.meeting_type === 'zoom', 'External Zoom class configured and retrieved');
  assert(zoomClass.data?.class?.meeting_url?.includes('zoom.us'), 'Zoom URL properly stored and provided to student');

  // Test 9: Teacher Class Management
  console.log('\nTest Group 7: Teacher Dashboard & Class Operations');
  const teacherDash = await request('/api/teacher/dashboard', {
    headers: { Authorization: `Bearer ${teacherToken}` }
  });
  assert(teacherDash.ok && teacherDash.data?.data?.todayClasses?.length > 0, 'Teacher dashboard retrieves assigned sessions');

  // Test 10: Admin Student Management & Auto Code Generation (STU00011)
  console.log('\nTest Group 8: Admin Management & Code Generation');
  const newStudent = await request('/api/admin/students', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      name: 'Automated Test Student',
      email: `autotest.${Date.now()}@classconnect.com`,
      phone: '+91 99999 88888',
      batchId: 1
    })
  });
  assert(newStudent.ok && newStudent.data?.studentCode?.startsWith('STU'), `New student created with generated ID: ${newStudent.data?.studentCode}`);

  // Test 11: Admin Class Scheduling & Auto Code Generation (CLS...)
  const todayStr = new Date().toISOString().split('T')[0];
  const newClass = await request('/api/classes', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      title: 'Advanced AI Prompt Systems',
      teacherId: 1,
      batchId: 1,
      date: todayStr,
      startTime: '16:00',
      endTime: '17:30',
      meetingType: 'internal'
    })
  });
  assert(newClass.ok && newClass.data?.classCode?.startsWith('CLS'), `New class scheduled with generated ID: ${newClass.data?.classCode}`);

  // Test 12: CSV Reports Generation
  console.log('\nTest Group 9: Administrative CSV Export Suite');
  const stuCsv = await fetch(`${BASE_URL}/api/reports/students/csv`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const stuCsvText = await stuCsv.text();
  assert(stuCsv.ok && stuCsvText.includes('Student ID,Student Name'), 'Student Attendance CSV report generated with standard headers');

  const clsCsv = await fetch(`${BASE_URL}/api/reports/classes/csv`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const clsCsvText = await clsCsv.text();
  assert(clsCsv.ok && clsCsvText.includes('Class Code,Class Title'), 'Class Attendance CSV report generated with session records');

  // Test 13: Learning Materials Accessibility
  console.log('\nTest Group 10: Learning Materials & Resources');
  const materials = await request('/api/student/materials', {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert(materials.ok && materials.data?.materials?.length > 0, `Learning materials accessible to enrolled student (${materials.data.materials.length} resources)`);

  // Final Summary
  console.log('\n========================================================');
  console.log(`🎉 TEST RUN COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
