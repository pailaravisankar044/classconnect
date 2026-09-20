import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { 
  CheckCircle2, 
  Clock, 
  Calendar, 
  User, 
  Download, 
  AlertCircle, 
  ArrowLeft,
  Filter,
  BarChart3
} from 'lucide-react';

export const AttendancePage: React.FC = () => {
  const { classId } = useParams<{ classId?: string }>();
  const { user } = useAuth();

  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        if (classId && isTeacherOrAdmin) {
          // Fetch class-specific roster
          const res = await api.get(`/teacher/classes/${classId}/attendance`);
          if (res.success) {
            setAttendanceData(res);
          }
        } else {
          // Fetch student personal attendance history
          const res = await api.get('/student/attendance');
          if (res.success) {
            setAttendanceData(res);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load attendance records.');
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [classId, isTeacherOrAdmin]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Present
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Partial
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> Absent
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center text-slate-500 font-semibold">
        Loading attendance records...
      </div>
    );
  }

  // Teacher / Admin viewing a specific class roster
  if (classId && isTeacherOrAdmin) {
    const classDetails = attendanceData?.classDetails;
    const students = attendanceData?.students || [];
    const summary = attendanceData?.summary || { total: 0, present: 0, partial: 0, absent: 0, attendanceRate: 0 };

    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to="/teacher"
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Classes
          </Link>
          <a
            href={`/api/reports/classes/csv?classId=${classId}`}
            download
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> Export Class CSV
          </a>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft">
          <span className="text-xs font-mono font-bold text-brand-600 uppercase bg-brand-50 px-2.5 py-0.5 rounded-md">
            {classDetails?.class_code}
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-2 mb-1">
            {classDetails?.title}
          </h1>
          <p className="text-xs text-slate-500">
            {classDetails?.date} • {classDetails?.start_time} – {classDetails?.end_time} • {classDetails?.batch_name}
          </p>

          {/* KPI Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
            <div className="bg-slate-50 p-3 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Students</span>
              <span className="text-xl font-extrabold text-slate-800">{summary.total}</span>
            </div>
            <div className="bg-emerald-50 p-3 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-600 block">Present (75%+)</span>
              <span className="text-xl font-extrabold text-emerald-800">{summary.present}</span>
            </div>
            <div className="bg-amber-50 p-3 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-amber-600 block">Partial</span>
              <span className="text-xl font-extrabold text-amber-800">{summary.partial}</span>
            </div>
            <div className="bg-rose-50 p-3 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-rose-600 block">Absent</span>
              <span className="text-xl font-extrabold text-rose-800">{summary.absent}</span>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-soft">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Student Attendance Roster</h3>
            <span className="text-xs text-slate-500">{students.length} Students Enrolled</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Joined At</th>
                  <th className="py-3 px-4">Left At</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Attendance %</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                {students.map((s: any) => (
                  <tr key={s.student_id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold text-brand-600">{s.student_code}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{s.student_name}</div>
                      <div className="text-[11px] text-slate-400">{s.email}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {s.joined_at ? new Date(s.joined_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {s.left_at ? new Date(s.left_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="py-3 px-4 font-semibold">{s.duration_minutes ? `${s.duration_minutes}m` : '0m'}</td>
                    <td className="py-3 px-4 font-bold">{s.attendance_percentage ? `${s.attendance_percentage}%` : '0%'}</td>
                    <td className="py-3 px-4 text-right">{getStatusBadge(s.attendance_status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Student viewing personal attendance breakdown
  const stats = attendanceData?.stats || { attendancePercentage: 0, attendedClasses: 0, totalClasses: 0, presentCount: 0, partialCount: 0 };
  const history = attendanceData?.history || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Attendance History</h1>
          <p className="text-xs text-slate-500 mt-0.5">Automated class attendance records and participation percentage.</p>
        </div>
        <div className="text-right">
          <span className="text-3xl font-black text-emerald-600">{stats.attendancePercentage}%</span>
          <span className="text-[11px] font-bold text-slate-400 block uppercase">Overall Attendance</span>
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-soft">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
          <span>Completion Progress (Threshold: 75%)</span>
          <span>{stats.attendedClasses} of {stats.totalClasses} classes attended</span>
        </div>
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, stats.attendancePercentage)}%` }}
          ></div>
        </div>
      </div>

      {/* Attendance History Timeline */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-soft">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm">Class Sessions Log</h3>
        </div>

        {history.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {history.map((record: any) => (
              <div key={record.id} className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                      {record.class_code}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {record.class_date}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-base">{record.class_title}</h4>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                    <span>Instructor: {record.teacher_name}</span>
                    <span>Class Window: {record.start_time} – {record.end_time}</span>
                  </p>
                </div>

                <div className="flex items-center gap-4 sm:text-right">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      {record.duration_minutes} mins ({record.attendance_percentage}%)
                    </span>
                    <span className="text-[11px] text-slate-400 block font-mono">
                      Joined: {record.joined_at ? new Date(record.joined_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </span>
                  </div>
                  <div>
                    {getStatusBadge(record.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8">
            <EmptyState type="attendance" />
          </div>
        )}
      </div>
    </div>
  );
};
