import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { SocketProvider } from './context/SocketContext.js';
import { Navbar } from './components/common/Navbar.js';
import { MobileNav } from './components/common/MobileNav.js';

// Pages
import { LandingPage } from './pages/LandingPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { StudentDashboard } from './pages/StudentDashboard.js';
import { StudentClassesPage } from './pages/StudentClassesPage.js';
import { TeacherDashboard } from './pages/TeacherDashboard.js';
import { AdminDashboard } from './pages/AdminDashboard.js';
import { JoinPage } from './pages/JoinPage.js';
import { ClassroomPage } from './pages/ClassroomPage.js';
import { AttendancePage } from './pages/AttendancePage.js';
import { MaterialsPage } from './pages/MaterialsPage.js';
import { AnnouncementsPage } from './pages/AnnouncementsPage.js';
import { SupportPage } from './pages/SupportPage.js';
import { ProfilePage } from './pages/ProfilePage.js';

// Role-based route guard
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: Array<'admin' | 'teacher' | 'student'>;
}> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-bold text-sm">
        Verifying authorization...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to user's assigned dashboard
    return <Navigate to={`/${user.role}`} replace />;
  }

  return <>{children}</>;
};

// Layout wrapper with Navbar & Mobile Nav
const AppLayout: React.FC<{ children: React.ReactNode; hideNav?: boolean }> = ({ children, hideNav = false }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {!hideNav && <Navbar />}
      <main className="flex-1">{children}</main>
      {!hideNav && <MobileNav />}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<AppLayout><LandingPage /></AppLayout>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/support" element={<AppLayout><SupportPage /></AppLayout>} />

            {/* Student Friendly Join Gateway (/join/:classCode) */}
            <Route path="/join/:classCode" element={<JoinPage />} />

            {/* Live Interactive Classroom (Clean minimal layout without standard navbar) */}
            <Route
              path="/classroom/:classCode"
              element={
                <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
                  <ClassroomPage />
                </ProtectedRoute>
              }
            />

            {/* Student Portal */}
            <Route
              path="/student"
              element={
                <ProtectedRoute allowedRoles={['student', 'admin']}>
                  <AppLayout><StudentDashboard /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/classes"
              element={
                <ProtectedRoute allowedRoles={['student', 'admin']}>
                  <AppLayout><StudentClassesPage /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/attendance"
              element={
                <ProtectedRoute allowedRoles={['student', 'admin']}>
                  <AppLayout><AttendancePage /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/materials"
              element={
                <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
                  <AppLayout><MaterialsPage /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/announcements"
              element={
                <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
                  <AppLayout><AnnouncementsPage /></AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Teacher Portal */}
            <Route
              path="/teacher"
              element={
                <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                  <AppLayout><TeacherDashboard /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/classes"
              element={
                <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                  <AppLayout><TeacherDashboard /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/classes/:classId/attendance"
              element={
                <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                  <AppLayout><AttendancePage /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/materials"
              element={
                <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                  <AppLayout><MaterialsPage /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/announcements"
              element={
                <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                  <AppLayout><AnnouncementsPage /></AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Admin Portal */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AppLayout><AdminDashboard /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AppLayout><AdminDashboard /></AppLayout>
                </ProtectedRoute>
              }
            />

            {/* User Profile */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
                  <AppLayout><ProfilePage /></AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
