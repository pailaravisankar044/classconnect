import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: string; // YYYY-MM-DD
  startTime: string;  // HH:MM
  endTime?: string;   // HH:MM
  status?: string;    // scheduled, live, completed
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDate,
  startTime,
  endTime,
  status = 'scheduled'
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isLive: boolean;
    isPast: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, isLive: false, isPast: false });

  useEffect(() => {
    const calculateTime = () => {
      if (status === 'live') {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isLive: true, isPast: false });
        return;
      }

      if (status === 'completed' || status === 'cancelled') {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isLive: false, isPast: true });
        return;
      }

      const [startH, startM] = startTime.split(':').map(Number);
      const startDateTime = new Date(`${targetDate}T${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}:00`);

      let endDateTime = new Date(startDateTime.getTime() + 90 * 60000);
      if (endTime) {
        const [endH, endM] = endTime.split(':').map(Number);
        endDateTime = new Date(`${targetDate}T${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`);
      }

      const now = new Date();

      if (now >= startDateTime && now <= endDateTime) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isLive: true, isPast: false });
        return;
      }

      if (now > endDateTime) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isLive: false, isPast: true });
        return;
      }

      const diffMs = startDateTime.getTime() - now.getTime();
      const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setTimeLeft({ hours, minutes, seconds, isLive: false, isPast: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate, startTime, endTime, status]);

  if (timeLeft.isLive) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-bold text-sm tracking-wide">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-live"></span>
        <span>🔴 LIVE NOW</span>
      </div>
    );
  }

  if (timeLeft.isPast) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold text-xs uppercase tracking-wider">
        <span>Class Completed</span>
      </div>
    );
  }

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 font-mono text-sm shadow-sm">
      <span className="text-xs font-sans font-medium text-amber-700">Starts in:</span>
      <span className="font-bold tracking-wider">
        {timeLeft.hours > 0 ? `${pad(timeLeft.hours)}:` : ''}{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
      </span>
    </div>
  );
};
