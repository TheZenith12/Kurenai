'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../../store/auth.store';
import { useHasHydrated } from '../../hooks/useHasHydrated';
import { socketManager } from '../../lib/socket';
import { useChatStore } from '../../store/chat.store';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import NotificationBell from '../../components/NotificationBell';
import LoginStreakBadge from '../../components/LoginStreakBadge';
import { motion, AnimatePresence } from 'framer-motion';
import { useRef } from 'react';
import {
  User, MessageCircle, Swords, Gamepad2, ClipboardList,
  Sparkles, Trophy, Palette, BarChart3, Shield, ShieldAlert,
  MoreHorizontal, ShieldCheck, LogOut, Star, Search,
  Bell, Tv, History, Rss,
} from 'lucide-react';

type NavItem = { href: string; label: string; Icon: React.ElementType; group?: string };

const PRIMARY_NAV: NavItem[] = [
  { href: '/dashboard/profile', label: 'Профайл', Icon: User },
  { href: '/dashboard/chat',    label: 'Чат',     Icon: MessageCircle },
  { href: '/dashboard/attack',  label: 'Тулаан',  Icon: Swords },
  { href: '/dashboard/games',   label: 'Тоглоом', Icon: Gamepad2 },
];

const ALL_NAV: NavItem[] = [
  { href: '/dashboard/profile',       label: 'Профайл',     Icon: User,          group: 'Үндсэн' },
  { href: '/dashboard/chat',          label: 'Чат',         Icon: MessageCircle, group: 'Үндсэн' },
  { href: '/dashboard/attack',        label: 'Тулаан',      Icon: Swords,        group: 'Үндсэн' },
  { href: '/dashboard/games',         label: 'Тоглоом',     Icon: Gamepad2,      group: 'Үндсэн' },
  { href: '/dashboard/quests',        label: 'Даалгавар',   Icon: ClipboardList, group: 'Үндсэн' },
  { href: '/dashboard/activity',      label: 'Идэвхи',      Icon: Rss,           group: 'Үндсэн' },
  { href: '/dashboard/gacha',         label: 'Гача',        Icon: Sparkles,      group: 'Цуглуулга' },
  { href: '/dashboard/achievements',  label: 'Амжилт',      Icon: Trophy,        group: 'Цуглуулга' },
  { href: '/dashboard/cosmetics',     label: 'Тохируулга',  Icon: Palette,       group: 'Цуглуулга' },
  { href: '/dashboard/watchlist',     label: 'Жагсаалт',    Icon: Tv,            group: 'Цуглуулга' },
  { href: '/dashboard/leaderboard',   label: 'Рейтинг',     Icon: BarChart3,     group: 'Нийгэм' },
  { href: '/dashboard/guild',         label: 'Гилд',        Icon: Shield,        group: 'Нийгэм' },
  { href: '/dashboard/guild-wars',    label: 'Гилд дайн',   Icon: ShieldAlert,   group: 'Нийгэм' },
  { href: '/dashboard/seasons',       label: 'Сезон',       Icon: History,       group: 'Нийгэм' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const hasHydrated = useHasHydrated();
  const { setOnlineCount } = useChatStore();
  const [moreOpen, setMoreOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dismissed = localStorage.getItem('email-banner-dismissed');
    if (dismissed) setBannerDismissed(true);
  }, []);

  const dismissBanner = () => {
    localStorage.setItem('email-banner-dismissed', '1');
    setBannerDismissed(true);
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) router.replace('/login');
  }, [hasHydrated, isAuthenticated, router]);

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) return;

    socketManager.connect();

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const showPush = (title: string, body: string) => {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' && document.hidden) {
        new Notification(title, { body, icon: '/favicon.ico' });
      }
    };

    const unsubOnline  = socketManager.onOnlineCount(({ count }) => setOnlineCount(count));
    const unsubWarn    = socketManager.onModerationWarning(({ message }) => { toast.error(`⚠️ ${message}`, { duration: 6000 }); showPush('Анхааруулга', message); });
    const unsubMuted   = socketManager.onModerationMuted(({ message }) => { toast.error(`🔇 ${message}`, { duration: 8000 }); showPush('Чимээгүйжүүлэгдлээ', message); });
    const unsubAttack  = socketManager.onAttackReceived((data) => {
      toast(`⚔️ ${data.attackerUsername} таныг ${data.damageDealt} damage-аар дайрлаа!`, { icon: '💥', duration: 5000 });
      showPush('Дайрагдлаа! ⚔️', `${data.attackerUsername} таныг ${data.damageDealt} damage-аар дайрлаа!`);
    });
    const unsubError   = socketManager.onError(({ message }) => toast.error(message));

    return () => { unsubOnline(); unsubWarn(); unsubMuted(); unsubAttack(); unsubError(); };
  }, [hasHydrated, isAuthenticated]);

  // Page route өөрчлөгдөхөд drawer хаана
  useEffect(() => { setMoreOpen(false); }, [pathname]);

  if (!hasHydrated) return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-50 border-b border-border glass h-14" />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <div className="space-y-4 animate-pulse">
          <div className="h-24 rounded-2xl bg-surface-2" />
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-surface-2" />)}
        </div>
      </main>
    </div>
  );

  if (!hasHydrated || !isAuthenticated) return null;

  const handleLogout = async () => {
    socketManager.disconnect();
    await logout();
    router.push('/login');
    toast.success('Амжилттай гарлаа');
  };

  // Desktop nav-д харуулах items (эхний 8)
  const DESKTOP_NAV = ALL_NAV.slice(0, 8);

  const groups = ALL_NAV.reduce((acc, item) => {
    const g = item.group ?? 'Бусад';
    if (!acc[g]) acc[g] = [];
    acc[g].push(item);
    return acc;
  }, {} as Record<string, typeof ALL_NAV>);

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* ── BACKGROUND ─────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="hero-bg-img" style={{ opacity: 0.13 }} />
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 80% 20%, rgba(220,20,20,0.12) 0%, transparent 50%)',
          animation: 'energyPulseRed 6s ease-in-out infinite',
        }} />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'linear-gradient(rgba(220,38,38,0.08) 1px, transparent 1px),linear-gradient(90deg, rgba(56,189,248,0.06) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }} />
        <div className="absolute inset-0 anime-scanlines opacity-15" />
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)',
        }} />
      </div>

      {/* ── TOP NAVBAR ───────────────────────────────── */}
      <header className="sticky top-0 z-50" style={{ background: 'linear-gradient(135deg, rgba(4,0,10,0.92) 0%, rgba(8,0,18,0.92) 60%, rgba(4,0,10,0.92) 100%)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(220,38,38,0.2)', boxShadow: '0 4px 24px rgba(0,0,0,0.5), inset 0 -1px 0 rgba(220,38,38,0.1)' }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 flex items-center gap-2">
          {/* Logo */}
          <Link href="/dashboard/profile" className="flex items-baseline gap-1.5 flex-shrink-0 mr-2 select-none">
            <span className="text-base font-black tracking-widest"
              style={{ fontFamily: 'var(--font-bangers)', background: 'linear-gradient(135deg, #ff4444, #dc2626)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', filter: 'drop-shadow(0 0 8px rgba(220,38,38,0.7))' }}>
              KURENAI
            </span>
            <span className="text-sm font-black" style={{ fontFamily: 'serif', background: 'linear-gradient(135deg, #ff6b35, #dc2626)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', filter: 'drop-shadow(0 0 6px rgba(220,38,38,0.6))' }}>
              紅
            </span>
          </Link>

          {/* Desktop nav — scroll хийж болно */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1 overflow-x-auto scrollbar-hide">
            {DESKTOP_NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex-shrink-0',
                    !active && 'text-white/60 hover:text-white hover:bg-white/[0.06]',
                  )}
                  style={active
                    ? { background: 'rgba(220,38,38,0.18)', color: '#f87171', border: '1px solid rgba(220,38,38,0.40)', boxShadow: '0 0 12px rgba(220,38,38,0.20)' }
                    : undefined}
                >
                  <item.Icon size={14} />
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              );
            })}
            {/* More dropdown */}
            <div className="relative flex-shrink-0" ref={moreRef}>
              <button
                onClick={() => setMoreOpen((v) => !v)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-white/60 hover:text-white hover:bg-white/[0.06]"
              >
                <MoreHorizontal size={15} />
                <span className="hidden lg:inline">Бусад</span>
              </button>
              <AnimatePresence>
                {moreOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.95 }}
                    className="absolute left-0 top-10 rounded-2xl shadow-2xl z-50 p-2 min-w-[180px]"
                    style={{ background: 'rgba(4,0,10,0.97)', backdropFilter: 'blur(20px)', border: '1px solid rgba(220,38,38,0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}
                  >
                    {ALL_NAV.slice(8).map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                        style={pathname.startsWith(item.href)
                          ? { background: 'rgba(139,92,246,0.20)', color: '#A78BFA' }
                          : { color: 'rgba(255,255,255,0.55)' }}
                      >
                        <item.Icon size={15} />
                        {item.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
            <div className="hidden sm:flex items-center gap-1.5 text-sm">
              <Star size={12} style={{ color: '#fbbf24' }} />
              <span className="font-bold text-xs" style={{ color: '#fbbf24' }}>{user?.characterPoints ?? 0}</span>
              <span className="hidden md:inline" style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
              <span className="font-medium text-xs hidden md:inline" style={{ color: 'rgba(255,255,255,0.7)' }}>{user?.username}</span>
            </div>
            <Link href="/dashboard/search" className="p-1.5 rounded-lg transition-colors hover:bg-white/10" title="Хайлт"
              style={{ color: 'rgba(255,255,255,0.65)' }}>
              <Search size={16} />
            </Link>
            <LoginStreakBadge />
            <NotificationBell />
            {user?.role !== 'USER' && (
              <Link href="/admin" className="hidden sm:block p-1.5 rounded-lg transition-colors"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.15)' }}>
                <ShieldCheck size={15} />
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg transition-colors"
              style={{ color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Гарах</span>
            </button>
          </div>
        </div>
      </header>

      {/* Email verification banner — dismissible */}
      {user && !(user as any).isEmailVerified && !bannerDismissed && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="flex items-center justify-between px-4 py-2"
          style={{ background: 'rgba(245,158,11,0.09)', borderBottom: '1px solid rgba(245,158,11,0.2)' }}
        >
          <span className="text-xs sm:text-sm font-medium flex items-center gap-1.5" style={{ color: 'rgba(251,191,36,0.9)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            Имэйл хаягаа баталгаажуулна уу —{' '}
            <a href="/dashboard/verify-email" className="underline font-black" style={{ color: '#fbbf24' }}>Баталгаажуулах</a>
          </span>
          <button onClick={dismissBanner} className="text-white/30 hover:text-white/70 transition-colors ml-3 text-lg leading-none flex-shrink-0">×</button>
        </motion.div>
      )}

      {/* ── MOBILE BOTTOM NAV ─────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 safe-bottom" style={{ background: 'rgba(4,0,10,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(220,38,38,0.20)', boxShadow: '0 -4px 24px rgba(0,0,0,0.6)' }}>
        <div className="flex">
          {PRIMARY_NAV.map((item) => (
            <Link key={item.href} href={item.href}
              className="flex-1 flex flex-col items-center justify-center py-2 text-[10px] gap-1 transition-all"
              style={{ color: pathname.startsWith(item.href) ? '#f87171' : 'rgba(255,255,255,0.45)', fontWeight: pathname.startsWith(item.href) ? 700 : 400 }}>
              <item.Icon size={20} />
              <span className="leading-tight">{item.label}</span>
            </Link>
          ))}
          <button onClick={() => setMoreOpen((v) => !v)}
            className="flex-1 flex flex-col items-center justify-center py-2 text-[10px] gap-1"
            style={{ color: moreOpen ? '#f87171' : 'rgba(255,255,255,0.45)' }}>
            <MoreHorizontal size={20} />
            <span className="leading-tight">Бусад</span>
          </button>
        </div>
      </nav>

      {/* ── MOBILE MORE DRAWER ──────────────────────────── */}
      <AnimatePresence>
        {moreOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/60 z-40"
              onClick={() => setMoreOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              className="md:hidden fixed bottom-16 left-0 right-0 z-40 rounded-t-3xl max-h-[75vh] overflow-y-auto"
            style={{ background: 'rgba(4,0,10,0.97)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(220,38,38,0.25)', boxShadow: '0 -8px 40px rgba(0,0,0,0.7)' }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-border rounded-full" />
              </div>

              {/* User info */}
              <div className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: '1px solid rgba(139,92,246,0.18)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-black text-white"
                  style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)', boxShadow: '0 0 12px rgba(220,38,38,0.5)' }}>
                  {user?.username?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div>
                  <p className="font-bold text-sm text-white">{user?.username}</p>
                  <p className="text-xs font-bold" style={{ color: '#fbbf24' }}>⭐ {user?.characterPoints ?? 0} CP</p>
                </div>
                {user?.role !== 'USER' && (
                  <Link href="/admin" className="ml-auto px-3 py-1.5 text-xs font-bold rounded-lg"
                    style={{ background: 'rgba(139,92,246,0.20)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.40)' }}>
                    🛡️ Admin
                  </Link>
                )}
              </div>

              {/* Nav groups */}
              <div className="p-4 space-y-4 pb-6">
                {Object.entries(groups).map(([group, items]) => (
                  <div key={group}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-2 px-1" style={{ color: '#a78bfa' }}>{group}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {items.map((item) => (
                        <Link key={item.href} href={item.href}
                          className="flex flex-col items-center gap-1.5 p-3 rounded-2xl text-center transition-all active:scale-95"
                          style={pathname.startsWith(item.href)
                            ? { background: 'rgba(139,92,246,0.25)', border: '1px solid rgba(139,92,246,0.5)', color: '#A78BFA', boxShadow: '0 0 12px rgba(139,92,246,0.18)' }
                            : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)' }}>
                          <item.Icon size={22} />
                          <span className="text-[10px] font-medium leading-tight">{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Logout */}
                <button onClick={handleLogout}
                  className="w-full py-3 text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>
                  <LogOut size={16} /> Гарах
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT ─────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6 pb-24 md:pb-6">
        {children}
      </main>
    </div>
  );
}
