import React from 'react';
import { Flame } from 'lucide-react';

export default function StreakBadge({ currentStreak }) {
  const isHot = currentStreak > 0;
  
  return (
    <div className={`card flex items-center gap-4 mb-6 ${isHot ? 'streak-celebrate' : ''}`} style={{ borderColor: isHot ? 'var(--success)' : 'var(--border-color)', backgroundColor: isHot ? 'var(--success-light)' : 'var(--surface)' }}>
      <div className="p-3 rounded-full" style={{ backgroundColor: isHot ? 'var(--success)' : 'var(--bg-color)' }}>
        <Flame size={28} color={isHot ? '#FFFFFF' : 'var(--text-muted)'} fill={isHot ? '#FFFFFF' : 'none'} />
      </div>
      <div>
        <div className="text-xl font-bold" style={{ color: isHot ? 'var(--success-text)' : 'var(--text-main)' }}>
          {currentStreak} Day Streak
        </div>
        <div className="text-sm font-medium" style={{ color: isHot ? 'var(--success-text)' : 'var(--text-muted)', opacity: 0.9 }}>
          {isHot ? "You're on fire! Keep it up." : "Start your catch-up streak today!"}
        </div>
      </div>
    </div>
  );
}
