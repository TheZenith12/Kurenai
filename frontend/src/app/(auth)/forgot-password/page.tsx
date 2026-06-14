'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { authApi } from '../../../lib/api';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'request' | 'done'>('request');
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUsername.trim()) return;

    setIsLoading(true);
    try {
      const data = await authApi.forgotPassword(emailOrUsername.trim()) as any;
      // Dev mode-д кодыг шууд харуулна
      if (data.devCode) {
        setDevCode(data.devCode);
      }
      setStep('done');
      toast.success('Reset код үүслээ!');
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Алдаа гарлаа');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-accent-blue/8 rounded-full blur-[60px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Logo */}
        <Link href="/" className="block text-center text-xl font-black glow-text mb-8">
          ⚡ ANIME PLATFORM
        </Link>

        <div className="bg-surface border border-border rounded-2xl p-8">
          {step === 'request' ? (
            <>
              <div className="text-center mb-6">
                <div className="text-5xl mb-3">🔐</div>
                <h1 className="text-2xl font-black mb-1">Нууц үг мартсан</h1>
                <p className="text-sm text-muted-foreground">
                  Имэйл эсвэл хэрэглэгчийн нэрийг оруулна уу
                </p>
              </div>

              <form onSubmit={handleRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Имэйл эсвэл хэрэглэгчийн нэр
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground select-none">
                      📧
                    </span>
                    <input
                      type="text"
                      value={emailOrUsername}
                      onChange={(e) => setEmailOrUsername(e.target.value)}
                      placeholder="naruto@mail.mn эсвэл naruto_fan"
                      required
                      autoFocus
                      className="w-full pl-11 pr-4 py-3 bg-surface-2 border border-border rounded-xl text-foreground placeholder-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !emailOrUsername.trim()}
                  className="w-full py-3.5 bg-primary hover:bg-primary-glow disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-200 hover:shadow-glow-purple active:scale-95 flex items-center justify-center gap-2 text-sm"
                >
                  {isLoading ? (
                    <><div className="anime-spinner w-4 h-4" /> Шалгаж байна...</>
                  ) : '🔑 Reset код авах'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="text-5xl mb-3">✅</div>
                <h1 className="text-2xl font-black mb-1">Код бэлэн боллоо!</h1>
                <p className="text-sm text-muted-foreground">
                  6 оронтой кодоо оруулж нууц үгийг шинэчлэнэ үү
                </p>
              </div>

              {/* Dev mode: код шууд харуулах */}
              {devCode && (
                <div className="mb-4 p-4 bg-accent/10 border border-accent/30 rounded-xl text-center">
                  <p className="text-xs text-muted-foreground mb-1">🛠️ Dev mode — таны reset код:</p>
                  <p className="text-3xl font-black font-mono tracking-widest text-accent">{devCode}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    (Production-д имэйлээр ирнэ)
                  </p>
                </div>
              )}

              <Link
                href={devCode ? `/reset-password?code=${devCode}` : '/reset-password'}
                className="block w-full py-3.5 bg-primary text-white font-bold rounded-xl text-center hover:bg-primary-glow transition-all hover:shadow-glow-purple active:scale-95 text-sm"
              >
                🔄 Нууц үг шинэчлэх →
              </Link>
            </>
          )}

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Нэвтрэх хуудас руу буцах
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
