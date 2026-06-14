'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const hash = (n: number, salt: number) => (((n * salt) >>> 0) % 10000) / 100;

const STARS = Array.from({ length: 70 }, (_, i) => ({
  id: i,
  x: hash(i, 2654435761),
  y: hash(i, 1234567891),
  size: i % 5 === 0 ? 2 : i % 3 === 0 ? 1.5 : 1,
  opacity: 0.06 + hash(i, 987654321) / 300,
  twinkle: i % 4 === 0,
  tw_dur: 2 + (i % 4),
  tw_delay: hash(i, 111111111) / 20,
}));

const PARTICLES = Array.from({ length: 18 }, (_, i) => {
  const colors = ['#ff4500', '#ff8c00', '#ffd700', '#ff2d55', '#ffaa00', '#ff6030'];
  return {
    id: i,
    x: hash(i, 1357924680),
    size: 1 + (i % 3),
    dur: 8 + (i % 10),
    delay: -(i % 12),
    color: colors[i % colors.length],
    dx: (i % 2 === 0 ? 1 : -1) * (5 + (i % 20)),
  };
});

const SUKUNA_SLASHES = [
  { id: 0, left: '44%', top: '10%', w: 400, dur: 2.4, delay: 0.0 },
  { id: 1, left: '48%', top: '20%', w: 320, dur: 2.9, delay: 0.6 },
  { id: 2, left: '40%', top: '30%', w: 460, dur: 2.1, delay: 1.2 },
  { id: 3, left: '52%', top: '6%',  w: 260, dur: 3.1, delay: 1.8 },
  { id: 4, left: '42%', top: '40%', w: 380, dur: 2.6, delay: 2.4 },
];

const SPEED_LINES = Array.from({ length: 7 }, (_, i) => ({
  id: i,
  top: 10 + i * 12,
  h: i % 3 === 0 ? 2 : 1,
  dur: 2.0 + (i % 5) * 0.45,
  delay: -(i * 0.52),
  width: 22 + (i % 4) * 14,
}));

const FOG_STRIPS = Array.from({ length: 3 }, (_, i) => ({
  id: i,
  top: 18 + i * 24,
  h: 70 + (i % 3) * 50,
  dur: 20 + i * 6,
  delay: -(i * 5),
}));

const ORBS = [
  { x: '62%', y: '5%',  w: 520, h: 520, color: 'rgba(220,38,38,0.14)',   dur: 14, delay: 0 },
  { x: '45%', y: '52%', w: 400, h: 400, color: 'rgba(255,140,0,0.08)',   dur: 10, delay: 5 },
];

const RINGS = [
  { dur: 5,   delay: 0,    color: 'rgba(220,38,38,0.42)' },
  { dur: 5,   delay: 1.67, color: 'rgba(255,140,0,0.30)' },
  { dur: 5,   delay: 3.34, color: 'rgba(220,38,38,0.18)' },
];

const FEATURES = [
  { title: 'PvP Attack Event',   desc: 'Долоо хоног бүр Season. HP/Energy/Skill бодит тулаан.',     from: 'from-red-600/20',     border: 'border-red-500/30',    shadow: 'hover:shadow-red-500/20' },
  { title: 'Anime Chat',          desc: 'Нийт, Anime, хувийн, Guild — бодит цагийн WebSocket чат.', from: 'from-blue-600/20',    border: 'border-blue-500/30',   shadow: 'hover:shadow-blue-500/20' },
  { title: 'Anime Characters',    desc: 'Naruto, One Piece, Bleach, DBZ, Demon Slayer. 20+ дүр.',   from: 'from-orange-600/20',  border: 'border-orange-500/30', shadow: 'hover:shadow-orange-500/20' },
  { title: 'Mini Games',          desc: 'Reaction, Memory, Click Speed — Attack Point олж авна.',   from: 'from-emerald-600/20', border: 'border-emerald-500/30',shadow: 'hover:shadow-emerald-500/20' },
  { title: 'Leaderboard',         desc: '5 төрлийн rank. Season ялагчид Character Point шагнал.',  from: 'from-yellow-600/20',  border: 'border-yellow-500/30', shadow: 'hover:shadow-yellow-500/20' },
  { title: 'Guild System',        desc: 'Anime бүрт Guild. Guild chat, rank, хамтын тулаан.',       from: 'from-cyan-600/20',    border: 'border-cyan-500/30',   shadow: 'hover:shadow-cyan-500/20' },
];

const ANIME_TAGS = [
  { label: 'Naruto',        color: 'text-orange-400 border-orange-500/40 bg-orange-500/10' },
  { label: 'One Piece',     color: 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10' },
  { label: 'Bleach',        color: 'text-sky-400    border-sky-500/40    bg-sky-500/10' },
  { label: 'Dragon Ball Z', color: 'text-amber-400  border-amber-500/40  bg-amber-500/10' },
  { label: 'Demon Slayer',  color: 'text-red-400    border-red-500/40    bg-red-500/10' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden relative" style={{ background: '#020008' }}>

      {/* ══ FIXED BACKGROUND ══ */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="hero-bg-img" />
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to bottom,rgba(2,0,8,0.05) 0%,rgba(2,0,8,0.04) 20%,rgba(2,0,8,0.15) 50%,rgba(2,0,8,0.58) 72%,rgba(2,0,8,0.92) 88%,rgba(2,0,8,0.97) 100%)',
        }} />
        <div className="absolute inset-y-0" style={{
          right: '-5%', left: '35%',
          background: 'radial-gradient(ellipse at 80% 35%,rgba(220,20,20,0.35) 0%,rgba(190,60,0,0.20) 30%,transparent 62%)',
          animation: 'energyPulseRed 4s ease-in-out infinite',
        }} />
        <div className="absolute inset-0 md:hidden" style={{
          background: 'radial-gradient(ellipse at 85% 35%, rgba(220,20,20,0.28) 0%, transparent 45%)',
          animation: 'energyPulseRed 4s ease-in-out infinite',
        }} />
        {SUKUNA_SLASHES.map((sl) => (
          <div key={sl.id} className="battle-fx-desktop absolute" style={{
            left: sl.left, top: sl.top, width: sl.w, height: 4,
            background: 'linear-gradient(90deg, transparent 0%, rgba(220,20,20,0.95) 20%, rgba(255,80,40,0.85) 60%, rgba(255,180,120,0.6) 85%, transparent 100%)',
            borderRadius: '4px', filter: 'blur(0.8px)',
            boxShadow: '0 0 12px rgba(220,20,20,0.8),0 0 28px rgba(220,20,20,0.4)',
            transform: 'rotate(-38deg)', transformOrigin: 'left center',
            animation: `sukunaSlash ${sl.dur}s ${sl.delay}s ease-in-out infinite`,
          }} />
        ))}
        <div className="battle-fx-desktop absolute" style={{
          left: '46%', top: '22%', width: 340, height: 6,
          background: 'linear-gradient(90deg, transparent, rgba(220,20,20,0.95), rgba(255,100,40,0.8), rgba(255,200,120,0.5), transparent)',
          borderRadius: '4px', filter: 'blur(1px)',
          boxShadow: '0 0 20px rgba(220,20,20,0.85),0 0 45px rgba(220,20,20,0.4)',
          transformOrigin: 'left center',
          animation: 'sukunaArm 2.8s ease-in-out infinite',
        }} />
        <div className="battle-fx-desktop absolute" style={{
          left: '40%', top: '42%', width: 180, height: 180,
          background: 'radial-gradient(circle,rgba(255,255,255,0.80) 0%,rgba(255,200,50,0.55) 22%,rgba(255,100,0,0.28) 48%,rgba(220,20,20,0.12) 70%,transparent 85%)',
          filter: 'blur(5px)', transform: 'translate(-50%,-50%)',
          animation: 'collisionBurst 1.6s ease-in-out infinite',
        }} />
        <div className="battle-fx-desktop absolute" style={{
          left: '40%', top: '42%', width: 44, height: 44,
          background: 'radial-gradient(circle, rgba(255,255,255,0.98) 0%, rgba(255,220,80,0.75) 55%, transparent 100%)',
          filter: 'blur(2px)', transform: 'translate(-50%,-50%)',
          boxShadow: '0 0 24px rgba(255,255,255,0.85),0 0 55px rgba(255,180,0,0.65),0 0 90px rgba(220,20,20,0.30)',
          animation: 'collisionBurst 1.6s 0.3s ease-in-out infinite',
        }} />
        <div className="absolute inset-0" style={{
          background: 'rgba(255,255,255,1)',
          animation: 'blackFlash 7s 2s ease-in-out infinite',
        }} />
        {SPEED_LINES.map((sl) => (
          <div key={sl.id} className="absolute left-0 right-0 overflow-hidden" style={{ top: `${sl.top}%`, height: `${sl.h}px` }}>
            <div className="absolute h-full" style={{
              width: `${sl.width}%`,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.60), rgba(255,160,60,0.45), transparent)',
              animation: `speedLine ${sl.dur}s ${sl.delay}s linear infinite`,
            }} />
          </div>
        ))}
        {FOG_STRIPS.map((f) => (
          <div key={f.id} className="absolute left-0 overflow-hidden" style={{ top: `${f.top}%`, height: `${f.h}px`, width: '100%' }}>
            <div className="absolute h-full" style={{
              width: '50%',
              background: 'linear-gradient(90deg, transparent, rgba(255,180,80,0.10), rgba(200,80,60,0.07), transparent)',
              filter: 'blur(10px)',
              animation: `fogDrift ${f.dur}s ${f.delay}s ease-in-out infinite`,
            }} />
          </div>
        ))}
        {STARS.map((s) => (
          <div key={s.id} className="absolute rounded-full bg-white" style={{
            left: `${s.x}%`, top: `${s.y}%`,
            width: `${s.size}px`, height: `${s.size}px`,
            opacity: s.opacity,
            animation: s.twinkle ? `twinkle ${s.tw_dur}s ${s.tw_delay}s ease-in-out infinite` : undefined,
          }} />
        ))}
        {ORBS.map((orb, i) => (
          <div key={i} className="absolute rounded-full" style={{
            left: orb.x, top: orb.y, width: orb.w, height: orb.h,
            background: orb.color, filter: 'blur(90px)',
            animation: `slowDrift ${orb.dur}s ${orb.delay}s ease-in-out infinite`,
          }} />
        ))}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'linear-gradient(rgba(220,38,38,0.06) 1px, transparent 1px),linear-gradient(90deg, rgba(56,189,248,0.05) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }} />
        <div className="absolute top-[38%] left-1/2">
          {RINGS.map((r, i) => (
            <div key={i} className="absolute rounded-full border" style={{
              width: 240, height: 240,
              borderColor: r.color, boxShadow: `0 0 14px ${r.color}`,
              animation: `ringExpand ${r.dur}s ${r.delay}s ease-out infinite`,
            }} />
          ))}
        </div>
        {PARTICLES.map((p) => (
          <div key={p.id} className="absolute rounded-full" style={{
            left: `${p.x}%`, bottom: 0,
            width: `${p.size}px`, height: `${p.size}px`,
            background: p.color, boxShadow: `0 0 ${p.size * 4}px ${p.color}`,
            ['--dx' as any]: `${p.dx}px`,
            animation: `floatParticle ${p.dur}s ${p.delay}s linear infinite`,
          }} />
        ))}
        <div className="absolute inset-0 anime-scanlines opacity-25" />
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.60) 100%)',
        }} />
      </div>

      {/* ══ NAVBAR ══ */}
      <header className="relative z-20">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <motion.span
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl flex items-baseline gap-2"
            style={{ fontFamily: 'var(--font-bangers)', letterSpacing: '0.12em' }}
          >
            <span style={{
              background: 'linear-gradient(135deg, #ff4444, #cc0000)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              filter: 'drop-shadow(0 0 10px rgba(220,38,38,0.8))',
            }}>KURENAI</span>
            <span style={{
              fontFamily: 'serif', fontSize: '1.1em', letterSpacing: 0,
              background: 'linear-gradient(160deg, #ff6b35, #cc0000)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              filter: 'drop-shadow(0 0 8px rgba(220,38,38,0.7))',
            }}>紅</span>
          </motion.span>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
            <Link href="/login"
              className="hidden sm:block px-5 py-2 text-sm font-semibold text-white/80 hover:text-white border border-white/15 hover:border-sky-400/60 rounded-xl transition-all backdrop-blur-sm"
              style={{ background: 'rgba(0,0,0,0.3)' }}>
              Нэвтрэх
            </Link>
            <Link href="/register"
              className="px-5 py-2 text-sm font-bold text-white rounded-xl transition-all hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #dc2626, #9b1c1c)', boxShadow: '0 0 20px rgba(220,38,38,0.50), 0 4px 12px rgba(0,0,0,0.4)' }}>
              Бүртгүүлэх
            </Link>
          </motion.div>
        </div>
      </header>

      {/* ══ HERO ══ */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-24 sm:pb-32 text-center">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="flex flex-wrap justify-center gap-2 mb-10">
          {ANIME_TAGS.map((t) => (
            <span key={t.label} className={`px-3.5 py-1 text-xs font-semibold border rounded-full backdrop-blur-sm ${t.color}`}
              style={{ textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>
              {t.label}
            </span>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.16, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="leading-none select-none" style={{ fontFamily: 'var(--font-bangers)', letterSpacing: '0.06em' }}>
            <span className="block text-[clamp(5.5rem,18vw,12rem)]" style={{
              backgroundImage: 'linear-gradient(160deg, #ff6666 0%, #ff2020 45%, #cc0000 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              WebkitTextStroke: '2px rgba(0,0,0,0.85)',
              filter: 'drop-shadow(0 0 28px rgba(220,38,38,0.85)) drop-shadow(0 4px 16px rgba(0,0,0,1))',
            }}>ANIME</span>
            <span className="block text-[clamp(4.5rem,15.5vw,10.5rem)]" style={{
              backgroundImage: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 50%, #1d4ed8 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              WebkitTextStroke: '2px rgba(0,0,0,0.80)',
              filter: 'drop-shadow(0 0 24px rgba(37,99,235,0.8)) drop-shadow(0 4px 16px rgba(0,0,0,1))',
            }}>PLATFORM</span>
          </h1>
        </motion.div>

        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }}
          className="mt-6 text-lg sm:text-xl text-white/85 max-w-lg mx-auto leading-relaxed"
          style={{ textShadow: '0 2px 12px rgba(0,0,0,0.9)' }}>
          Монголын хамгийн том{' '}
          <strong className="text-white">anime community</strong>
          {' '}+{' '}
          <strong style={{ color: '#ff6b35' }}>PvP тоглоом</strong>
        </motion.p>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.44 }}
          className="mt-2 text-sm text-white/45" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}>
          Дүр сонгоорой · Тулалдаарай · League-ийн дээгүүр гар
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register"
            className="relative w-full sm:w-auto px-10 py-4 text-base font-black text-white rounded-2xl overflow-hidden group transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)',
              boxShadow: '0 0 0 1px rgba(220,38,38,0.55),0 8px 40px rgba(220,38,38,0.50),0 0 80px rgba(220,38,38,0.25)',
            }}>
            <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-15deg]" />
            <span className="relative">Үнэгүй эхлэх</span>
          </Link>
          <Link href="/login"
            className="w-full sm:w-auto px-10 py-4 text-base font-semibold text-white/70 hover:text-white border border-white/20 hover:border-sky-400/50 rounded-2xl transition-all backdrop-blur-sm hover:bg-sky-400/5 text-center"
            style={{ background: 'rgba(0,0,0,0.25)' }}>
            Нэвтрэх →
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.64 }}
          className="mt-10 sm:mt-14 inline-flex flex-wrap justify-center gap-5 sm:gap-8 px-5 sm:px-8 py-4 sm:py-5 rounded-2xl backdrop-blur-md border border-white/10 w-full sm:w-auto"
          style={{ background: 'rgba(0,0,0,0.38)' }}>
          {[
            { v: '8',   label: 'Anime world' },
            { v: '20+', label: 'Дүр'          },
            { v: '4',   label: 'Mini game'    },
            { v: '∞',   label: 'PvP Season'   },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-black" style={{ color: '#ffd700', textShadow: '0 0 16px rgba(255,200,0,0.8)' }}>{s.v}</div>
              <div className="text-xs text-white/50 mt-0.5">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Divider */}
      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.6), rgba(220,38,38,0.7), rgba(255,165,0,0.5), transparent)' }} />
      </div>

      {/* ══ FEATURES ══ */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
          <h2 className="text-4xl mb-3 text-white" style={{ fontFamily: 'var(--font-bangers)', letterSpacing: '0.06em', textShadow: '0 2px 16px rgba(0,0,0,0.8)' }}>
            Үндсэн онцлогууд
          </h2>
          <p className="text-white/50 text-lg">Anime world дахь бүхий л зүйл нэг дор</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title}
              initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
              className={`group relative p-7 rounded-2xl bg-gradient-to-br ${f.from} to-transparent border ${f.border} backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${f.shadow} cursor-default overflow-hidden`}
              style={{ background: 'rgba(4,0,10,0.55)' }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04), transparent)' }} />
              <h3 className="text-lg text-white mb-2" style={{ fontFamily: 'var(--font-bangers)', letterSpacing: '0.05em', textShadow: '0 1px 8px rgba(0,0,0,0.7)' }}>
                {f.title}
              </h3>
              <p className="text-sm text-white/55 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══ STEPS ══ */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-24">
        <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="text-4xl text-center text-white mb-14"
          style={{ fontFamily: 'var(--font-bangers)', letterSpacing: '0.06em', textShadow: '0 2px 16px rgba(0,0,0,0.8)' }}>
          Хэрхэн эхлэх вэ?
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative">
          <div className="hidden sm:block absolute top-11 left-[22%] right-[22%] h-px"
            style={{ background: 'linear-gradient(90deg, rgba(56,189,248,0.4), rgba(255,100,0,0.8), rgba(220,38,38,0.4))' }} />
          {[
            { n: '01', title: 'Бүртгүүлэх', desc: 'Имэйл + нэрээ оруул. 30 секунд.',            col: 'rgba(56,189,248,0.20)',  border: 'rgba(56,189,248,0.45)',  text: '#38bdf8' },
            { n: '02', title: 'Дүр авах',    desc: 'Дуртай anime-ийнхаа үнэгүй дүрийг сонго.',  col: 'rgba(255,165,0,0.15)',   border: 'rgba(255,165,0,0.45)',   text: '#ffd700' },
            { n: '03', title: 'Тулалдах',    desc: 'Season, chat, mini game — нэгэн зэрэг!',    col: 'rgba(220,38,38,0.18)',   border: 'rgba(220,38,38,0.45)',   text: '#f87171' },
          ].map((item, i) => (
            <motion.div key={item.n}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }}
              className="relative text-center p-7 rounded-2xl backdrop-blur-md border border-white/10"
              style={{ background: 'rgba(4,0,10,0.55)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-black mx-auto mb-4"
                style={{ background: item.col, border: `1px solid ${item.border}`, color: item.text }}>
                {item.n}
              </div>
              <h3 className="text-xl text-white mb-2" style={{ fontFamily: 'var(--font-bangers)', letterSpacing: '0.05em', textShadow: '0 1px 8px rgba(0,0,0,0.7)' }}>
                {item.title}
              </h3>
              <p className="text-sm text-white/45">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══ FINAL CTA ══ */}
      <section className="relative z-10 px-6 pb-24">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="max-w-2xl mx-auto rounded-3xl p-px"
          style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.7), rgba(220,38,38,0.9), rgba(255,165,0,0.6))' }}>
          <div className="rounded-3xl p-12 text-center backdrop-blur-md" style={{ background: 'rgba(4,0,10,0.90)' }}>
            <h2 className="text-3xl mb-3 text-white" style={{ fontFamily: 'var(--font-bangers)', letterSpacing: '0.06em', textShadow: '0 0 24px rgba(255,100,0,0.45), 0 2px 8px rgba(0,0,0,0.8)' }}>
              Нэгдэхэд бэлэн үү?
            </h2>
            <p className="text-white/50 mb-8 text-lg">Бүртгэл бүрэн үнэгүй · Дүр шууд авна · Тулалдаан эхэлнэ</p>
            <Link href="/register"
              className="group relative inline-block px-12 py-4 text-white font-black text-lg rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)', boxShadow: '0 0 55px rgba(220,38,38,0.55), 0 0 100px rgba(220,38,38,0.20)' }}>
              <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-15deg]" />
              <span className="relative">Одоо эхлэх — Үнэгүй</span>
            </Link>
          </div>
        </motion.div>
      </section>

      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-sm text-white/20">
        Anime Platform · Монголын anime нийгэмлэг · 2026
      </footer>
    </div>
  );
}
