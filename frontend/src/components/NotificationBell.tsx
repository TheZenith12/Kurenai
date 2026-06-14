'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { notificationsApi } from '../lib/api';
import clsx from 'clsx';

const TYPE_ICONS: Record<string, string> = {
  ATTACK_RECEIVED: '⚔️',
  ACHIEVEMENT_UNLOCKED: '🏆',
  QUEST_COMPLETED: '📋',
  GUILD_INVITE: '🏰',
  SEASON_START: '🗓️',
  SEASON_END: '🏁',
  PAYMENT_CONFIRMED: '💳',
  SYSTEM: '📢',
  GUILD_WAR: '⚔️',
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: unread } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: notificationsApi.getUnreadCount,
    refetchInterval: 30000,
  });

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll(20),
    enabled: open,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const count = unread?.count ?? 0;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-surface-2"
      >
        <span className="text-lg">🔔</span>
        {count > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent-red text-white text-[10px] font-black rounded-full flex items-center justify-center"
          >
            {count > 9 ? '9+' : count}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-80 max-h-[480px] overflow-y-auto bg-surface border border-border rounded-2xl shadow-2xl z-50"
          >
            {/* Header */}
            <div className="sticky top-0 bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
              <h3 className="font-bold text-sm">🔔 Мэдэгдэл</h3>
              <div className="flex items-center gap-2">
                {count > 0 && (
                  <button onClick={() => markAllMutation.mutate()} className="text-xs text-primary hover:underline">
                    Бүгдийг уншсан болгох
                  </button>
                )}
                <Link href="/dashboard/notifications" onClick={() => setOpen(false)} className="text-xs text-white/40 hover:text-white transition-colors">
                  Бүгдийг харах →
                </Link>
              </div>
            </div>

            {/* List */}
            {isLoading ? (
              <div className="flex justify-center py-8"><div className="anime-spinner w-6 h-6" /></div>
            ) : (notifications as any[]).length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <p className="text-3xl mb-2">🔔</p>
                <p className="text-sm">Мэдэгдэл байхгүй байна</p>
              </div>
            ) : (
              <div>
                {(notifications as any[]).map((n: any) => (
                  <div
                    key={n.id}
                    onClick={() => !n.isRead && markReadMutation.mutate(n.id)}
                    className={clsx(
                      'flex items-start gap-3 px-4 py-3 border-b border-border/50 cursor-pointer hover:bg-surface-2 transition-colors',
                      !n.isRead && 'bg-primary/5',
                    )}
                  >
                    <span className="text-xl flex-shrink-0 mt-0.5">{TYPE_ICONS[n.type] ?? '📢'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold leading-tight">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{n.body}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {new Date(n.createdAt).toLocaleString('mn-MN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {!n.isRead && (
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
