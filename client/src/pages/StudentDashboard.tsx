import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { CountdownTimer } from '../components/common/CountdownTimer.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { QRCodeModal } from '../components/common/QRCodeModal.js';
import { 
  Video, 
  Calendar, 
  Clock, 
  User, 
  ArrowRight, 
  CheckCircle, 
  Bell, 
  BookOpen, 
  QrCode, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrModalClass, setQrModalClass] = useState<any>(null);
  const [joinCode, setJoinCode] = useState('');

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim();
    if (code) {
      navigate(`/join/${code}`);
    }
  };

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/student/dashboard');
      if (res.success) {
        setDashboardData(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to load dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto text-brand-600 animate-spin mb-4">
          <RefreshCw className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-slate-600">Loading your classroom dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-soft">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 mb-1">Something went wrong</h3>
          <p className="text-xs text-slate-500 mb-4">{error}</p>
          <button
            onClick={fetchDashboard}
            className="px-5 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const nextClass = dashboardData?.nextClass;
  const upcomingClasses = dashboardData?.upcomingClasses || [];
  const attendance = dashboardData?.attendance || { attendancePercentage: 0, attendedClasses: 0, totalClasses: 0 };
  const announcements = dashboardData?.announcements || [];

  const isLive = nextClass?.status === 'live';
  const isCompleted = nextClass?.status === 'completed';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-12 space-y-8">
      {/* Top Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {getGreeting()}, {user?.name} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
            <Calendar className="w-4 h-4 text-slate-400" />
            {formattedDate}
          </p>
        </div>
        {user?.studentCode && (
          <div className="self-start sm:self-auto bg-slate-100 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-700">
            ID: {user.studentCode}
          </div>
        )}
      </div>

      {/* Quick Join With Class Code or Link */}
      <div className="bg-gradient-to-r from-brand-50 to-indigo-50 border border-brand-200/70 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Have a Class Code or Meeting Link?</h3>
            <p className="text-xs text-slate-600">Enter the class code shared by your teacher to join instantly.</p>
          </div>
        </div>
        <form onSubmit={handleJoinByCode} className="w-full sm:w-auto flex items-center gap-2">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="e.g. CLS2026..."
            className="flex-1 sm:w-48 px-3.5 py-2.5 text-xs font-mono font-bold uppercase rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-brand-600 shadow-sm"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all shrink-0"
          >
            Join Class →
          </button>
        </form>
      </div>

      {/* NEXT CLASS — THE MOST IMPORTANT SECTION */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Video className="w-4 h-4 text-brand-600" />
            Next Class
          </h2>
          {nextClass && (
            <button
              onClick={() => setQrModalClass(nextClass)}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 hover:underline"
            >
              <QrCode className="w-3.5 h-3.5" />
              Scan QR Code
            </button>
          )}
        </div>

        {nextClass ? (
          <div className={`relative overflow-hidden rounded-3xl border-2 transition-all p-6 sm:p-8 bg-white shadow-elevated ${
            isLive ? 'border-rose-400 ring-4 ring-rose-500/10' : 'border-slate-200'
          }`}>
            {/* Top Status & Timing Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <CountdownTimer
                  targetDate={nextClass.date}
                  startTime={nextClass.start_time}
                  endTime={nextClass.end_time}
                  status={nextClass.status}
                />
                {nextClass.batch_name && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                    {nextClass.batch_name}
                  </span>
                )}
              </div>

              <div className="text-xs font-mono text-slate-500">
                {nextClass.class_code}
              </div>
            </div>

            {/* Class Title */}
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
              {nextClass.title}
            </h3>

            {nextClass.description && (
              <p className="text-sm text-slate-600 mb-6 leading-relaxed max-w-2xl">
                {nextClass.description}
              </p>
            )}

            {/* Details Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Instructor</span>
                  <span className="text-xs font-bold text-slate-800">{nextClass.teacher_name}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Date</span>
                  <span className="text-xs font-bold text-slate-800">{nextClass.date}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 col-span-2 sm:col-span-1">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Time</span>
                  <span className="text-xs font-bold text-slate-800">
                    {nextClass.start_time} – {nextClass.end_time} ({nextClass.duration_minutes}m)
                  </span>
                </div>
              </div>
            </div>

            {/* THE BIGGEST CTA ON THE PAGE: [ JOIN CLASS ] */}
            <div>
              {isCompleted ? (
                <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-center">
                  <p className="text-sm font-bold text-slate-600">This class has completed.</p>
                  <Link
                    to="/student/attendance"
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline"
                  >
                    View attendance record →
                  </Link>
                </div>
              ) : (
                <Link
                  to={`/join/${nextClass.class_code}`}
                  className={`w-full flex items-center justify-center gap-3 py-4 sm:py-5 px-6 rounded-2xl font-black text-lg sm:text-xl text-white shadow-elevated transition-all active:scale-[0.99] ${
                    isLive 
                      ? 'bg-rose-600 hover:bg-rose-700 ring-4 ring-rose-500/20 shadow-rose-600/30 animate-pulse' 
                      : 'bg-brand-600 hover:bg-brand-700 shadow-brand-600/25'
                  }`}
                >
                  <Video className="w-6 h-6 sm:w-7 sm:h-7" />
                  <span>JOIN CLASS</span>
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </Link>
              )}
            </div>
          </div>
        ) : (
          <EmptyState
            type="classes"
            title="No classes scheduled for today."
            description="You don't have any classes scheduled right now. Check back soon or view upcoming sessions below."
          />
        )}
      </section>

      {/* UPCOMING CLASSES */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-brand-600" />
            Upcoming Classes
          </h2>
          <Link
            to="/student/classes"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
          >
            View All Classes →
          </Link>
        </div>

        {upcomingClasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingClasses.map((cls: any) => (
              <div
                key={cls.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-brand-50 text-brand-700">
                      {cls.date}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {cls.start_time} – {cls.end_time}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-base mb-1 line-clamp-1">
                    {cls.title}
                  </h4>

                  <p className="text-xs text-slate-500 flex items-center gap-1 mb-4">
                    <User className="w-3.5 h-3.5" /> Instructor: {cls.teacher_name}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-mono text-slate-400">
                    {cls.duration_minutes} mins
                  </span>

                  <Link
                    to={`/join/${cls.class_code}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState type="classes" />
        )}
      </section>

      {/* MY ATTENDANCE & ANNOUNCEMENTS TWO-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MY ATTENDANCE (1 Column) */}
        <section className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                My Attendance
              </h2>
              <Link to="/student/attendance" className="text-xs font-semibold text-brand-600 hover:underline">
                History →
              </Link>
            </div>

            {/* Attendance Circular / Percentage Display */}
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-28 h-28 rounded-full border-8 border-emerald-500 bg-emerald-50/50 mb-2 shadow-inner">
                <span className="text-3xl font-black text-emerald-700 tracking-tight">
                  {attendance.attendancePercentage}%
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-600">Overall Attendance</p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 text-center">
              <div className="bg-slate-50 p-2.5 rounded-xl">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Attended</span>
                <span className="text-base font-extrabold text-slate-800">{attendance.attendedClasses}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Classes</span>
                <span className="text-base font-extrabold text-slate-800">{attendance.totalClasses}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <p className="text-[11px] text-slate-500 text-center">
              Target: Maintain 75%+ attendance for certification.
            </p>
          </div>
        </section>

        {/* ANNOUNCEMENTS (2 Columns) */}
        <section className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-brand-600" />
              Latest Announcements
            </h2>
          </div>

          {announcements.length > 0 ? (
            <div className="space-y-3">
              {announcements.map((item: any) => (
                <div key={item.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                    <span className="text-[11px] font-medium text-slate-400 shrink-0">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.message}</p>
                  <p className="text-[10px] font-bold text-brand-600 mt-2">
                    Posted by {item.author_name}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState type="announcements" />
          )}
        </section>
      </div>

      {/* QR Code Modal */}
      {qrModalClass && (
        <QRCodeModal
          isOpen={true}
          onClose={() => setQrModalClass(null)}
          classCode={qrModalClass.class_code}
          classTitle={qrModalClass.title}
          teacherName={qrModalClass.teacher_name}
          date={qrModalClass.date}
          time={`${qrModalClass.start_time} – ${qrModalClass.end_time}`}
        />
      )}
    </div>
  );
};
