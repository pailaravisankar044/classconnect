import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { 
  Video, 
  CheckCircle, 
  FileText, 
  ArrowRight, 
  ShieldCheck, 
  GraduationCap, 
  Sparkles,
  Zap,
  Clock
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user, quickLogin } = useAuth();
  const navigate = useNavigate();

  const handleQuickLogin = async (role: 'student' | 'teacher' | 'admin') => {
    try {
      await quickLogin(role);
      navigate(`/${role}`);
    } catch (e) {
      navigate(`/login?role=${role}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 flex flex-col justify-between">
      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-16 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200/60 text-brand-700 text-xs sm:text-sm font-semibold mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 text-brand-600" />
            Simple Online Classes. Easy Student Access.
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.15] sm:leading-[1.12]">
            Join your online class <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">
              in one click.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            Attend live classes, access learning materials, and track your attendance — all in one simple platform designed for every student.
          </p>

          {/* Primary Role Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login?role=student"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 text-lg font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-2xl shadow-elevated transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <GraduationCap className="w-6 h-6" />
              Student Login
              <ArrowRight className="w-5 h-5 text-brand-200" />
            </Link>

            <Link
              to="/login?role=teacher"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 text-lg font-bold text-slate-800 bg-white hover:bg-slate-50 border-2 border-slate-200 rounded-2xl shadow-soft transition-all hover:border-slate-300 active:scale-[0.98]"
            >
              <Video className="w-6 h-6 text-brand-600" />
              Teacher Login
            </Link>
          </div>

          {/* Android Mobile APK Download CTA */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/api/download/apk"
              download="ClassConnect.apk"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] border border-slate-800"
            >
              <span className="text-base">📲</span>
              <span>Download Android App (APK)</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md font-mono">v1.0</span>
            </a>

            <Link
              to="/login?role=admin"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors py-2 px-3 rounded-xl hover:bg-slate-100"
            >
              <ShieldCheck className="w-4 h-4" />
              Admin Portal Login →
            </Link>
          </div>

          {/* One-Click Demo Quick Switcher Banner */}
          <div className="mt-10 p-4 sm:p-5 rounded-2xl bg-brand-50/70 border border-brand-100 text-left max-w-xl mx-auto">
            <div className="flex items-center gap-2 text-xs font-bold text-brand-800 uppercase tracking-wider mb-2">
              <Zap className="w-4 h-4 text-brand-600" /> Instant Demo Access (One-Click)
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Explore the system instantly with pre-populated demo roles and active classes:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleQuickLogin('student')}
                className="py-2 px-3 rounded-xl bg-white border border-brand-200 text-xs font-bold text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition-colors shadow-sm text-center"
              >
                🎓 Student
              </button>
              <button
                onClick={() => handleQuickLogin('teacher')}
                className="py-2 px-3 rounded-xl bg-white border border-brand-200 text-xs font-bold text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-colors shadow-sm text-center"
              >
                👨‍🏫 Teacher
              </button>
              <button
                onClick={() => handleQuickLogin('admin')}
                className="py-2 px-3 rounded-xl bg-white border border-brand-200 text-xs font-bold text-purple-700 hover:bg-purple-50 hover:border-purple-300 transition-colors shadow-sm text-center"
              >
                🛡️ Admin
              </button>
            </div>
          </div>
        </div>

        {/* 3 Core Feature Cards */}
        <div className="mt-16 sm:mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Card 1: LIVE CLASSES */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-soft hover:shadow-elevated transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-6">
              <Video className="w-7 h-7" />
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-rose-600 mb-1">Live Classes</div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Join online classes quickly.</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              No complicated links or confusing software. Simply tap the big "Join Class" button to enter your live session instantly.
            </p>
          </div>

          {/* Card 2: ATTENDANCE */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-soft hover:shadow-elevated transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
              <CheckCircle className="w-7 h-7" />
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">Attendance</div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Automatically track attendance.</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Never worry about roll calls. Your joined duration and participation percentage are accurately calculated in real time.
            </p>
          </div>

          {/* Card 3: LEARNING MATERIALS */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-soft hover:shadow-elevated transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-6">
              <FileText className="w-7 h-7" />
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-1">Learning Materials</div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Access notes and resources.</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Download lecture slides, assignments, PDFs, and notes uploaded directly by your teachers after every session.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-brand-600" />
            <span className="font-bold text-slate-800">ClassConnect</span>
            <span>— Simple Online Classes. Easy Student Access.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/support" className="hover:text-slate-900 transition-colors">Help & Support</Link>
            <Link to="/login" className="hover:text-slate-900 transition-colors">Portal Login</Link>
            <span>© 2026 ClassConnect Inc.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
