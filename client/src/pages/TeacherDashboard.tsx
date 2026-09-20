import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { QRCodeModal } from '../components/common/QRCodeModal.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { 
  Video, 
  Play, 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle, 
  QrCode, 
  FileText, 
  Bell, 
  Plus, 
  Share2, 
  ArrowRight,
  ExternalLink,
  BookOpen
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClassForQR, setSelectedClassForQR] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'completed'>('today');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/teacher/dashboard');
      if (res.success) {
        setDashboardData(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleStartClass = async (classId: number, classCode: string) => {
    try {
      await api.post(`/teacher/classes/${classId}/start`);
      // Navigate directly into the classroom as teacher host!
      navigate(`/classroom/${classCode}`);
    } catch (e: any) {
      alert(e.message || 'Failed to start class');
    }
  };

  const handleEndClass = async (classId: number) => {
    if (window.confirm('End this class session? Attendance duration will be finalized.')) {
      try {
        await api.post(`/teacher/classes/${classId}/end`);
        fetchDashboard();
      } catch (e: any) {
        alert(e.message || 'Failed to end class');
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center text-slate-500 font-semibold">
        Loading teacher dashboard...
      </div>
    );
  }

  const stats = dashboardData?.stats || {
    totalClasses: 0,
    liveClasses: 0,
    todayClassesCount: 0,
    completedClassesCount: 0,
    totalStudents: 0,
    totalMaterials: 0
  };

  const todayClasses = dashboardData?.todayClasses || [];
  const upcomingClasses = dashboardData?.upcomingClasses || [];
  const completedClasses = dashboardData?.completedClasses || [];

  const currentList = activeTab === 'today' ? todayClasses : activeTab === 'upcoming' ? upcomingClasses : completedClasses;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Teacher Classroom Portal
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Instructor: <strong>{user?.name}</strong> • {user?.teacherCode || 'TRN00001'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/teacher/materials"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <FileText className="w-4 h-4 text-brand-600" /> Upload Materials
          </Link>
          <Link
            to="/teacher/announcements"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-colors shadow-sm"
          >
            <Bell className="w-4 h-4" /> Send Announcement
          </Link>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
          <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">Total Students</span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900">{stats.totalStudents}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
          <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">Live Classes</span>
          <span className="text-2xl sm:text-3xl font-black text-rose-600 flex items-center gap-2">
            {stats.liveClasses} {stats.liveClasses > 0 && <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping"></span>}
          </span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
          <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">Today's Classes</span>
          <span className="text-2xl sm:text-3xl font-black text-brand-600">{stats.todayClassesCount}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
          <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">Completed Classes</span>
          <span className="text-2xl sm:text-3xl font-black text-slate-800">{stats.completedClassesCount}</span>
        </div>
      </div>

      {/* Class Schedule Tabs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('today')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'today'
                  ? 'bg-brand-600 text-white shadow'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Today's Classes ({todayClasses.length})
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'upcoming'
                  ? 'bg-brand-600 text-white shadow'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Upcoming ({upcomingClasses.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'completed'
                  ? 'bg-brand-600 text-white shadow'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Completed ({completedClasses.length})
            </button>
          </div>
        </div>

        {/* Classes Cards List */}
        {currentList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {currentList.map((cls: any) => {
              const isLive = cls.status === 'live';
              const isCompleted = cls.status === 'completed';

              return (
                <div
                  key={cls.id}
                  className={`bg-white rounded-3xl p-6 border transition-all shadow-soft flex flex-col justify-between ${
                    isLive ? 'border-rose-400 ring-4 ring-rose-500/10' : 'border-slate-200'
                  }`}
                >
                  <div>
                    {/* Header tags */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        {isLive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                            <span className="w-2 h-2 rounded-full bg-rose-600 animate-live"></span>
                            LIVE NOW
                          </span>
                        ) : isCompleted ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                            Completed
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                            Scheduled
                          </span>
                        )}

                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {cls.batch_name || 'Batch 6'}
                        </span>
                      </div>

                      <span className="text-xs font-mono text-slate-400 font-semibold">{cls.class_code}</span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug">
                      {cls.title}
                    </h3>

                    {/* Meta info */}
                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-5 flex-wrap">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {cls.date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {cls.start_time} – {cls.end_time}</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {cls.joined_count || 0} Joined</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedClassForQR(cls)}
                        className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
                        title="Show QR Code for students to scan"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>

                      <Link
                        to={`/teacher/classes/${cls.id}/attendance`}
                        className="px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors flex items-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Attendance
                      </Link>
                    </div>

                    <div className="flex items-center gap-2">
                      {isLive ? (
                        <>
                          <button
                            onClick={() => navigate(`/classroom/${cls.class_code}`)}
                            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow"
                          >
                            <Video className="w-4 h-4" /> Enter Room
                          </button>
                          <button
                            onClick={() => handleEndClass(cls.id)}
                            className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold"
                          >
                            End Class
                          </button>
                        </>
                      ) : isCompleted ? (
                        <span className="text-xs font-semibold text-slate-400">Class Finished</span>
                      ) : (
                        <button
                          onClick={() => handleStartClass(cls.id, cls.class_code)}
                          className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-brand-500/20 active:scale-95 transition-all"
                        >
                          <Play className="w-4 h-4 fill-white" /> START CLASS
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState type="classes" />
        )}
      </div>

      {/* QR Code Modal */}
      {selectedClassForQR && (
        <QRCodeModal
          isOpen={true}
          onClose={() => setSelectedClassForQR(null)}
          classCode={selectedClassForQR.class_code}
          classTitle={selectedClassForQR.title}
          teacherName={user?.name}
          date={selectedClassForQR.date}
          time={`${selectedClassForQR.start_time} – ${selectedClassForQR.end_time}`}
        />
      )}
    </div>
  );
};
