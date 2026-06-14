'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';

export default function LoginStreakBadge() {
  const [showTooltip, setShowTooltip] = useState(false);

  const { data: streak } = useQuery({
    queryKey: ['login-streak'],
    queryFn: () => api.get<any>('/auth/streak'),
    staleTime: 5 * 60 * 1000,
  });

  if (!streak) return null;

  const s = streak.currentStreak ?? 1;
  const color = s >= 30 ? 'text-amber-400' : s >= 7 ? 'text-orange-400' : s >= 3 ? 'text-yellow-400' : 'text-muted-foreground';
  const icon = s >= 30 ? '💎' : s >= 14 ? '🔥' : s >= 7 ? '⚡' : s >= 3 ? '✨' : '🌱';

  return (
    <div className="relative hidden sm:block">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-surface-2 transition-colors"
      >
        <span className="text-base">{icon}</span>
        <span className={`text-xs font-black ${color}`}>{s}</span>
      </button>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute right-0 top-10 bg-surface border border-border rounded-xl p-3 text-xs whitespace-nowrap z-50 shadow-lg"
          >
            <p className="font-bold">{icon} {s} хоногийн streak</p>
            <p className="text-muted-foreground mt-0.5">Хамгийн урт: {streak.longestStreak} хоног</p>
            <p className="text-muted-foreground">Нийт: {streak.totalDays} хоног</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
