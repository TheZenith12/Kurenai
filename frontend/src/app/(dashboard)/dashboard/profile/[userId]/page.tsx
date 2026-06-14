'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { mn } from 'date-fns/locale';
import { usersApi, characterApi } from '../../../../../lib/api';
import { useAuthStore } from '../../../../../store/auth.store';

const BACKEND = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3001';
const toAbsolute = (url: string) =>
  url && !url.startsWith('http') ? `${BACKEND}${url}` : url;

const EFFECT_STYLE: Record<string, string> = {
  FIRE:      'text-orange-400 [text-shadow:0_0_8px_rgba(255,100,0,0.95)]',
  LIGHTNING: 'text-yellow-300 [text-shadow:0_0_8px_rgba(255,220,0,0.95)]',
  DARK:      'text-purple-400 [text-shadow:0_0_8px_rgba(160,0,255,0.95)]',
  WATER:     'text-blue-400  [text-shadow:0_0_8px_rgba(0,180,255,0.95)]',
  WIND:      'text-green-400 [text-shadow:0_0_8px_rgba(80,255,100,0.95)]',
  SPIRIT:    'text-pink-400  [text-shadow:0_0_8px_rgba(255,100,200,0.95)]',
  RASENGAN:  'text-cyan-300  [text-shadow:0_0_8px_rgba(0,240,255,0.95)]',
  SHARINGAN: 'text-red-500   [text-shadow:0_0_8px_rgba(220,0,0,0.95)]',
  ICE:       'text-sky-200   [text-shadow:0_0_8px_rgba(150,220,255,0.95)]',
  LIGHT:     'text-yellow-100 [text-shadow:0_0_8px_rgba(255,255,180,0.95)]',
  EARTH:     'text-amber-600 [text-shadow:0_0_8px_rgba(200,120,0,0.80)]',
  VOID:      'text-gray-300  [text-shadow:0_0_8px_rgba(150,150,200,0.80)]',
};
const EFFECT_BADGE: Record<string, string> = {
  FIRE: '🔥', LIGHTNING: '⚡', DARK: '🌑', WATER: '💧', WIND: '🌪️',
  SPIRIT: '💗', RASENGAN: '🌀', SHARINGAN: '👁️', ICE: '❄️',
  LIGHT: '✨', EARTH: '🪨', VOID: '🕳️',
};

const TIER_COLORS: Record<string, string> = {
  Free: 'text-muted-foreground border-border',
  Bronze: 'text-amber-600 border-amber-600/40 bg-amber-600/10',
  Silver: 'text-slate-300 border-slate-400/40 bg-slate-400/10',
  Gold: 'text-yellow-400 border-yellow-400/40 bg-yellow-400/10',
  Platinum: 'text-cyan-300 border-cyan-400/40 bg-cyan-400/10',
  Premium: 'text-purple-400 border-purple-400/40 bg-purple-400/10',
};

function getTier(price: number, cp: number, isBase: boolean) {
  if (isBase) return 'Free';
  if (price > 0) return 'Premium';
  if (cp >= 2000) return 'Platinum';
  if (cp >= 500)  return 'Gold';
  if (cp >= 100)  return 'Silver';
  return 'Bronze';
}

export default function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const { user: me } = useAuthStore();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => usersApi.getProfile(userId),
    enabled: !!userId,
  });

  const { data: allAnimes = [] } = useQuery({
    queryKey: ['animes'],
    queryFn: characterApi.getAnimes,
  });

  // Redirect to own profile page if viewing self
  if (me?.id === userId) {
    router.replace('/dashboard/profile');
    return null;
  }

  if (profileLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
        <div className="h-32 rounded-2xl bg-surface-2" />
        <div className="h-24 rounded-2xl bg-surface-2" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-36 rounded-xl bg-surface-2" />)}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 text-muted-foreground">
        Хэрэглэгч олдсонгүй
      </div>
    );
  }

  // Find active character's skill effect for name glow
  const activeCharSkill: string = '';

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Буцах
      </button>

      {/* Profile card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-6 flex items-start gap-5"
        style={{ background: 'linear-gradient(135deg,rgba(220,38,38,0.1),rgba(0,0,0,0.7))', border: '1px solid rgba(220,38,38,0.2)' }}
      >
        {/* Avatar */}
        <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-border flex-shrink-0 bg-surface-2">
          {profile.avatarUrl ? (
            <img
              src={toAbsolute(profile.avatarUrl)}
              alt={profile.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl font-black text-primary bg-primary/10">
              {profile.username?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-black truncate">
            {profile.displayName ?? profile.username}
          </h1>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>

          {profile.systemId && (
            <p className="text-xs text-muted-foreground/60 mt-0.5">#{profile.systemId}</p>
          )}

          <div className="flex flex-wrap gap-2 mt-3">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-accent/15 text-accent border border-accent/30">
              ⭐ {profile.characterPoints ?? 0} CP
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-surface-2 border border-border text-muted-foreground">
              🎭 {profile._count?.ownedCharacters ?? 0} дүр
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-surface-2 border border-border text-muted-foreground">
              💬 {profile.reputation ?? 100} rep
            </span>
          </div>

          {profile.createdAt && (
            <p className="text-xs text-muted-foreground/50 mt-2">
              {formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true, locale: mn })} нэгдсэн
            </p>
          )}
        </div>
      </motion.div>

      {/* Character showcase — anime they're in */}
      {(allAnimes as any[]).length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-xs text-white/30 uppercase tracking-widest font-bold mb-4">🎭 Дүрийн цуглуулга</p>
          {(profile._count?.ownedCharacters ?? 0) === 0 ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">🎭</p>
              <p className="text-white/40 text-sm">Одоогоор дүр байхгүй байна</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {(allAnimes as any[]).slice(0, 8).map((anime: any, i: number) => (
                <motion.div key={anime.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-xl overflow-hidden aspect-[3/4] relative"
                  style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                  <img src={anime.imageUrl} alt={anime.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.7) 0%,transparent 60%)' }} />
                  <p className="absolute bottom-1.5 left-1.5 right-1.5 text-[9px] font-black text-white leading-tight truncate">{anime.name}</p>
                </motion.div>
              ))}
              {(profile._count?.ownedCharacters ?? 0) > 8 && (
                <div className="rounded-xl aspect-[3/4] flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-white/40 font-black text-sm">+{(profile._count?.ownedCharacters ?? 0) - 8}</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
