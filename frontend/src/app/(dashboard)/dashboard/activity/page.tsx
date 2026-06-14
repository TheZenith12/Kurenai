'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { activityApi } from '../../../../lib/api';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { SkeletonList } from '../../../../components/ui/Skeleton';

const TYPE_MAP: Record<string, { icon: string; color: string; label: string }> = {
  ATTACK_RECEIVED:      { icon: '⚔️', color: '#ef4444', label: 'Дайрлагдлаа'   },
  ACHIEVEMENT_UNLOCKED: { icon: '🏆', color: '#f59e0b', label: 'Achievement'     },
  QUEST_COMPLETED:      { icon: '📋', color: '#10b981', label: 'Даалгавар'       },
  GUILD_INVITE:         { icon: '🏰', color: '#8b5cf6', label: 'Guild урилга'    },
  GUILD_WAR:            { icon: '⚔️', color: '#dc2626', label: 'Guild дайн'      },
  SEASON_START:         { icon: '🗓️', color: '#06b6d4', label: 'Season эхэлсэн'  },
  SEASON_END:           { icon: '🏁', color: '#f97316', label: 'Season дууссан'  },
  PAYMENT_CONFIRMED:    { icon: '💳', color: '#22c55e', label: 'Төлбөр'          },
  SYSTEM:               { icon: '📢', color: '#6b7280', label: 'Систем'           },
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Дөнгөж сая';
  if (m < 60) return `${m}м өмнө`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}ц өмнө`;
  return `${Math.floor(h / 24)}ө өмнө`;
}

function dayLabel(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Өнөөдөр';
  if (d.toDateString() === yesterday.toDateString()) return 'Өчигдөр';
  return d.toLocaleDateString('mn-MN', { month: 'long', day: 'numeric' });
}

export default function ActivityPage() {
  const { data: feed = [], isLoading } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: activityApi.getFeed,
    refetchInterval: 60000,
  });

  // Group by day
  const grouped: Record<string, any[]> = {};
  (feed as any[]).forEach((n: any) => {
    const key = new Date(n.createdAt).toDateString();
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(n);
  });

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <PageHeader pill="📡 ИДЭВХИ" title="Үйл ажиллагаа" subtitle="Таны хамгийн сүүлийн үеийн үйл явдлууд" accent="purple" />

      {/* Feed */}
      {isLoading ? (
        <SkeletonList rows={6} />
      ) : Object.keys(grouped).length === 0 ? (
        <EmptyState icon="📡" title="Үйл явдал байхгүй" description="Тоглоод, тулалдаад идэвхтэй байснаар энд түүх үүснэ!" />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dayKey, events]) => (
            <div key={dayKey}>
              <p className="text-xs text-white/30 uppercase tracking-widest font-bold mb-3 flex items-center gap-2">
                <span className="flex-1 h-px bg-white/10" />
                {dayLabel(events[0].createdAt)}
                <span className="flex-1 h-px bg-white/10" />
              </p>
              <div className="space-y-2">
                {events.map((n: any, i: number) => {
                  const cfg = TYPE_MAP[n.type] ?? TYPE_MAP.SYSTEM;
                  return (
                    <motion.div key={n.id}
                      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-start gap-3 p-3.5 rounded-2xl"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      {/* Timeline dot + icon */}
                      <div className="flex flex-col items-center gap-1 flex-shrink-0">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                          style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.color}30` }}>
                          {cfg.icon}
                        </div>
                        {i < events.length - 1 && <div className="w-px h-3 bg-white/10 rounded-full" />}
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="font-bold text-white text-sm leading-tight">{n.title}</p>
                          <span className="text-[10px] text-white/30 flex-shrink-0">{timeAgo(n.createdAt)}</span>
                        </div>
                        <p className="text-xs text-white/50 mt-0.5 leading-relaxed">{n.body}</p>
                        <span className="inline-block mt-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: `${cfg.color}15`, color: cfg.color }}>
                          {cfg.label}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
