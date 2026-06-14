'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { achievementsApi } from '../../../../lib/api';
import clsx from 'clsx';

const RARITY_STYLE: Record<string, { label: string; color: string; glow: string }> = {
  COMMON:    { label: 'Энгийн',   color: 'text-gray-400 border-gray-400/30 bg-gray-400/10',     glow: '' },
  RARE:      { label: 'Ховор',    color: 'text-blue-400 border-blue-400/30 bg-blue-400/10',     glow: 'shadow-[0_0_12px_rgba(96,165,250,0.3)]' },
  EPIC:      { label: 'Эпик',     color: 'text-purple-400 border-purple-400/30 bg-purple-400/10', glow: 'shadow-[0_0_16px_rgba(168,85,247,0.35)]' },
  LEGENDARY: { label: 'Домог',    color: 'text-amber-400 border-amber-400/30 bg-amber-400/10',  glow: 'shadow-[0_0_20px_rgba(251,191,36,0.4)]' },
};

const CAT_ICONS: Record<string, string> = {
  COMBAT: '⚔️', SOCIAL: '👥', COLLECTION: '🎴', MASTERY: '🏅', SEASONAL: '🗓️', SPECIAL: '⭐',
};

export default function AchievementsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>('ALL');
  const [rarityFilter, setRarityFilter] = useState<string>('ALL');

  const { data: achievements = [], isLoading } = useQuery({
    queryKey: ['achievements-my'],
    queryFn: achievementsApi.getMy,
  });

  const claimMutation = useMutation({
    mutationFn: (id: string) => achievementsApi.claim(id),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['achievements-my'] });
      toast.success(`🏆 +${data.rewardCp} CP шагнал авлаа!`, { duration: 5000 });
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Алдаа гарлаа'),
  });

  const unlocked = (achievements as any[]).filter((a: any) => a.unlockedAt).length;
  const total = (achievements as any[]).length;

  const cats = ['ALL', ...Array.from(new Set((achievements as any[]).map((a: any) => a.category)))];
  const rarities = ['ALL', 'COMMON', 'RARE', 'EPIC', 'LEGENDARY'];

  const filtered = (achievements as any[]).filter((a: any) => {
    if (filter !== 'ALL' && a.category !== filter) return false;
    if (rarityFilter !== 'ALL' && a.rarity !== rarityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/15 to-surface-2 border border-amber-500/20 p-5">
        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black">🏆 Achievements</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Даалгавар биелүүлж badge цуглуул</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-amber-400">{unlocked}/{total}</p>
              <p className="text-xs text-muted-foreground">Нээгдсэн</p>
            </div>
          </div>
          <div className="mt-3 h-2 rounded-full bg-surface-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: total > 0 ? `${(unlocked / total) * 100}%` : '0%' }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {cats.map((c) => (
            <button key={c} onClick={() => setFilter(c)}
              className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                filter === c ? 'bg-primary/20 text-primary border border-primary/30' : 'text-muted-foreground border border-border hover:bg-surface-2')}>
              {c === 'ALL' ? '🌟 Бүгд' : `${CAT_ICONS[c] ?? ''} ${c}`}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {rarities.map((r) => {
            const s = r !== 'ALL' ? RARITY_STYLE[r] : null;
            return (
              <button key={r} onClick={() => setRarityFilter(r)}
                className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border',
                  rarityFilter === r ? (s?.color ?? 'bg-primary/20 text-primary border-primary/30') : 'text-muted-foreground border-border hover:bg-surface-2')}>
                {r === 'ALL' ? 'Бүх ховор' : s?.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="anime-spinner w-8 h-8" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((a: any, i: number) => {
              const rarity = RARITY_STYLE[a.rarity] ?? RARITY_STYLE.COMMON;
              const pct = Math.min((a.progress / a.target) * 100, 100);
              const isUnlocked = !!a.unlockedAt;
              const canClaim = isUnlocked && !a.claimed && a.rewardCp > 0;
              return (
                <motion.div
                  key={a.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className={clsx(
                    'relative bg-surface border rounded-2xl p-4 transition-all',
                    isUnlocked ? `${rarity.color} ${rarity.glow}` : 'border-border opacity-70',
                  )}
                >
                  {/* Rarity badge */}
                  <div className="absolute top-3 right-3">
                    <span className={clsx('text-xs px-1.5 py-0.5 rounded-full font-bold border', rarity.color)}>
                      {rarity.label}
                    </span>
                  </div>

                  <div className="flex items-start gap-3 pr-16">
                    <div className={clsx('text-4xl flex-shrink-0', !isUnlocked && 'grayscale opacity-50')}>
                      {isUnlocked ? a.icon : '🔒'}
                    </div>
                    <div className="min-w-0">
                      <h3 className={clsx('font-black text-sm', !isUnlocked && 'text-muted-foreground')}>{a.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{a.description}</p>
                      {a.rewardCp > 0 && (
                        <p className="text-xs font-bold text-amber-400 mt-1">⭐ +{a.rewardCp} CP</p>
                      )}
                    </div>
                  </div>

                  {/* Progress */}
                  {!isUnlocked && a.target > 1 && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{a.progress}/{a.target}</span>
                        <span>{Math.round(pct)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                        <motion.div
                          className="h-full bg-primary rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>
                  )}

                  {isUnlocked && (
                    <div className="mt-3">
                      {canClaim ? (
                        <button
                          onClick={() => claimMutation.mutate(a.id)}
                          disabled={claimMutation.isPending}
                          className="w-full py-1.5 text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl hover:bg-amber-500/30 transition-colors disabled:opacity-50 active:scale-95"
                        >
                          {claimMutation.isPending ? '...' : '🎁 Шагнал авах'}
                        </button>
                      ) : (
                        <p className="text-xs text-center text-muted-foreground">
                          {a.claimed ? '✅ Авсан' : '✅ Нээгдсэн'}
                          {a.unlockedAt && ` · ${new Date(a.unlockedAt).toLocaleDateString('mn-MN')}`}
                        </p>
                      )}
                    </div>
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
