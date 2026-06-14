'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationsApi } from '../../../../lib/api';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { SkeletonList } from '../../../../components/ui/Skeleton';
import clsx from 'clsx';

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  ATTACK_RECEIVED:      { icon: '⚔️', color: '#ef4444', bg: 'rgba(239,68,68,0.1)'   },
  ACHIEVEMENT_UNLOCKED: { icon: '🏆', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
  QUEST_COMPLETED:      { icon: '📋', color: '#10b981', bg: 'rgba(16,185,129,0.1)'  },
  GUILD_INVITE:         { icon: '🏰', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)'  },
  SEASON_START:         { icon: '🗓️', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)'   },
  SEASON_END:           { icon: '🏁', color: '#f97316', bg: 'rgba(249,115,22,0.1)'  },
  PAYMENT_CONFIRMED:    { icon: '💳', color: '#22c55e', bg: 'rgba(34,197,94,0.1)'   },
  GUILD_WAR:            { icon: '⚔️', color: '#dc2626', bg: 'rgba(220,38,38,0.1)'   },
  SYSTEM:               { icon: '📢', color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Дөнгөж сая';
  if (m < 60) return `${m} минутын өмнө`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} цагийн өмнө`;
  return `${Math.floor(h / 24)} өдрийн өмнө`;
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications-page'],
    queryFn: () => notificationsApi.getAll(100),
    refetchInterval: 30000,
  });

  const markReadMut = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });

  const markAllMut = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });

  const unreadCount = (notifications as any[]).filter((n: any) => !n.isRead).length;

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <PageHeader
        pill="🔔 МЭДЭГДЭЛ"
        title="Мэдэгдлийн түүх"
        subtitle={unreadCount > 0 ? `${unreadCount} уншаагүй мэдэгдэл байна` : 'Бүх мэдэгдлийг уншсан'}
        accent="amber"
        right={unreadCount > 0 ? (
          <button
            onClick={() => markAllMut.mutate()}
            disabled={markAllMut.isPending}
            className="px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 hover:brightness-110"
            style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' }}>
            {markAllMut.isPending ? '...' : '✓ Бүгдийг уншсан'}
          </button>
        ) : undefined}
      />

      {/* List */}
      {isLoading ? (
        <SkeletonList rows={6} />
      ) : (notifications as any[]).length === 0 ? (
        <EmptyState icon="🔔" title="Мэдэгдэл байхгүй" description="Шинэ мэдэгдэл ирэхэд энд харагдана" />
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {(notifications as any[]).map((n: any, i: number) => {
              const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.SYSTEM;
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => !n.isRead && markReadMut.mutate(n.id)}
                  className={clsx(
                    'flex items-start gap-3.5 p-4 rounded-2xl cursor-pointer transition-all',
                    !n.isRead ? 'hover:bg-white/[0.05]' : 'opacity-60 hover:opacity-80',
                  )}
                  style={{ background: n.isRead ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)', border: `1px solid ${n.isRead ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.1)'}` }}>
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.color}30` }}>
                    {cfg.icon}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm">{n.title}</p>
                    <p className="text-xs text-white/50 mt-0.5 leading-relaxed">{n.body}</p>
                    <p className="text-[10px] text-white/25 mt-1.5">{timeAgo(n.createdAt)}</p>
                  </div>
                  {/* Unread dot */}
                  {!n.isRead && (
                    <div className="dot-live w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: cfg.color }} />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
