'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { authApi } from '../../../../lib/api';
import { useAuthStore } from '../../../../store/auth.store';

export default function VerifyEmailPage() {
  const { user, setUser } = useAuthStore();
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);

  const sendMutation = useMutation({
    mutationFn: authApi.sendVerification,
    onSuccess: (data: any) => {
      setCodeSent(true);
      toast.success('Баталгаажуулах код илгээгдлээ!');
      if (data.devCode) {
        setDevCode(data.devCode);
        toast(`Dev code: ${data.devCode}`, { icon: '🔑', duration: 10000 });
      }
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Алдаа гарлаа'),
  });

  const verifyMutation = useMutation({
    mutationFn: () => authApi.verifyEmail(code),
    onSuccess: () => {
      toast.success('Имэйл амжилттай баталгаажлаа!');
      if (user) setUser({ ...user, isEmailVerified: true });
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Код буруу байна'),
  });

  if (user?.isEmailVerified) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="text-6xl">✅</div>
        <h2 className="text-2xl font-black">Имэйл баталгаажсан!</h2>
        <p className="text-muted-foreground">Таны имэйл хаяг амжилттай баталгаажсан байна.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6 pt-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface border border-border rounded-2xl p-6 space-y-5"
      >
        <div className="text-center">
          <div className="text-5xl mb-3">📧</div>
          <h2 className="text-xl font-black">Имэйл баталгаажуулах</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {user?.email ?? 'Таны имэйл'} хаягт 6 оронтой код илгээнэ
          </p>
        </div>

        {!codeSent ? (
          <button
            onClick={() => sendMutation.mutate()}
            disabled={sendMutation.isPending}
            className="w-full py-3 bg-primary/20 text-primary border border-primary/30 rounded-xl font-bold hover:bg-primary/30 disabled:opacity-50 transition-colors"
          >
            {sendMutation.isPending ? '...' : '📨 Код илгээх'}
          </button>
        ) : (
          <div className="space-y-3">
            {devCode && (
              <div className="p-3 bg-accent/10 border border-accent/30 rounded-xl text-center">
                <p className="text-xs text-muted-foreground">Dev mode код:</p>
                <p className="text-2xl font-black tracking-widest text-accent">{devCode}</p>
              </div>
            )}
            <div>
              <label className="text-xs text-muted-foreground font-medium">6 оронтой код</label>
              <input
                className="w-full mt-1 px-4 py-3 bg-surface-2 border border-border rounded-xl text-center text-xl font-black tracking-widest focus:outline-none focus:border-primary transition-colors"
                placeholder="000000"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </div>
            <button
              onClick={() => verifyMutation.mutate()}
              disabled={code.length !== 6 || verifyMutation.isPending}
              className="w-full py-3 bg-accent-green/20 text-accent-green border border-accent-green/30 rounded-xl font-bold hover:bg-accent-green/30 disabled:opacity-50 transition-colors"
            >
              {verifyMutation.isPending ? '...' : '✓ Баталгаажуулах'}
            </button>
            <button
              onClick={() => sendMutation.mutate()}
              disabled={sendMutation.isPending}
              className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Код ирсэнгүй? Дахин илгээх
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
