'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { attackApi, seasonApi, leaderboardApi, characterApi } from '../../../../lib/api';
import { useAuthStore } from '../../../../store/auth.store';
import clsx from 'clsx';

type AttackTab = 'leaderboard' | 'attack' | 'history' | 'season';

export default function AttackPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<AttackTab>('leaderboard');
  const [now, setNow] = useState(() => Date.now());

  // Energy countdown — секунд бүр шинэчилнэ
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const getEnergyRefillInfo = () => {
    if (!myStats?.energyLastRefill) return null;
    const lastRefill = new Date(myStats.energyLastRefill).getTime();
    const nextRefill = lastRefill + 30 * 60 * 1000;
    const secsLeft = Math.max(0, Math.ceil((nextRefill - now) / 1000));
    const mins = Math.floor(secsLeft / 60);
    const secs = secsLeft % 60;
    const isFull = myStats.energy >= myStats.maxEnergy;
    const refillsToFull = Math.ceil((myStats.maxEnergy - myStats.energy) / 10);
    const minsToFull = secsLeft > 0
      ? mins + (refillsToFull - 1) * 30
      : (refillsToFull - 1) * 30;
    return { secsLeft, mins, secs, isFull, refillsToFull, minsToFull };
  };

  const [selectedDefenderId, setSelectedDefenderId] = useState<string | null>(null);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [attackResult, setAttackResult] = useState<any>(null);
  const [showDamage, setShowDamage] = useState(false);
  // skillId → expiry timestamp (ms)
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const [, setTick] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cooldown байгаа үед секунд бүр re-render хийнэ
  useEffect(() => {
    tickRef.current = setInterval(() => {
      const now = Date.now();
      setCooldowns((prev) => {
        const next = { ...prev };
        let changed = false;
        for (const id in next) {
          if (next[id] <= now) { delete next[id]; changed = true; }
        }
        return changed ? next : prev;
      });
      setTick((t) => t + 1);
    }, 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, []);

  const getCooldownLeft = (skillId: string) => {
    const exp = cooldowns[skillId];
    if (!exp) return 0;
    return Math.max(0, Math.ceil((exp - Date.now()) / 1000));
  };

  const { data: season } = useQuery({
    queryKey: ['season-current'],
    queryFn: seasonApi.getCurrent,
    refetchInterval: 60000,
  });

  const { data: myStats } = useQuery({
    queryKey: ['my-attack-stats'],
    queryFn: attackApi.getMyStats,
    refetchInterval: 10000,
  });

  const { data: leaderboard = [] } = useQuery({
    queryKey: ['attack-leaderboard'],
    queryFn: attackApi.getLeaderboard,
    refetchInterval: 30000,
  });

  const { data: history = [] } = useQuery({
    queryKey: ['attack-history'],
    queryFn: attackApi.getHistory,
    enabled: tab === 'history',
  });

  const { data: myChars = [] } = useQuery({
    queryKey: ['my-characters'],
    queryFn: characterApi.getMyCharacters,
  });

  const activeChar = myChars.find((c: any) => c.isActive);
  const availableSkills = activeChar?.character?.skills?.filter(
    (s: any) => activeChar.level >= s.requiredLevel,
  ) ?? [];

  const attackMutation = useMutation({
    mutationFn: ({ defenderId, skillId }: { defenderId: string; skillId: string }) =>
      attackApi.attack(defenderId, skillId),
    onSuccess: (data: any) => {
      setAttackResult(data);
      setShowDamage(true);
      setTimeout(() => setShowDamage(false), 3000);

      // Ашигласан skill-ийн cooldown-г тохируулна
      if (selectedSkillId) {
        const skill = availableSkills.find((s: any) => s.id === selectedSkillId);
        if (skill?.cooldownSeconds) {
          setCooldowns((prev) => ({
            ...prev,
            [selectedSkillId]: Date.now() + skill.cooldownSeconds * 1000,
          }));
        }
      }

      queryClient.invalidateQueries({ queryKey: ['my-attack-stats'] });
      queryClient.invalidateQueries({ queryKey: ['attack-leaderboard'] });

      if (data.isKill) {
        toast.success(`💀 KILL! ${data.message}`, { duration: 5000 });
      } else {
        toast(`⚔️ ${data.message}`, { duration: 3000 });
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message ?? 'Дайрахад алдаа гарлаа');
    },
  });

  const handleAttack = () => {
    if (!selectedDefenderId || !selectedSkillId) {
      toast.error('Дайрах хэрэглэгч болон skill сонгоно уу');
      return;
    }
    if (getCooldownLeft(selectedSkillId) > 0) {
      toast.error(`Skill дахин ашиглах хүртэл ${getCooldownLeft(selectedSkillId)}с хүлээнэ үү`);
      return;
    }
    attackMutation.mutate({ defenderId: selectedDefenderId, skillId: selectedSkillId });
  };

  const TABS: { key: AttackTab; label: string; icon: string }[] = [
    { key: 'leaderboard', label: 'Леадерборд', icon: '🏆' },
    { key: 'attack', label: 'Дайрах', icon: '⚔️' },
    { key: 'history', label: 'Түүх', icon: '📜' },
    { key: 'season', label: 'Season', icon: '🗓️' },
  ];

  const selectedTarget = leaderboard.find((e: any) => e.userId === selectedDefenderId);
  const maxHp = leaderboard.length > 0 ? Math.max(...leaderboard.map((e: any) => e.hp), 1) : 1000;

  // Anime-style helper: HP color
  const hpColor = (pct: number) =>
    pct > 60 ? ['#16a34a','#4ade80'] : pct > 25 ? ['#d97706','#fbbf24'] : ['#dc2626','#f87171'];

  if (!season) {
    return (
      <div className="text-center py-24">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
          className="text-8xl mb-6" style={{ filter: 'drop-shadow(0 0 20px rgba(220,38,38,0.7))' }}>⚔️</motion.div>
        <h2 className="text-3xl font-black text-white mb-2" style={{ fontFamily:'var(--font-bangers)', letterSpacing:'0.1em' }}>
          PvP SEASON
        </h2>
        <p className="text-white/40">Одоогоор идэвхтэй season байхгүй байна</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">

      {/* ── SEASON BANNER ─────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl p-5"
        style={{
          background: 'linear-gradient(135deg,#0d0000 0%,#1a0000 50%,#0d0000 100%)',
          border: '1px solid rgba(220,38,38,0.4)',
          boxShadow: '0 0 40px rgba(220,38,38,0.12), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}>

        {/* Manga diagonal lines bg */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0px, #fff 1px, transparent 0, transparent 50%)', backgroundSize: '14px 14px' }} />

        {/* Right glow orb */}
        <div className="absolute top-0 right-0 w-72 h-72 pointer-events-none"
          style={{ background: 'radial-gradient(circle at top right, rgba(220,38,38,0.18) 0%, transparent 65%)' }} />

        <div className="relative">
          {/* Title row */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <span className="text-2xl" style={{ filter:'drop-shadow(0 0 8px rgba(220,38,38,0.9))' }}>⚔️</span>
                <h2 style={{ fontFamily:'var(--font-bangers)', letterSpacing:'0.1em', fontSize:'1.6rem', lineHeight:1,
                  background:'linear-gradient(180deg, #fff 30%, #fca5a5 100%)',
                  WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                  filter:'drop-shadow(0 2px 8px rgba(220,38,38,0.6))' }}>
                  SEASON #{season?.number}
                </h2>
                <span className="px-2 py-0.5 text-xs font-black rounded-full text-red-300 animate-pulse"
                  style={{ background:'rgba(220,38,38,0.2)', border:'1px solid rgba(220,38,38,0.5)' }}>
                  LIVE
                </span>
              </div>
              <p className="text-xs text-white/30 tracking-wide">Даваа → Баасан · Хамгийн их HP-тэй ялна</p>
            </div>

            {myStats && (
              <div className="flex gap-2">
                {[
                  { v: myStats.hp, l: 'HP', c: '#4ade80', bg: 'rgba(74,222,128,0.1)', br: 'rgba(74,222,128,0.25)' },
                  { v: myStats.energy, l: 'EN', c: '#60a5fa', bg: 'rgba(96,165,250,0.1)', br: 'rgba(96,165,250,0.25)' },
                  { v: myStats.kills, l: 'KO', c: '#f87171', bg: 'rgba(248,113,113,0.1)', br: 'rgba(248,113,113,0.25)' },
                ].map(s => (
                  <div key={s.l} className="text-center px-2.5 py-1.5 rounded-xl"
                    style={{ background: s.bg, border: `1px solid ${s.br}` }}>
                    <p className="text-xl font-black leading-none" style={{ color: s.c, fontFamily:'var(--font-bangers)', letterSpacing:'0.05em' }}>{s.v}</p>
                    <p className="text-xs mt-0.5" style={{ color:'rgba(255,255,255,0.35)', letterSpacing:'0.1em' }}>{s.l}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {myStats && (
            <div className="space-y-2">
              {/* HP bar — anime game style */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/50 font-bold tracking-widest text-[10px] uppercase">Health</span>
                  <span className="font-black text-green-400 text-xs">{myStats.hp} / {myStats.maxHp}</span>
                </div>
                <div className="h-3 rounded-sm overflow-hidden" style={{ background:'rgba(255,255,255,0.06)', boxShadow:'inset 0 1px 3px rgba(0,0,0,0.6)' }}>
                  <motion.div initial={{ width:0 }}
                    animate={{ width:`${(myStats.hp/myStats.maxHp)*100}%` }}
                    transition={{ duration:1, ease:'easeOut' }}
                    className="h-full relative"
                    style={{ background:`linear-gradient(90deg, ${hpColor(myStats.hp/myStats.maxHp*100)[0]}, ${hpColor(myStats.hp/myStats.maxHp*100)[1]})`,
                      boxShadow:`0 0 10px ${hpColor(myStats.hp/myStats.maxHp*100)[1]}70` }}>
                    {/* HP bar shimmer */}
                    <div className="absolute inset-0 opacity-40"
                      style={{ background:'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 60%)' }} />
                  </motion.div>
                </div>
              </div>

              {/* Energy bar */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/50 font-bold tracking-widest text-[10px] uppercase">Energy</span>
                  <span className="text-blue-400 font-black text-xs">
                    {myStats.energy}/{myStats.maxEnergy}
                    {(() => {
                      const info = getEnergyRefillInfo();
                      if (!info || info.isFull) return null;
                      if (info.secsLeft <= 0) return <span className="text-yellow-400 ml-1.5 animate-pulse">▲+10</span>;
                      return <span className="text-white/30 ml-1.5 font-normal">{info.mins}:{String(info.secs).padStart(2,'0')}</span>;
                    })()}
                  </span>
                </div>
                <div className="h-2 rounded-sm overflow-hidden" style={{ background:'rgba(255,255,255,0.05)', boxShadow:'inset 0 1px 2px rgba(0,0,0,0.5)' }}>
                  <motion.div animate={{ width:`${(myStats.energy/myStats.maxEnergy)*100}%` }}
                    className="h-full"
                    style={{ background:'linear-gradient(90deg,#1d4ed8,#93c5fd)', boxShadow:'0 0 8px rgba(96,165,250,0.6)' }} />
                </div>
              </div>

              {/* AP strip */}
              <div className="flex items-center justify-between mt-1 pt-2"
                style={{ borderTop:'1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2">
                  <span style={{ fontFamily:'var(--font-bangers)', fontSize:'1.1rem', letterSpacing:'0.08em', color:'#fb923c',
                    filter:'drop-shadow(0 0 6px rgba(251,146,60,0.7))' }}>
                    ⚔️ {myStats.attackPoint ?? 0} AP
                  </span>
                  <span className="text-white/25 text-xs">= damage</span>
                </div>
                <span className="text-white/20 text-xs">−5 AP/халдлага · тоглоомоос +5-10</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── DAMAGE FLASH ──────────────────────────────────────── */}
      <AnimatePresence>
        {showDamage && attackResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.4, y: 20 }}
            animate={{ opacity: 1, scale: 1.3, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: -60 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none text-center"
          >
            <p className="text-7xl font-black text-red-400"
              style={{ filter: 'drop-shadow(0 0 30px rgba(239,68,68,0.9))' }}>
              -{attackResult.damageDealt}
            </p>
            {attackResult.isKill && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-black text-red-300 mt-2"
              >
                💀 KILL!
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TABS ──────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all"
            style={tab === t.key ? {
              background:'linear-gradient(135deg,#dc2626,#991b1b)',
              boxShadow:'0 0 16px rgba(220,38,38,0.4)',
              fontFamily:'var(--font-bangers)',
              letterSpacing:'0.08em',
              color:'#fff',
              fontSize:'0.85rem',
            } : {
              color:'rgba(255,255,255,0.35)',
              fontSize:'0.8rem',
            }}
          >
            <span>{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ───────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >

          {/* LEADERBOARD */}
          {tab === 'leaderboard' && (
            <div className="space-y-2">
              <p style={{ fontFamily:'var(--font-bangers)', letterSpacing:'0.15em', color:'rgba(255,255,255,0.25)', fontSize:'0.7rem' }}
                className="mb-3 uppercase">
                Season #{season?.number} · {leaderboard.length} тэмцэгч
              </p>
              {leaderboard.map((entry: any, idx: number) => {
                const hpPct = Math.max(0, Math.min(100, (entry.hp / (myStats?.maxHp ?? 1000)) * 100));
                const [c1, c2] = hpColor(hpPct);
                const isMe = entry.userId === user?.id;
                const rankAccent = idx === 0 ? '#eab308' : idx === 1 ? '#94a3b8' : idx === 2 ? '#d97706' : 'rgba(255,255,255,0.15)';
                return (
                  <motion.div key={entry.userId}
                    initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }}
                    transition={{ delay: idx * 0.05, type:'spring', stiffness:200, damping:20 }}
                    className={clsx('relative overflow-hidden rounded-xl', entry.isEliminated && 'opacity-35')}
                    style={{
                      background: isMe
                        ? 'linear-gradient(90deg, rgba(139,92,246,0.12), rgba(0,0,0,0.6))'
                        : 'linear-gradient(90deg, rgba(255,255,255,0.04), rgba(0,0,0,0.5))',
                      border: isMe ? '1px solid rgba(139,92,246,0.45)' : '1px solid rgba(255,255,255,0.07)',
                      boxShadow: isMe ? '0 0 20px rgba(139,92,246,0.15)' : 'none',
                    }}
                  >
                    {/* Left rank accent bar */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ background: rankAccent }} />

                    <div className="flex items-center gap-3 p-3 pl-4">
                      {/* Rank */}
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-lg"
                        style={{ background:`${rankAccent}22`, border:`1px solid ${rankAccent}55` }}>
                        {idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉'
                          : <span style={{ fontFamily:'var(--font-bangers)', color:'rgba(255,255,255,0.4)', fontSize:'0.75rem' }}>#{entry.rank}</span>}
                      </div>

                      {/* Name + bar */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span style={{ fontFamily:'var(--font-bangers)', letterSpacing:'0.06em', fontSize:'1rem',
                            color: isMe ? '#a78bfa' : '#fff' }}>
                            {entry.username}
                          </span>
                          {isMe && <span className="text-xs px-1.5 py-0.5 rounded text-purple-300"
                            style={{ background:'rgba(139,92,246,0.2)', border:'1px solid rgba(139,92,246,0.4)' }}>ТА</span>}
                          {entry.isEliminated && <span className="text-xs text-red-400 ml-1">💀 KO</span>}
                          {entry.kills > 0 && !entry.isEliminated && (
                            <span className="ml-auto text-xs text-red-400/70 font-bold">⚔️×{entry.kills}</span>
                          )}
                        </div>
                        {/* Anime-style HP bar with segments */}
                        <div className="relative h-2 rounded-sm overflow-hidden"
                          style={{ background:'rgba(0,0,0,0.5)', boxShadow:'inset 0 1px 3px rgba(0,0,0,0.8)' }}>
                          <motion.div
                            initial={{ width:0 }} animate={{ width:`${hpPct}%` }}
                            transition={{ duration:0.8, ease:'easeOut', delay: idx * 0.05 }}
                            className="absolute inset-y-0 left-0"
                            style={{ background:`linear-gradient(90deg,${c1},${c2})`,
                              boxShadow:`0 0 8px ${c2}80` }}
                          />
                          {/* Bar segments overlay */}
                          <div className="absolute inset-0 pointer-events-none"
                            style={{ backgroundImage:'repeating-linear-gradient(90deg, transparent 0px, transparent 9px, rgba(0,0,0,0.3) 9px, rgba(0,0,0,0.3) 10px)' }} />
                        </div>
                      </div>

                      {/* HP + action */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span style={{ fontFamily:'var(--font-bangers)', letterSpacing:'0.05em', fontSize:'1rem',
                          color: hpPct > 60 ? '#4ade80' : hpPct > 25 ? '#fbbf24' : '#f87171',
                          filter:`drop-shadow(0 0 5px ${c2}90)` }}>
                          {entry.hp}
                        </span>
                        {!entry.isEliminated && !isMe ? (
                          <button
                            onClick={() => { setSelectedDefenderId(entry.userId); setTab('attack'); }}
                            className="px-2.5 py-1 text-xs font-black rounded-lg transition-all hover:scale-105 active:scale-95"
                            style={{ fontFamily:'var(--font-bangers)', letterSpacing:'0.08em',
                              background:'linear-gradient(135deg,#dc2626,#991b1b)',
                              boxShadow:'0 0 10px rgba(220,38,38,0.4)', color:'#fff' }}>
                            ДАЙР
                          </button>
                        ) : entry.isEliminated ? null : (
                          <span className="text-xs text-purple-400/50 px-2">YOU</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* ATTACK */}
          {tab === 'attack' && (
            <div className="max-w-md mx-auto space-y-4">
              {myStats?.isEliminated ? (
                <div className="text-center py-16">
                  <p className="text-7xl mb-4">💀</p>
                  <p className="text-xl font-black text-red-400">ELIMINATED</p>
                  <p className="text-sm text-white/40 mt-2">Дараагийн season-д дахин тулалд</p>
                </div>
              ) : (
                <>
                  {/* Target picker */}
                  <div className="space-y-2">
                    <p style={{ fontFamily:'var(--font-bangers)', letterSpacing:'0.15em', color:'rgba(255,255,255,0.25)', fontSize:'0.7rem' }}
                      className="uppercase">Target сонгох</p>
                    <div className="grid gap-2">
                      {leaderboard.filter((e: any) => e.userId !== user?.id && !e.isEliminated).map((e: any) => {
                        const pct = Math.min(100, (e.hp / (myStats?.maxHp ?? 1000)) * 100);
                        const [c1, c2] = hpColor(pct);
                        const isSelected = selectedDefenderId === e.userId;
                        return (
                          <button key={e.userId}
                            onClick={() => setSelectedDefenderId(isSelected ? null : e.userId)}
                            className="relative overflow-hidden flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                            style={isSelected ? {
                              background:'linear-gradient(90deg,rgba(220,38,38,0.18),rgba(0,0,0,0.5))',
                              border:'1px solid rgba(220,38,38,0.55)',
                              boxShadow:'0 0 18px rgba(220,38,38,0.2)',
                            } : {
                              background:'rgba(255,255,255,0.04)',
                              border:'1px solid rgba(255,255,255,0.08)',
                            }}
                          >
                            {isSelected && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
                                style={{ background:'linear-gradient(180deg,#dc2626,#f87171)' }} />
                            )}
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-xs"
                              style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
                                color:'rgba(255,255,255,0.5)', fontFamily:'var(--font-bangers)', letterSpacing:'0.05em' }}>
                              #{e.rank}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p style={{ fontFamily:'var(--font-bangers)', letterSpacing:'0.06em',
                                color: isSelected ? '#fca5a5' : '#fff', fontSize:'0.95rem' }}>
                                {e.username}
                              </p>
                              <div className="h-1.5 rounded-sm mt-1.5 overflow-hidden" style={{ background:'rgba(0,0,0,0.4)' }}>
                                <div className="h-full rounded-sm transition-all" style={{
                                  width:`${pct}%`,
                                  background:`linear-gradient(90deg,${c1},${c2})`,
                                  boxShadow:`0 0 6px ${c2}60`,
                                }} />
                              </div>
                            </div>
                            <span style={{ fontFamily:'var(--font-bangers)', fontSize:'0.95rem', letterSpacing:'0.05em', color: c2 }}
                              className="flex-shrink-0">{e.hp} HP</span>
                            {isSelected && <span className="text-xl" style={{ filter:'drop-shadow(0 0 8px rgba(220,38,38,0.8))' }}>🎯</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Skill picker */}
                  <div className="space-y-2">
                    <p style={{ fontFamily:'var(--font-bangers)', letterSpacing:'0.15em', color:'rgba(255,255,255,0.25)', fontSize:'0.7rem' }}
                      className="uppercase">Skill сонгох</p>
                    {availableSkills.length === 0 ? (
                      <div className="text-center py-6 text-white/25 text-sm rounded-xl"
                        style={{ border:'1px solid rgba(255,255,255,0.06)' }}>
                        Идэвхтэй дүр эсвэл skill байхгүй
                      </div>
                    ) : (
                      <div className="grid gap-2">
                        {availableSkills.map((skill: any) => {
                          const cdLeft = getCooldownLeft(skill.id);
                          const onCd = cdLeft > 0;
                          const isSelected = selectedSkillId === skill.id;
                          const effectColors: Record<string,string[]> = {
                            FIRE:['#dc2626','#f97316'], LIGHTNING:['#ca8a04','#fde047'],
                            DARK:['#7c3aed','#a78bfa'], WATER:['#1d4ed8','#60a5fa'],
                            WIND:['#16a34a','#4ade80'], RASENGAN:['#0891b2','#22d3ee'],
                            SHARINGAN:['#dc2626','#ff0000'], ICE:['#0ea5e9','#bae6fd'],
                            LIGHT:['#ca8a04','#fef08a'], VOID:['#374151','#9ca3af'],
                          };
                          const [ec1, ec2] = effectColors[skill.effectType] ?? ['#9333ea','#c084fc'];
                          const effectEmoji: Record<string,string> = {
                            FIRE:'🔥',LIGHTNING:'⚡',DARK:'🌑',WATER:'💧',WIND:'🌪️',
                            RASENGAN:'🌀',SHARINGAN:'👁️',ICE:'❄️',LIGHT:'✨',VOID:'🕳️',
                          };
                          return (
                            <button key={skill.id}
                              onClick={() => { if (!onCd) setSelectedSkillId(isSelected ? null : skill.id); }}
                              disabled={onCd}
                              className="relative overflow-hidden text-left transition-all rounded-xl"
                              style={onCd ? {
                                opacity:0.45, cursor:'not-allowed',
                                background:'rgba(255,255,255,0.03)',
                                border:'1px solid rgba(255,255,255,0.06)',
                              } : isSelected ? {
                                background:`linear-gradient(135deg, ${ec1}25, ${ec2}10)`,
                                border:`1px solid ${ec1}80`,
                                boxShadow:`0 0 20px ${ec1}30`,
                              } : {
                                background:'rgba(255,255,255,0.04)',
                                border:`1px solid rgba(255,255,255,0.08)`,
                              }}
                            >
                              {/* CD countdown bar */}
                              {onCd && (
                                <div className="absolute bottom-0 left-0 h-0.5 transition-all"
                                  style={{ width:`${(cdLeft/skill.cooldownSeconds)*100}%`,
                                    background:'linear-gradient(90deg,#fbbf24,#fde68a)' }} />
                              )}
                              {/* Selected glow line */}
                              {isSelected && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
                                  style={{ background:`linear-gradient(180deg,${ec1},${ec2})` }} />
                              )}

                              <div className="flex items-center gap-3 p-3.5 pl-4">
                                {/* Effect icon */}
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                                  style={{ background:`${ec1}20`, border:`1px solid ${ec1}40`,
                                    boxShadow: isSelected ? `0 0 12px ${ec1}50` : 'none' }}>
                                  {effectEmoji[skill.effectType] ?? '⚔️'}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <p style={{ fontFamily:'var(--font-bangers)', letterSpacing:'0.06em', fontSize:'1rem',
                                    color: onCd ? 'rgba(255,255,255,0.4)' : '#fff' }}>
                                    {skill.name}
                                  </p>
                                  <p className="text-xs text-white/35 truncate">{skill.description}</p>
                                </div>

                                <div className="text-right flex-shrink-0 ml-2">
                                  <p style={{ fontFamily:'var(--font-bangers)', letterSpacing:'0.05em', fontSize:'1.15rem',
                                    color: ec2, filter:`drop-shadow(0 0 6px ${ec1}80)` }}>
                                    {myStats?.attackPoint ?? 0}
                                  </p>
                                  <p className="text-white/30 text-xs">−5 AP</p>
                                  {onCd
                                    ? <p className="text-yellow-400 font-black text-xs animate-pulse">⏳{cdLeft}с</p>
                                    : <p className="text-white/20 text-xs">⏱{skill.cooldownSeconds}с</p>
                                  }
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* AP warning */}
                  {(myStats?.attackPoint ?? 0) < 5 && (
                    <div className="p-3 rounded-xl border border-yellow-500/30 bg-yellow-500/8 text-center">
                      <p className="text-yellow-400 text-sm font-bold">⚠️ AP хүрэлцэхгүй байна</p>
                      <p className="text-white/40 text-xs mt-0.5">Тоглоом тоглоод AP цуглуул</p>
                    </div>
                  )}

                  {/* Attack result */}
                  <AnimatePresence>
                    {attackResult && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className={clsx(
                          'p-4 rounded-xl border text-center',
                          attackResult.isKill
                            ? 'border-red-500/50 bg-red-500/8'
                            : 'border-orange-500/30 bg-orange-500/6',
                        )}
                      >
                        <p className="font-bold text-white">{attackResult.message}</p>
                        <p className="text-white/40 text-xs mt-1">+{attackResult.xpGained} XP</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ATTACK BUTTON */}
                  <button
                    onClick={handleAttack}
                    disabled={attackMutation.isPending || !selectedDefenderId || !selectedSkillId || (myStats?.attackPoint ?? 0) < 5}
                    className="relative w-full py-4 rounded-2xl font-black text-lg text-white overflow-hidden transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{
                      background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 50%, #7f1d1d 100%)',
                      boxShadow: '0 0 40px rgba(220,38,38,0.35), 0 4px 16px rgba(0,0,0,0.5)',
                    }}
                  >
                    <span className="absolute inset-0 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-[-15deg]" />
                    <span className="relative flex items-center justify-center gap-2">
                      {attackMutation.isPending ? (
                        <>
                          <div className="anime-spinner w-5 h-5" />
                          Дайрч байна...
                        </>
                      ) : (
                        <>⚔️ ДАЙРАХ — {myStats?.attackPoint ?? 0} dmg</>
                      )}
                    </span>
                  </button>
                </>
              )}
            </div>
          )}

          {/* HISTORY */}
          {tab === 'history' && (
            <div className="space-y-2">
              <p className="text-xs text-white/30 uppercase tracking-widest font-bold mb-3">Сүүлийн дайралтууд</p>
              {history.length === 0 ? (
                <div className="text-center py-12 text-white/25">Дайралтын түүх байхгүй байна</div>
              ) : (
                history.map((log: any, i: number) => {
                  const isAttacker = log.attackerId === user?.id;
                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={clsx(
                        'flex items-center gap-3 p-3 rounded-xl border',
                        isAttacker
                          ? 'border-red-900/50 bg-red-950/30'
                          : 'border-white/8 bg-white/3',
                      )}
                    >
                      <div className={clsx(
                        'w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0',
                        log.isKill ? 'bg-red-500/20' : isAttacker ? 'bg-orange-500/15' : 'bg-blue-500/15',
                      )}>
                        {log.isKill ? '💀' : isAttacker ? '⚔️' : '🛡️'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">
                          {isAttacker
                            ? <><span className="text-red-400">{log.defender?.username}</span> руу <span className="text-orange-400 font-black">{log.damageDealt} dmg</span></>
                            : <><span className="text-blue-400">{log.attacker?.username}</span> танд <span className="text-red-400 font-black">{log.damageDealt} dmg</span></>}
                          {log.isKill && <span className="ml-1.5 text-red-400 font-black">[KILL]</span>}
                        </p>
                        <p className="text-xs text-white/30 mt-0.5">
                          HP: {isAttacker ? log.defenderHpBefore : log.attackerHpBefore} → {isAttacker ? log.defenderHpAfter : log.attackerHpAfter}
                        </p>
                      </div>
                      <span className="text-xs text-white/25 flex-shrink-0">
                        {new Date(log.createdAt).toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </motion.div>
                  );
                })
              )}
            </div>
          )}

          {/* SEASON INFO */}
          {tab === 'season' && (
            <div className="space-y-4 max-w-md mx-auto">
              <div
                className="rounded-2xl border border-white/8 p-5 space-y-3"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <h3 className="font-black text-white text-lg">Season #{season?.number}</h3>
                {[
                  { label: 'Эхлэх огноо', value: new Date(season?.startDate).toLocaleDateString('mn-MN') },
                  { label: 'Дуусах огноо', value: new Date(season?.endDate).toLocaleDateString('mn-MN') },
                  { label: '🥇 Шагнал', value: `${season?.rewardPoints} CP`, highlight: true },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                    <span className="text-sm text-white/40">{row.label}</span>
                    <span className={clsx('text-sm font-bold', row.highlight ? 'text-yellow-400' : 'text-white')}>{row.value}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-white/8 p-5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <p className="font-bold text-white mb-3">Дүрэм</p>
                <ul className="space-y-2">
                  {[
                    '🎮 Тоглоом тоглоно → AP олно',
                    '⚔️ Дайрахад 5 AP зарцуулна',
                    '💥 Damage = таны одоогийн AP',
                    '❤️ HP 0 болвол eliminated',
                    '🏆 Хамгийн их HP-тэй ялна',
                    '⭐ Шагнал = Character Point',
                  ].map((rule) => (
                    <li key={rule} className="text-sm text-white/50 flex items-start gap-2">{rule}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
