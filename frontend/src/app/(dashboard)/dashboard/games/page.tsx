'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { gameApi, leaderboardApi } from '../../../../lib/api';
import clsx from 'clsx';

type GameTab = 'games' | 'leaderboard' | 'stats';

// ─── Reaction Game ────────────────────────────────────────────────────

function ReactionGame({ gameData, onEnd }: { gameData: any; onEnd: (score: number, duration: number) => void }) {
  const ROUNDS = 5;
  const delays: number[] = gameData.delays ?? Array.from({ length: 5 }, () => 2000);
  const [phase, setPhase] = useState<'waiting' | 'ready' | 'clicked'>('waiting');
  const [clickTime, setClickTime] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const delay = delays[round] ?? 2000;
    const t = setTimeout(() => { setPhase('ready'); setStartTime(Date.now()); }, delay);
    return () => clearTimeout(t);
  }, [round]);

  const handleClick = () => {
    if (phase === 'waiting') { toast.error('Хэтэрхий эрт! -100'); setScore((s) => s - 100); return; }
    if (phase !== 'ready') return;
    const rt = Date.now() - (startTime ?? Date.now());
    const roundScore = Math.max(0, 1000 - rt);
    const newScore = score + roundScore;
    setScore(newScore);
    setClickTime(rt);
    setPhase('clicked');
    if (round >= ROUNDS - 1) {
      setTimeout(() => onEnd(newScore, Date.now() - startRef.current), 1400);
    } else {
      setTimeout(() => { setRound((r) => r + 1); setPhase('waiting'); setClickTime(null); setStartTime(null); }, 1400);
    }
  };

  const phaseBg = phase === 'ready'
    ? 'bg-emerald-500/20 border-emerald-400/60'
    : phase === 'clicked'
    ? 'bg-purple-500/10 border-purple-400/30'
    : 'bg-white/[0.03] border-white/10';

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div className="flex gap-1.5">
          {Array.from({ length: ROUNDS }).map((_, i) => (
            <div key={i} className={clsx('h-2 w-8 rounded-full transition-all duration-300',
              i < round ? 'bg-emerald-400' : i === round ? 'bg-white/40' : 'bg-white/10')} />
          ))}
        </div>
        <span className="font-black text-white/70">⭐ {score}</span>
      </div>

      <motion.div
        onClick={handleClick}
        whileTap={{ scale: 0.97 }}
        className={clsx('w-full h-52 rounded-2xl border-2 flex flex-col items-center justify-center cursor-pointer select-none transition-all duration-200', phaseBg)}
      >
        {phase === 'waiting' && (
          <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1.4 }} className="text-center">
            <p className="text-5xl mb-3">⏳</p>
            <p className="text-white/40 font-bold">Хүлээ...</p>
          </motion.div>
        )}
        {phase === 'ready' && (
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
            <p className="text-5xl mb-3">⚡</p>
            <p className="text-emerald-300 text-3xl font-black tracking-wide">ДАРНА УУ!</p>
          </motion.div>
        )}
        {phase === 'clicked' && clickTime != null && (
          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center">
            <p className="text-4xl font-black text-white">{clickTime}мс</p>
            <p className="text-white/40 mt-1">+{Math.max(0, 1000 - clickTime)} оноо</p>
          </motion.div>
        )}
      </motion.div>
      <p className="text-center text-xs text-white/30">Раунд {round + 1} / {ROUNDS}</p>
    </div>
  );
}

// ─── Anime Quiz Game ──────────────────────────────────────────────────

function QuizGame({ gameData, onEnd }: { gameData: any; onEnd: (score: number, duration: number) => void }) {
  const questions: { q: string; choices: string[]; correct: string }[] = gameData.questions ?? [];
  const TOTAL = questions.length;
  const TIME_PER_Q = 12;

  const [qIdx, setQIdx] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q);
  const startRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const advance = useCallback((picked: string | null) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const correct = questions[qIdx]?.correct;
    const gained = picked === correct ? 200 : 0;
    const newScore = score + gained;
    setScore(newScore);
    setChosen(picked ?? '__timeout__');

    setTimeout(() => {
      if (qIdx >= TOTAL - 1) {
        onEnd(newScore, Date.now() - startRef.current);
      } else {
        setQIdx((i) => i + 1);
        setChosen(null);
        setTimeLeft(TIME_PER_Q);
      }
    }, 1200);
  }, [qIdx, score, questions, TOTAL, onEnd]);

  useEffect(() => {
    if (chosen !== null) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { advance(null); return TIME_PER_Q; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [qIdx, chosen]);

  const q = questions[qIdx];
  if (!q) return null;
  const correct = q.correct;
  const pct = (timeLeft / TIME_PER_Q) * 100;
  const barColor = pct > 60 ? '#10b981' : pct > 30 ? '#f59e0b' : '#ef4444';

  return (
    <div className="space-y-5">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1 flex-1">
          {Array.from({ length: TOTAL }).map((_, i) => (
            <div key={i} className={clsx('h-1.5 flex-1 rounded-full transition-all duration-300',
              i < qIdx ? 'bg-purple-400' : i === qIdx ? 'bg-white/50' : 'bg-white/10')} />
          ))}
        </div>
        <span className="text-xs font-black text-white/50">{qIdx + 1}/{TOTAL}</span>
      </div>

      {/* Timer bar */}
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: barColor }} />
      </div>

      {/* Question */}
      <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}>
        <p className="text-white font-bold leading-snug text-sm">{q.q}</p>
      </div>

      {/* Choices */}
      <div className="grid grid-cols-1 gap-2.5">
        {q.choices.map((c) => {
          const isChosen = chosen === c;
          const isCorrect = c === correct;
          let style = 'bg-white/[0.04] border-white/10 text-white/70 hover:bg-white/[0.08] hover:border-white/20';
          if (chosen !== null) {
            if (isCorrect) style = 'bg-emerald-500/20 border-emerald-400/60 text-emerald-300';
            else if (isChosen) style = 'bg-red-500/20 border-red-400/60 text-red-300';
            else style = 'bg-white/[0.02] border-white/5 text-white/30';
          }
          return (
            <motion.button
              key={c}
              onClick={() => chosen === null && advance(c)}
              disabled={chosen !== null}
              whileTap={{ scale: 0.98 }}
              className={clsx('w-full py-3 px-4 rounded-xl border text-sm font-bold text-left transition-all duration-200', style)}
            >
              {chosen !== null && isCorrect && '✓ '}{chosen !== null && isChosen && !isCorrect && '✗ '}{c}
            </motion.button>
          );
        })}
      </div>

      <div className="text-center">
        <span className="text-white/40 text-xs font-bold">⭐ {score} оноо</span>
      </div>
    </div>
  );
}

// ─── Dodge Game ───────────────────────────────────────────────────────

const DODGE_OBSTACLES = ['🔥', '💀', '⚡', '🗡️', '🌀', '☠️'];
const LANES = 3;

function DodgeGame({ gameData, onEnd }: { gameData: any; onEnd: (score: number, duration: number) => void }) {
  const GAME_DURATION = 15;
  const [lane, setLane] = useState(1);
  const [obstacles, setObstacles] = useState<{ id: number; lane: number; emoji: string }[]>([]);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [dead, setDead] = useState(false);
  const [started, setStarted] = useState(false);

  const laneRef = useRef(1);
  const livesRef = useRef(3);
  const scoreRef = useRef(0);
  const deadRef = useRef(false);
  const obsId = useRef(0);
  const startRef = useRef(Date.now());

  const moveLeft  = () => { const n = Math.max(0, laneRef.current - 1); laneRef.current = n; setLane(n); };
  const moveRight = () => { const n = Math.min(2, laneRef.current + 1); laneRef.current = n; setLane(n); };

  // Keyboard
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (!started || deadRef.current) return;
      if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') moveLeft();
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') moveRight();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [started]);

  // Timer
  useEffect(() => {
    if (!started || dead) return;
    const t = setInterval(() => {
      setTimeLeft((tl) => {
        if (tl <= 1) {
          clearInterval(t);
          onEnd(scoreRef.current, Date.now() - startRef.current);
          return 0;
        }
        return tl - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [started, dead]);

  // Obstacle spawner
  useEffect(() => {
    if (!started || dead) return;
    const spawnInterval = 900;
    const t = setInterval(() => {
      if (deadRef.current) return;
      const obsLane = Math.floor(Math.random() * LANES);
      const id = obsId.current++;
      const emoji = DODGE_OBSTACLES[Math.floor(Math.random() * DODGE_OBSTACLES.length)];
      setObstacles((prev) => [...prev, { id, lane: obsLane, emoji }]);

      // Collision check after 500ms (obstacle at player row)
      setTimeout(() => {
        if (deadRef.current) return;
        if (laneRef.current === obsLane) {
          const newLives = livesRef.current - 1;
          livesRef.current = newLives;
          setLives(newLives);
          if (newLives <= 0) {
            deadRef.current = true;
            setDead(true);
            setObstacles([]);
            onEnd(scoreRef.current, Date.now() - startRef.current);
          } else {
            toast.error('Хий! ❤️ -1', { duration: 800 });
          }
        } else {
          scoreRef.current += 100;
          setScore(scoreRef.current);
        }
        setObstacles((prev) => prev.filter((o) => o.id !== id));
      }, 650);
    }, spawnInterval);
    return () => clearInterval(t);
  }, [started, dead]);

  if (!started) {
    return (
      <div className="text-center space-y-6 py-4">
        <div className="text-6xl">🥷</div>
        <div className="space-y-1">
          <p className="text-white font-black text-xl">Dodge!</p>
          <p className="text-white/40 text-sm">← → товч дарж саадаас зайлсхий</p>
          <p className="text-white/40 text-sm">3 амь • 15 секунд • dodge бүр = 100 оноо</p>
        </div>
        <button
          onClick={() => { setStarted(true); startRef.current = Date.now(); }}
          className="px-8 py-3 rounded-xl font-black text-white text-sm"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', boxShadow: '0 4px 20px rgba(168,85,247,0.4)' }}
        >
          ▶ Эхлэх
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 select-none">
      {/* HUD */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className={clsx('text-xl transition-all', i < lives ? 'opacity-100' : 'opacity-20')}>❤️</span>
          ))}
        </div>
        <span className="font-black text-white/70 text-lg">{timeLeft}s</span>
        <span className="font-black text-amber-400">⭐ {score}</span>
      </div>

      {/* Game field */}
      <div className="relative rounded-2xl overflow-hidden" style={{ height: 220, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Lane dividers */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: LANES }).map((_, i) => (
            <div key={i} className="flex-1" style={{ borderRight: i < LANES - 1 ? '1px solid rgba(255,255,255,0.06)' : undefined }} />
          ))}
        </div>

        {/* Obstacles */}
        <AnimatePresence>
          {obstacles.map((obs) => (
            <motion.div
              key={obs.id}
              initial={{ top: 0, opacity: 1 }}
              animate={{ top: '60%', opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.65, ease: 'linear' }}
              className="absolute text-2xl flex items-center justify-center"
              style={{ left: `${(obs.lane / LANES) * 100 + 100 / LANES / 2}%`, transform: 'translateX(-50%)', width: 40 }}
            >
              {obs.emoji}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Player */}
        <motion.div
          animate={{ left: `${(lane / LANES) * 100 + 100 / LANES / 2}%` }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="absolute bottom-4 text-3xl flex items-center justify-center"
          style={{ transform: 'translateX(-50%)', width: 40 }}
        >
          🥷
        </motion.div>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button
          onPointerDown={moveLeft}
          className="flex-1 py-4 rounded-xl border border-white/10 text-2xl font-black text-white/60 hover:bg-white/[0.06] active:bg-white/10 transition-all"
        >
          ←
        </button>
        <button
          onPointerDown={moveRight}
          className="flex-1 py-4 rounded-xl border border-white/10 text-2xl font-black text-white/60 hover:bg-white/[0.06] active:bg-white/10 transition-all"
        >
          →
        </button>
      </div>
    </div>
  );
}

// ─── Identify Game ────────────────────────────────────────────────────

function IdentifyGame({ gameData, onEnd }: { gameData: any; onEnd: (score: number, duration: number) => void }) {
  const questions: { emoji: string; hints: string[]; choices: string[]; correct: string }[] = gameData.questions ?? [];
  const TOTAL = questions.length;
  const TIME_PER_Q = 15;

  const [qIdx, setQIdx] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q);
  const [revealedHints, setRevealedHints] = useState(1);
  const startRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const advance = useCallback((picked: string | null) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const correct = questions[qIdx]?.correct;
    const gained = picked === correct ? 200 : 0;
    const newScore = score + gained;
    setScore(newScore);
    setChosen(picked ?? '__timeout__');

    setTimeout(() => {
      if (qIdx >= TOTAL - 1) {
        onEnd(newScore, Date.now() - startRef.current);
      } else {
        setQIdx((i) => i + 1);
        setChosen(null);
        setTimeLeft(TIME_PER_Q);
        setRevealedHints(1);
      }
    }, 1400);
  }, [qIdx, score, questions, TOTAL, onEnd]);

  // Reveal extra hints over time
  useEffect(() => {
    if (chosen !== null) return;
    const t1 = setTimeout(() => setRevealedHints(2), 5000);
    const t2 = setTimeout(() => setRevealedHints(3), 10000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [qIdx, chosen]);

  useEffect(() => {
    if (chosen !== null) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { advance(null); return TIME_PER_Q; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [qIdx, chosen]);

  const q = questions[qIdx];
  if (!q) return null;
  const pct = (timeLeft / TIME_PER_Q) * 100;

  return (
    <div className="space-y-5">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1 flex-1">
          {Array.from({ length: TOTAL }).map((_, i) => (
            <div key={i} className={clsx('h-1.5 flex-1 rounded-full transition-all duration-300',
              i < qIdx ? 'bg-cyan-400' : i === qIdx ? 'bg-white/50' : 'bg-white/10')} />
          ))}
        </div>
        <span className="text-xs font-black text-white/50">{qIdx + 1}/{TOTAL}</span>
      </div>

      {/* Timer */}
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, background: pct > 60 ? '#06b6d4' : pct > 30 ? '#f59e0b' : '#ef4444' }} />
      </div>

      {/* Character display */}
      <div className="rounded-2xl p-5 text-center" style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)' }}>
        <div className="text-5xl mb-3">{q.emoji}</div>
        <div className="space-y-2">
          {q.hints.slice(0, revealedHints).map((hint, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 text-left"
            >
              <span className="text-cyan-400/60 text-xs mt-0.5 flex-shrink-0">#{i + 1}</span>
              <p className="text-white/70 text-sm">{hint}</p>
            </motion.div>
          ))}
        </div>
        {revealedHints < 3 && chosen === null && (
          <p className="text-white/20 text-xs mt-3">{3 - revealedHints} дохио үлдлээ...</p>
        )}
      </div>

      {/* Choices */}
      <div className="grid grid-cols-2 gap-2.5">
        {q.choices.map((c) => {
          const isChosen = chosen === c;
          const isCorrect = c === q.correct;
          let cls = 'bg-white/[0.04] border-white/10 text-white/70 hover:bg-white/[0.08]';
          if (chosen !== null) {
            if (isCorrect) cls = 'bg-cyan-500/20 border-cyan-400/60 text-cyan-300';
            else if (isChosen) cls = 'bg-red-500/20 border-red-400/60 text-red-300';
            else cls = 'bg-white/[0.02] border-white/5 text-white/25';
          }
          return (
            <motion.button
              key={c}
              onClick={() => chosen === null && advance(c)}
              disabled={chosen !== null}
              whileTap={{ scale: 0.97 }}
              className={clsx('py-3 px-3 rounded-xl border text-xs font-bold text-center transition-all duration-200 leading-tight', cls)}
            >
              {chosen !== null && isCorrect && '✓ '}{chosen !== null && isChosen && !isCorrect && '✗ '}{c}
            </motion.button>
          );
        })}
      </div>

      <div className="text-center">
        <span className="text-white/40 text-xs font-bold">⭐ {score} оноо</span>
      </div>
    </div>
  );
}

// ─── Game config ──────────────────────────────────────────────────────

const GAME_CONFIG: Record<string, { icon: string; color: string; accent: string; glow: string; border: string; desc: string }> = {
  REACTION: { icon: '⚡', color: '#7c3aed', accent: '#a855f7', glow: 'rgba(168,85,247,0.35)', border: 'rgba(168,85,247,0.3)', desc: 'Хурдан рефлекс' },
  QUIZ:     { icon: '🧩', color: '#0e7490', accent: '#22d3ee', glow: 'rgba(34,211,238,0.35)',  border: 'rgba(34,211,238,0.3)',  desc: 'Anime мэдлэг' },
  DODGE:    { icon: '🥷', color: '#065f46', accent: '#34d399', glow: 'rgba(52,211,153,0.35)',  border: 'rgba(52,211,153,0.3)',  desc: 'Саадаас зайлсхий' },
  IDENTIFY: { icon: '🔍', color: '#92400e', accent: '#fbbf24', glow: 'rgba(251,191,36,0.35)',  border: 'rgba(251,191,36,0.3)',  desc: 'Дүрс таних' },
};

// ─── Main Page ────────────────────────────────────────────────────────

export default function GamesPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<GameTab>('games');
  const [activeGame, setActiveGame] = useState<any>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const gameStartTime = useRef(Date.now());

  const { data: games = [] } = useQuery({ queryKey: ['mini-games'], queryFn: gameApi.getGames });
  const { data: myStats } = useQuery({ queryKey: ['game-stats'], queryFn: gameApi.getMyStats, enabled: tab === 'stats' });
  const { data: gameLeaderboard = [] } = useQuery({
    queryKey: ['game-leaderboard'],
    queryFn: () => leaderboardApi.getMiniGame('daily'),
    enabled: tab === 'leaderboard',
    refetchInterval: 30000,
  });

  const startMutation = useMutation({
    mutationFn: (gameId: string) => gameApi.startGame(gameId),
    onSuccess: (data: any, gameId) => {
      setSessionData(data);
      const game = (games as any[]).find((g: any) => g.id === gameId);
      setActiveGame(game);
      setIsPlaying(true);
      gameStartTime.current = Date.now();
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Тоглоом эхлүүлэхэд алдаа гарлаа'),
  });

  const endMutation = useMutation({
    mutationFn: (data: { sessionToken: string; score: number; duration: number }) => gameApi.endGame(data),
    onSuccess: (result: any) => {
      setIsPlaying(false);
      setActiveGame(null);
      setSessionData(null);
      queryClient.invalidateQueries({ queryKey: ['game-stats'] });
      if (result.isValid) toast.success(result.message, { duration: 5000 });
      else toast.error(result.message);
    },
    onError: (err: any) => {
      setIsPlaying(false);
      toast.error(err.response?.data?.message ?? 'Алдаа гарлаа');
    },
  });

  const handleGameEnd = useCallback((score: number) => {
    if (!sessionData) return;
    endMutation.mutate({ sessionToken: sessionData.sessionToken, score, duration: Date.now() - gameStartTime.current });
  }, [sessionData]);

  return (
    <div className="space-y-5">

      {/* ── HEADER ── */}
      <div className="relative overflow-hidden rounded-2xl p-5"
        style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.12) 0%, rgba(6,182,212,0.08) 60%, rgba(0,0,0,0) 100%)', border: '1px solid rgba(168,85,247,0.2)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top left, rgba(168,85,247,0.12) 0%, transparent 60%)' }} />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <span className="section-pill mb-2" style={{ background: 'rgba(168,85,247,0.15)', color: '#d8b4fe', border: '1px solid rgba(168,85,247,0.3)' }}>
              🎮 GAME CENTER
            </span>
            <h1 className="text-2xl font-black text-white mt-1">Мини тоглоомууд</h1>
            <p className="text-sm text-white/40 mt-0.5">Тоглоорой → AP олоорой → PvP-д ашиглаарай</p>
          </div>
          {myStats && (
            <div className="text-center px-4 py-3 rounded-xl flex-shrink-0"
              style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
              <p className="text-2xl font-black text-amber-400 leading-none">{myStats.dailyTotal}</p>
              <p className="text-[10px] text-white/40 font-bold uppercase mt-0.5">AP өнөөдөр</p>
            </div>
          )}
        </div>
      </div>

      {/* ── ACTIVE GAME OVERLAY ── */}
      <AnimatePresence>
        {isPlaying && activeGame && sessionData && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative overflow-hidden rounded-2xl p-5"
            style={{
              background: `linear-gradient(135deg, ${GAME_CONFIG[activeGame.type]?.color ?? '#1a1a2e'}22, rgba(0,0,0,0.7))`,
              border: `1px solid ${GAME_CONFIG[activeGame.type]?.border ?? 'rgba(255,255,255,0.1)'}`,
              boxShadow: `0 0 40px ${GAME_CONFIG[activeGame.type]?.glow ?? 'transparent'}`,
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: `${GAME_CONFIG[activeGame.type]?.color ?? '#333'}33`, border: `1px solid ${GAME_CONFIG[activeGame.type]?.border}` }}>
                  {GAME_CONFIG[activeGame.type]?.icon ?? '🎮'}
                </div>
                <div>
                  <h3 className="font-black text-white text-sm">{activeGame.name}</h3>
                  <p className="text-[11px] text-white/40">Тоглоом явагдаж байна...</p>
                </div>
              </div>
              <button
                onClick={() => { setIsPlaying(false); setActiveGame(null); setSessionData(null); }}
                className="px-3 py-1.5 text-xs font-bold text-white/40 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-all"
              >
                ✕ Болих
              </button>
            </div>

            {activeGame.type === 'REACTION' && <ReactionGame gameData={sessionData.gameData} onEnd={handleGameEnd} />}
            {activeGame.type === 'QUIZ'     && <QuizGame     gameData={sessionData.gameData} onEnd={handleGameEnd} />}
            {activeGame.type === 'DODGE'    && <DodgeGame    gameData={sessionData.gameData} onEnd={handleGameEnd} />}
            {activeGame.type === 'IDENTIFY' && <IdentifyGame gameData={sessionData.gameData} onEnd={handleGameEnd} />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TABS ── */}
      <div className="flex gap-2">
        {[
          { key: 'games'       as GameTab, label: 'Тоглоомууд', icon: '🎮' },
          { key: 'leaderboard' as GameTab, label: 'Леадерборд', icon: '🏆' },
          { key: 'stats'       as GameTab, label: 'Статистик',  icon: '📊' },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={clsx('tab-pill flex items-center gap-1.5 flex-shrink-0', tab === t.key ? 'tab-pill-active' : 'tab-pill-inactive')}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── GAMES GRID ── */}
      {tab === 'games' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(games as any[]).map((game: any, i: number) => {
            const gc = GAME_CONFIG[game.type] ?? GAME_CONFIG.REACTION;
            return (
              <motion.div key={game.id}
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="relative overflow-hidden rounded-2xl p-5 group"
                style={{ background: `linear-gradient(135deg, ${gc.color}18, rgba(0,0,0,0.65))`, border: `1px solid ${gc.border}` }}
              >
                {/* BG glow blob */}
                <div className="absolute top-0 right-0 w-36 h-36 rounded-full blur-3xl pointer-events-none opacity-25"
                  style={{ background: gc.glow, transform: 'translate(40%, -40%)' }} />

                {/* Header */}
                <div className="flex items-start gap-3 mb-4 relative">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                    style={{ background: `${gc.color}30`, border: `1px solid ${gc.border}`, boxShadow: `0 0 20px ${gc.glow}` }}>
                    {gc.icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-white text-base leading-tight">{game.name}</h3>
                    <p className="text-xs text-white/40 mt-0.5 leading-snug">{game.description}</p>
                    <span className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${gc.color}25`, color: gc.accent, border: `1px solid ${gc.border}` }}>
                      {gc.desc}
                    </span>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex gap-2.5 mb-4">
                  {[
                    { label: 'AP шагнал', value: `${game.minReward}–${game.maxReward}`, color: gc.accent },
                    { label: 'Cooldown', value: `${game.cooldownMin}мин`, color: 'rgba(255,255,255,0.5)' },
                    { label: 'Өдрийн cap', value: `${game.dailyCap}`, color: 'rgba(255,255,255,0.5)' },
                  ].map((s) => (
                    <div key={s.label} className="flex-1 text-center py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <p className="text-sm font-black" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-[9px] text-white/30 font-bold uppercase mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Play button */}
                <button
                  onClick={() => startMutation.mutate(game.id)}
                  disabled={startMutation.isPending || isPlaying}
                  className="relative w-full py-3 rounded-xl font-black text-white text-sm overflow-hidden transition-all active:scale-[0.98] disabled:opacity-30"
                  style={{ background: `linear-gradient(135deg, ${gc.color}, ${gc.accent})`, boxShadow: `0 4px 20px ${gc.glow}` }}
                >
                  <span className="absolute inset-0 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-500 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <span className="relative">{startMutation.isPending ? '...' : '▶  Тоглох'}</span>
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── LEADERBOARD ── */}
      {tab === 'leaderboard' && (
        <div className="space-y-2">
          <p className="text-xs text-white/30 uppercase tracking-widest font-bold mb-4">Өнөөдрийн шилдгүүд</p>
          {(gameLeaderboard as any[]).length === 0 ? (
            <div className="text-center py-16">
              <p className="text-5xl mb-3">🎮</p>
              <p className="text-white/50 font-bold">Өнөөдөр тоглоом тоглосон хэрэглэгч байхгүй</p>
            </div>
          ) : (
            (gameLeaderboard as any[]).map((entry: any, i: number) => {
              const rc = ['#f59e0b', '#9ca3af', '#d97706'][i] ?? 'rgba(255,255,255,0.2)';
              return (
                <motion.div key={entry.userId}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 p-3.5 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                    style={{ background: `${rc}20`, border: `1px solid ${rc}50`, color: rc }}>
                    {i < 3 ? ['👑', '🥈', '🥉'][i] : `#${i + 1}`}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm truncate">{entry.username ?? 'Unknown'}</p>
                    <p className="text-[10px] text-white/35">Best: {entry._max?.score?.toLocaleString() ?? '—'}</p>
                  </div>
                  <p className="font-black text-amber-400 text-sm">{(entry._sum?.reward ?? 0).toLocaleString()} AP</p>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* ── STATS ── */}
      {tab === 'stats' && myStats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Өнөөдрийн AP', value: myStats.dailyTotal, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.25)' },
              { label: 'Тоглосон тоо',  value: myStats.recentSessions?.length ?? 0, color: '#a855f7', bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.25)' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl p-5 text-center"
                style={{ background: `linear-gradient(135deg, ${s.bg}, rgba(0,0,0,0.5))`, border: `1px solid ${s.border}` }}>
                <p className="stat-number" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs text-white/40 font-bold uppercase mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs text-white/30 uppercase tracking-widest font-bold mb-3">Сүүлийн тоглоомууд</p>
            <div className="space-y-2">
              {myStats.recentSessions?.map((s: any, i: number) => {
                const gc = GAME_CONFIG[s.game?.type] ?? GAME_CONFIG.REACTION;
                return (
                  <motion.div key={s.id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 p-3.5 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: `${gc.color}20`, border: `1px solid ${gc.border}` }}>
                      {gc.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm">{s.game?.name}</p>
                      <p className="text-[10px] text-white/35">Score: {s.score?.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-amber-400 text-sm">+{s.reward} AP</p>
                      <p className="text-[10px] text-white/30">
                        {new Date(s.createdAt).toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
