'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { authApi } from '../../../lib/api';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillCode = searchParams.get('code') ?? '';

  const [resetCode, setResetCode] = useState(prefillCode);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (resetCode.length !== 6 || !/^\d+$/.test(resetCode)) {
      toast.error('6 оронтой тоон код оруулна уу');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Нууц үг таарахгүй байна');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Нууц үг доод тал нь 8 тэмдэгт байна');
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      toast.error('Нууц үгэнд том үсэг, жижиг үсэг, тоо байх ёстой');
      return;
    }

    setIsLoading(true);
    try {
      const data = await authApi.resetPassword(resetCode, newPassword) as any;
      toast.success(data.message ?? 'Нууц үг амжилттай шинэчлэгдлээ!');
      setTimeout(() => router.push('/login'), 1500);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Алдаа гарлаа');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full pl-11 pr-11 py-3 bg-surface-2 border border-border rounded-xl text-foreground placeholder-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors text-sm";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-accent-blue/8 rounded-full blur-[60px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm"
      >
        <Link href="/" className="block text-center text-xl font-black glow-text mb-8">
          ⚡ ANIME PLATFORM
        </Link>

        <div className="bg-surface border border-border rounded-2xl p-8">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🔄</div>
            <h1 className="text-2xl font-black mb-1">Нууц үг шинэчлэх</h1>
            <p className="text-sm text-muted-foreground">
              Reset кодоо болон шинэ нууц үгийг оруулна уу
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Reset code */}
            <div>
              <label className="block text-sm font-medium mb-2">6 оронтой reset код</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground select-none">
                  🔢
                </span>
                <input
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  required
                  autoFocus={!prefillCode}
                  className={inputClass}
                />
                {resetCode.length === 6 && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-accent-green text-sm">✓</span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                "Нууц үг мартсан" хуудаснаас авсан кодоо оруулна уу
              </p>
            </div>

            {/* New password */}
            <div>
              <label className="block text-sm font-medium mb-2">Шинэ нууц үг</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground select-none">🔑</span>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  className={inputClass}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-sm"
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Том үсэг + жижиг үсэг + тоо (8+ тэмдэгт)</p>
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium mb-2">Нууц үг давтах</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground select-none">🔒</span>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  className={inputClass}
                />
                {confirmPassword && (
                  <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-sm ${confirmPassword === newPassword ? 'text-accent-green' : 'text-accent-red'}`}>
                    {confirmPassword === newPassword ? '✓' : '✗'}
                  </span>
                )}
              </div>
            </div>

            {/* Password strength indicator */}
            {newPassword && (
              <div className="space-y-1">
                {[
                  { check: newPassword.length >= 8, label: '8+ тэмдэгт' },
                  { check: /[A-Z]/.test(newPassword), label: 'Том үсэг' },
                  { check: /[a-z]/.test(newPassword), label: 'Жижиг үсэг' },
                  { check: /[0-9]/.test(newPassword), label: 'Тоо' },
                ].map(({ check, label }) => (
                  <div key={label} className="flex items-center gap-2 text-xs">
                    <span className={check ? 'text-accent-green' : 'text-muted-foreground'}>
                      {check ? '✓' : '○'}
                    </span>
                    <span className={check ? 'text-accent-green' : 'text-muted-foreground'}>{label}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={
                isLoading ||
                resetCode.length !== 6 ||
                !newPassword ||
                !confirmPassword ||
                newPassword !== confirmPassword
              }
              className="w-full py-3.5 mt-2 bg-primary hover:bg-primary-glow disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-200 hover:shadow-glow-purple active:scale-95 flex items-center justify-center gap-2 text-sm"
            >
              {isLoading ? (
                <><div className="anime-spinner w-4 h-4" /> Шинэчилж байна...</>
              ) : '✅ Нууц үг шинэчлэх'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <Link href="/forgot-password" className="text-sm text-muted-foreground hover:text-foreground transition-colors block">
              ← Шинэ код авах
            </Link>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors block">
              Нэвтрэх хуудас руу буцах
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// useSearchParams нь Suspense шаарддаг
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="anime-spinner w-10 h-10" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
