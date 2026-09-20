import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { 
  GraduationCap, 
  LogOut, 
  User as UserIcon, 
  HelpCircle, 
  Menu, 
  X, 
  BookOpen, 
  Calendar, 
  FileText, 
  BarChart2, 
  Bell, 
  Settings,
  Users
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return (
      <header className="bg-white/95 backdrop-blur border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900 block leading-tight">ClassConnect</span>
              <span className="text-[11px] font-medium text-slate-500 hidden sm:block">Simple Online Classes</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <a
              href="/api/download/apk"
              download="ClassConnect.apk"
              className="text-slate-700 hover:text-slate-900 font-bold text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
            >
              <span>📲</span> Android App
            </a>
            <Link 
              to="/support" 
              className="text-slate-600 hover:text-slate-900 font-medium text-sm px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors hidden sm:flex items-center gap-1.5"
            >
              <HelpCircle className="w-4 h-4 text-slate-400" />
              Help & Support
            </Link>
            <Link 
              to="/login" 
              className="bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-sm transition-all hover:shadow-brand-500/20"
            >
              Login
            </Link>
          </div>
        </div>
      </header>
    );
  }

  // Define navigation links based on user role
  const getNavLinks = () => {
    switch (user.role) {
      case 'student':
        return [
          { name: 'Dashboard', path: '/student', icon: BookOpen },
          { name: 'My Classes', path: '/student/classes', icon: Calendar },
          { name: 'Materials', path: '/student/materials', icon: FileText },
          { name: 'Attendance', path: '/student/attendance', icon: BarChart2 },
        ];
      case 'teacher':
        return [
          { name: 'Dashboard', path: '/teacher', icon: BookOpen },
          { name: 'My Classes', path: '/teacher/classes', icon: Calendar },
          { name: 'Students', path: '/teacher/students', icon: Users },
          { name: 'Materials', path: '/teacher/materials', icon: FileText },
        ];
      case 'admin':
        return [
          { name: 'Dashboard', path: '/admin', icon: BarChart2 },
          { name: 'Students', path: '/admin/students', icon: Users },
          { name: 'Teachers', path: '/admin/teachers', icon: GraduationCap },
          { name: 'Classes', path: '/admin/classes', icon: Calendar },
          { name: 'Reports', path: '/admin/reports', icon: FileText },
          { name: 'Settings', path: '/admin/settings', icon: Settings },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  const getRoleBadge = () => {
    switch (user.role) {
      case 'admin':
        return <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-purple-200">Admin</span>;
      case 'teacher':
        return <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-200">Teacher</span>;
      case 'student':
        return <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">Student</span>;
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link to={`/${user.role}`} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-slate-900 block leading-tight">ClassConnect</span>
                <span className="text-[10px] font-semibold tracking-wide text-brand-600 uppercase">
                  {user.role} Portal
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 ml-4">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              {getRoleBadge()}
            </div>

            <Link
              to="/support"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors hidden sm:block"
              title="Help & Support"
            >
              <HelpCircle className="w-5 h-5" />
            </Link>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center ring-2 ring-slate-200">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden lg:block">
                  <span className="text-xs font-bold text-slate-900 block leading-tight">{user.name}</span>
                  <span className="text-[11px] text-slate-500 block truncate max-w-[140px]">{user.email}</span>
                </div>
              </button>

              {userDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    {user.studentCode && <p className="text-[11px] font-mono text-brand-600 mt-1">{user.studentCode}</p>}
                    {user.teacherCode && <p className="text-[11px] font-mono text-brand-600 mt-1">{user.teacherCode}</p>}
                  </div>

                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    My Profile
                  </Link>

                  <Link
                    to="/support"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <HelpCircle className="w-4 h-4 text-slate-400" />
                    Help & Troubleshooting
                  </Link>

                  <div className="border-t border-slate-100 my-1"></div>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors font-medium"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu hamburger (for admin/teacher) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl md:hidden"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-semibold ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {link.name}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-semibold text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
