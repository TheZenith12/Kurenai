'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { leaderboardApi, seasonApi } from '../../../../lib/api';
import { useAuthStore } from '../../../../store/auth.store';
import clsx from 'clsx';

type LBTab = 'attack' | 'minigame' | 'mastery';

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; glow: string }> = {
  DIAMOND:  { label: '💠 Diamond',  color: '#b9f2ff', bg: 'rgba(0,191,255,0.1)',  glow: '0 0 12px rgba(0,191,255,0.4)' },
  PLATINUM: { label: '💎 Platinum', color: '#c4b5fd', bg: 'rgba(196,181,253,0.1)', glow: '0 0 12px rgba(196,181,253,0.35)' },
  GOLD:     { label: '🥇 Gold',     color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  glow: '0 0 12px rgba(251,191,36,0.35)' },
  SILVER:   { label: '🥈 Silver',   color: '#d1d5db', bg: 'rgba(209,213,219,0.08)', glow: '' },
  BRONZE:   { label: '🥉 Bronze',   color: '#d97706', bg: 'rgba(217,119,6,0.08)',  glow: '' },
};

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return (
    <div className="relative">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg"
        style={{ background: 'linear-gradient(135deg, #f59e0b, #fde68a)', boxShadow: '0 0 16px rgba(245,158,11,0.5)' }}>
        👑
      </div>
    </div>
  );
  if (rank === 2) return (
    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg"
      style={{ background: 'linear-gradient(135deg, #6b7280, #d1d5db)', boxShadow: '0 0 8px rgba(209,213,219,0.3)' }}>
      🥈
    </div>
  );
  if (rank === 3) return (
    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg"
      style={{ background: 'linear-gradient(135deg, #92400e, #d97706)', boxShadow: '0 0 8px rgba(217,119,6,0.3)' }}>
      🥉
    </div>
  );
  return (
    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm bg-white/5 border border-white/8 text-white/40">
      {rank}
    </div>
  );
}

function PodiumTop3({ entries, valueKey, valueSuffix }: { entries: any[]; valueKey: string; valueSuffix: string }) {
  if (entries.length < 3) return null;
  const [first, second, third] = entries;
  return (
    <div className="flex items-end justify-center gap-3 mb-6 pt-2">
      {/* 2nd */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex flex-col items-center w-24">
        <img src={second?.avatarUrl} alt="" className="w-14 h-14 rounded-2xl object-cover border-2 mb-2"
          style={{ borderColor: '#9ca3af' }}
          onError={(e) => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).style.display='none'; }} />
        <p className="text-xs font-bold text-center truncate w-full text-center">{second?.username}</p>
        <p className="text-xs text-gray-400 font-black">{second?.[valueKey]}{valueSuffix}</p>
        <div className="mt-2 w-full h-12 rounded-t-xl flex items-center justify-center text-2xl font-black text-gray-400"
          style={{ background: 'linear-gradient(180deg, rgba(107,114,128,0.2), rgba(107,114,128,0.1))' }}>🥈</div>
      </motion.div>

      {/* 1st */}
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
        className="flex flex-col items-center w-24 -mb-2">
        <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="relative">
          <img src={first?.avatarUrl} alt="" className="w-16 h-16 rounded-2xl object-cover border-2 mb-1"
            style={{ borderColor: '#f59e0b', boxShadow: '0 0 20px rgba(245,158,11,0.4)' }}
            onError={(e) => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).style.display='none'; }} />
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xl">👑</span>
        </motion.div>
        <p className="text-xs font-black text-center truncate w-full text-center text-amber-400">{first?.username}</p>
        <p className="text-xs font-black" style={{ color: '#fbbf24' }}>{first?.[valueKey]}{valueSuffix}</p>
        <div className="mt-2 w-full h-16 rounded-t-xl flex items-center justify-center text-2xl"
          style={{ background: 'linear-gradient(180deg, rgba(245,158,11,0.25), rgba(245,158,11,0.1))', boxShadow: 'inset 0 1px 0 rgba(245,158,11,0.3)' }}>🏆</div>
      </motion.div>

      {/* 3rd */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="flex flex-col items-center w-24">
        <img src={third?.avatarUrl} alt="" className="w-14 h-14 rounded-2xl object-cover border-2 mb-2"
          style={{ borderColor: '#b45309' }}
          onError={(e) => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).style.display='none'; }} />
        <p className="text-xs font-bold text-center truncate w-full text-center">{third?.username}</p>
        <p className="text-xs text-amber-700 font-black">{third?.[valueKey]}{valueSuffix}</p>
        <div className="mt-2 w-full h-8 rounded-t-xl flex items-center justify-center text-2xl"
          style={{ background: 'linear-gradient(180deg, rgba(180,83,9,0.2), rgba(180,83,9,0.1))' }}>🥉</div>
      </motion.div>
    </div>
  );
}

export default function LeaderboardPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<LBTab>('attack');
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'all'>('daily');

  const { data: attackLB = [], isLoading: attackLoading } = useQuery({
    queryKey: ['lb-attack'],
    queryFn: () => leaderboardApi.getAttack(50),
    refetchInterval: 30000,
  });

  const { data: miniGameLB = [], isLoading: miniLoading } = useQuery({
    queryKey: ['lb-minigame', period],
    queryFn: () => leaderboardApi.getMiniGame(period),
    enabled: tab === 'minigame',
    refetchInterval: 30000,
  });

  const { data: masteryLB = [], isLoading: masteryLoading } = useQuery({
    queryKey: ['lb-mastery'],
    queryFn: leaderboardApi.getMastery,
    enabled: tab === 'mastery',
  });

  const { data: myRanks } = useQuery({
    queryKey: ['my-ranks'],
    queryFn: leaderboardApi.getMyRanks,
  });

  const { data: season } = useQuery({
    queryKey: ['season-current'],
    queryFn: seasonApi.getCurrent,
  });

  const isLoading = tab === 'attack' ? attackLoading : tab === 'minigame' ? miniLoading : masteryLoading;

  const TABS = [
    { key: 'attack' as LBTab,   label: 'PvP Season', icon: '⚔️',  color: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.4)' },
    { key: 'minigame' as LBTab, label: 'Тоглоом',    icon: '🎮',  color: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.4)' },
    { key: 'mastery' as LBTab,  label: 'Mastery',    icon: '🎭',  color: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)' },
  ];

  const myRankInTab = tab === 'attack' ? myRanks?.attackRank : tab === 'minigame' ? myRanks?.miniGameRank : null;

  return (
    <div className="space-y-5">
      {/* ── HEADER ── */}
      <div className="relative overflow-hidden rounded-2xl p-5"
        style={{
          background: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(168,85,247,0.08) 50%, rgba(6,182,212,0.06) 100%)',
          border: '1px solid rgba(245,158,11,0.2)',
        }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at top right, rgba(245,158,11,0.1) 0%, transparent 60%)' }} />
        <div className="relative flex flex-col sm:flex-row gap-4 justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="section-pill" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' }}>
                🏆 RANKINGS
              </span>
            </div>
            <h1 className="text-2xl font-black text-white">Шилдэг Тоглогчид</h1>
            <p className="text-sm text-white/40 mt-0.5">
              {season ? `Season #${season.number} · ` : ''}Бодит цагийн жагсаалт
            </p>
          </div>

          {/* My ranks summary */}
          {myRanks && (
            <div className="flex gap-3 flex-shrink-0">
              {myRanks.attackRank && (
                <div className="text-center px-4 py-2 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <p className="text-xl font-black" style={{ color: '#f87171' }}>#{myRanks.attackRank}</p>
                  <p className="text-[10px] text-white/40 font-bold uppercase">PvP</p>
                </div>
              )}
              {myRanks.miniGameRank && (
                <div className="text-center px-4 py-2 rounded-xl" style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)' }}>
                  <p className="text-xl font-black" style={{ color: '#c4b5fd' }}>#{myRanks.miniGameRank}</p>
                  <p className="text-[10px] text-white/40 font-bold uppercase">Game</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={clsx('tab-pill flex items-center gap-1.5 flex-shrink-0', tab === t.key ? 'tab-pill-active' : 'tab-pill-inactive')}
            style={tab === t.key ? { background: t.color, borderColor: t.border } : {}}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── MINI GAME PERIOD ── */}
      {tab === 'minigame' && (
        <div className="flex gap-2">
          {(['daily', 'weekly', 'all'] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={clsx('px-4 py-1.5 rounded-full text-sm font-semibold transition-all', period === p
                ? 'text-purple-300 bg-purple-500/15 border border-purple-500/35'
                : 'text-white/40 border border-white/10 hover:text-white/60')}>
              {p === 'daily' ? 'Өнөөдөр' : p === 'weekly' ? '7 хоног' : 'Нийт'}
            </button>
          ))}
        </div>
      )}

      {/* ── MY RANK HIGHLIGHT ── */}
      {myRankInTab && myRankInTab > 3 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)' }}>
          <span className="text-purple-400 font-black text-sm">Таны байр:</span>
          <span className="text-white font-black">#{myRankInTab}</span>
          <span className="text-white/40 text-xs ml-auto">{user?.username}</span>
        </div>
      )}

      {/* ── CONTENT ── */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={tab + period} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-2">

            {/* ── PvP ATTACK ── */}
            {tab === 'attack' && (
              <>
                {(attackLB as any[]).length >= 3 && (
                  <PodiumTop3 entries={(attackLB as any[]).slice(0, 3)} valueKey="hp" valueSuffix=" HP" />
                )}
                {(attackLB as any[]).map((entry: any, i: number) => {
                  const rank = entry.rank ?? i + 1;
                  const isMe = entry.userId === user?.id;
                  const hpPct = Math.round((entry.hp / (entry.maxHp ?? 1000)) * 100);
                  const hpBarClass = hpPct > 60 ? 'hp-bar-good' : hpPct > 25 ? 'hp-bar-warn' : 'hp-bar-glow';
                  const isTop3 = rank <= 3;
                  return (
                    <motion.div key={entry.userId}
                      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(i * 0.025, 0.4) }}
                      className={clsx('flex items-center gap-3 p-3.5 rounded-2xl border transition-all', entry.isEliminated && 'opacity-40')}
                      style={{
                        background: isMe ? 'rgba(168,85,247,0.1)' : isTop3 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.02)',
                        borderColor: isMe ? 'rgba(168,85,247,0.4)' : isTop3 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)',
                        boxShadow: isMe ? '0 0 0 1px rgba(168,85,247,0.2), 0 4px 16px rgba(168,85,247,0.1)' : 'none',
                      }}>
                      <RankIcon rank={rank} />

                      {/* Avatar */}
                      {entry.avatarUrl && (
                        <img src={entry.avatarUrl} alt="" className="w-9 h-9 rounded-xl object-cover flex-shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className={clsx('font-bold text-sm truncate', isMe && 'text-purple-300')}>{entry.username}</p>
                          {isMe && <span className="text-[10px] px-1.5 py-0.5 rounded-md font-black" style={{ background: 'rgba(168,85,247,0.2)', color: '#c4b5fd' }}>ТА</span>}
                          {entry.isEliminated && <span className="text-xs">💀</span>}
                        </div>
                        {/* HP bar */}
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                            <div className={clsx('h-full rounded-full', hpBarClass)} style={{ width: `${hpPct}%` }} />
                          </div>
                          <span className="text-[10px] text-white/30 flex-shrink-0">{hpPct}%</span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="text-right flex-shrink-0 space-y-0.5">
                        <p className="font-black text-sm" style={{ color: hpPct > 60 ? '#4ade80' : hpPct > 25 ? '#fbbf24' : '#f87171' }}>
                          {entry.hp} HP
                        </p>
                        <p className="text-[10px] text-white/35">⚔️ {entry.kills ?? 0}</p>
                      </div>
                    </motion.div>
                  );
                })}
                {(attackLB as any[]).length === 0 && (
                  <div className="text-center py-16">
                    <p className="text-5xl mb-3" style={{ filter: 'drop-shadow(0 0 12px rgba(239,68,68,0.5))' }}>⚔️</p>
                    <p className="font-bold text-white/60">Season эхлэхэд жагсаалт гарна</p>
                  </div>
                )}
              </>
            )}

            {/* ── MINI GAME ── */}
            {tab === 'minigame' && (
              <>
                {(miniGameLB as any[]).length >= 3 && (
                  <PodiumTop3 entries={(miniGameLB as any[]).slice(0, 3)} valueKey="totalReward" valueSuffix=" AP" />
                )}
                {(miniGameLB as any[]).map((entry: any, i: number) => {
                  const rank = entry.rank ?? i + 1;
                  const isMe = entry.userId === user?.id;
                  return (
                    <motion.div key={entry.userId}
                      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(i * 0.025, 0.4) }}
                      className="flex items-center gap-3 p-3.5 rounded-2xl border transition-all"
                      style={{
                        background: isMe ? 'rgba(168,85,247,0.1)' : 'rgba(255,255,255,0.02)',
                        borderColor: isMe ? 'rgba(168,85,247,0.4)' : 'rgba(255,255,255,0.07)',
                        boxShadow: isMe ? '0 0 0 1px rgba(168,85,247,0.2)' : 'none',
                      }}>
                      <RankIcon rank={rank} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className={clsx('font-bold text-sm truncate', isMe && 'text-purple-300')}>{entry.username}</p>
                          {isMe && <span className="text-[10px] px-1.5 py-0.5 rounded-md font-black bg-purple-500/20 text-purple-300">ТА</span>}
                        </div>
                        <p className="text-[10px] text-white/35 mt-0.5">Best: {entry.bestScore?.toLocaleString()}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-black text-sm text-amber-400">{entry.totalReward?.toLocaleString()} AP</p>
                        <p className="text-[10px] text-white/30">{entry.sessions ?? 0} тоглоом</p>
                      </div>
                    </motion.div>
                  );
                })}
                {(miniGameLB as any[]).length === 0 && (
                  <div className="text-center py-16">
                    <p className="text-5xl mb-3">🎮</p>
                    <p className="font-bold text-white/60">Өнөөдөр тоглоом тоглосон хэрэглэгч байхгүй</p>
                  </div>
                )}
              </>
            )}

            {/* ── MASTERY ── */}
            {tab === 'mastery' && (masteryLB as any[]).map((entry: any, i: number) => {
              const isMe = entry.userId === user?.id;
              const tier = TIER_CONFIG[entry.masteryTier] ?? TIER_CONFIG.BRONZE;
              return (
                <motion.div key={entry.userId}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.025, 0.4) }}
                  className="flex items-center gap-3 p-3.5 rounded-2xl border"
                  style={{
                    background: isMe ? 'rgba(168,85,247,0.1)' : tier.bg,
                    borderColor: isMe ? 'rgba(168,85,247,0.4)' : 'rgba(255,255,255,0.07)',
                    boxShadow: tier.glow ? `0 0 0 1px rgba(255,255,255,0.05), ${tier.glow}` : 'none',
                  }}>
                  <RankIcon rank={i + 1} />
                  {entry.avatarUrl && (
                    <img src={entry.avatarUrl} alt="" className="w-9 h-9 rounded-xl object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={clsx('font-bold text-sm truncate', isMe && 'text-purple-300')}>{entry.username}</p>
                      {isMe && <span className="text-[10px] px-1.5 py-0.5 rounded-md font-black bg-purple-500/20 text-purple-300">ТА</span>}
                    </div>
                    <p className="text-[10px] text-white/40 mt-0.5">{entry.characterName} · Lv{entry.level}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-black text-sm" style={{ color: tier.color, textShadow: tier.glow }}>{tier.label}</p>
                    <p className="text-[10px] text-white/30">{entry.xp?.toLocaleString()} XP</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
