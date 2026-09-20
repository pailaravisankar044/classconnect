import React from 'react';
import { Calendar, Bell, FileText, CheckCircle2, LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  type?: 'classes' | 'announcements' | 'materials' | 'attendance' | 'generic';
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: LucideIcon;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'generic',
  title,
  description,
  actionText,
  onAction,
  icon: CustomIcon
}) => {
  const configs = {
    classes: {
      icon: Calendar,
      title: 'No classes scheduled yet.',
      description: 'Upcoming sessions will appear here once your teacher schedules them.',
    },
    announcements: {
      icon: Bell,
      title: "You're all caught up.",
      description: 'There are no new announcements from your teachers or administrators.',
    },
    materials: {
      icon: FileText,
      title: 'Learning materials will appear here.',
      description: 'Your teachers will upload study guides, presentations, and resources here.',
    },
    attendance: {
      icon: CheckCircle2,
      title: 'Your attendance will appear after you attend a class.',
      description: 'Join a live class to automatically record your participation percentage.',
    },
    generic: {
      icon: CheckCircle2,
      title: 'No items found.',
      description: 'There are currently no records available in this section.',
    }
  };

  const currentConfig = configs[type] || configs.generic;
  const Icon = CustomIcon || currentConfig.icon;
  const displayTitle = title || currentConfig.title;
  const displayDesc = description || currentConfig.description;

  return (
    <div className="text-center py-12 px-6 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
        <Icon className="w-7 h-7" />
      </div>
      <h4 className="text-base font-bold text-slate-800 tracking-tight">{displayTitle}</h4>
      <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1.5 leading-relaxed">{displayDesc}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-xl transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
