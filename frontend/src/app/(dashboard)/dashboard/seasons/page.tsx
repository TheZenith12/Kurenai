'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { seasonApi } from '../../../../lib/api';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { SkeletonList } from '../../../../components/ui/Skeleton';

const TIER_CONFIG: Record<string, { icon: string; color: string }> = {
  BRONZE:   { icon: '🥉', color: '#cd7f32' },
  SILVER:   { icon: '🥈', color: '#9ca3af' },
  GOLD:     { icon: '🥇', color: '#f59e0b' },
  PLATINUM: { icon: '💎', color: '#06b6d4' },
  DIAMOND:  { icon: '🔷', color: '#a855f7' },
};

export default function SeasonsPage() {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['season-history'],
    queryFn: seasonApi.getHistory,
  });

  const { data: current } = useQuery({
    queryKey: ['season-current'],
    queryFn: seasonApi.getCurrent,
  });

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <PageHeader pill="🏆 СЕЗОН ТҮҮХ" title="Сезоны түүх" subtitle="Өнгөрсөн сезонуудын дүн" accent="amber" />


      {/* Current season */}
      {current && (
        <div className="relative overflow-hidden rounded-2xl p-5"
          style={{ background: 'linear-gradient(135deg,rgba(220,38,38,0.15),rgba(0,0,0,0.6))', border: '1px solid rgba(220,38,38,0.3)', boxShadow: '0 0 30px rgba(220,38,38,0.1)' }}>
          <div className="absolute top-3 right-4">
            <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              ИДЭВХТЭЙ
            </span>
          </div>
          <p className="text-xs text-white/40 font-bold uppercase tracking-widest mb-1">Одоогийн Season</p>
          <h2 className="text-xl font-black text-white">{current.name ?? `Season ${current.number ?? '?'}`}</h2>
          <div className="flex gap-4 mt-3 text-sm">
            <div>
              <p className="text-white/40 text-xs">Эхлэсэн</p>
              <p className="font-bold text-white">{new Date(current.startedAt).toLocaleDateString('mn-MN')}</p>
            </div>
            {current.endsAt && (
              <div>
                <p className="text-white/40 text-xs">Дуусах</p>
                <p className="font-bold text-white">{new Date(current.endsAt).toLocaleDateString('mn-MN')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History */}
      {isLoading ? (
        <SkeletonList rows={4} />
      ) : (history as any[]).length === 0 ? (
        <EmptyState icon="📅" title="Өнгөрсөн сезон байхгүй" description="Эхний сезон дуусахад түүх энд харагдана" />
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-white/30 uppercase tracking-widest font-bold">Өнгөрсөн сезонууд</p>
          {(history as any[]).map((s: any, i: number) => (
            <motion.div key={s.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-black text-white">{s.name ?? `Season ${s.number ?? i + 1}`}</h3>
                  <p className="text-xs text-white/40 mt-0.5">
                    {new Date(s.startedAt).toLocaleDateString('mn-MN')} — {s.endedAt ? new Date(s.endedAt).toLocaleDateString('mn-MN') : '—'}
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  Дууссан
                </span>
              </div>

              {/* Top players */}
              {s.stats && s.stats.length > 0 && (
                <div>
                  <p className="text-xs text-white/30 font-bold uppercase mb-2">Шилдэг тоглогчид</p>
                  <div className="space-y-2">
                    {s.stats.slice(0, 5).map((stat: any, ri: number) => {
                      const tierCfg = TIER_CONFIG[stat.mastery ?? 'BRONZE'] ?? TIER_CONFIG.BRONZE;
                      const medals = ['👑', '🥈', '🥉'];
                      return (
                        <div key={stat.userId} className="flex items-center gap-2.5">
                          <span className="text-sm w-6 text-center">{medals[ri] ?? `${ri + 1}`}</span>
                          <p className="flex-1 text-sm text-white/70 font-medium truncate">{stat.user?.username ?? 'Unknown'}</p>
                          <span className="text-xs">{tierCfg.icon}</span>
                          <p className="text-xs font-black text-amber-400">{stat.attackPoint ?? 0} AP</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
