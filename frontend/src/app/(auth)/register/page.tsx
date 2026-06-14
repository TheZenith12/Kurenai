'use client';

import { useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import { authApi } from '../../../lib/api';
import { useAuthStore } from '../../../store/auth.store';

// ── Field component тодорхойлолт нь RegisterPage-с ГАДНА байна ──
// Функц дотор тодорхойлвол keystroke бүрт remount хийж focus алддаг.
interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder: string;
  required?: boolean;
  icon?: string;
  hint?: string;
}

const Field = memo(function Field({
  label, value, onChange, type = 'text', placeholder, required = true, icon = '✏️', hint,
}: FieldProps) {
  const [showPass, setShowPass] = useState(false);
  const isPassword = type === 'password';

  return (
    <div>
      <label className="block text-sm font-medium mb-2 text-foreground/90">{label}</label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base select-none text-muted-foreground">
          {icon}
        </span>
        <input
          type={isPassword && showPass ? 'text' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          autoComplete={isPassword ? 'new-password' : type === 'email' ? 'email' : 'off'}
          className="w-full pl-11 pr-11 py-3 bg-surface-2 border border-border rounded-xl text-foreground placeholder-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors text-sm"
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPass((v) => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            {showPass ? '🙈' : '👁️'}
          </button>
        )}
      </div>
      {hint && <p className="mt-1.5 text-xs text-muted-foreground/70">{hint}</p>}
    </div>
  );
});

// ── Main page ──
export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Нууц үг таарахгүй байна');
      return;
    }
    if (password.length < 8) {
      toast.error('Нууц үг доод тал нь 8 тэмдэгт байна');
      return;
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      toast.error('Нууц үгэнд том үсэг, жижиг үсэг, тоо байх ёстой');
      return;
    }

    setIsLoading(true);
    try {
      const data = await authApi.register({
        email,
        username,
        displayName: displayName || undefined,
        password,
      }) as any;

      Cookies.set('access_token', data.accessToken, { expires: 1 / 96 });
      Cookies.set('refresh_token', data.refreshToken, { expires: 7 });

      // Auth store-д хэрэглэгч оруулах
      if (data.user) {
        setUser(data.user);
      }

      toast.success('Бүртгэл амжилттай үүслээ! 🎉');
      router.push('/dashboard/profile?onboarding=true');
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Бүртгэхэд алдаа гарлаа');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">

      {/* ── Left decorative panel (desktop) ── */}
      <div className="hidden lg:flex flex-col justify-between w-[42%] relative overflow-hidden bg-surface border-r border-border p-12">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/15 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/3 left-0 w-60 h-60 bg-accent/8 rounded-full blur-[80px]" />
        </div>

        <Link href="/" className="relative z-10 text-2xl font-black glow-text">
          ⚡ ANIME PLATFORM
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative z-10"
        >
          <div className="text-7xl mb-6">🎭</div>
          <h2 className="text-3xl font-black mb-4 leading-tight">
            Anime world-д<br />
            <span className="glow-text">тавтай морил</span>
          </h2>
          <p className="text-muted-foreground mb-8">
            Нэг дүр үнэгүй авна. Season-д шууд оролцоно.
          </p>

          {/* Perks */}
          <div className="space-y-3.5">
            {[
              { icon: '✅', text: 'Бүртгэл 100% үнэгүй' },
              { icon: '🎁', text: '1 үнэгүй anime дүр шууд авна' },
              { icon: '⚔️', text: 'PvP Season-д нэн даруй оролцоно' },
              { icon: '💬', text: 'Community chat руу нэвтэрнэ' },
              { icon: '🏆', text: 'Season ялбал Character Point авна' },
            ].map((p) => (
              <div key={p.text} className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="text-base">{p.icon}</span>
                <span>{p.text}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="relative z-10 text-xs text-muted-foreground/50">
          © 2026 Anime Platform
        </div>
      </div>

      {/* ── Right: Register form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative overflow-y-auto">
        {/* Mobile logo */}
        <Link href="/" className="lg:hidden text-xl font-black glow-text mb-8">
          ⚡ ANIME PLATFORM
        </Link>

        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/8 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-accent/6 rounded-full blur-[60px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-sm"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-black mb-1.5">Бүртгүүлэх</h1>
            <p className="text-muted-foreground text-sm">Шинэ акаунт үүсгэж anime world-д нэгд</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field
              label="Имэйл хаяг *"
              value={email}
              onChange={setEmail}
              type="email"
              placeholder="naruto@mail.mn"
              icon="📧"
            />
            <Field
              label="Хэрэглэгчийн нэр * (a-z, 0-9, _)"
              value={username}
              onChange={setUsername}
              placeholder="naruto_fan_99"
              icon="🎌"
              hint="Зөвхөн латин үсэг, тоо, доогуур зураас"
            />
            <Field
              label="Нэвтрэх нэр (заавал биш)"
              value={displayName}
              onChange={setDisplayName}
              placeholder="Naruto Fan"
              required={false}
              icon="✨"
            />
            <Field
              label="Нууц үг * (8+ тэмдэгт)"
              value={password}
              onChange={setPassword}
              type="password"
              placeholder="••••••••"
              icon="🔑"
              hint="Том үсэг + жижиг үсэг + тоо агуулах ёстой"
            />
            <Field
              label="Нууц үг давтах *"
              value={confirmPassword}
              onChange={setConfirmPassword}
              type="password"
              placeholder="••••••••"
              icon="🔒"
            />

            {/* Info box */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-xs text-muted-foreground leading-relaxed">
                🎮 <span className="text-foreground font-medium">Бүртгүүлсний дараа:</span>
                {' '}үнэгүй дүр сонгоод PvP, chat, mini game-д шууд оролцоорой!
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !username || !password || !confirmPassword}
              className="w-full py-3.5 bg-primary hover:bg-primary-glow disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-200 hover:shadow-glow-purple active:scale-95 flex items-center justify-center gap-2 text-sm"
            >
              {isLoading ? (
                <>
                  <div className="anime-spinner w-4 h-4" />
                  Бүртгэж байна...
                </>
              ) : (
                '🚀 Бүртгүүлэх'
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">аль хэдийн бүртгэлтэй юу?</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <Link
            href="/login"
            className="block w-full py-3.5 text-center font-semibold border border-border hover:border-primary/40 text-muted-foreground hover:text-foreground rounded-xl transition-all duration-200 text-sm hover:bg-surface-2"
          >
            ⚡ Нэвтрэх
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
