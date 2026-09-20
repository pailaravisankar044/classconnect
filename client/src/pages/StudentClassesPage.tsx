import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { QRCodeModal } from '../components/common/QRCodeModal.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { 
  Calendar, 
  Clock, 
  User, 
  Video, 
  CheckCircle2, 
  QrCode, 
  Search,
  ExternalLink,
  ArrowRight
} from 'lucide-react';

export const StudentClassesPage: React.FC = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [qrModalClass, setQrModalClass] = useState<any>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        const res = await api.get('/student/classes');
        if (res.success) {
          setClasses(res.classes || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const filtered = classes.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || 
                          c.teacher_name.toLowerCase().includes(search.toLowerCase()) ||
                          c.class_code.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (filterTab === 'upcoming') {
      return c.status === 'live' || (c.date >= today && c.status !== 'completed');
    }
    if (filterTab === 'completed') {
      return c.status === 'completed' || c.date < today;
    }
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            My Classes
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse all scheduled, live, and previous classroom sessions.
          </p>
        </div>

        {/* Search bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search class or teacher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:border-brand-600 outline-none shadow-sm"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilterTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filterTab === 'all' ? 'bg-brand-600 text-white shadow' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Classes ({classes.length})
        </button>
        <button
          onClick={() => setFilterTab('upcoming')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filterTab === 'upcoming' ? 'bg-brand-600 text-white shadow' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Upcoming & Live
        </button>
        <button
          onClick={() => setFilterTab('completed')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filterTab === 'completed' ? 'bg-brand-600 text-white shadow' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Completed
        </button>
      </div>

      {/* Cards List */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 font-semibold text-sm">
          Loading classes...
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((cls) => {
            const isLive = cls.status === 'live';
            const isCompleted = cls.status === 'completed' || cls.date < today;

            return (
              <div
                key={cls.id}
                className={`bg-white rounded-3xl p-6 border transition-all shadow-soft flex flex-col justify-between ${
                  isLive ? 'border-rose-400 ring-4 ring-rose-500/10' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      {isLive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                          <span className="w-2 h-2 rounded-full bg-rose-600 animate-live"></span>
                          LIVE NOW
                        </span>
                      ) : isCompleted ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                          Completed
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold">
                          Scheduled
                        </span>
                      )}

                      {cls.meeting_type !== 'internal' && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {cls.meeting_type}
                        </span>
                      )}
                    </div>

                    <span className="text-xs font-mono text-slate-400 font-semibold">{cls.class_code}</span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug">
                    {cls.title}
                  </h3>

                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-4 flex-wrap">
                    <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {cls.teacher_name}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {cls.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {cls.start_time} – {cls.end_time}</span>
                  </div>

                  {cls.attendance_status && (
                    <div className="mb-4 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-800 flex items-center justify-between">
                      <span>Attendance: <strong>{cls.attendance_status}</strong></span>
                      <span>{cls.attended_duration} mins ({cls.attendance_percentage}%)</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    onClick={() => setQrModalClass(cls)}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
                    title="Scan QR"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>

                  <Link
                    to={`/join/${cls.class_code}`}
                    className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-sm transition-all ${
                      isLive 
                        ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20' 
                        : isCompleted 
                          ? 'bg-slate-700 hover:bg-slate-800' 
                          : 'bg-brand-600 hover:bg-brand-700 shadow-brand-500/20'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    <span>{isLive ? 'JOIN LIVE' : isCompleted ? 'View Details' : 'Join Class'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState type="classes" />
      )}

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
