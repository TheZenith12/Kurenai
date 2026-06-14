'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { cosmeticsApi } from '../../../../lib/api';
import clsx from 'clsx';

const TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  AVATAR_FRAME: { label: 'Аватар хүрээ', icon: '🖼️' },
  CHAT_ANIMATION: { label: 'Чат эффект', icon: '✨' },
  KILL_EFFECT: { label: 'Алалтын эффект', icon: '💀' },
  PROFILE_BACKGROUND: { label: 'Профайл арын зураг', icon: '🎨' },
};

const TYPE_ORDER = ['AVATAR_FRAME', 'CHAT_ANIMATION', 'KILL_EFFECT', 'PROFILE_BACKGROUND'];

export default function CosmeticsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'shop' | 'my'>('shop');
  const [filterType, setFilterType] = useState<string>('ALL');

  const { data: allItems = [], isLoading: shopLoading } = useQuery({
    queryKey: ['cosmetics-shop'],
    queryFn: cosmeticsApi.getAll,
    enabled: activeTab === 'shop',
  });

  const { data: myItems = [], isLoading: myLoading } = useQuery({
    queryKey: ['cosmetics-my'],
    queryFn: cosmeticsApi.getMy,
    enabled: activeTab === 'my',
  });

  const buyMutation = useMutation({
    mutationFn: (itemId: string) => cosmeticsApi.buy(itemId),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['cosmetics-my'] });
      queryClient.invalidateQueries({ queryKey: ['cosmetics-shop'] });
      toast.success(`${data.item?.name ?? 'Бараа'} худалдан авлаа!`);
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Алдаа гарлаа'),
  });

  const equipMutation = useMutation({
    mutationFn: ({ itemId, equip }: { itemId: string; equip: boolean }) =>
      equip ? cosmeticsApi.equip(itemId) : cosmeticsApi.unequip(itemId),
    onSuccess: (_data: any, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cosmetics-my'] });
      toast.success(variables.equip ? 'Өмссөн!' : 'Тайлсан');
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Алдаа гарлаа'),
  });

  const ownedIds = new Set((myItems as any[]).map((u: any) => u.itemId));
  const equippedIds = new Set((myItems as any[]).filter((u: any) => u.isEquipped).map((u: any) => u.itemId));

  const filteredItems = (allItems as any[]).filter(
    (item: any) => filterType === 'ALL' || item.type === filterType,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent/15 to-surface-2 border border-accent/20 p-5">
        <div className="relative">
          <h2 className="text-xl font-black">🎨 Тохируулга & Cosmetis</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Баатрынхаа дүр төрхийг тохируул</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['shop', 'my'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={clsx(
              'px-5 py-2 rounded-xl text-sm font-bold transition-colors',
              activeTab === t ? 'bg-primary/20 text-primary border border-primary/30' : 'text-muted-foreground border border-border hover:bg-surface-2',
            )}
          >
            {t === 'shop' ? '🛍️ Дэлгүүр' : '🎒 Минийх'}
          </button>
        ))}
      </div>

      {/* Shop */}
      {activeTab === 'shop' && (
        <div className="space-y-4">
          {/* Type filter */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {['ALL', ...TYPE_ORDER].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                  filterType === type ? 'bg-primary/20 text-primary border border-primary/30' : 'text-muted-foreground border border-border hover:bg-surface-2',
                )}
              >
                {type === 'ALL' ? '🌟 Бүгд' : `${TYPE_LABELS[type]?.icon} ${TYPE_LABELS[type]?.label}`}
              </button>
            ))}
          </div>

          {shopLoading ? (
            <div className="flex justify-center py-12"><div className="anime-spinner w-8 h-8" /></div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-4xl mb-2">🛍️</p>
              <p>Дэлгүүр хоосон байна</p>
              <p className="text-xs mt-1">Admin тун удахгүй бараа нэмнэ</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item: any, i: number) => {
                const owned = ownedIds.has(item.id);
                const equipped = equippedIds.has(item.id);
                const typeInfo = TYPE_LABELS[item.type] ?? { label: item.type, icon: '🎁' };
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={clsx(
                      'bg-surface border rounded-2xl p-4 transition-colors',
                      owned ? 'border-primary/30' : 'border-border hover:border-primary/20',
                    )}
                  >
                    {/* Image */}
                    <div className="w-full h-36 rounded-xl bg-surface-2 overflow-hidden mb-3 flex items-center justify-center">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl">{typeInfo.icon}</span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-sm leading-tight">{item.name}</h3>
                        {owned && (
                          <span className="text-xs px-1.5 py-0.5 bg-accent-green/20 text-accent-green rounded-full flex-shrink-0">Эзэмшилтэй</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                      <p className="text-xs text-accent-blue">{typeInfo.icon} {typeInfo.label}</p>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-black text-accent">⭐ {item.price} CP</span>
                      {owned ? (
                        <button
                          onClick={() => equipMutation.mutate({ itemId: item.id, equip: !equipped })}
                          disabled={equipMutation.isPending}
                          className={clsx(
                            'px-3 py-1.5 text-xs rounded-lg font-bold transition-colors disabled:opacity-50',
                            equipped
                              ? 'bg-accent-green/20 text-accent-green border border-accent-green/30 hover:bg-accent-red/20 hover:text-accent-red hover:border-accent-red/30'
                              : 'bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30',
                          )}
                        >
                          {equipped ? '✓ Өмссөн' : 'Өмсөх'}
                        </button>
                      ) : (
                        <button
                          onClick={() => buyMutation.mutate(item.id)}
                          disabled={buyMutation.isPending}
                          className="px-3 py-1.5 text-xs bg-accent/20 text-accent border border-accent/30 rounded-lg font-bold hover:bg-accent/30 transition-colors disabled:opacity-50 active:scale-95"
                        >
                          {buyMutation.isPending ? '...' : 'Худалдан авах'}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* My cosmetics */}
      {activeTab === 'my' && (
        <div className="space-y-4">
          {myLoading ? (
            <div className="flex justify-center py-12"><div className="anime-spinner w-8 h-8" /></div>
          ) : (myItems as any[]).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-4xl mb-2">🎒</p>
              <p>Эзэмшилтэй тохируулга байхгүй байна</p>
              <button
                onClick={() => setActiveTab('shop')}
                className="mt-3 px-4 py-2 text-sm text-primary border border-primary/30 rounded-xl hover:bg-primary/10 transition-colors"
              >
                🛍️ Дэлгүүр үзэх
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(myItems as any[]).map((owned: any, i: number) => {
                const item = owned.item;
                const typeInfo = TYPE_LABELS[item?.type] ?? { label: item?.type, icon: '🎁' };
                return (
                  <motion.div
                    key={owned.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={clsx(
                      'bg-surface border rounded-2xl p-4',
                      owned.isEquipped ? 'border-accent-green/40 shadow-glow-green' : 'border-border',
                    )}
                  >
                    <div className="w-full h-36 rounded-xl bg-surface-2 overflow-hidden mb-3 flex items-center justify-center">
                      {item?.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl">{typeInfo.icon}</span>
                      )}
                    </div>
                    <h3 className="font-bold text-sm">{item?.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{typeInfo.icon} {typeInfo.label}</p>
                    <button
                      onClick={() => equipMutation.mutate({ itemId: item.id, equip: !owned.isEquipped })}
                      disabled={equipMutation.isPending}
                      className={clsx(
                        'mt-3 w-full py-1.5 text-xs rounded-lg font-bold transition-colors',
                        owned.isEquipped
                          ? 'bg-accent-green/20 text-accent-green border border-accent-green/30'
                          : 'bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30',
                      )}
                    >
                      {owned.isEquipped ? '✓ Өмссөн — Тайлах' : 'Өмсөх'}
                    </button>
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
