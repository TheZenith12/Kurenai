'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usersApi, animeApi } from '../../../../lib/api';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { SkeletonList, SkeletonGrid } from '../../../../components/ui/Skeleton';
import clsx from 'clsx';

type Tab = 'users' | 'anime';

function useDebounce(value: string, ms = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<Tab>('users');
  const debouncedQ = useDebounce(q);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const { data: users = [], isFetching: uFetching } = useQuery({
    queryKey: ['search-users', debouncedQ],
    queryFn: () => usersApi.search(debouncedQ),
    enabled: debouncedQ.length >= 2 && tab === 'users',
  });

  const { data: allAnime = [], isLoading: aLoading } = useQuery({
    queryKey: ['all-anime'],
    queryFn: animeApi.getAll,
    enabled: tab === 'anime',
  });

  const filteredAnime = (allAnime as any[]).filter((a: any) =>
    !debouncedQ || a.name.toLowerCase().includes(debouncedQ.toLowerCase()),
  );

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <PageHeader pill="🔍 ХАЙЛТ" title="Хайлт" subtitle="Хэрэглэгч эсвэл аниме хайна уу" accent="cyan" />

      {/* Search input */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-lg pointer-events-none">🔍</span>
        <input
          ref={inputRef}
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={tab === 'users' ? 'Хэрэглэгчийн нэр хайх...' : 'Анимений нэр хайх...'}
          className="focus-ring w-full pl-11 pr-10 py-3.5 rounded-2xl text-white placeholder:text-white/30 text-sm font-medium"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
        />
        <AnimatePresence>
          {q && (
            <motion.button
              initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }}
              onClick={() => { setQ(''); inputRef.current?.focus(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white/50 hover:text-white transition-all text-xs flex items-center justify-center">
              ✕
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'users' as Tab, label: 'Хэрэглэгчид', icon: '👤' },
          { key: 'anime' as Tab, label: 'Аниме',       icon: '🎌' },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={clsx('tab-pill flex items-center gap-1.5', t.key === tab ? 'tab-pill-active' : 'tab-pill-inactive')}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Users results */}
      {tab === 'users' && (
        <div className="space-y-2">
          {debouncedQ.length < 2 ? (
            <EmptyState icon="🔎" title="Хэрэглэгч хайх" description="Хайлт эхлүүлэхийн тулд дор хаяж 2 тэмдэгт оруулна уу" />
          ) : uFetching ? (
            <SkeletonList rows={5} />
          ) : (users as any[]).length === 0 ? (
            <EmptyState icon="😔" title="Илэрц олдсонгүй" description={`«${debouncedQ}» нэртэй хэрэглэгч олдсонгүй`} />
          ) : (
            <AnimatePresence mode="popLayout">
              {(users as any[]).map((u: any, i: number) => (
                <motion.div key={u.id} layout
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.04 }}>
                  <Link href={`/dashboard/profile/${u.id}`}
                    className="hover-row flex items-center gap-3 p-4 rounded-2xl group"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black text-white flex-shrink-0 overflow-hidden"
                      style={{ background: 'linear-gradient(135deg,#dc2626,#7c3aed)', boxShadow: '0 0 12px rgba(220,38,38,0.4)' }}>
                      {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" /> : u.username?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-white group-hover:text-primary transition-colors truncate">{u.displayName ?? u.username}</p>
                      <p className="text-sm text-white/40 truncate">@{u.username}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold text-amber-400">⭐ {u.reputation}</p>
                      <p className="text-[10px] text-white/30 mt-0.5">Нэр хүнд</p>
                    </div>
                    <span className="text-white/20 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all ml-1">→</span>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      )}

      {/* Anime results */}
      {tab === 'anime' && (
        <div>
          {aLoading ? (
            <SkeletonGrid count={6} />
          ) : filteredAnime.length === 0 ? (
            <EmptyState icon="🎌" title="Аниме олдсонгүй" description={debouncedQ ? `«${debouncedQ}» олдсонгүй` : undefined} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredAnime.map((a: any, i: number) => (
                <motion.div key={a.id}
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}>
                  <Link href={`/dashboard/chat`}
                    className="card-interactive block rounded-2xl overflow-hidden group relative"
                    style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="aspect-[3/4] relative">
                      <img src={a.imageUrl} alt={a.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.85) 0%,transparent 50%)' }} />
                    </div>
                    <div className="p-3 absolute bottom-0 left-0 right-0">
                      <p className="font-black text-white text-sm leading-tight">{a.name}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
