import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { Home, Calendar, FileText, BarChart2, User } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user || user.role !== 'student') return null;

  const items = [
    { name: 'Home', path: '/student', icon: Home },
    { name: 'Classes', path: '/student/classes', icon: Calendar },
    { name: 'Materials', path: '/student/materials', icon: FileText },
    { name: 'Attendance', path: '/student/attendance', icon: BarChart2 },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-2 py-1.5">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-brand-600 font-bold scale-105'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? 'bg-brand-50' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-brand-600 stroke-[2.5]' : 'text-slate-500'}`} />
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
