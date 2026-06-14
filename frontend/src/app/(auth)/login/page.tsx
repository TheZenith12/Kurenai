'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../../store/auth.store';
import { useHasHydrated } from '../../../hooks/useHasHydrated';
import { socketManager } from '../../../lib/socket';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, isAuthenticated } = useAuthStore();
  const hasHydrated = useHasHydrated();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Аль хэдийн нэвтэрсэн бол dashboard руу явуулна
  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      router.replace('/dashboard/profile');
    }
  }, [hasHydrated, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUsername.trim() || !password) return;
    try {
      await login(emailOrUsername.trim(), password);
      socketManager.connect();
      toast.success('Амжилттай нэвтэрлээ!');
      router.push('/dashboard/profile');
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Нэвтрэхэд алдаа гарлаа');
    }
  };

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">

      {/* ── Left decorative panel (desktop) ── */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] relative overflow-hidden bg-surface border-r border-border p-12">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-80 h-80 bg-primary/15 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-0 w-60 h-60 bg-blue-600/10 rounded-full blur-[80px]" />
        </div>

        {/* Logo */}
        <Link href="/" className="relative z-10 text-2xl font-black glow-text">
          ⚡ ANIME PLATFORM
        </Link>

        {/* Center content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-7xl mb-6">⚔️</div>
            <h2 className="text-3xl font-black mb-4 leading-tight">
              Тулалдаан<br />
              <span className="glow-text">дуусаагүй</span>
            </h2>
            <p className="text-muted-foreground text-base mb-8">
              Буцаж нэвтэрч, Season дахь байрандаа тулалдаарай.
            </p>

            {/* Mini feature list */}
            <div className="space-y-3">
              {[
                { icon: '⚔️', text: 'PvP Season тулалдаан' },
                { icon: '🎭', text: '20+ anime дүр' },
                { icon: '💬', text: 'Бодит цагийн чат' },
                { icon: '🏆', text: 'Leaderboard шагнал' },
              ].map((f) => (
                <div key={f.text} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{f.icon}</span>
                  <span>{f.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom */}
        <div className="relative z-10 text-xs text-muted-foreground/50">
          © 2026 Anime Platform
        </div>
      </div>

      {/* ── Right: Login form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative">
        {/* Mobile logo */}
        <Link href="/" className="lg:hidden text-xl font-black glow-text mb-10">
          ⚡ ANIME PLATFORM
        </Link>

        {/* Ambient */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 right-0 w-64 h-64 bg-primary/8 rounded-full blur-[80px]" />
          <div className="absolute bottom-1/4 left-0 w-48 h-48 bg-blue-600/6 rounded-full blur-[60px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-sm"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-black mb-1.5">Нэвтрэх</h1>
            <p className="text-muted-foreground text-sm">Акаунтдаа нэвтрэж үргэлжлүүлээрэй</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email / username */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Имэйл эсвэл хэрэглэгчийн нэр
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-base select-none">
                  👤
                </span>
                <input
                  type="text"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  placeholder="naruto@mail.mn эсвэл naruto_fan"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-surface-2 border border-border rounded-xl text-foreground placeholder-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Нууц үг</label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Нууц үг мартсан?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-base select-none">
                  🔑
                </span>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-12 py-3 bg-surface-2 border border-border rounded-xl text-foreground placeholder-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-sm"
                  tabIndex={-1}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !emailOrUsername.trim() || !password}
              className="w-full py-3.5 mt-2 bg-primary hover:bg-primary-glow disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-200 hover:shadow-glow-purple active:scale-95 flex items-center justify-center gap-2 text-sm"
            >
              {isLoading ? (
                <>
                  <div className="anime-spinner w-4 h-4" />
                  Нэвтэрч байна...
                </>
              ) : (
                '⚡ Нэвтрэх'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">эсвэл</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Register link */}
          <Link
            href="/register"
            className="block w-full py-3.5 text-center font-semibold border border-border hover:border-primary/40 text-muted-foreground hover:text-foreground rounded-xl transition-all duration-200 text-sm hover:bg-surface-2"
          >
            🚀 Шинэ бүртгэл үүсгэх
          </Link>

          {/* Demo hint */}
          <div className="mt-6 p-4 rounded-xl bg-surface border border-border/60">
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              🛡️ Demo admin:{' '}
              <span className="text-accent font-mono">superadmin@animeplatform.mn</span>
              <br />
              <span className="text-accent font-mono">Admin@12345</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
