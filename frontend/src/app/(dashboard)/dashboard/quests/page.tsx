'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { questsApi } from '../../../../lib/api';
import clsx from 'clsx';

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string; border: string }> = {
  ATTACK_ENEMIES: { icon: '⚔️', color: '#f87171', bg: 'rgba(239,68,68,0.12)',    border: 'rgba(239,68,68,0.3)'  },
  PLAY_GAMES:     { icon: '🎮', color: '#818cf8', bg: 'rgba(99,102,241,0.12)',   border: 'rgba(99,102,241,0.3)' },
  SEND_MESSAGES:  { icon: '💬', color: '#34d399', bg: 'rgba(52,211,153,0.12)',   border: 'rgba(52,211,153,0.3)' },
  EARN_AP:        { icon: '⚡', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',   border: 'rgba(251,191,36,0.3)' },
  WIN_GAMES:      { icon: '🏆', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)',  border: 'rgba(167,139,250,0.3)' },
};

export default function QuestsPage() {
  const queryClient = useQueryClient();

  const { data: quests = [], isLoading } = useQuery({
    queryKey: ['quests-today'],
    queryFn: questsApi.getToday,
    refetchInterval: 60000,
  });

  const claimMutation = useMutation({
    mutationFn: (questId: string) => questsApi.claim(questId),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['quests-today'] });
      const rewards: string[] = [];
      if (data.rewardAp) rewards.push(`+${data.rewardAp} AP`);
      if (data.rewardCp) rewards.push(`+${data.rewardCp} CP`);
      if (data.rewardXp) rewards.push(`+${data.rewardXp} XP`);
      toast.success(`🎁 ${rewards.join(' · ')}`, { duration: 4000 });
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Алдаа гарлаа'),
  });

  const completed = (quests as any[]).filter((q: any) => q.completed).length;
  const claimed   = (quests as any[]).filter((q: any) => q.claimed).length;
  const total     = (quests as any[]).length;
  const allDone   = total > 0 && completed === total;

  return (
    <div className="space-y-5">

      {/* ── HEADER ── */}
      <div className="relative overflow-hidden rounded-2xl p-5"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.14) 0%, rgba(168,85,247,0.08) 60%, rgba(0,0,0,0) 100%)',
          border: '1px solid rgba(99,102,241,0.25)',
        }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at top right, rgba(168,85,247,0.12) 0%, transparent 60%)' }} />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="section-pill mb-1.5" style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.35)' }}>
                📋 DAILY QUESTS
              </span>
              <h1 className="text-2xl font-black text-white mt-1">Өдрийн Даалгавар</h1>
              <p className="text-sm text-white/40 mt-0.5">Шөнө дунд шинэчлэгдэнэ · AP, CP, XP шагнал</p>
            </div>
            <div className="text-center flex-shrink-0">
              <p className="text-3xl font-black" style={{
                background: allDone ? 'linear-gradient(135deg, #4ade80, #22d3ee)' : 'linear-gradient(135deg, #a5b4fc, #818cf8)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>{completed}/{total}</p>
              <p className="text-[10px] text-white/40 font-bold uppercase">Дууссан</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: total > 0 ? `${(completed / total) * 100}%` : '0%' }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              style={{
                background: allDone
                  ? 'linear-gradient(90deg, #4ade80, #22d3ee)'
                  : 'linear-gradient(90deg, #818cf8, #a855f7)',
                boxShadow: allDone ? '0 0 8px rgba(74,222,128,0.5)' : '0 0 8px rgba(168,85,247,0.5)',
              }}
            />
          </div>

          {allDone && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center text-xs font-bold mt-2" style={{ color: '#4ade80' }}>
              ✨ Бүх даалгаврыг дуусгалаа! Маргааш дахин ир.
            </motion.p>
          )}
        </div>
      </div>

      {/* ── QUEST LIST ── */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
      ) : (quests as any[]).length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-3">📋</p>
          <p className="font-bold text-white/60">Өнөөдрийн даалгавар байхгүй байна</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {(quests as any[]).map((quest: any, i: number) => {
              const cfg = TYPE_CONFIG[quest.type] ?? TYPE_CONFIG.EARN_AP;
              const pct = Math.min((quest.progress / quest.target) * 100, 100);
              return (
                <motion.div key={quest.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={clsx('relative overflow-hidden rounded-2xl p-4 transition-all', quest.claimed && 'opacity-50')}
                  style={{
                    background: quest.claimed
                      ? 'rgba(255,255,255,0.02)'
                      : quest.completed
                        ? `linear-gradient(135deg, ${cfg.bg}, rgba(0,0,0,0.5))`
                        : 'rgba(255,255,255,0.03)',
                    border: quest.completed && !quest.claimed
                      ? `1px solid ${cfg.border}`
                      : '1px solid rgba(255,255,255,0.07)',
                    boxShadow: quest.completed && !quest.claimed
                      ? `0 0 20px ${cfg.bg}` : 'none',
                  }}>

                  {/* Completed shimmer bg */}
                  {quest.completed && !quest.claimed && (
                    <div className="absolute inset-0 pointer-events-none opacity-20"
                      style={{ background: `radial-gradient(ellipse at top left, ${cfg.color} 0%, transparent 60%)` }} />
                  )}

                  <div className="relative flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{
                        background: quest.claimed ? 'rgba(255,255,255,0.05)' : cfg.bg,
                        border: `1px solid ${quest.claimed ? 'rgba(255,255,255,0.1)' : cfg.border}`,
                        boxShadow: quest.completed && !quest.claimed ? `0 0 12px ${cfg.bg}` : 'none',
                      }}>
                      {quest.claimed ? '✅' : cfg.icon}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-black text-white text-sm leading-tight">{quest.title}</h3>
                        {/* Rewards */}
                        <div className="flex gap-1.5 flex-shrink-0">
                          {quest.rewardAp > 0 && (
                            <span className="badge-premium" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' }}>
                              +{quest.rewardAp} AP
                            </span>
                          )}
                          {quest.rewardCp > 0 && (
                            <span className="badge-premium" style={{ background: 'rgba(168,85,247,0.15)', color: '#c4b5fd', border: '1px solid rgba(168,85,247,0.3)' }}>
                              +{quest.rewardCp} CP
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-white/40 mb-2 leading-tight">{quest.description}</p>

                      {/* Progress */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-white/35">
                          <span>{quest.progress}/{quest.target}</span>
                          <span>{Math.round(pct)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                          <motion.div
                            className="h-full rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.7, ease: 'easeOut', delay: i * 0.05 }}
                            style={{
                              background: quest.completed ? `linear-gradient(90deg, ${cfg.color}, white)` : cfg.color,
                              boxShadow: quest.completed ? `0 0 6px ${cfg.color}` : 'none',
                            }}
                          />
                        </div>
                      </div>

                      {/* Claim button */}
                      {quest.completed && !quest.claimed && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                          onClick={() => claimMutation.mutate(quest.id)}
                          disabled={claimMutation.isPending}
                          className="mt-3 px-4 py-2 rounded-xl font-black text-xs transition-all active:scale-95 disabled:opacity-50"
                          style={{
                            background: `linear-gradient(135deg, ${cfg.color}30, ${cfg.color}15)`,
                            border: `1px solid ${cfg.border}`,
                            color: cfg.color,
                            boxShadow: `0 4px 12px ${cfg.bg}`,
                          }}>
                          {claimMutation.isPending ? '...' : '🎁 Шагнал авах'}
                        </motion.button>
                      )}
                      {quest.claimed && (
                        <p className="mt-2 text-[10px] text-white/30 font-bold">✅ Шагнал авсан</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
