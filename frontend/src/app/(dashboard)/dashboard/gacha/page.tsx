'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { gachaApi } from '../../../../lib/api';
import { useAuthStore } from '../../../../store/auth.store';
import clsx from 'clsx';

const RARITY_STYLE: Record<string, { label: string; color: string; bg: string; glow: string }> = {
  R:   { label: 'R',   color: 'text-gray-300',  bg: 'bg-gray-500/20',   glow: '' },
  SR:  { label: 'SR',  color: 'text-blue-400',  bg: 'bg-blue-500/20',   glow: 'shadow-[0_0_20px_rgba(96,165,250,0.5)]' },
  SSR: { label: 'SSR', color: 'text-amber-400', bg: 'bg-amber-500/20',  glow: 'shadow-[0_0_30px_rgba(251,191,36,0.6)]' },
};

function RollResultCard({ result, delay }: { result: any; delay: number }) {
  const rarity = RARITY_STYLE[result.rarity] ?? RARITY_STYLE.R;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, rotateY: 180 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{ delay, duration: 0.5, type: 'spring' }}
      className={clsx('relative rounded-2xl border p-4 text-center', rarity.bg, rarity.glow,
        result.rarity === 'SSR' ? 'border-amber-400/50' : result.rarity === 'SR' ? 'border-blue-400/50' : 'border-border')}
    >
      {result.isNew && (
        <span className="absolute -top-2 -right-2 text-xs bg-accent-green text-background px-1.5 py-0.5 rounded-full font-black">NEW</span>
      )}
      <div className="relative">
        <img
          src={result.character?.avatarUrl || '/placeholder.png'}
          alt={result.character?.name}
          className={clsx('w-20 h-20 object-cover rounded-xl mx-auto', result.rarity === 'SSR' && 'ring-2 ring-amber-400/60')}
          onError={(e) => { (e.target as HTMLImageElement).src = ''; }}
        />
        {result.rarity === 'SSR' && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-xl border-2 border-amber-400/30 pointer-events-none"
          />
        )}
      </div>
      <p className="font-black text-sm mt-2 truncate">{result.character?.name}</p>
      <span className={clsx('text-xs font-black', rarity.color)}>{rarity.label}</span>
    </motion.div>
  );
}

export default function GachaPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [results, setResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedPool, setSelectedPool] = useState<string | null>(null);

  const { data: pools = [], isLoading } = useQuery({
    queryKey: ['gacha-pools'],
    queryFn: gachaApi.getPools,
  });

  const { data: pityData } = useQuery({
    queryKey: ['gacha-pity', selectedPool],
    queryFn: () => gachaApi.getPity(selectedPool!),
    enabled: !!selectedPool,
  });

  const rollMutation = useMutation({
    mutationFn: ({ poolId, count }: { poolId: string; count: 1 | 10 }) =>
      gachaApi.roll(poolId, count),
    onSuccess: (data: any[]) => {
      setResults(data);
      setShowResults(true);
      queryClient.invalidateQueries({ queryKey: ['gacha-pity'] });
      const ssrCount = data.filter((r) => r.rarity === 'SSR').length;
      if (ssrCount > 0) toast.success(`✨ ${ssrCount} SSR татлаа!`, { duration: 6000 });
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Алдаа гарлаа'),
  });

  if (isLoading) return <div className="flex justify-center py-20"><div className="anime-spinner w-10 h-10" /></div>;

  const pool = selectedPool ? (pools as any[]).find((p: any) => p.id === selectedPool) : null;
  const pity = pityData?.pity ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/15 via-pink-500/10 to-surface-2 border border-purple-500/20 p-5">
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-amber-400/60 rounded-full"
              animate={{ y: [0, -40, 0], x: [0, Math.sin(i) * 20, 0], opacity: [0, 1, 0] }}
              transition={{ duration: 2 + i * 0.5, repeat: Infinity, delay: i * 0.3 }}
              style={{ left: `${10 + i * 15}%`, top: '80%' }}
            />
          ))}
        </div>
        <div className="relative">
          <h2 className="text-xl font-black">🎰 Gacha Систем</h2>
          <p className="text-sm text-muted-foreground mt-0.5">CP-ээр баатрын татуурга татаарай — pity 90</p>
          <p className="text-sm font-bold text-amber-400 mt-1">⭐ {user?.characterPoints ?? 0} CP байна</p>
        </div>
      </div>

      {/* Roll results overlay */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-6"
            onClick={() => setShowResults(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="w-full max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-center text-xl font-black mb-4 text-white">✨ Татуургын үр дүн</h3>
              <div className={clsx('grid gap-3', results.length === 1 ? 'grid-cols-1 max-w-xs mx-auto' : 'grid-cols-3 sm:grid-cols-5')}>
                {results.map((r, i) => <RollResultCard key={i} result={r} delay={i * 0.1} />)}
              </div>
              <button
                onClick={() => setShowResults(false)}
                className="mt-6 w-full py-3 bg-white/10 text-white border border-white/20 rounded-xl font-bold hover:bg-white/20 transition-colors"
              >
                Хаах
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pool list */}
      {(pools as any[]).length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-5xl mb-3">🎰</p>
          <p className="font-bold">Gacha pool байхгүй байна</p>
          <p className="text-sm mt-1">Admin тун удахгүй pool нэмнэ</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(pools as any[]).map((p: any) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={clsx(
                'bg-surface border rounded-2xl overflow-hidden transition-all cursor-pointer',
                selectedPool === p.id ? 'border-primary/50 shadow-glow-purple' : 'border-border hover:border-primary/30',
              )}
              onClick={() => setSelectedPool(p.id === selectedPool ? null : p.id)}
            >
              {p.bannerUrl && (
                <div className="h-28 overflow-hidden">
                  <img src={p.bannerUrl} alt={p.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-black">{p.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>

                <div className="flex flex-wrap gap-2 mt-3">
                  {p.items?.slice(0, 5).map((item: any) => (
                    <img key={item.id} src={item.character?.avatarUrl} alt={item.character?.name}
                      className="w-10 h-10 rounded-lg object-cover border border-border"
                      title={item.character?.name}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ))}
                  {p.items?.length > 5 && <div className="w-10 h-10 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-xs text-muted-foreground">+{p.items.length - 5}</div>}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="font-black text-amber-400">⭐ {p.costCp} CP / 1 татуурга</span>
                  {selectedPool === p.id && pityData && (
                    <span className="text-xs text-muted-foreground">Pity: {pity}/90</span>
                  )}
                </div>

                {selectedPool === p.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-4 space-y-2 overflow-hidden"
                  >
                    {pity >= 75 && (
                      <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-400 text-center font-bold">
                        ⚡ Soft pity! SSR магадлал нэмэгдсэн ({pity}/90)
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); rollMutation.mutate({ poolId: p.id, count: 1 }); }}
                        disabled={rollMutation.isPending || (user?.characterPoints ?? 0) < p.costCp}
                        className="py-2.5 bg-primary/20 text-primary border border-primary/30 rounded-xl text-sm font-bold hover:bg-primary/30 disabled:opacity-40 transition-colors active:scale-95"
                      >
                        {rollMutation.isPending ? '...' : `1x — ${p.costCp} CP`}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); rollMutation.mutate({ poolId: p.id, count: 10 }); }}
                        disabled={rollMutation.isPending || (user?.characterPoints ?? 0) < p.costCp * 10}
                        className="py-2.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-sm font-bold hover:bg-amber-500/30 disabled:opacity-40 transition-colors active:scale-95"
                      >
                        {rollMutation.isPending ? '...' : `10x — ${p.costCp * 10} CP`}
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
