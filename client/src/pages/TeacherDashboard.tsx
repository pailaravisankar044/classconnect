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
  BookOpen,
  Copy,
  Check,
  X,
  MessageSquare
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClassForQR, setSelectedClassForQR] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'completed'>('today');

  // Instant meeting state
  const [isInstantModalOpen, setIsInstantModalOpen] = useState(false);
  const [instantTitle, setInstantTitle] = useState('');
  const [instantDuration, setInstantDuration] = useState(60);
  const [isStartingInstant, setIsStartingInstant] = useState(false);

  // Share invitation modal state
  const [shareModalData, setShareModalData] = useState<{ title: string; classCode: string; date?: string; time?: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

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

  const handleOpenInstantModal = () => {
    setInstantTitle(`Live Class with ${user?.name || 'Instructor'}`);
    setIsInstantModalOpen(true);
  };

  const handleCreateInstantMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsStartingInstant(true);
      const res = await api.post('/classes/instant', {
        title: instantTitle.trim() || `Live Class with ${user?.name || 'Instructor'}`,
        durationMinutes: Number(instantDuration) || 60
      });

      if (res.success && res.classCode) {
        setIsInstantModalOpen(false);
        fetchDashboard();
        setShareModalData({
          title: res.title || instantTitle,
          classCode: res.classCode
        });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to start instant meeting.');
    } finally {
      setIsStartingInstant(false);
    }
  };

  const handleCopyLink = (classCode: string) => {
    const url = `${window.location.origin}/join/${classCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getWhatsAppMessage = (title: string, classCode: string) => {
    const joinUrl = `${window.location.origin}/join/${classCode}`;
    return `*Join my live class on ClassConnect!*\n\n*Topic:* ${title}\n*Class Code:* ${classCode}\n*Link:* ${joinUrl}\n\nTap the link above or open the ClassConnect app and enter the code to join!`;
  };

  const handleCopyWhatsApp = (title: string, classCode: string) => {
    const message = getWhatsAppMessage(title, classCode);
    navigator.clipboard.writeText(message);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const handleOpenWhatsApp = (title: string, classCode: string) => {
    const message = getWhatsAppMessage(title, classCode);
    handleCopyWhatsApp(title, classCode);
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

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

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOpenInstantModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 active:scale-95"
          >
            <Video className="w-4 h-4" />
            <span>+ Start Instant Meeting</span>
          </button>
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

                      <button
                        onClick={() => setShareModalData({ title: cls.title, classCode: cls.class_code, date: cls.date, time: `${cls.start_time} – ${cls.end_time}` })}
                        className="p-2 text-brand-600 hover:text-brand-800 hover:bg-brand-50 rounded-xl transition-colors border border-brand-200"
                        title="Share Invitation / WhatsApp"
                      >
                        <Share2 className="w-4 h-4" />
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

      {/* Start Instant Meeting Modal */}
      {isInstantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 text-left border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Start Instant Live Meeting</h3>
                  <p className="text-xs text-slate-500">Go live right now and invite students with a link</p>
                </div>
              </div>
              <button
                onClick={() => setIsInstantModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInstantMeeting} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Class Topic / Meeting Name
                </label>
                <input
                  type="text"
                  required
                  value={instantTitle}
                  onChange={(e) => setInstantTitle(e.target.value)}
                  placeholder="e.g. Physics Chapter 4 Doubt Session"
                  className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Duration
                </label>
                <select
                  value={instantDuration}
                  onChange={(e) => setInstantDuration(Number(e.target.value))}
                  className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none"
                >
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>60 Minutes (Standard)</option>
                  <option value={90}>90 Minutes</option>
                  <option value={120}>2 Hours</option>
                </select>
              </div>

              <div className="pt-3 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsInstantModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isStartingInstant}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isStartingInstant ? (
                    <span>Starting...</span>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      <span>Start Meeting Now</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Invitation Modal */}
      {shareModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 text-left border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Share Meeting Invitation</h3>
                  <p className="text-xs text-slate-500">Students can join using the link or class code</p>
                </div>
              </div>
              <button
                onClick={() => setShareModalData(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Meeting Topic</span>
                <span className="text-sm font-bold text-slate-900">{shareModalData.title}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Class Code</span>
                <div className="flex items-center justify-between mt-0.5 bg-white px-3 py-2 rounded-xl border border-slate-200">
                  <span className="font-mono text-base font-extrabold text-brand-600 tracking-wider">
                    {shareModalData.classCode}
                  </span>
                  <button
                    onClick={() => handleCopyLink(shareModalData.classCode)}
                    className="text-xs font-semibold text-slate-600 hover:text-brand-600 flex items-center gap-1"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Direct Join URL</span>
                <div className="text-xs text-slate-600 font-mono break-all bg-white p-2.5 rounded-xl border border-slate-200">
                  {`${window.location.origin}/join/${shareModalData.classCode}`}
                </div>
              </div>
            </div>

            {/* Quick Share Actions */}
            <div className="space-y-2.5">
              <button
                onClick={() => handleOpenWhatsApp(shareModalData.title, shareModalData.classCode)}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all active:scale-[0.99]"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Share via WhatsApp</span>
              </button>

              <button
                onClick={() => handleCopyWhatsApp(shareModalData.title, shareModalData.classCode)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                {copiedInvite ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedInvite ? 'Invitation Copied!' : 'Copy Full WhatsApp Text'}</span>
              </button>

              <button
                onClick={() => {
                  const code = shareModalData.classCode;
                  setShareModalData(null);
                  navigate(`/classroom/${code}`);
                }}
                className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-brand-500/20 transition-all active:scale-[0.99]"
              >
                <Video className="w-4 h-4" />
                <span>Enter Classroom as Host →</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
