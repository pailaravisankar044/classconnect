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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classCodeInput, setClassCodeInput] = React.useState('');

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = classCodeInput.trim();
    if (code) {
      navigate(`/join/${code}`);
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

          {/* Primary Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 text-base sm:text-lg font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-2xl shadow-elevated transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <GraduationCap className="w-5 h-5" />
              Create Free Account
              <ArrowRight className="w-4 h-4 text-brand-200" />
            </Link>

            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 text-base sm:text-lg font-bold text-slate-800 bg-white hover:bg-slate-50 border-2 border-slate-200 rounded-2xl shadow-soft transition-all hover:border-slate-300 active:scale-[0.98]"
            >
              <span>Log In</span>
            </Link>
          </div>

          {/* Direct Class Code Join Bar */}
          <div className="mt-8 max-w-md mx-auto p-2 bg-white rounded-2xl border-2 border-slate-200 shadow-soft focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
            <form onSubmit={handleJoinSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={classCodeInput}
                onChange={(e) => setClassCodeInput(e.target.value.toUpperCase())}
                placeholder="Enter Class Code (e.g. CLS2026...)"
                className="flex-1 px-3.5 py-2 text-sm font-mono uppercase text-slate-900 placeholder:text-slate-400 placeholder:normal-case focus:outline-none"
              />
              <button
                type="submit"
                className="py-2.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm shrink-0"
              >
                Join Class →
              </button>
            </form>
          </div>

          {/* Android Mobile APK Download CTA & Admin link */}
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
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors py-2 px-3 rounded-xl hover:bg-slate-100"
            >
              <ShieldCheck className="w-4 h-4" />
              Admin Portal →
            </Link>
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
