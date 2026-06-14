'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { watchlistApi, animeApi } from '../../../../lib/api';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { SkeletonGrid } from '../../../../components/ui/Skeleton';
import clsx from 'clsx';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  PLANNING:  { label: 'Төлөвлөж байна', color: '#6b7280', bg: 'rgba(107,114,128,0.15)', icon: '📋' },
  WATCHING:  { label: 'Үзэж байна',     color: '#06b6d4', bg: 'rgba(6,182,212,0.15)',   icon: '▶️' },
  COMPLETED: { label: 'Дууссан',        color: '#10b981', bg: 'rgba(16,185,129,0.15)',  icon: '✅' },
  DROPPED:   { label: 'Орхисон',        color: '#ef4444', bg: 'rgba(239,68,68,0.15)',   icon: '🚫' },
};

const STATUS_ORDER = ['WATCHING', 'PLANNING', 'COMPLETED', 'DROPPED'];

type ActiveTab = 'watchlist' | 'add';

export default function WatchlistPage() {
  const [tab, setTab] = useState<ActiveTab>('watchlist');
  const qc = useQueryClient();

  const { data: watchlist = [], isLoading: wLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: watchlistApi.getAll,
  });

  const { data: allAnime = [], isLoading: aLoading } = useQuery({
    queryKey: ['all-anime'],
    queryFn: animeApi.getAll,
    enabled: tab === 'add',
  });

  const addMut = useMutation({
    mutationFn: ({ animeId, status }: { animeId: string; status: string }) =>
      watchlistApi.add(animeId, status),
    onSuccess: () => {
      toast.success('Watchlist-д нэмэгдлээ!');
      qc.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });

  const removeMut = useMutation({
    mutationFn: (animeId: string) => watchlistApi.remove(animeId),
    onSuccess: () => {
      toast.success('Устгагдлаа');
      qc.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ animeId, status }: { animeId: string; status: string }) =>
      watchlistApi.add(animeId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watchlist'] }),
  });

  const watchedIds = new Set((watchlist as any[]).map((w: any) => w.animeId));

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <PageHeader
        pill="📺 ЖАГСААЛТ"
        title="Анимэ жагсаалт"
        subtitle={`${(watchlist as any[]).length} анимэ жагсаалтад байна`}
        accent="cyan"
      />

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'watchlist' as ActiveTab, label: 'Миний жагсаалт', icon: '📺' },
          { key: 'add'       as ActiveTab, label: 'Нэмэх',          icon: '➕' },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={clsx('tab-pill flex items-center gap-1.5', t.key === tab ? 'tab-pill-active' : 'tab-pill-inactive')}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* My watchlist */}
      {tab === 'watchlist' && (
        <div>
          {wLoading ? (
            <SkeletonGrid count={6} />
          ) : (watchlist as any[]).length === 0 ? (
            <EmptyState
              icon="📺"
              title="Жагсаалт хоосон байна"
              description="Дуртай анимэгээ нэмж, үзэх төлөвлөгөөгөө хөтлөөрэй"
              action={
                <button onClick={() => setTab('add')}
                  className="btn-sheen px-5 py-2.5 rounded-xl text-sm font-black text-white"
                  style={{ background: 'linear-gradient(135deg,#0e7490,#06b6d4)', boxShadow: '0 4px 18px rgba(6,182,212,0.35)' }}>
                  ➕ Анимэ нэмэх
                </button>
              }
            />
          ) : (
            <div className="space-y-5">
              {STATUS_ORDER.map((status) => {
                const items = (watchlist as any[]).filter((w: any) => w.status === status);
                if (items.length === 0) return null;
                const cfg = STATUS_CONFIG[status];
                return (
                  <div key={status}>
                    <div className="flex items-center gap-2 mb-3">
                      <span>{cfg.icon}</span>
                      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: cfg.color }}>{cfg.label}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full font-black" style={{ background: cfg.bg, color: cfg.color }}>{items.length}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {items.map((w: any) => (
                        <motion.div key={w.id} layout className="hover-lift group rounded-2xl overflow-hidden relative"
                          style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                          <div className="aspect-[3/4] relative">
                            <img src={w.anime?.imageUrl} alt={w.anime?.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.85) 0%,transparent 50%)' }} />
                          </div>
                          <div className="p-2.5">
                            <p className="font-black text-white text-xs leading-tight truncate">{w.anime?.name}</p>
                            {/* Status selector */}
                            <select
                              value={w.status}
                              onChange={(e) => updateMut.mutate({ animeId: w.animeId, status: e.target.value })}
                              className="mt-1.5 w-full text-[10px] font-bold rounded-lg px-2 py-1 outline-none appearance-none"
                              style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                              {Object.entries(STATUS_CONFIG).map(([s, sc]) => (
                                <option key={s} value={s}>{sc.icon} {sc.label}</option>
                              ))}
                            </select>
                          </div>
                          <button
                            onClick={() => removeMut.mutate(w.animeId)}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white/60 hover:text-white hover:bg-red-500/80 transition-all text-xs opacity-0 group-hover:opacity-100 flex items-center justify-center">
                            ✕
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add anime */}
      {tab === 'add' && (
        <div>
          {aLoading ? (
            <SkeletonGrid count={9} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(allAnime as any[]).map((a: any, i: number) => {
                const inList = watchedIds.has(a.id);
                return (
                  <motion.div key={a.id}
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover-lift group rounded-2xl overflow-hidden relative"
                    style={{ border: `1px solid ${inList ? 'rgba(6,182,212,0.4)' : 'rgba(255,255,255,0.08)'}` }}>
                    <div className="aspect-[3/4] relative">
                      <img src={a.imageUrl} alt={a.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.85) 0%,transparent 50%)' }} />
                      {inList && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center text-xs">✓</div>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="font-black text-white text-xs leading-tight truncate mb-2">{a.name}</p>
                      <button
                        onClick={() => inList
                          ? removeMut.mutate(a.id)
                          : addMut.mutate({ animeId: a.id, status: 'PLANNING' })}
                        disabled={addMut.isPending || removeMut.isPending}
                        className="w-full py-1.5 rounded-lg text-[10px] font-black transition-all active:scale-95"
                        style={inList
                          ? { background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }
                          : { background: 'rgba(6,182,212,0.15)', color: '#67e8f9', border: '1px solid rgba(6,182,212,0.3)' }}>
                        {inList ? '✕ Хасах' : '+ Нэмэх'}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
