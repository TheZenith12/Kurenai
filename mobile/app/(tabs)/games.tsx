import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions,
  ScrollView, Alert, Modal, ActivityIndicator, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation } from '@tanstack/react-query';
import { gameApi, leaderboardApi } from '../../lib/api';
import { colors, spacing, radius, font } from '../../constants/theme';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');
const LANE_WIDTH = (width - spacing.md * 2) / 3;

// ─── Reaction Game (10s click speed) ──────────────────────────────────
function ReactionGame({ session, onEnd }: { session: any; onEnd: (score: number) => void }) {
  const totalSecs = Math.round((session?.gameData?.duration ?? 10000) / 1000);
  const [count, setCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(totalSecs);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const countRef = useRef(0);
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!started || done) return;
    const t = setInterval(() => {
      setTimeLeft((tl) => {
        if (tl <= 1) {
          clearInterval(t);
          setDone(true);
          setTimeout(() => onEnd(countRef.current), 600);
          return 0;
        }
        return tl - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [started, done]);

  const handleTap = () => {
    if (done) return;
    if (!started) setStarted(true);
    countRef.current += 1;
    setCount((c) => c + 1);
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, tension: 300 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 300 }),
    ]).start();
  };

  const pct = (timeLeft / totalSecs) * 100;
  const barColor = pct > 60 ? colors.success : pct > 30 ? colors.warning : colors.error;

  return (
    <View style={rg.root}>
      <View style={rg.hud}>
        <Text style={rg.timer}>⏱ {timeLeft}с</Text>
        <Text style={rg.counter}>🖱️ {count}</Text>
      </View>
      <View style={rg.barBg}>
        <View style={[rg.barFill, { width: `${pct}%` as any, backgroundColor: barColor }]} />
      </View>
      <TouchableOpacity onPress={handleTap} activeOpacity={0.85} disabled={done}>
        <Animated.View style={[rg.btn, { transform: [{ scale }] }, done && rg.btnDone]}>
          <LinearGradient colors={done ? [colors.bgElevated, colors.bgElevated] : ['#dc2626', '#7c3aed']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          {!started ? (
            <>
              <Text style={rg.bigEmoji}>⚡</Text>
              <Text style={rg.btnText}>ЭХЛЭХДЭЭ ДАР</Text>
              <Text style={rg.sub}>{totalSecs} секундэд олон дар!</Text>
            </>
          ) : !done ? (
            <>
              <Text style={rg.bigCount}>{count}</Text>
              <Text style={rg.btnText}>💥 ДАР!</Text>
            </>
          ) : (
            <>
              <Text style={rg.bigEmoji}>✅</Text>
              <Text style={rg.btnText}>{count} даралт!</Text>
            </>
          )}
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}
const rg = StyleSheet.create({
  root: { gap: spacing.lg },
  hud: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.sm },
  timer: { color: colors.text, fontWeight: '900', fontSize: font.xl },
  counter: { color: colors.primary, fontWeight: '900', fontSize: font.xxl },
  barBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  btn: { height: 220, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center', gap: 6, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  btnDone: { opacity: 0.8 },
  bigEmoji: { fontSize: 52 },
  bigCount: { fontSize: 72, fontWeight: '900', color: '#fff', lineHeight: 76 },
  btnText: { fontSize: 24, fontWeight: '900', color: '#fff', textAlign: 'center' },
  sub: { fontSize: font.sm, color: 'rgba(255,255,255,0.7)' },
});

// ─── Anime Quiz Game ──────────────────────────────────────────────────
function QuizGame({ session, onEnd }: { session: any; onEnd: (score: number) => void }) {
  const questions: { q: string; choices: string[]; correct: string }[] = session?.gameData?.questions ?? [];
  const TOTAL = questions.length;
  const TIME_PER_Q = 12;
  const [qIdx, setQIdx] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerAnim = useRef(new Animated.Value(1)).current;

  const advance = useCallback((picked: string | null) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const correct = questions[qIdx]?.correct;
    const gained = picked === correct ? 200 : 0;
    const newScore = score + gained;
    setScore(newScore);
    setChosen(picked ?? '__timeout__');
    setTimeout(() => {
      if (qIdx >= TOTAL - 1) { onEnd(newScore); return; }
      setQIdx((i) => i + 1);
      setChosen(null);
      setTimeLeft(TIME_PER_Q);
      Animated.timing(timerAnim, { toValue: 1, duration: 0, useNativeDriver: false }).start();
    }, 1200);
  }, [qIdx, score, questions, TOTAL, onEnd]);

  useEffect(() => {
    if (chosen !== null) return;
    Animated.timing(timerAnim, { toValue: 0, duration: TIME_PER_Q * 1000, useNativeDriver: false }).start();
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => { if (t <= 1) { advance(null); return TIME_PER_Q; } return t - 1; });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [qIdx, chosen]);

  const q = questions[qIdx];
  if (!q) return null;

  const barWidth = timerAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={qg.root}>
      {/* Progress dots */}
      <View style={qg.dots}>
        {Array.from({ length: TOTAL }).map((_, i) => (
          <View key={i} style={[qg.dot, i < qIdx && qg.dotDone, i === qIdx && qg.dotActive]} />
        ))}
      </View>

      {/* Timer bar */}
      <View style={qg.timerTrack}>
        <Animated.View style={[qg.timerFill, { width: barWidth as any }]} />
      </View>

      {/* Question */}
      <View style={qg.qBox}>
        <Text style={qg.qText}>{q.q}</Text>
      </View>

      {/* Choices */}
      <View style={qg.choicesWrap}>
        {q.choices.map((c) => {
          const isChosen = chosen === c;
          const isCorrect = c === q.correct;
          let bg: string = colors.bgCard;
          let borderColor: string = colors.border;
          let textColor: string = colors.text;
          if (chosen !== null) {
            if (isCorrect) { bg = 'rgba(16,185,129,0.2)'; borderColor = '#10B981'; textColor = '#6EE7B7'; }
            else if (isChosen) { bg = 'rgba(239,68,68,0.2)'; borderColor = '#EF4444'; textColor = '#FCA5A5'; }
            else { bg = 'rgba(0,0,0,0.3)'; borderColor = 'rgba(255,255,255,0.05)'; textColor = 'rgba(255,255,255,0.3)'; }
          }
          return (
            <TouchableOpacity key={c} onPress={() => chosen === null && advance(c)} activeOpacity={0.75} disabled={chosen !== null}>
              <View style={[qg.choice, { backgroundColor: bg, borderColor }]}>
                <Text style={[qg.choiceText, { color: textColor }]}>
                  {chosen !== null && isCorrect && '✓ '}{chosen !== null && isChosen && !isCorrect && '✗ '}{c}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={qg.score}>⭐ {score} оноо</Text>
    </View>
  );
}
const qg = StyleSheet.create({
  root: { gap: spacing.md },
  dots: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' },
  dot: { flex: 1, height: 5, borderRadius: 3, backgroundColor: colors.bgElevated },
  dotDone: { backgroundColor: '#8B5CF6' },
  dotActive: { backgroundColor: 'rgba(255,255,255,0.35)' },
  timerTrack: { height: 4, backgroundColor: colors.bgElevated, borderRadius: 2, overflow: 'hidden' },
  timerFill: { height: '100%', backgroundColor: '#8B5CF6', borderRadius: 2 },
  qBox: { backgroundColor: 'rgba(139,92,246,0.1)', borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: 'rgba(139,92,246,0.25)' },
  qText: { color: colors.text, fontWeight: '700', fontSize: font.md, textAlign: 'center', lineHeight: 22 },
  choicesWrap: { gap: spacing.sm },
  choice: { borderRadius: radius.md, padding: spacing.md, borderWidth: 1 },
  choiceText: { fontWeight: '700', fontSize: font.sm },
  score: { color: colors.primary, fontWeight: '800', fontSize: font.md, textAlign: 'center' },
});

// ─── Dodge Game ───────────────────────────────────────────────────────
const DODGE_EMOJIS = ['🔥', '💀', '⚡', '🗡️', '🌀', '☠️'];

function DodgeGame({ session, onEnd }: { session: any; onEnd: (score: number) => void }) {
  const DURATION = 15;
  const [lane, setLane] = useState(1);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [obstacles, setObstacles] = useState<{ id: number; lane: number; emoji: string; anim: Animated.Value }[]>([]);
  const [started, setStarted] = useState(false);
  const [dead, setDead] = useState(false);

  const laneRef = useRef(1);
  const livesRef = useRef(3);
  const scoreRef = useRef(0);
  const deadRef = useRef(false);
  const obsId = useRef(0);

  const moveLane = (dir: -1 | 1) => {
    const n = Math.max(0, Math.min(2, laneRef.current + dir));
    laneRef.current = n;
    setLane(n);
  };

  useEffect(() => {
    if (!started || dead) return;
    const t = setInterval(() => {
      setTimeLeft((tl) => {
        if (tl <= 1) { clearInterval(t); onEnd(scoreRef.current); return 0; }
        return tl - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [started, dead]);

  useEffect(() => {
    if (!started || dead) return;
    const spawnObs = () => {
      if (deadRef.current) return;
      const obsLane = Math.floor(Math.random() * 3);
      const id = obsId.current++;
      const emoji = DODGE_EMOJIS[Math.floor(Math.random() * DODGE_EMOJIS.length)];
      const anim = new Animated.Value(0);

      setObstacles((prev) => [...prev, { id, lane: obsLane, emoji, anim }]);

      Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }).start();

      setTimeout(() => {
        if (deadRef.current) return;
        if (laneRef.current === obsLane) {
          const nl = livesRef.current - 1;
          livesRef.current = nl;
          setLives(nl);
          if (nl <= 0) { deadRef.current = true; setDead(true); setObstacles([]); onEnd(scoreRef.current); }
        } else {
          scoreRef.current += 100;
          setScore(scoreRef.current);
        }
        setObstacles((prev) => prev.filter((o) => o.id !== id));
      }, 700);
    };

    const t = setInterval(spawnObs, 900);
    return () => clearInterval(t);
  }, [started, dead]);

  if (!started) {
    return (
      <View style={dg.startWrap}>
        <Text style={dg.startEmoji}>🥷</Text>
        <Text style={dg.startTitle}>Dodge!</Text>
        <Text style={dg.startDesc}>Зүүн / баруун талыг дарж саадаас зайлсхий</Text>
        <Text style={dg.startDesc}>3 амь • 15 секунд • dodge бүр = 100 оноо</Text>
        <TouchableOpacity onPress={() => setStarted(true)} activeOpacity={0.85}>
          <LinearGradient colors={['#065f46', '#10B981']} style={dg.startBtn}>
            <Text style={dg.startBtnText}>▶  Эхлэх</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={dg.root}>
      {/* HUD */}
      <View style={dg.hud}>
        <View style={dg.livesRow}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Text key={i} style={{ fontSize: 18, opacity: i < lives ? 1 : 0.2 }}>❤️</Text>
          ))}
        </View>
        <Text style={dg.timer}>{timeLeft}s</Text>
        <Text style={dg.score}>⭐ {score}</Text>
      </View>

      {/* Game field */}
      <View style={dg.field}>
        {/* Lane lines */}
        <View style={[dg.laneLine, { left: LANE_WIDTH }]} />
        <View style={[dg.laneLine, { left: LANE_WIDTH * 2 }]} />

        {/* Obstacles */}
        {obstacles.map((obs) => (
          <Animated.Text
            key={obs.id}
            style={[dg.obstacle, {
              left: obs.lane * LANE_WIDTH + LANE_WIDTH / 2 - 16,
              transform: [{ translateY: obs.anim.interpolate({ inputRange: [0, 1], outputRange: [-40, 160] }) }],
            }]}
          >
            {obs.emoji}
          </Animated.Text>
        ))}

        {/* Player */}
        <Animated.Text style={[dg.player, { left: lane * LANE_WIDTH + LANE_WIDTH / 2 - 16 }]}>
          🥷
        </Animated.Text>
      </View>

      {/* Controls */}
      <View style={dg.controls}>
        <TouchableOpacity style={dg.ctrlBtn} onPress={() => moveLane(-1)} activeOpacity={0.7}>
          <Text style={dg.ctrlText}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity style={dg.ctrlBtn} onPress={() => moveLane(1)} activeOpacity={0.7}>
          <Text style={dg.ctrlText}>→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const dg = StyleSheet.create({
  root: { gap: spacing.md },
  hud: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  livesRow: { flexDirection: 'row', gap: 4 },
  timer: { color: colors.text, fontWeight: '900', fontSize: font.xl },
  score: { color: '#F59E0B', fontWeight: '900', fontSize: font.lg },
  field: { height: 220, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', position: 'relative' },
  laneLine: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  obstacle: { position: 'absolute', fontSize: 28, top: 0 },
  player: { position: 'absolute', bottom: 16, fontSize: 28 },
  controls: { flexDirection: 'row', gap: spacing.md },
  ctrlBtn: { flex: 1, height: 64, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center' },
  ctrlText: { color: colors.text, fontSize: 28, fontWeight: '900' },
  startWrap: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
  startEmoji: { fontSize: 60 },
  startTitle: { color: colors.text, fontWeight: '900', fontSize: 28 },
  startDesc: { color: colors.textSecondary, fontSize: font.sm, textAlign: 'center' },
  startBtn: { paddingHorizontal: 40, paddingVertical: 14, borderRadius: radius.xl, marginTop: spacing.sm },
  startBtnText: { color: '#fff', fontWeight: '900', fontSize: font.lg },
});

// ─── Identify Game ────────────────────────────────────────────────────
function IdentifyGame({ session, onEnd }: { session: any; onEnd: (score: number) => void }) {
  const questions: { emoji: string; hints: string[]; choices: string[]; correct: string }[] = session?.gameData?.questions ?? [];
  const TOTAL = questions.length;
  const TIME_PER_Q = 15;
  const [qIdx, setQIdx] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q);
  const [revealedHints, setRevealedHints] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerAnim = useRef(new Animated.Value(1)).current;

  const advance = useCallback((picked: string | null) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const correct = questions[qIdx]?.correct;
    const gained = picked === correct ? 200 : 0;
    const newScore = score + gained;
    setScore(newScore);
    setChosen(picked ?? '__timeout__');
    setTimeout(() => {
      if (qIdx >= TOTAL - 1) { onEnd(newScore); return; }
      setQIdx((i) => i + 1);
      setChosen(null);
      setTimeLeft(TIME_PER_Q);
      setRevealedHints(1);
      Animated.timing(timerAnim, { toValue: 1, duration: 0, useNativeDriver: false }).start();
    }, 1400);
  }, [qIdx, score, questions, TOTAL, onEnd]);

  useEffect(() => {
    if (chosen !== null) return;
    const t1 = setTimeout(() => setRevealedHints(2), 5000);
    const t2 = setTimeout(() => setRevealedHints(3), 10000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [qIdx, chosen]);

  useEffect(() => {
    if (chosen !== null) return;
    Animated.timing(timerAnim, { toValue: 0, duration: TIME_PER_Q * 1000, useNativeDriver: false }).start();
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => { if (t <= 1) { advance(null); return TIME_PER_Q; } return t - 1; });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [qIdx, chosen]);

  const q = questions[qIdx];
  if (!q) return null;
  const barWidth = timerAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={ig.root}>
      {/* Progress */}
      <View style={ig.dots}>
        {Array.from({ length: TOTAL }).map((_, i) => (
          <View key={i} style={[ig.dot, i < qIdx && ig.dotDone, i === qIdx && ig.dotActive]} />
        ))}
      </View>

      {/* Timer */}
      <View style={ig.timerTrack}>
        <Animated.View style={[ig.timerFill, { width: barWidth as any }]} />
      </View>

      {/* Character */}
      <View style={ig.charBox}>
        <Text style={ig.charEmoji}>{q.emoji}</Text>
        <View style={ig.hintsWrap}>
          {q.hints.slice(0, revealedHints).map((hint, i) => (
            <View key={i} style={ig.hintRow}>
              <Text style={ig.hintNum}>#{i + 1}</Text>
              <Text style={ig.hintText}>{hint}</Text>
            </View>
          ))}
        </View>
        {revealedHints < 3 && chosen === null && (
          <Text style={ig.moreHints}>{3 - revealedHints} дохио үлдлээ...</Text>
        )}
      </View>

      {/* Choices 2x2 */}
      <View style={ig.grid}>
        {q.choices.map((c) => {
          const isChosen = chosen === c;
          const isCorrect = c === q.correct;
          let bg = colors.bgCard, borderColor = colors.border, textColor = colors.text;
          if (chosen !== null) {
            if (isCorrect) { bg = 'rgba(6,182,212,0.2)'; borderColor = '#06B6D4'; textColor = '#67E8F9'; }
            else if (isChosen) { bg = 'rgba(239,68,68,0.2)'; borderColor = '#EF4444'; textColor = '#FCA5A5'; }
            else { bg = 'rgba(0,0,0,0.3)'; borderColor = 'rgba(255,255,255,0.05)'; textColor = 'rgba(255,255,255,0.25)'; }
          }
          return (
            <TouchableOpacity key={c} style={ig.choiceWrap} onPress={() => chosen === null && advance(c)} activeOpacity={0.75} disabled={chosen !== null}>
              <View style={[ig.choice, { backgroundColor: bg, borderColor }]}>
                <Text style={[ig.choiceText, { color: textColor }]} numberOfLines={2}>
                  {chosen !== null && isCorrect && '✓ '}{chosen !== null && isChosen && !isCorrect && '✗ '}{c}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={ig.score}>⭐ {score} оноо</Text>
    </View>
  );
}
const ig = StyleSheet.create({
  root: { gap: spacing.md },
  dots: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' },
  dot: { flex: 1, height: 5, borderRadius: 3, backgroundColor: colors.bgElevated },
  dotDone: { backgroundColor: '#06B6D4' },
  dotActive: { backgroundColor: 'rgba(255,255,255,0.35)' },
  timerTrack: { height: 4, backgroundColor: colors.bgElevated, borderRadius: 2, overflow: 'hidden' },
  timerFill: { height: '100%', backgroundColor: '#06B6D4', borderRadius: 2 },
  charBox: { backgroundColor: 'rgba(6,182,212,0.08)', borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: 'rgba(6,182,212,0.2)', gap: spacing.sm },
  charEmoji: { fontSize: 48, textAlign: 'center' },
  hintsWrap: { gap: 6 },
  hintRow: { flexDirection: 'row', gap: 6 },
  hintNum: { color: 'rgba(6,182,212,0.5)', fontWeight: '700', fontSize: font.xs, marginTop: 2 },
  hintText: { color: colors.textSecondary, fontSize: font.sm, flex: 1, lineHeight: 18 },
  moreHints: { color: 'rgba(255,255,255,0.2)', fontSize: font.xs, textAlign: 'center', marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  choiceWrap: { width: '48%' },
  choice: { borderRadius: radius.md, padding: spacing.sm, borderWidth: 1, minHeight: 54, justifyContent: 'center' },
  choiceText: { fontWeight: '700', fontSize: font.sm, textAlign: 'center' },
  score: { color: colors.primary, fontWeight: '800', fontSize: font.md, textAlign: 'center' },
});

// ─── Game config ──────────────────────────────────────────────────────
const GAME_CONFIG = {
  REACTION: { icon: '⚡', label: 'Хурдан Дарах', desc: 'Дохиог аль болох хурдан дарна уу!', color: '#7C3AED', gradient: ['#7C3AED', '#A855F7'] as [string, string] },
  QUIZ:     { icon: '🧩', label: 'Anime Quiz',   desc: 'Anime мэдлэгээ шалгаарай',          color: '#0E7490', gradient: ['#0E7490', '#22D3EE'] as [string, string] },
  DODGE:    { icon: '🥷', label: 'Dodge!',       desc: 'Саадаас зайлсхий — 3 амь!',        color: '#065F46', gradient: ['#065F46', '#34D399'] as [string, string] },
  IDENTIFY: { icon: '🔍', label: 'Дүрс Таних',   desc: 'Дохиогоор дүрийг тааль',           color: '#92400E', gradient: ['#92400E', '#FBBF24'] as [string, string] },
} as const;

type GameType = keyof typeof GAME_CONFIG;

const GameComponent: Record<string, any> = { REACTION: ReactionGame, QUIZ: QuizGame, DODGE: DodgeGame, IDENTIFY: IdentifyGame };

// ─── Main Screen ──────────────────────────────────────────────────────
export default function GamesScreen() {
  const [activeType, setActiveType] = useState<GameType | null>(null);
  const [session, setSession] = useState<any>(null);
  const [tab, setTab] = useState(0);
  const gameStartRef = useRef(Date.now());

  const { data: games = [], isLoading: gamesLoading } = useQuery({ queryKey: ['mini-games'], queryFn: gameApi.getGames });
  const { data: lb = [], isLoading: lbLoading } = useQuery({ queryKey: ['gameLb'], queryFn: () => leaderboardApi.getMiniGame('daily') });
  const { data: myStats } = useQuery({ queryKey: ['gameStats'], queryFn: gameApi.getMyStats });

  const startMut = useMutation({
    mutationFn: (gameId: string) => gameApi.startGame(gameId),
    onSuccess: (data: any, gameId: string) => {
      const game = (games as any[]).find((g: any) => g.id === gameId);
      setSession({ ...data, gameType: game?.type });
      setActiveType(game?.type as GameType);
      gameStartRef.current = Date.now(); // session эхэлсэн бодит цаг
    },
    onError: (e: any) => Alert.alert('Алдаа', e?.response?.data?.message ?? 'Тоглоом эхлүүлэхэд алдаа'),
  });

  const endMut = useMutation({
    mutationFn: (params: any) => gameApi.endGame(params),
    onSuccess: (data: any) => {
      setActiveType(null);
      setSession(null);
      Alert.alert('🎮 Тоглоом дууслаа!', data.message ?? `+${data.reward ?? 0} AP`, [{ text: 'OK' }]);
    },
    onError: (e: any) => { setActiveType(null); setSession(null); Alert.alert('Алдаа', e?.response?.data?.message ?? 'Үр дүн хадгалахад алдаа гарлаа'); },
  });

  const handleGameEnd = useCallback((score: number) => {
    if (!session) return;
    // Серверийн session-той таарах бодит өнгөрсөн хугацаа
    endMut.mutate({ sessionToken: session.sessionToken, score, duration: Date.now() - gameStartRef.current });
  }, [session]);

  const ActiveComp = activeType ? GameComponent[activeType] : null;

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>🎮 Game Center</Text>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {['Тоглоомууд', 'Жагсаалт', 'Стат'].map((t, i) => (
          <TouchableOpacity key={t} onPress={() => setTab(i)} style={[s.tab, tab === i && s.tabActive]}>
            {tab === i && <LinearGradient colors={colors.gradient} style={StyleSheet.absoluteFill} />}
            <Text style={[s.tabText, tab === i && s.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Active Game Modal */}
      <Modal visible={!!activeType} animationType="slide">
        <View style={s.modal}>
          <LinearGradient colors={['#0A0A0F', '#120A22']} style={StyleSheet.absoluteFill} />
          <SafeAreaView edges={['top']} style={{ flex: 1 }}>
            <View style={s.modalHeader}>
              {activeType && (
                <View style={s.modalTitleWrap}>
                  <Text style={s.modalIcon}>{GAME_CONFIG[activeType].icon}</Text>
                  <Text style={s.modalTitle}>{GAME_CONFIG[activeType].label}</Text>
                </View>
              )}
              <TouchableOpacity onPress={() => { setActiveType(null); setSession(null); }}>
                <Text style={s.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={s.modalBody} showsVerticalScrollIndicator={false}>
              {ActiveComp && session && <ActiveComp session={session} onEnd={handleGameEnd} />}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Games grid */}
        {tab === 0 && (
          <View style={s.grid}>
            {gamesLoading && <ActivityIndicator color={colors.primary} />}
            {(games as any[]).map((game: any) => {
              const cfg = GAME_CONFIG[game.type as GameType];
              if (!cfg) return null;
              return (
                <TouchableOpacity
                  key={game.id}
                  onPress={() => startMut.mutate(game.id)}
                  disabled={startMut.isPending}
                  activeOpacity={0.8}
                  style={s.card}
                >
                  <LinearGradient colors={[cfg.color + '22', cfg.color + '08']} style={s.cardInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <View style={[s.cardIconWrap, { backgroundColor: cfg.color + '30', borderColor: cfg.color + '50' }]}>
                      <Text style={s.cardIcon}>{cfg.icon}</Text>
                    </View>
                    <Text style={s.cardName}>{cfg.label}</Text>
                    <Text style={s.cardDesc}>{game.description}</Text>
                    <View style={s.cardStats}>
                      <View style={s.cardStat}>
                        <Text style={[s.cardStatVal, { color: cfg.gradient[1] }]}>{game.minReward}–{game.maxReward}</Text>
                        <Text style={s.cardStatLbl}>AP</Text>
                      </View>
                      <View style={s.cardStat}>
                        <Text style={s.cardStatVal}>{game.cooldownMin}</Text>
                        <Text style={s.cardStatLbl}>мин</Text>
                      </View>
                    </View>
                    <LinearGradient colors={cfg.gradient} style={s.playBtn}>
                      <Text style={s.playBtnText}>{startMut.isPending ? '...' : '▶  Тоглох'}</Text>
                    </LinearGradient>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Leaderboard */}
        {tab === 1 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>🏆 Өдрийн жагсаалт</Text>
            {lbLoading && <ActivityIndicator color={colors.primary} />}
            {(lb as any[]).map((entry: any, i) => {
              const medal = ['👑', '🥈', '🥉'][i] ?? `#${i + 1}`;
              return (
                <View key={entry.userId ?? i} style={s.lbItem}>
                  <Text style={s.lbMedal}>{medal}</Text>
                  <LinearGradient colors={colors.gradient} style={s.lbAvatar}>
                    <Text style={s.lbAvatarText}>{entry.username?.[0]?.toUpperCase() ?? '?'}</Text>
                  </LinearGradient>
                  <Text style={s.lbName}>{entry.username ?? 'Unknown'}</Text>
                  <Text style={s.lbScore}>{(entry._sum?.reward ?? 0)} AP</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Stats */}
        {tab === 2 && myStats && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>📊 Миний стат</Text>
            {[
              { label: 'Өнөөдрийн AP', value: myStats.dailyTotal ?? 0 },
              { label: 'Нийт тоглосон', value: myStats.recentSessions?.length ?? 0 },
            ].map((st) => (
              <View key={st.label} style={s.statCard}>
                <Text style={s.statVal}>{st.value}</Text>
                <Text style={s.statLbl}>{st.label}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backText: { color: colors.text, fontSize: 22 },
  title: { color: colors.text, fontWeight: '800', fontSize: font.xl },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', overflow: 'hidden' },
  tabActive: {},
  tabText: { color: colors.textSecondary, fontSize: font.sm, fontWeight: '600' },
  tabTextActive: { color: '#fff', fontWeight: '800' },
  scroll: { padding: spacing.md, paddingBottom: 40 },
  grid: { gap: spacing.md },
  card: { borderRadius: radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  cardInner: { padding: spacing.lg, gap: spacing.sm },
  cardIconWrap: { width: 52, height: 52, borderRadius: radius.lg, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  cardIcon: { fontSize: 26 },
  cardName: { color: colors.text, fontWeight: '900', fontSize: font.xl },
  cardDesc: { color: colors.textSecondary, fontSize: font.sm, lineHeight: 18 },
  cardStats: { flexDirection: 'row', gap: spacing.sm, marginTop: 4 },
  cardStat: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: radius.md, padding: spacing.sm, alignItems: 'center' },
  cardStatVal: { color: colors.text, fontWeight: '800', fontSize: font.md },
  cardStatLbl: { color: colors.textSecondary, fontSize: font.xs, marginTop: 2 },
  playBtn: { borderRadius: radius.md, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  playBtnText: { color: '#fff', fontWeight: '900', fontSize: font.md },
  modal: { flex: 1, backgroundColor: 'transparent' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  modalIcon: { fontSize: 22 },
  modalTitle: { color: colors.text, fontWeight: '800', fontSize: font.xl },
  closeBtn: { color: colors.textSecondary, fontSize: 22, padding: 4 },
  modalBody: { padding: spacing.md, paddingBottom: 40 },
  section: { gap: spacing.sm },
  sectionTitle: { color: colors.textSecondary, fontSize: font.xs, fontWeight: '700', letterSpacing: 2, marginBottom: spacing.sm, textTransform: 'uppercase' },
  lbItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  lbMedal: { fontSize: 18, width: 28 },
  lbAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  lbAvatarText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  lbName: { flex: 1, color: colors.text, fontWeight: '600' },
  lbScore: { color: colors.primary, fontWeight: '800' },
  statCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: colors.border },
  statVal: { color: colors.primary, fontWeight: '900', fontSize: font.xl },
  statLbl: { color: colors.textSecondary },
});
