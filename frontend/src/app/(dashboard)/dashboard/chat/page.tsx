'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { mn } from 'date-fns/locale';
import { socketManager } from '../../../../lib/socket';
import { useChatStore } from '../../../../store/chat.store';
import { useAuthStore } from '../../../../store/auth.store';
import { chatApi, attackApi, characterApi } from '../../../../lib/api';
import clsx from 'clsx';
import toast from 'react-hot-toast';


const BACKEND = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3001';
const toAbsolute = (url: string) =>
  url && !url.startsWith('http') ? `${BACKEND}${url}` : url;

// ─── Skill effect → username glow ───────────────────────────────────────────
const EFFECT_STYLE: Record<string, string> = {
  FIRE:      'text-orange-400 [text-shadow:0_0_8px_rgba(255,100,0,0.95),0_0_16px_rgba(255,60,0,0.5)]',
  LIGHTNING: 'text-yellow-300 [text-shadow:0_0_8px_rgba(255,220,0,0.95),0_0_16px_rgba(255,200,0,0.5)]',
  DARK:      'text-purple-400 [text-shadow:0_0_8px_rgba(160,0,255,0.95),0_0_16px_rgba(100,0,200,0.5)]',
  WATER:     'text-blue-400  [text-shadow:0_0_8px_rgba(0,180,255,0.95),0_0_16px_rgba(0,120,255,0.5)]',
  WIND:      'text-green-400 [text-shadow:0_0_8px_rgba(80,255,100,0.95),0_0_16px_rgba(50,200,80,0.5)]',
  SPIRIT:    'text-pink-400  [text-shadow:0_0_8px_rgba(255,100,200,0.95),0_0_16px_rgba(230,0,180,0.5)]',
  RASENGAN:  'text-cyan-300  [text-shadow:0_0_8px_rgba(0,240,255,0.95),0_0_16px_rgba(0,200,220,0.5)]',
  SHARINGAN: 'text-red-500   [text-shadow:0_0_8px_rgba(220,0,0,0.95),0_0_16px_rgba(180,0,0,0.5)]',
  ICE:       'text-sky-200   [text-shadow:0_0_8px_rgba(150,220,255,0.95),0_0_16px_rgba(100,180,255,0.5)]',
  LIGHT:     'text-yellow-100 [text-shadow:0_0_8px_rgba(255,255,180,0.95),0_0_16px_rgba(255,240,100,0.5)]',
  EARTH:     'text-amber-600 [text-shadow:0_0_8px_rgba(200,120,0,0.80)]',
  VOID:      'text-gray-300  [text-shadow:0_0_8px_rgba(150,150,200,0.80)]',
};

const EFFECT_BADGE: Record<string, string> = {
  FIRE: '🔥', LIGHTNING: '⚡', DARK: '🌑', WATER: '💧', WIND: '🌪️',
  SPIRIT: '💗', RASENGAN: '🌀', SHARINGAN: '👁️', ICE: '❄️',
  LIGHT: '✨', EARTH: '🪨', VOID: '🕳️',
};

// ─── Quick Attack Modal ──────────────────────────────────────────────────────
function QuickAttackModal({
  target, onClose,
}: { target: { id: string; username: string }; onClose: () => void }) {
  const { data: myChars = [] } = useQuery({
    queryKey: ['my-characters'],
    queryFn: characterApi.getMyCharacters,
  });
  const [selectedSkill, setSelectedSkill] = useState<string>('');

  const activeChar = (myChars as any[]).find((c: any) => c.isActive);
  const skills = activeChar?.character?.skills ?? [];

  const attackMut = useMutation({
    mutationFn: () => attackApi.attack(target.id, selectedSkill),
    onSuccess: (res: any) => {
      toast.success(`⚔️ ${res.damageDealt} damage! ${res.message ?? ''}`);
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Дайрлахад алдаа гарлаа'),
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.85, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-primary/30 rounded-2xl p-5 w-full max-w-sm shadow-2xl"
      >
        <h3 className="font-black text-lg mb-1">⚔️ Дайрлах</h3>
        <p className="text-sm text-muted-foreground mb-4">
          <span className="text-foreground font-medium">{target.username}</span>-г дайрна
        </p>

        {skills.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Skill байхгүй байна</p>
        ) : (
          <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
            {skills.map((skill: any) => {
              const fx = EFFECT_BADGE[skill.effectType] ?? '⚡';
              return (
                <button
                  key={skill.id}
                  onClick={() => setSelectedSkill(skill.id)}
                  className={clsx(
                    'w-full text-left px-3 py-2.5 rounded-xl border transition-all text-sm',
                    selectedSkill === skill.id
                      ? 'border-primary/60 bg-primary/20 text-primary'
                      : 'border-border bg-surface-2 hover:border-primary/30',
                  )}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{fx} {skill.name} {skill.isUltimate && '⚡'}</span>
                    <span className="text-xs text-muted-foreground">
                      {skill.damageMin}–{skill.damageMax} dmg
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{skill.energyCost} energy · {skill.cooldownSeconds}s</p>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => attackMut.mutate()}
            disabled={!selectedSkill || attackMut.isPending}
            className="flex-1 py-2.5 bg-gradient-to-r from-red-600/80 to-orange-600/80 text-white rounded-xl font-bold text-sm hover:from-red-500/80 hover:to-orange-500/80 disabled:opacity-40 transition-all active:scale-95"
          >
            {attackMut.isPending ? '...' : '⚔️ Дайрлах!'}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 border border-border rounded-xl text-sm hover:bg-surface-2 transition-colors">
            Болих
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Message bubble ──────────────────────────────────────────────────────────
const QUICK_REACTIONS = ['🔥','❤️','😂','👍','💀','⚔️','🌀','👁️'];

function MessageBubble({
  msg, isOwn, isFirst, isLast, onAttack, onDM, onProfile, onReply, onReact, reactions, currentUserId, hasBg,
}: {
  msg: any; isOwn: boolean; isFirst: boolean; isLast: boolean;
  onAttack: (u: { id: string; username: string }) => void;
  onDM: (u: { id: string; username: string }) => void;
  onProfile: (userId: string) => void;
  onReply: (msg: any) => void;
  onReact: (messageId: string, emoji: string) => void;
  reactions: Record<string, string[]>;
  currentUserId: string;
  hasBg: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const meta = msg.metadata as any ?? {};
  const avatarUrl = meta.avatarUrl ? toAbsolute(meta.avatarUrl) : '';
  const skillEffect: string = meta.skillEffect ?? '';
  const nameStyle = EFFECT_STYLE[skillEffect] ?? 'text-foreground/90';
  const effectBadge = EFFECT_BADGE[skillEffect];
  const isImage = meta.type === 'image';
  const replyTo = meta.replyTo as { id: string; username: string; content: string } | undefined;
  const totalReactions = Object.values(reactions).reduce((s, arr) => s + arr.length, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.15 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={clsx(
        'flex gap-2 items-end group relative',
        isOwn ? 'flex-row-reverse' : 'flex-row',
        isFirst && 'mt-4',
        !isFirst && 'mt-0.5',
      )}
    >
      {/* Avatar — profile рүү очих */}
      {!isOwn && (
        <div className="w-8 flex-shrink-0 self-end">
          {isLast && (
            <button
              onClick={() => onProfile(msg.senderId)}
              title={`${msg.username}-ийн профайл`}
              className="w-8 h-8 rounded-full bg-surface-2 border-2 border-border overflow-hidden hover:border-primary/70 hover:scale-110 transition-all active:scale-95"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={msg.username} className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold bg-primary/15 text-primary">
                  {msg.username?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
            </button>
          )}
        </div>
      )}

      <div className={clsx('flex flex-col max-w-[72%] sm:max-w-[60%]', isOwn ? 'items-end' : 'items-start')}>
        {/* Name row */}
        {isFirst && !isOwn && (
          <div className="flex flex-wrap items-center gap-1.5 mb-1 px-0.5">
            <button
              onClick={() => onProfile(msg.senderId)}
              className={clsx('text-xs font-black leading-none hover:underline underline-offset-2 transition-opacity hover:opacity-80', nameStyle)}
            >
              {effectBadge && <span className="mr-0.5">{effectBadge}</span>}
              {msg.username}
            </button>
            {meta.characterName && (
              <span className="text-[10px] bg-surface-2 border border-border px-2 py-0.5 rounded-full text-muted-foreground leading-none">
                🎭 {meta.characterName}
                {meta.animeName && <span className="opacity-60"> · {meta.animeName}</span>}
              </span>
            )}
          </div>
        )}

        {/* Bubble */}
        <div className={clsx(
          'relative text-sm leading-relaxed break-words',
          isImage ? 'p-1' : 'px-3.5 py-2.5',
          isOwn
            ? ['bg-gradient-to-br from-primary to-primary/75 text-white shadow-md shadow-primary/20',
               'rounded-2xl', isFirst && 'rounded-tr-md', isLast && 'rounded-br-sm']
            : ['bg-surface-2 border border-border text-foreground',
               'rounded-2xl', isFirst && 'rounded-tl-md', isLast && 'rounded-bl-sm'],
        )}>
          {/* Reply quote */}
          {replyTo && (
            <div className={clsx(
              'px-2 py-1.5 mb-1 rounded-lg border-l-2 text-xs opacity-80',
              isOwn ? 'border-white/40 bg-white/10' : 'border-primary/50 bg-primary/8',
            )}>
              <p className="font-bold text-primary/80 truncate">{replyTo.username}</p>
              <p className="text-muted-foreground truncate">{replyTo.content}</p>
            </div>
          )}

          {isImage ? (
            <img
              src={toAbsolute(msg.content)}
              alt="image"
              className="max-w-[220px] max-h-[280px] rounded-xl object-contain cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(toAbsolute(msg.content), '_blank')}
            />
          ) : (
            <span className="whitespace-pre-wrap">{msg.content}</span>
          )}
        </div>

        {/* Reactions display */}
        {totalReactions > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 px-0.5">
            {Object.entries(reactions).map(([emoji, users]) =>
              users.length > 0 ? (
                <button key={emoji}
                  onClick={() => onReact(msg.id, emoji)}
                  className={clsx(
                    'flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-xs transition-all',
                    users.includes(currentUserId)
                      ? 'bg-primary/20 border-primary/40 text-primary'
                      : 'bg-surface-2 border-border text-muted-foreground hover:border-primary/30',
                  )}
                >
                  {emoji} <span>{users.length}</span>
                </button>
              ) : null
            )}
          </div>
        )}

        {isLast && (
          <span className="text-[10px] text-muted-foreground/50 mt-0.5 px-0.5">
            {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: mn })}
          </span>
        )}
      </div>

      {/* Hover actions */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.1 }}
            className={clsx(
              'absolute flex items-center gap-1 z-10',
              isOwn ? 'left-0 bottom-0' : 'right-0 bottom-0',
            )}
          >
            {/* Quick reactions */}
            {showEmojiPicker && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex gap-1 bg-surface border border-border rounded-xl px-2 py-1.5 shadow-xl mr-1"
              >
                {QUICK_REACTIONS.map(e => (
                  <button key={e} onClick={() => { onReact(msg.id, e); setShowEmojiPicker(false); }}
                    className="text-base hover:scale-125 transition-transform active:scale-90">
                    {e}
                  </button>
                ))}
              </motion.div>
            )}
            <button
              onClick={() => setShowEmojiPicker(v => !v)}
              className="w-7 h-7 bg-surface border border-border rounded-lg flex items-center justify-center text-sm hover:bg-surface-2 shadow transition-colors"
            >😊</button>
            <button
              onClick={() => onReply(msg)}
              className="px-2 py-1 bg-surface border border-border text-foreground rounded-lg text-xs hover:bg-surface-2 shadow transition-colors active:scale-95"
            >↩</button>
            {!isOwn && (
              <button
                onClick={() => onDM({ id: msg.senderId, username: msg.username })}
                className="px-2 py-1 bg-surface border border-border text-foreground rounded-lg text-xs hover:bg-surface-2 shadow transition-colors active:scale-95"
              >💬</button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Skill Effect Configs ────────────────────────────────────────────────────
const SKILL_EFFECTS: Record<string, {
  bg: string; ring: string; particle: string; label: string; duration: number;
}> = {
  FIRE:      { bg:'rgba(255,60,0,0.18)',   ring:'#ff4500', particle:'#ff8c00', label:'🔥 FIRE',      duration:2200 },
  LIGHTNING: { bg:'rgba(255,220,0,0.18)',  ring:'#fde047', particle:'#fbbf24', label:'⚡ LIGHTNING', duration:1800 },
  DARK:      { bg:'rgba(100,0,200,0.20)',  ring:'#7c3aed', particle:'#a78bfa', label:'🌑 DARK',      duration:2500 },
  WATER:     { bg:'rgba(0,150,255,0.18)',  ring:'#38bdf8', particle:'#7dd3fc', label:'💧 WATER',     duration:2000 },
  WIND:      { bg:'rgba(80,255,100,0.15)', ring:'#4ade80', particle:'#86efac', label:'🌪️ WIND',      duration:1800 },
  RASENGAN:  { bg:'rgba(0,220,255,0.18)',  ring:'#22d3ee', particle:'#67e8f9', label:'🌀 RASENGAN',  duration:2400 },
  SHARINGAN: { bg:'rgba(200,0,0,0.22)',    ring:'#dc2626', particle:'#f87171', label:'👁️ SHARINGAN', duration:2600 },
  ICE:       { bg:'rgba(100,200,255,0.18)',ring:'#bae6fd', particle:'#e0f2fe', label:'❄️ ICE',       duration:2200 },
  LIGHT:     { bg:'rgba(255,255,150,0.18)',ring:'#fef08a', particle:'#fefce8', label:'✨ LIGHT',     duration:1600 },
  SPIRIT:    { bg:'rgba(255,100,200,0.18)',ring:'#f472b6', particle:'#fbcfe8', label:'💗 SPIRIT',    duration:2000 },
  VOID:      { bg:'rgba(50,50,80,0.28)',   ring:'#6b7280', particle:'#9ca3af', label:'🕳️ VOID',      duration:3000 },
  EARTH:     { bg:'rgba(180,100,0,0.20)',  ring:'#d97706', particle:'#fbbf24', label:'🪨 EARTH',     duration:2200 },
};

// ─── Skill Effect Overlay ────────────────────────────────────────────────────
function SkillEffectOverlay({ effectType, skillName, onDone }: {
  effectType: string; skillName: string; onDone: () => void;
}) {
  const cfg = SKILL_EFFECTS[effectType] ?? SKILL_EFFECTS.FIRE;
  const isGomu = /gomu|pistol|rifle|bazooka|gatling/i.test(skillName);
  const isRasengan = effectType === 'RASENGAN' || /rasengan/i.test(skillName);
  const isSharingan = effectType === 'SHARINGAN' || /sharingan|mangekyou/i.test(skillName);
  const isChidori = /chidori|raikiri/i.test(skillName);
  const isKamehameha = /kamehameha|kame/i.test(skillName);

  const particles = Array.from({ length: 24 }, (_, i) => i);

  useEffect(() => {
    const t = setTimeout(onDone, cfg.duration + 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none overflow-hidden"
      style={{ background: cfg.bg }}
    >
      {/* ── GOMU GOMU — stretching rubber arm ── */}
      {isGomu && (
        <>
          {/* Arm body stretching from left */}
          <motion.div
            initial={{ scaleX: 0, x: '-50vw' }}
            animate={{ scaleX: [0, 1, 1.3, 1, 0], x: ['-50vw', '0vw', '15vw', '5vw', '-50vw'] }}
            transition={{ duration: 1.2, times: [0, 0.35, 0.55, 0.75, 1], ease: 'easeInOut' }}
            style={{
              position: 'absolute', top: '50%', left: '0',
              width: '60vw', height: '28px',
              background: 'linear-gradient(90deg, #fb923c, #fbbf24)',
              borderRadius: '14px', transformOrigin: 'left center',
              boxShadow: '0 0 20px rgba(251,146,60,0.7)',
              marginTop: '-14px',
            }}
          />
          {/* Fist */}
          <motion.div
            initial={{ x: '-80vw', scale: 0.5 }}
            animate={{ x: ['-80vw', '20vw', '35vw', '20vw', '-80vw'], scale: [0.5, 1.2, 1.5, 1.2, 0] }}
            transition={{ duration: 1.2, times: [0, 0.35, 0.55, 0.75, 1] }}
            style={{
              position: 'absolute', top: '50%',
              width: '64px', height: '64px', marginTop: '-32px',
              background: 'radial-gradient(circle at 35% 35%, #fbbf24, #f97316)',
              borderRadius: '40% 50% 50% 40%',
              boxShadow: '0 0 30px rgba(251,146,60,0.9), inset -4px -4px 8px rgba(0,0,0,0.3)',
              border: '3px solid rgba(0,0,0,0.5)',
            }}
          />
          {/* Impact flash */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 3, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 0.4, delay: 0.5 }}
            style={{
              position: 'absolute',
              width: '120px', height: '120px',
              background: 'radial-gradient(circle, #fff 0%, #fbbf24 40%, transparent 70%)',
              borderRadius: '50%',
            }}
          />
          {/* Impact lines */}
          {[0,45,90,135,180,225,270,315].map((deg, i) => (
            <motion.div key={i}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: [0, 1, 0], opacity: [0, 1, 0] }}
              transition={{ duration: 0.5, delay: 0.48 + i * 0.01 }}
              style={{
                position: 'absolute', width: '80px', height: '4px',
                background: '#fbbf24', borderRadius: '2px',
                transformOrigin: 'left center',
                transform: `rotate(${deg}deg)`,
                boxShadow: '0 0 8px #f97316',
              }}
            />
          ))}
        </>
      )}

      {/* ── RASENGAN — spinning sphere ── */}
      {isRasengan && (
        <>
          {[0,1,2].map(i => (
            <motion.div key={i}
              initial={{ rotate: 0, scale: 0, opacity: 0.9 }}
              animate={{ rotate: i % 2 === 0 ? 720 : -720, scale: [0, 1.4, 2.5], opacity: [0.9, 0.7, 0] }}
              transition={{ duration: 2, delay: i * 0.15, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                width: `${100 + i * 60}px`, height: `${100 + i * 60}px`,
                borderRadius: '50%',
                border: `${3 - i}px solid ${cfg.ring}`,
                boxShadow: `0 0 20px ${cfg.ring}`,
              }}
            />
          ))}
          {/* Core sphere */}
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: [0, 1.6, 1.2, 0], rotate: [0, 360, 720] }}
            transition={{ duration: 2 }}
            style={{
              position: 'absolute', width: '80px', height: '80px', borderRadius: '50%',
              background: `radial-gradient(circle at 30% 30%, #fff, ${cfg.ring}, #0891b2)`,
              boxShadow: `0 0 40px ${cfg.ring}, 0 0 80px ${cfg.ring}88`,
            }}
          />
          {/* Orbiting dots */}
          {Array.from({ length: 8 }, (_, i) => (
            <motion.div key={i}
              initial={{ rotate: i * 45, opacity: 1 }}
              animate={{ rotate: i * 45 + 720, opacity: [1, 1, 0] }}
              transition={{ duration: 1.8, ease: 'easeOut' }}
              style={{ position: 'absolute', width: '120px', height: '120px' }}
            >
              <div style={{
                position: 'absolute', top: 0, left: '50%',
                width: '10px', height: '10px', borderRadius: '50%',
                background: cfg.particle, boxShadow: `0 0 8px ${cfg.ring}`,
                transform: 'translateX(-50%)',
              }} />
            </motion.div>
          ))}
        </>
      )}

      {/* ── SHARINGAN — tomoe eye ── */}
      {isSharingan && (
        <>
          {/* Iris */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.5, 1.2, 3], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 2.5 }}
            style={{
              position: 'absolute', width: '160px', height: '160px', borderRadius: '50%',
              background: 'radial-gradient(circle, #7f1d1d 0%, #dc2626 40%, #991b1b 70%, #450a0a 100%)',
              boxShadow: '0 0 60px rgba(220,38,38,0.9), 0 0 120px rgba(220,38,38,0.5)',
            }}
          />
          {/* Pupil */}
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: [0, 1, 0.8, 2.5], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 2.5, delay: 0.1 }}
            style={{
              position: 'absolute', width: '50px', height: '70px',
              background: '#0a0000', borderRadius: '50%',
              boxShadow: '0 0 20px rgba(0,0,0,0.8)',
            }}
          />
          {/* 3 Tomoe spinning */}
          {[0, 120, 240].map((deg, i) => (
            <motion.div key={i}
              initial={{ rotate: deg, opacity: 0 }}
              animate={{ rotate: [deg, deg + 360, deg + 720], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 2.5, times: [0, 0.2, 0.7, 1] }}
              style={{ position: 'absolute', width: '140px', height: '140px' }}
            >
              <div style={{
                position: 'absolute', top: '8px', left: '50%',
                width: '22px', height: '30px',
                background: '#0a0000', borderRadius: '50% 50% 40% 40%',
                transform: 'translateX(-50%)',
                boxShadow: '0 0 8px rgba(0,0,0,0.6)',
              }} />
            </motion.div>
          ))}
          {/* Outer ring */}
          <motion.div
            initial={{ scale: 0, opacity: 0.9 }} animate={{ scale: [0, 2, 4], opacity: [0.9, 0.5, 0] }}
            transition={{ duration: 2.5 }}
            style={{
              position: 'absolute', width: '180px', height: '180px', borderRadius: '50%',
              border: '3px solid #dc2626', boxShadow: '0 0 24px #dc2626',
            }}
          />
        </>
      )}

      {/* ── CHIDORI — lightning hand ── */}
      {isChidori && !isSharingan && (
        <>
          <motion.div
            initial={{ x: '100vw', rotate: -15 }}
            animate={{ x: ['100vw', '10vw', '-5vw', '-100vw'], rotate: [-15, -10, -5, 0] }}
            transition={{ duration: 1.5, ease: [0.2, 0, 0.8, 1] }}
            style={{ position: 'absolute' }}
          >
            <div style={{
              width: '180px', height: '180px', borderRadius: '40% 60% 55% 45%',
              background: 'radial-gradient(circle at 40% 40%, #fff, #fde047, #ca8a04)',
              boxShadow: '0 0 60px #fde04790, 0 0 120px #ca8a0450',
              position: 'relative',
            }}>
              {/* Lightning sparks */}
              {[0,30,60,90,120,150].map((a,i) => (
                <motion.div key={i}
                  animate={{ opacity: [0,1,0,1,0], scaleX: [0.5,1,0.5,1,0.5] }}
                  transition={{ duration: 0.15, repeat: 10, delay: i * 0.02 }}
                  style={{
                    position: 'absolute', top: '50%', left: '50%',
                    width: '40px', height: '2px',
                    background: '#fff',
                    transformOrigin: 'left center',
                    transform: `rotate(${a}deg) translateY(-1px)`,
                  }}
                />
              ))}
            </div>
          </motion.div>
        </>
      )}

      {/* ── KAMEHAMEHA — energy beam ── */}
      {isKamehameha && (
        <>
          {/* Charging orb */}
          <motion.div
            initial={{ scale: 0, x: '-20vw', y: '15vh' }}
            animate={{ scale: [0, 1.5, 1, 0], x: ['-20vw', '-20vw', '-20vw', '0vw'], y: ['15vh', '15vh', '15vh', '0vh'] }}
            transition={{ duration: 2.2, times: [0, 0.3, 0.5, 0.7] }}
            style={{
              position: 'absolute', width: '80px', height: '80px', borderRadius: '50%',
              background: 'radial-gradient(circle, #fff 0%, #60a5fa 40%, #1d4ed8 80%)',
              boxShadow: '0 0 60px #3b82f6, 0 0 120px #1d4ed8',
            }}
          />
          {/* Beam */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0, x: '-20vw', y: '0' }}
            animate={{ scaleX: [0, 0, 1, 1, 0], opacity: [0, 0, 1, 1, 0], x: ['-20vw', '-20vw', '0', '20vw', '150vw'] }}
            transition={{ duration: 2.2, times: [0, 0.48, 0.55, 0.7, 1] }}
            style={{
              position: 'absolute', width: '120vw', height: '60px',
              background: 'linear-gradient(90deg, #1d4ed8, #60a5fa, #fff, #60a5fa)',
              transformOrigin: 'left center',
              boxShadow: '0 0 40px #3b82f6, 0 0 80px #1d4ed880',
              borderRadius: '30px',
            }}
          />
        </>
      )}

      {/* ── DEFAULT — expanding rings + particles ── */}
      {!isGomu && !isRasengan && !isSharingan && !isChidori && !isKamehameha && (
        <>
          {[0, 0.18, 0.38].map((delay, i) => (
            <motion.div key={i}
              initial={{ scale: 0, opacity: 0.9 }}
              animate={{ scale: 4 + i * 2, opacity: 0 }}
              transition={{ duration: cfg.duration / 1000 * 0.8, delay, ease: 'easeOut' }}
              style={{
                position: 'absolute', width: '160px', height: '160px', borderRadius: '50%',
                border: `${4 - i}px solid ${cfg.ring}`, boxShadow: `0 0 20px ${cfg.ring}`,
              }}
            />
          ))}
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: [0, 1.8, 0], opacity: [1, 0.8, 0] }}
            transition={{ duration: cfg.duration / 1000 * 0.7 }}
            style={{
              position: 'absolute', width: '140px', height: '140px', borderRadius: '50%',
              background: `radial-gradient(circle, ${cfg.ring}ee 0%, transparent 70%)`,
            }}
          />
          {particles.map((i) => {
            const angle = (i / particles.length) * Math.PI * 2;
            const dist = 130 + (i % 5) * 40;
            return (
              <motion.div key={i}
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, opacity: 0, scale: 0 }}
                transition={{ duration: cfg.duration / 1000 * 0.7, delay: i * 0.01, ease: 'easeOut' }}
                style={{
                  position: 'absolute', width: '10px', height: '10px', borderRadius: '50%',
                  background: cfg.particle, boxShadow: `0 0 8px ${cfg.particle}`,
                }}
              />
            );
          })}
        </>
      )}

      {/* Skill name label */}
      <motion.div
        initial={{ scale: 0.2, opacity: 0, y: 30 }}
        animate={{ scale: [0.2, 1.3, 1, 1, 0.8], opacity: [0, 1, 1, 1, 0], y: [30, 0, 0, 0, -40] }}
        transition={{ duration: cfg.duration / 1000, times: [0, 0.2, 0.4, 0.75, 1] }}
        style={{ position: 'absolute', bottom: '15%', textAlign: 'center' }}
      >
        <p style={{
          fontFamily: 'var(--font-bangers)', fontSize: 'clamp(2rem, 7vw, 3.5rem)',
          letterSpacing: '0.1em', color: cfg.ring,
          filter: `drop-shadow(0 0 20px ${cfg.ring}) drop-shadow(0 0 40px ${cfg.ring}66)`,
          WebkitTextStroke: '2px rgba(0,0,0,0.7)',
        }}>
          {skillName}
        </p>
      </motion.div>

      {/* Screen flash */}
      <motion.div
        initial={{ opacity: 0.5 }} animate={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        style={{ position: 'absolute', inset: 0, background: cfg.ring + '55' }}
      />
    </motion.div>
  );
}

// ─── Skill Selector Modal ────────────────────────────────────────────────────
function SkillSelectorModal({
  onSelect, onClose,
}: { onSelect: (effectType: string, name: string) => void; onClose: () => void }) {
  const { data: myChars = [] } = useQuery({
    queryKey: ['my-characters'],
    queryFn: characterApi.getMyCharacters,
  });
  const activeChar = (myChars as any[]).find((c: any) => c.isActive);
  const skills = activeChar?.character?.skills ?? [];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'rgba(5,0,12,0.97)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div className="p-4 border-b border-white/8">
          <p style={{ fontFamily: 'var(--font-bangers)', fontSize: '1.2rem', letterSpacing: '0.1em', color: '#fff' }}>
            ⚡ SKILL АШИГЛАХ
          </p>
          <p className="text-xs text-white/30 mt-0.5">
            {activeChar ? activeChar.character?.name : 'Идэвхтэй дүр байхгүй'}
          </p>
        </div>
        <div className="p-3 space-y-2 max-h-72 overflow-y-auto">
          {skills.length === 0 ? (
            <p className="text-center text-white/30 py-4 text-sm">Skill байхгүй байна</p>
          ) : skills.map((s: any) => {
            const cfg = SKILL_EFFECTS[s.effectType];
            return (
              <button key={s.id}
                onClick={() => { onSelect(s.effectType, s.name); onClose(); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-95"
                style={{ background: `${cfg?.ring ?? '#888'}15`, border: `1px solid ${cfg?.ring ?? '#888'}35` }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: `${cfg?.ring ?? '#888'}20`, boxShadow: `0 0 12px ${cfg?.ring ?? '#888'}40` }}>
                  {EFFECT_BADGE[s.effectType] ?? '⚔️'}
                </div>
                <div>
                  <p style={{ fontFamily: 'var(--font-bangers)', letterSpacing: '0.06em', color: cfg?.ring ?? '#fff', fontSize: '0.95rem' }}>
                    {s.name}
                  </p>
                  <p className="text-xs text-white/35">{s.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main ChatPage ───────────────────────────────────────────────────────────
export default function ChatPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const {
    messages, activeRoom, typingUsers, onlineCount,
    setActiveRoom, addMessage, setHistory, setTyping,
  } = useChatStore();

  const [input, setInput] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [attackTarget, setAttackTarget] = useState<{ id: string; username: string } | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [showSkillSelector, setShowSkillSelector] = useState(false);
  const [activeEffect, setActiveEffect] = useState<{ effectType: string; name: string } | null>(null);
  // Reply
  const [replyTo, setReplyTo] = useState<{ id: string; username: string; content: string } | null>(null);
  // Reactions: messageId → { emoji: [userId, ...] }
  const [reactions, setReactions] = useState<Record<string, Record<string, string[]>>>({});
  // Background per room
  const [roomBg, setRoomBg] = useState<Record<string, string>>({});
  // Admin bg uploader
  const [showBgAdmin, setShowBgAdmin] = useState(false);
  const bgFileRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: animeRooms = [] } = useQuery({
    queryKey: ['my-anime-rooms'],
    queryFn: chatApi.getMyAnimeRooms,
  });

  const { data: privateRooms = [] } = useQuery({
    queryKey: ['my-private-rooms'],
    queryFn: chatApi.getMyPrivateRooms,
    refetchInterval: 15000,
  });

  const createDMMut = useMutation({
    mutationFn: (userId: string) => chatApi.createPrivateRoom(userId),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['my-private-rooms'] });
      setActiveRoom(data.chatRoomId ?? data.roomId);
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'DM эхлүүлэхэд алдаа гарлаа'),
  });

  // WebSocket events
  useEffect(() => {
    const u1 = socketManager.onMessage((msg) => addMessage(msg.roomId ?? 'all', msg));
    const u2 = socketManager.onHistory(({ roomId, messages: msgs }) => {
      // DB messages have { sender: { id, username } } shape; normalize to flat { senderId, username }
      const normalized = (msgs as any[]).map((m: any) => ({
        ...m,
        senderId: m.senderId ?? m.sender?.id,
        username: m.username ?? m.sender?.username ?? (m.metadata as any)?.username ?? '',
      }));
      setHistory(roomId ?? 'all', normalized);
    });
    const u3 = socketManager.onTyping((data) => {
      setTyping(activeRoom, { userId: data.userId, username: data.username }, data.isTyping);
      setTimeout(() => setTyping(activeRoom, { userId: data.userId, username: data.username }, false), 3000);
    });
    const u4 = socketManager.onReactionUpdate(({ messageId, reactions: r }) => {
      setReactions(prev => ({ ...prev, [messageId]: r }));
    });
    const u5 = socketManager.onReactionsBulk((bulk) => {
      setReactions(prev => ({ ...prev, ...bulk }));
    });
    const u6 = socketManager.onBackgroundChanged(({ roomId, backgroundUrl }) => {
      setRoomBg(prev => ({ ...prev, [roomId]: backgroundUrl ?? '' }));
    });
    return () => { u1(); u2(); u3(); u4(); u5(); u6(); };
  }, [activeRoom]);

  useEffect(() => {
    socketManager.joinRoom(activeRoom);
    inputRef.current?.focus();
    setReplyTo(null);
    // Background татах
    chatApi.getRoomBackground(activeRoom)
      .then(d => { if (d.backgroundUrl) setRoomBg(prev => ({ ...prev, [activeRoom]: d.backgroundUrl! })); })
      .catch(() => {});
  }, [activeRoom]);

  // Auto scroll
  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    if (c.scrollHeight - c.scrollTop - c.clientHeight < 150)
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages[activeRoom]]);

  const handleScroll = () => {
    const c = containerRef.current;
    if (c) setShowScrollBtn(c.scrollHeight - c.scrollTop - c.clientHeight > 200);
  };

  const sendText = useCallback(() => {
    if (!input.trim() || isComposing) return;
    const extraMeta = replyTo ? { replyTo } : undefined;
    socketManager.sendMessage(activeRoom, input.trim(), undefined, extraMeta);
    setInput('');
    setReplyTo(null);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    socketManager.sendTyping(activeRoom, false);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
  }, [input, activeRoom, isComposing, replyTo]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    socketManager.sendTyping(activeRoom, true);
    typingTimer.current = setTimeout(() => socketManager.sendTyping(activeRoom, false), 2000);
  };

  const handleImageUpload = async (file: File) => {
    if (file.size > 8 * 1024 * 1024) { toast.error('8MB-аас бага зураг оруулна уу'); return; }
    setImageUploading(true);
    try {
      const { url } = await chatApi.uploadImage(file);
      // Send as special image message with metadata
      socketManager.sendMessage(activeRoom, url, undefined, { type: 'image' });
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch {
      toast.error('Зураг upload амжилтгүй боллоо');
    } finally {
      setImageUploading(false);
    }
  };

  const handleDM = (target: { id: string; username: string }) => {
    if (target.id === user?.id) return;
    // Check if DM room exists
    const existing = (privateRooms as any[]).find((r: any) => r.userId === target.id);
    if (existing) {
      setActiveRoom(existing.roomId);
    } else {
      createDMMut.mutate(target.id);
    }
  };

  const currentMessages = messages[activeRoom] ?? [];
  const currentTyping = (typingUsers[activeRoom] ?? []).filter((u) => u.userId !== user?.id);
  const activeRoomLabel =
    activeRoom === 'all' ? 'Нийт чат'
    : (animeRooms as any[]).find((r: any) => r.roomId === activeRoom)?.animeName
    ?? (privateRooms as any[]).find((r: any) => r.roomId === activeRoom)?.username
    ?? 'Чат';
  const activeRoomEmoji = activeRoom === 'all' ? '🌍'
    : (privateRooms as any[]).find((r: any) => r.roomId === activeRoom) ? '👤' : '🎌';

  return (
    <>
      <div className="flex gap-3 h-[calc(100vh-10rem)]">

        {/* ══ SIDEBAR ══ */}
        <div className="w-64 flex-shrink-0 hidden md:flex flex-col gap-1 bg-surface border border-border rounded-2xl overflow-hidden">

          {/* Header */}
          <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-shrink-0">
            <span className="font-bold text-sm">Чат</span>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {onlineCount} онлайн
            </div>
          </div>

          {/* All sections visible at once */}
          <div className="flex-1 overflow-y-auto py-2">

            {/* ── Нийт чат ── */}
            <SectionLabel label="🌍 Нийт" />
            <RoomItem icon="🌍" label="Нийт чат" sub={`${onlineCount} онлайн`}
              active={activeRoom === 'all'} onClick={() => setActiveRoom('all')} />

            {/* ── Anime чат ── */}
            <SectionLabel label="🎌 Anime чат" className="mt-3" />
            {(animeRooms as any[]).length === 0
              ? <p className="text-[11px] text-muted-foreground/50 px-4 py-1.5 leading-relaxed">
                  Дүр авсны дараа нэвтэрнэ
                </p>
              : (animeRooms as any[]).map((r: any) => (
                  <RoomItem key={r.roomId} icon="🎌" label={r.animeName}
                    active={activeRoom === r.roomId} onClick={() => setActiveRoom(r.roomId)} />
                ))
            }

            {/* ── Хувийн чат ── */}
            <SectionLabel label="💬 Хувийн чат" className="mt-3" />
            {(privateRooms as any[]).length === 0
              ? <p className="text-[11px] text-muted-foreground/50 px-4 py-1.5 leading-relaxed">
                  Мессеж дэрх 💬 DM товчоор эхлүүлнэ
                </p>
              : (privateRooms as any[]).map((r: any) => (
                  <RoomItem
                    key={r.roomId}
                    icon="👤"
                    label={r.displayName ?? r.username}
                    sub={r.lastMessage
                      ? (r.lastMessage.length > 28 ? r.lastMessage.slice(0, 28) + '…' : r.lastMessage)
                      : undefined}
                    active={activeRoom === r.roomId}
                    onClick={() => { setActiveRoom(r.roomId); }}
                  />
                ))
            }
          </div>
        </div>

        {/* ══ CHAT AREA ══ */}
        <div className="flex-1 flex flex-col bg-surface border border-border rounded-2xl overflow-hidden min-w-0 relative">

          {/* Header */}
          <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-shrink-0 bg-surface-2/40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-lg flex-shrink-0">
                {activeRoomEmoji}
              </div>
              <div>
                <h2 className="font-bold text-sm leading-tight">{activeRoomLabel}</h2>
                <p className="text-[11px] text-muted-foreground leading-tight">{currentMessages.length} мессеж</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Admin background button */}
              {user?.role !== 'USER' && (
                <button
                  onClick={() => setShowBgAdmin(v => !v)}
                  className="px-2 py-1 text-xs rounded-lg border border-border bg-surface-2 text-muted-foreground hover:text-foreground transition-colors"
                  title="Арын зураг солих"
                >
                  🖼️
                </button>
              )}
              <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {onlineCount} онлайн
              </div>
            </div>
          </div>

          {/* Admin bg panel */}
          <AnimatePresence>
            {showBgAdmin && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-b border-border bg-surface-2/60 px-4 py-3 flex items-center gap-3"
              >
                <span className="text-xs text-muted-foreground font-medium">Арын зураг:</span>
                <input
                  type="text"
                  placeholder="URL оруулах..."
                  className="flex-1 px-3 py-1.5 text-xs bg-surface border border-border rounded-lg focus:outline-none focus:border-primary"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const url = (e.target as HTMLInputElement).value.trim();
                      socketManager.setBackground(activeRoom, url);
                      setRoomBg(prev => ({ ...prev, [activeRoom]: url }));
                      setShowBgAdmin(false);
                    }
                  }}
                />
                <span className="text-xs text-muted-foreground">эсвэл</span>
                <button
                  onClick={() => bgFileRef.current?.click()}
                  className="px-3 py-1.5 text-xs bg-primary/20 text-primary border border-primary/30 rounded-lg hover:bg-primary/30 transition-colors"
                >
                  Зураг оруулах
                </button>
                <input ref={bgFileRef} type="file" accept="image/*" className="hidden"
                  onChange={async e => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    try {
                      const res = await chatApi.uploadRoomBackground(activeRoom, f);
                      const url = `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1','') || 'http://localhost:3001'}${res.url}`;
                      socketManager.setBackground(activeRoom, url);
                      setRoomBg(prev => ({ ...prev, [activeRoom]: url }));
                      setShowBgAdmin(false);
                      toast.success('Арын зураг тохиргоо хийгдлээ');
                    } catch { toast.error('Upload амжилтгүй'); }
                    e.target.value = '';
                  }}
                />
                <button
                  onClick={() => {
                    socketManager.setBackground(activeRoom, '');
                    setRoomBg(prev => { const n = {...prev}; delete n[activeRoom]; return n; });
                    setShowBgAdmin(false);
                  }}
                  className="px-2 py-1.5 text-xs text-red-400 border border-red-400/30 rounded-lg hover:bg-red-400/10 transition-colors"
                >
                  Арилгах
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages */}
          <div ref={containerRef} onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-0 relative"
            style={roomBg[activeRoom] ? {
              backgroundImage: `url(${roomBg[activeRoom]})`,
              backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
            } : {}}
          >
            {/* BG overlay for readability */}
            {roomBg[activeRoom] && (
              <div className="absolute inset-0 bg-background/70 pointer-events-none" />
            )}
            {currentMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground select-none">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-3xl mb-3">💬</div>
                <p className="font-semibold">Мессеж байхгүй байна</p>
                <p className="text-xs mt-1 opacity-60">Эхний мессежийг илгээгээрэй!</p>
              </div>
            )}

            <AnimatePresence initial={false}>
              {currentMessages.map((msg, i) => {
                const isOwn = msg.senderId === user?.id;
                const prev = currentMessages[i - 1];
                const next = currentMessages[i + 1];
                const isFirst = i === 0 || prev?.senderId !== msg.senderId;
                const isLast = !next || next.senderId !== msg.senderId;
                return (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    isOwn={isOwn}
                    isFirst={isFirst}
                    isLast={isLast}
                    onAttack={setAttackTarget}
                    onDM={handleDM}
                    onProfile={(uid) => router.push(`/dashboard/profile/${uid}`)}
                    onReply={(m) => {
                      setReplyTo({ id: m.id, username: m.username, content: m.content });
                      inputRef.current?.focus();
                    }}
                    onReact={(messageId, emoji) => socketManager.reactToMessage(activeRoom, messageId, emoji)}
                    reactions={reactions[msg.id] ?? {}}
                    currentUserId={user?.id ?? ''}
                    hasBg={!!roomBg[activeRoom]}
                  />
                );
              })}
            </AnimatePresence>

            {/* Typing indicator */}
            <AnimatePresence>
              {currentTyping.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }} className="flex items-center gap-2 mt-4 pl-10">
                  <div className="bg-surface-2 border border-border rounded-2xl rounded-bl-sm px-3.5 py-2 flex items-center gap-2">
                    <span className="flex gap-1">
                      {[0, 1, 2].map((j) => (
                        <span key={j} className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
                          style={{ animationDelay: `${j * 0.13}s` }} />
                      ))}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {currentTyping.map((u) => u.username).join(', ')} бичиж байна...
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Scroll FAB */}
          <AnimatePresence>
            {showScrollBtn && (
              <motion.button
                initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                onClick={() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); setShowScrollBtn(false); }}
                className="absolute bottom-20 right-4 w-9 h-9 bg-primary text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all z-10"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                </svg>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Input area */}
          <div className="px-3 py-3 border-t border-border flex-shrink-0 bg-surface-2/20">
            <div className="flex gap-2 items-center">

              {/* Reply bar */}
              <AnimatePresence>
                {replyTo && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="absolute bottom-full left-0 right-0 mb-1 mx-1 px-3 py-2 bg-surface-2 border border-primary/30 rounded-xl flex items-center gap-2 text-xs"
                  >
                    <div className="w-0.5 h-full bg-primary rounded-full flex-shrink-0" style={{ minHeight: '20px' }} />
                    <div className="flex-1 min-w-0">
                      <span className="text-primary font-bold">{replyTo.username}</span>
                      <p className="text-muted-foreground truncate">{replyTo.content}</p>
                    </div>
                    <button onClick={() => setReplyTo(null)} className="text-muted-foreground hover:text-foreground flex-shrink-0">✕</button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Skill button */}
              <button
                onClick={() => setShowSkillSelector(true)}
                className="w-10 h-10 flex-shrink-0 rounded-2xl border border-border bg-surface-2 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                title="Skill ашиглах"
                style={{ fontSize: '1.1rem' }}
              >
                ⚡
              </button>

              {/* Image upload button */}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={imageUploading}
                className="w-10 h-10 flex-shrink-0 rounded-2xl border border-border bg-surface-2 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors disabled:opacity-40"
                title="Зураг илгээх"
              >
                {imageUploading
                  ? <div className="anime-spinner w-4 h-4" />
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                    </svg>
                }
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) { handleImageUpload(f); e.target.value = ''; } }} />

              {/* Text input */}
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !isComposing) { e.preventDefault(); sendText(); } }}
                  onCompositionStart={() => setIsComposing(true)}
                  onCompositionEnd={() => setIsComposing(false)}
                  placeholder="Мессеж бичнэ үү... (Enter = илгээх)"
                  maxLength={500}
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-2xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>

              {/* Send button */}
              <button onClick={sendText} disabled={!input.trim()}
                className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-primary to-primary/80 text-white rounded-2xl flex items-center justify-center disabled:opacity-30 hover:shadow-lg hover:shadow-primary/30 active:scale-95 transition-all"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>

            {input.length > 380 && (
              <div className="flex justify-end mt-1 px-0.5">
                <p className={clsx('text-[10px]', input.length > 480 ? 'text-red-400' : 'text-muted-foreground/40')}>
                  {500 - input.length} үлдсэн
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Skill selector modal */}
      <AnimatePresence>
        {showSkillSelector && (
          <SkillSelectorModal
            onSelect={(effectType, name) => setActiveEffect({ effectType, name })}
            onClose={() => setShowSkillSelector(false)}
          />
        )}
      </AnimatePresence>

      {/* Skill effect overlay */}
      <AnimatePresence>
        {activeEffect && (
          <SkillEffectOverlay
            effectType={activeEffect.effectType}
            skillName={activeEffect.name}
            onDone={() => setActiveEffect(null)}
          />
        )}
      </AnimatePresence>

      {/* Attack modal */}
      <AnimatePresence>
        {attackTarget && (
          <QuickAttackModal
            target={attackTarget}
            onClose={() => setAttackTarget(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────── */

function RoomItem({ icon, label, sub, active, onClick }: {
  icon: string; label: string; sub?: string; active: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className={clsx(
        'w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all text-sm group border',
        active ? 'bg-gradient-to-r from-primary/20 to-primary/5 border-primary/30 text-primary'
               : 'border-transparent hover:bg-surface-2 text-muted-foreground hover:text-foreground',
      )}
    >
      <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 transition-colors',
        active ? 'bg-primary/20' : 'bg-surface-2 group-hover:bg-primary/10')}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold truncate leading-tight">{label}</p>
        {sub && <p className="text-[11px] opacity-60 leading-tight truncate">{sub}</p>}
      </div>
      {active && <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
    </button>
  );
}

function SectionLabel({ label, className }: { label: string; className?: string }) {
  return (
    <p className={clsx('text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider px-4 py-1', className)}>
      {label}
    </p>
  );
}
