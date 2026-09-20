import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { 
  Users, 
  GraduationCap, 
  Calendar, 
  Video, 
  TrendingUp, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Download, 
  Settings, 
  CheckCircle2, 
  Clock, 
  Shield, 
  ExternalLink,
  X,
  FileText
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'teachers' | 'classes' | 'reports' | 'settings'>('overview');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Lists state
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [settingsData, setSettingsData] = useState<any>({});

  // Search filters
  const [studentSearch, setStudentSearch] = useState('');
  const [teacherSearch, setTeacherSearch] = useState('');

  // Modals state
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [teacherModalOpen, setTeacherModalOpen] = useState(false);
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);

  // Student Form
  const [stuName, setStuName] = useState('');
  const [stuEmail, setStuEmail] = useState('');
  const [stuPhone, setStuPhone] = useState('');
  const [stuCourseId, setStuCourseId] = useState('');
  const [stuBatchId, setStuBatchId] = useState('');

  // Teacher Form
  const [trnName, setTrnName] = useState('');
  const [trnEmail, setTrnEmail] = useState('');
  const [trnPhone, setTrnPhone] = useState('');
  const [trnSpecialization, setTrnSpecialization] = useState('');
  const [trnBio, setTrnBio] = useState('');

  // Class Form
  const [clsTitle, setClsTitle] = useState('');
  const [clsDescription, setClsDescription] = useState('');
  const [clsTeacherId, setClsTeacherId] = useState('');
  const [clsBatchId, setClsBatchId] = useState('');
  const [clsDate, setClsDate] = useState(new Date().toISOString().split('T')[0]);
  const [clsStartTime, setClsStartTime] = useState('10:00');
  const [clsEndTime, setClsEndTime] = useState('11:30');
  const [clsMeetingType, setClsMeetingType] = useState('internal');
  const [clsMeetingUrl, setClsMeetingUrl] = useState('');

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/dashboard');
      if (res.success) setDashboardData(res.data);
      const sRes = await api.get('/settings');
      if (sRes.success) setSettingsData(sRes.settings);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    const res = await api.get(`/admin/students?search=${encodeURIComponent(studentSearch)}`);
    if (res.success) setStudents(res.students || []);
  };

  const fetchTeachers = async () => {
    const res = await api.get(`/admin/teachers?search=${encodeURIComponent(teacherSearch)}`);
    if (res.success) setTeachers(res.teachers || []);
  };

  const fetchClasses = async () => {
    const res = await api.get('/classes');
    if (res.success) setClasses(res.classes || []);
  };

  const fetchCoursesAndBatches = async () => {
    const cRes = await api.get('/admin/courses');
    if (cRes.success) setCourses(cRes.courses || []);
    const bRes = await api.get('/admin/batches');
    if (bRes.success) setBatches(bRes.batches || []);
  };

  useEffect(() => {
    fetchOverview();
    fetchCoursesAndBatches();
  }, []);

  useEffect(() => {
    if (activeTab === 'students') fetchStudents();
    if (activeTab === 'teachers') fetchTeachers();
    if (activeTab === 'classes') {
      fetchClasses();
      fetchTeachers();
    }
  }, [activeTab]);

  // Student Save
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await api.put(`/admin/students/${editingStudent.id}`, {
          name: stuName,
          email: stuEmail,
          phone: stuPhone,
          courseId: stuCourseId ? Number(stuCourseId) : null,
          batchId: stuBatchId ? Number(stuBatchId) : null
        });
      } else {
        await api.post('/admin/students', {
          name: stuName,
          email: stuEmail,
          phone: stuPhone,
          courseId: stuCourseId ? Number(stuCourseId) : null,
          batchId: stuBatchId ? Number(stuBatchId) : null
        });
      }
      setStudentModalOpen(false);
      setEditingStudent(null);
      fetchStudents();
      fetchOverview();
    } catch (err: any) {
      alert(err.message || 'Failed to save student');
    }
  };

  const handleDeleteStudent = async (id: number) => {
    if (window.confirm('Are you sure you want to deactivate/delete this student?')) {
      await api.delete(`/admin/students/${id}`);
      fetchStudents();
      fetchOverview();
    }
  };

  // Teacher Save
  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTeacher) {
        await api.put(`/admin/teachers/${editingTeacher.id}`, {
          name: trnName,
          email: trnEmail,
          phone: trnPhone,
          specialization: trnSpecialization,
          bio: trnBio
        });
      } else {
        await api.post('/admin/teachers', {
          name: trnName,
          email: trnEmail,
          phone: trnPhone,
          specialization: trnSpecialization,
          bio: trnBio
        });
      }
      setTeacherModalOpen(false);
      setEditingTeacher(null);
      fetchTeachers();
      fetchOverview();
    } catch (err: any) {
      alert(err.message || 'Failed to save teacher');
    }
  };

  const handleDeleteTeacher = async (id: number) => {
    if (window.confirm('Are you sure you want to remove this teacher?')) {
      await api.delete(`/admin/teachers/${id}`);
      fetchTeachers();
      fetchOverview();
    }
  };

  // Class Save
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/classes', {
        title: clsTitle,
        description: clsDescription,
        teacherId: Number(clsTeacherId),
        batchId: clsBatchId ? Number(clsBatchId) : null,
        date: clsDate,
        startTime: clsStartTime,
        endTime: clsEndTime,
        meetingType: clsMeetingType,
        meetingUrl: clsMeetingUrl
      });
      setClassModalOpen(false);
      setClsTitle('');
      setClsDescription('');
      fetchClasses();
      fetchOverview();
    } catch (err: any) {
      alert(err.message || 'Failed to schedule class');
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/settings', { settings: settingsData });
      alert('System settings updated successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    }
  };

  const stats = dashboardData?.stats || {
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    totalBatches: 0,
    todayClasses: 0,
    liveClasses: 0,
    attendanceRate: 0
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Shield className="w-8 h-8 text-brand-600" />
            Admin Administration Portal
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Global management for students, trainers, classroom scheduling, attendance, and reports.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setEditingStudent(null);
              setStuName('');
              setStuEmail('');
              setStuPhone('');
              setStudentModalOpen(true);
            }}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" /> Student
          </button>
          <button
            onClick={() => {
              setEditingTeacher(null);
              setTrnName('');
              setTrnEmail('');
              setTrnPhone('');
              setTrnSpecialization('');
              setTeacherModalOpen(true);
            }}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" /> Teacher
          </button>
          <button
            onClick={() => {
              if (teachers.length === 0) fetchTeachers();
              setClassModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 flex items-center gap-1 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Schedule Class
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 text-xs font-bold">
        {[
          { id: 'overview', name: 'Dashboard Overview', icon: TrendingUp },
          { id: 'students', name: 'Students', icon: Users },
          { id: 'teachers', name: 'Teachers', icon: GraduationCap },
          { id: 'classes', name: 'Classes', icon: Calendar },
          { id: 'reports', name: 'Reports & Exports', icon: FileText },
          { id: 'settings', name: 'System Settings', icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all shrink-0 ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* --- TAB 1: OVERVIEW --- */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Total Students</span>
              <span className="text-2xl font-black text-slate-900">{stats.totalStudents}</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Total Teachers</span>
              <span className="text-2xl font-black text-slate-900">{stats.totalTeachers}</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Today's Classes</span>
              <span className="text-2xl font-black text-brand-600">{stats.todayClasses}</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Live Right Now</span>
              <span className="text-2xl font-black text-rose-600 flex items-center gap-1.5">
                {stats.liveClasses} {stats.liveClasses > 0 && <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping"></span>}
              </span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Overall Attendance</span>
              <span className="text-2xl font-black text-emerald-600">{stats.attendanceRate}%</span>
            </div>
          </div>

          {/* Recent Scheduled Sessions */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-soft">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Recently Scheduled Classrooms</h3>
              <button onClick={() => setActiveTab('classes')} className="text-xs font-bold text-brand-600 hover:underline">
                View All →
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {dashboardData?.recentClasses?.map((cls: any) => (
                <div key={cls.id} className="p-4 hover:bg-slate-50 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-brand-600">{cls.class_code}</span>
                      <span className="text-slate-400">•</span>
                      <span className="font-semibold text-slate-600">{cls.date}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500">{cls.start_time} – {cls.end_time}</span>
                    </div>
                    <p className="font-bold text-slate-900 text-sm">{cls.title}</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Teacher: {cls.teacher_name} • Batch: {cls.batch_name || 'N/A'} • Provider: {cls.meeting_type}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {cls.status === 'live' ? (
                      <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-bold text-[11px] border border-rose-200">
                        🔴 LIVE
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold text-[11px]">
                        {cls.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: STUDENTS --- */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, email, or STU ID..."
                value={studentSearch}
                onChange={(e) => {
                  setStudentSearch(e.target.value);
                  fetchStudents();
                }}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:border-brand-600 outline-none shadow-sm"
              />
            </div>

            <button
              onClick={() => {
                setEditingStudent(null);
                setStuName('');
                setStuEmail('');
                setStuPhone('');
                setStudentModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Student
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-100">
                    <th className="py-3 px-4">Student ID</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Mobile</th>
                    <th className="py-3 px-4">Cohort Batch</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {students.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono font-bold text-brand-600">{s.student_code}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                      <td className="py-3 px-4">{s.email}</td>
                      <td className="py-3 px-4 text-slate-500">{s.phone || '—'}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {s.batch_name || 'Unassigned'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingStudent(s);
                              setStuName(s.name);
                              setStuEmail(s.email);
                              setStuPhone(s.phone || '');
                              setStuCourseId(s.course_id || '');
                              setStuBatchId(s.batch_id || '');
                              setStudentModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100"
                            title="Edit Student"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(s.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Delete Student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: TEACHERS --- */}
      {activeTab === 'teachers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search teacher by name or TRN ID..."
                value={teacherSearch}
                onChange={(e) => {
                  setTeacherSearch(e.target.value);
                  fetchTeachers();
                }}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:border-brand-600 outline-none shadow-sm"
              />
            </div>

            <button
              onClick={() => {
                setEditingTeacher(null);
                setTrnName('');
                setTrnEmail('');
                setTrnPhone('');
                setTrnSpecialization('');
                setTeacherModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Teacher
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-100">
                    <th className="py-3 px-4">Trainer ID</th>
                    <th className="py-3 px-4">Trainer Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Specialization</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {teachers.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono font-bold text-brand-600">{t.teacher_code}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{t.name}</td>
                      <td className="py-3 px-4">{t.email}</td>
                      <td className="py-3 px-4 text-slate-600">{t.specialization || 'General Instructor'}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingTeacher(t);
                              setTrnName(t.name);
                              setTrnEmail(t.email);
                              setTrnPhone(t.phone || '');
                              setTrnSpecialization(t.specialization || '');
                              setTrnBio(t.bio || '');
                              setTeacherModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100"
                            title="Edit Teacher"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTeacher(t.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Delete Teacher"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 4: CLASSES --- */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">All Scheduled Classes</h2>
            <button
              onClick={() => setClassModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Schedule New Class
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-100">
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Instructor</th>
                    <th className="py-3 px-4">Meeting Type</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {classes.map((cls) => (
                    <tr key={cls.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono font-bold text-brand-600">{cls.class_code}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 max-w-[220px] truncate">{cls.title}</td>
                      <td className="py-3 px-4">{cls.date} • {cls.start_time}</td>
                      <td className="py-3 px-4 font-medium">{cls.teacher_name}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono uppercase text-[10px]">
                          {cls.meeting_type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {cls.status === 'live' ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-bold">
                            LIVE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                            {cls.status}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`/join/${cls.class_code}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-brand-600 hover:underline font-bold text-xs flex items-center gap-0.5"
                          >
                            Join Link <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 5: REPORTS & EXPORTS --- */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft">
            <h3 className="text-base font-bold text-slate-900 mb-1">Administrative Attendance & Performance Reports</h3>
            <p className="text-xs text-slate-500 mb-6">
              Download clean CSV spreadsheets for compliance, student progress, and instructor tracking.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">Student Attendance Report</h4>
                  <p className="text-xs text-slate-500 mb-4">
                    Summary of all students, total sessions attended, partials, and overall attendance %.
                  </p>
                </div>
                <a
                  href="/api/reports/students/csv"
                  download
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" /> Download Student CSV
                </a>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">Class Attendance Report</h4>
                  <p className="text-xs text-slate-500 mb-4">
                    Detailed per-session log with join time, leave time, calculated duration, and status.
                  </p>
                </div>
                <a
                  href="/api/reports/classes/csv"
                  download
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" /> Download Classes CSV
                </a>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">Trainer Performance Report</h4>
                  <p className="text-xs text-slate-500 mb-4">
                    Overview of instructor sessions conducted, live classes, and student attendance aggregates.
                  </p>
                </div>
                <a
                  href="/api/reports/teachers/csv"
                  download
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" /> Download Trainer CSV
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 6: SETTINGS --- */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl bg-white rounded-3xl p-6 border border-slate-200 shadow-soft">
          <h3 className="text-base font-bold text-slate-900 mb-1">Global Organization Settings</h3>
          <p className="text-xs text-slate-500 mb-6">
            Configure default attendance criteria, branding, and meeting defaults.
          </p>

          <form onSubmit={handleUpdateSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Organization / Academy Name
              </label>
              <input
                type="text"
                value={settingsData.organization_name || ''}
                onChange={(e) => setSettingsData({ ...settingsData, organization_name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-brand-600 outline-none font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Default Attendance Threshold (%)
              </label>
              <p className="text-[11px] text-slate-400 mb-1.5">
                Students must attend at least this percentage of the class to be marked <strong>PRESENT</strong>. Below this is marked <strong>PARTIAL</strong>.
              </p>
              <input
                type="number"
                min="10"
                max="100"
                value={settingsData.attendance_threshold || '75'}
                onChange={(e) => setSettingsData({ ...settingsData, attendance_threshold: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-brand-600 outline-none font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Official Support Email
              </label>
              <input
                type="email"
                value={settingsData.support_email || ''}
                onChange={(e) => setSettingsData({ ...settingsData, support_email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-brand-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Timezone
              </label>
              <input
                type="text"
                value={settingsData.timezone || 'Asia/Kolkata'}
                onChange={(e) => setSettingsData({ ...settingsData, timezone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-brand-600 outline-none"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition-all"
            >
              Save Configuration
            </button>
          </form>
        </div>
      )}

      {/* Student Modal */}
      {studentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 text-left border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">{editingStudent ? 'Edit Student' : 'Add New Student'}</h3>
              <button onClick={() => setStudentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={stuName}
                  onChange={(e) => setStuName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-brand-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={stuEmail}
                  onChange={(e) => setStuEmail(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-brand-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mobile Phone</label>
                <input
                  type="text"
                  value={stuPhone}
                  onChange={(e) => setStuPhone(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-brand-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assigned Batch</label>
                <select
                  value={stuBatchId}
                  onChange={(e) => setStuBatchId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-brand-600 outline-none"
                >
                  <option value="">-- Select Batch --</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name} ({b.course_name})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setStudentModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold"
                >
                  Save Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teacher Modal */}
      {teacherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 text-left border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">{editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}</h3>
              <button onClick={() => setTeacherModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeacher} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={trnName}
                  onChange={(e) => setTrnName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-brand-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={trnEmail}
                  onChange={(e) => setTrnEmail(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-brand-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Specialization</label>
                <input
                  type="text"
                  placeholder="e.g. AI, Full-Stack Web, Data Science"
                  value={trnSpecialization}
                  onChange={(e) => setTrnSpecialization(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-brand-600 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setTeacherModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold"
                >
                  Save Teacher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Class Modal */}
      {classModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 text-left border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Schedule Live Class</h3>
              <button onClick={() => setClassModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Class Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Digital Skills & AI – Day 7"
                  value={clsTitle}
                  onChange={(e) => setClsTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-brand-600 outline-none font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assign Teacher</label>
                  <select
                    required
                    value={clsTeacherId}
                    onChange={(e) => setClsTeacherId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-brand-600 outline-none"
                  >
                    <option value="">-- Choose Instructor --</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.teacher_code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Cohort Batch</label>
                  <select
                    value={clsBatchId}
                    onChange={(e) => setClsBatchId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-brand-600 outline-none"
                  >
                    <option value="">-- Choose Batch --</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={clsDate}
                    onChange={(e) => setClsDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={clsStartTime}
                    onChange={(e) => setClsStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={clsEndTime}
                    onChange={(e) => setClsEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Meeting Provider</label>
                <select
                  value={clsMeetingType}
                  onChange={(e) => setClsMeetingType(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-brand-600 outline-none"
                >
                  <option value="internal">Internal Interactive Video Class (WebRTC)</option>
                  <option value="zoom">Zoom External Meeting</option>
                  <option value="google_meet">Google Meet External Link</option>
                  <option value="teams">Microsoft Teams External Link</option>
                  <option value="other">Other External URL</option>
                </select>
              </div>

              {clsMeetingType !== 'internal' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">External Meeting URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                    value={clsMeetingUrl}
                    onChange={(e) => setClsMeetingUrl(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:border-brand-600 outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
                <textarea
                  rows={2}
                  value={clsDescription}
                  onChange={(e) => setClsDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  placeholder="Class objectives or preparation notes..."
                />
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setClassModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold"
                >
                  Create Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
