'use client';

import { useState, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { characterApi, paymentApi } from '../../../../lib/api';
import { useAuthStore } from '../../../../store/auth.store';

const TIER_LABELS: Record<string, string> = {
  BRONZE: '🥉 Bronze',
  SILVER: '🥈 Silver',
  GOLD: '🥇 Gold',
  PLATINUM: '💎 Platinum',
  DIAMOND: '🔷 Diamond',
};

const SKILL_EFFECT_COLORS: Record<string, string> = {
  FIRE: 'text-orange-400',
  LIGHTNING: 'text-yellow-300',
  DARK: 'text-purple-400',
  WIND: 'text-green-400',
  WATER: 'text-blue-400',
  SHARINGAN: 'text-red-400',
  RASENGAN: 'text-cyan-400',
  SPIRIT: 'text-pink-400',
  ICE: 'text-blue-200',
  LIGHT: 'text-yellow-100',
  EARTH: 'text-amber-600',
  VOID: 'text-indigo-400',
};

type Tab = 'characters' | 'shop' | 'payment' | 'skills';

// ─── Onboarding Modal ────────────────────────────────────────────────
function OnboardingModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-10 w-full max-w-md bg-surface border border-primary/30 rounded-2xl p-7 shadow-glow-purple"
      >
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-primary/20 rounded-full blur-[60px] pointer-events-none" />

        <div className="relative">
          <div className="text-5xl text-center mb-4">🎭</div>
          <h2 className="text-2xl font-black text-center mb-1">Anime World-д тавтай морил!</h2>
          <p className="text-muted-foreground text-sm text-center mb-6">
            Бүртгэл амжилттай үүслээ. Эхний алхмуудаа хийцгээе!
          </p>

          <div className="space-y-3 mb-6">
            {[
              { step: 1, icon: '🎌', title: 'Anime сонгох', desc: 'Дэлгүүр таб дээр дарж таны дуртай anime-г сонгоно уу' },
              { step: 2, icon: '🆓', title: 'Үнэгүй дүр авах', desc: 'Base form дүрүүд үнэгүй — "Үнэгүй авах" дарна уу' },
              { step: 3, icon: '⚔️', title: 'PvP Event-д оролцох', desc: 'PvP хэсэгт очиж season-д бүртгүүлж тулалдаарай' },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-3 p-3 rounded-xl bg-surface-2 border border-border">
                <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-black text-primary flex-shrink-0 mt-0.5">
                  {s.step}
                </div>
                <div>
                  <p className="font-bold text-sm">{s.icon} {s.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-glow transition-colors hover:shadow-glow-purple active:scale-95"
          >
            🚀 Эхлэх
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ProfileContent() {
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const isOnboarding = searchParams.get('onboarding') === 'true';

  const [activeTab, setActiveTab] = useState<Tab>(isOnboarding ? 'shop' : 'characters');
  const [showOnboarding, setShowOnboarding] = useState(isOnboarding);
  const [selectedAnimeId, setSelectedAnimeId] = useState<string | null>(null);
  const [payingCharacterId, setPayingCharacterId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'qpay' | 'bank'>('qpay');
  const [qpayData, setQpayData] = useState<any>(null);
  const [bankData, setBankData] = useState<any>(null);

  const { data: myChars = [], isLoading: myCharsLoading } = useQuery({
    queryKey: ['my-characters'],
    queryFn: characterApi.getMyCharacters,
  });

  const { data: animes = [] } = useQuery({
    queryKey: ['animes'],
    queryFn: characterApi.getAnimes,
  });

  const { data: selectedAnime } = useQuery({
    queryKey: ['anime', selectedAnimeId],
    queryFn: () => characterApi.getAnime(selectedAnimeId!),
    enabled: !!selectedAnimeId,
  });

  const setActiveMutation = useMutation({
    mutationFn: (userCharacterId: string) => characterApi.setActive(userCharacterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-characters'] });
      toast.success('Идэвхтэй дүр солигдлоо');
    },
  });

  const selectFreeMutation = useMutation({
    mutationFn: (characterId: string) => characterApi.selectFree(characterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-characters'] });
      toast.success('Дүр амжилттай авлаа! 🎉');
      setActiveTab('characters');
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Алдаа гарлаа'),
  });

  const buyWithPointsMutation = useMutation({
    mutationFn: (characterId: string) => characterApi.buyWithPoints(characterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-characters'] });
      toast.success('Дүр амжилттай авлаа! 🎉');
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Алдаа гарлаа'),
  });

  const handleQpayPayment = async (characterId: string) => {
    try {
      const data = await paymentApi.createQpay(characterId) as any;
      setQpayData(data);
      setPayingCharacterId(characterId);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'QPay invoice үүсгэхэд алдаа гарлаа');
    }
  };

  const handleBankTransfer = async (characterId: string) => {
    try {
      const data = await paymentApi.submitBankTransfer(characterId) as any;
      setBankData(data);
      setPayingCharacterId(characterId);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Алдаа гарлаа');
    }
  };

  const activeChar = myChars.find((c: any) => c.isActive);
  const ownedIds = new Set(myChars.map((c: any) => c.characterId));

  const XP_NEXT_LEVEL = [0, 100, 250, 500, 1000, 2000, 4000, 8000, 15000, 30000, 60000];

  const getXpProgress = (xp: number, level: number) => {
    const current = XP_NEXT_LEVEL[level - 1] ?? 0;
    const next = XP_NEXT_LEVEL[level] ?? XP_NEXT_LEVEL[XP_NEXT_LEVEL.length - 1];
    return { percent: Math.min(((xp - current) / (next - current)) * 100, 100), next };
  };

  return (
    <div className="space-y-6">
      {/* ─── Onboarding Modal ─── */}
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingModal onClose={() => setShowOnboarding(false)} />
        )}
      </AnimatePresence>

      {/* ─── Active Character Hero ─── */}
      <div className="relative overflow-hidden rounded-2xl p-5" style={{
        background: activeChar
          ? 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(6,182,212,0.08) 60%, rgba(0,0,0,0.4) 100%)'
          : 'rgba(255,255,255,0.03)',
        border: activeChar ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(255,255,255,0.08)',
        boxShadow: activeChar ? '0 0 30px rgba(139,92,246,0.1)' : 'none',
      }}>
        {activeChar && (
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at top right, rgba(139,92,246,0.15) 0%, transparent 60%)' }} />
        )}

        <div className="relative flex gap-4 items-start">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden"
              style={{
                border: activeChar ? '2px solid rgba(139,92,246,0.5)' : '2px solid rgba(255,255,255,0.1)',
                boxShadow: activeChar ? '0 0 20px rgba(139,92,246,0.3)' : 'none',
              }}>
              {activeChar?.character.avatarUrl ? (
                <img src={activeChar.character.avatarUrl} alt={activeChar.character.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl"
                  style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(6,182,212,0.1))' }}>
                  {activeChar ? '🌟' : '❓'}
                </div>
              )}
            </div>
            {activeChar && (
              <div className="absolute -bottom-1.5 -right-1.5 text-[10px] px-2 py-0.5 rounded-full font-black"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 2px 8px rgba(124,58,237,0.5)', color: '#fff' }}>
                Lv{activeChar.level}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-black text-white truncate">
              {activeChar ? activeChar.character.name : 'Дүр сонгоогүй'}
            </h2>
            {activeChar && (
              <p className="text-sm text-white/50 truncate">{activeChar.character.anime?.name}</p>
            )}

            {/* Stat chips */}
            <div className="flex flex-wrap gap-2 mt-2.5">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl"
                style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)' }}>
                <span className="text-amber-400 font-black text-xs">⭐ {user?.characterPoints ?? 0} CP</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl"
                style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <span className="text-green-400 font-black text-xs">💚 {user?.reputation ?? 100}</span>
              </div>
              {activeChar && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl"
                  style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}>
                  <span className="text-purple-300 font-black text-xs">{TIER_LABELS[activeChar.masteryTier]}</span>
                </div>
              )}
            </div>

            {/* XP Bar */}
            {activeChar && (() => {
              const { percent, next } = getXpProgress(activeChar.xp, activeChar.level);
              return (
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] text-white/35 mb-1">
                    <span>XP {activeChar.xp?.toLocaleString()}</span>
                    <span>Next Lv: {next?.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }}
                      transition={{ duration: 0.9, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, #7c3aed, #06b6d4)', boxShadow: '0 0 6px rgba(139,92,246,0.5)' }} />
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {([
          { key: 'characters', label: 'Миний дүрүүд', icon: '🎭' },
          { key: 'shop',       label: 'Дэлгүүр',      icon: '🛍️' },
          { key: 'payment',    label: 'Төлбөр',        icon: '💳' },
          { key: 'skills',     label: 'Skills',        icon: '⚡' },
        ] as { key: Tab; label: string; icon: string }[]).map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`tab-pill flex-shrink-0 flex items-center gap-1.5 ${activeTab === t.key ? 'tab-pill-active' : 'tab-pill-inactive'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ─── Tab Content ─── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* MY CHARACTERS */}
          {activeTab === 'characters' && (
            <div>
              {myCharsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="anime-spinner w-10 h-10" />
                </div>
              ) : myChars.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-4xl mb-3">🎭</p>
                  <p className="text-muted-foreground mb-4">Дүр байхгүй байна. Эхлээд үнэгүй дүр сонгоно уу.</p>
                  <button
                    onClick={() => setActiveTab('shop')}
                    className="px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-glow transition-colors hover:shadow-glow-purple active:scale-95"
                  >
                    🛍️ Дэлгүүр үзэх
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myChars.map((uc: any) => {
                    const { percent } = getXpProgress(uc.xp, uc.level);
                    return (
                      <motion.div
                        key={uc.id}
                        className={`character-card rounded-xl border p-4 cursor-pointer ${
                          uc.isActive
                            ? 'border-primary/60 bg-primary/10 shadow-glow-purple'
                            : 'border-border bg-surface hover:border-primary/30'
                        }`}
                        onClick={() => !uc.isActive && setActiveMutation.mutate(uc.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-14 h-14 rounded-xl bg-surface-2 overflow-hidden flex-shrink-0">
                            {uc.character.avatarUrl ? (
                              <img
                                src={uc.character.avatarUrl}
                                alt={uc.character.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl bg-gradient-to-br from-primary/20 to-accent-blue/10">🌟</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold truncate">{uc.character.name}</h3>
                            <p className="text-xs text-muted-foreground">{uc.character.anime?.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs font-bold ${uc.masteryTier === 'DIAMOND' ? 'tier-diamond' : uc.masteryTier === 'GOLD' ? 'tier-gold' : uc.masteryTier === 'PLATINUM' ? 'tier-platinum' : ''}`}>
                                {TIER_LABELS[uc.masteryTier]}
                              </span>
                              <span className="text-xs text-muted-foreground">Lv{uc.level}</span>
                            </div>
                          </div>
                          {uc.isActive && (
                            <span className="text-xs text-primary font-bold flex-shrink-0">✓ ACTIVE</span>
                          )}
                        </div>

                        <div className="mt-3">
                          <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-accent-blue rounded-full transition-all"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{uc.xp} XP</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SHOP */}
          {activeTab === 'shop' && (
            <div className="space-y-6">
              {/* Anime selector */}
              <div>
                <h3 className="font-bold mb-3 text-lg">Anime сонгох</h3>
                {animes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="anime-spinner w-8 h-8 mx-auto mb-3" />
                    <p>Уншиж байна...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {animes.map((anime: any) => (
                      <button
                        key={anime.id}
                        onClick={() => setSelectedAnimeId(anime.id === selectedAnimeId ? null : anime.id)}
                        className={`p-2 rounded-xl border text-left transition-all active:scale-95 ${
                          selectedAnimeId === anime.id
                            ? 'border-primary bg-primary/15 shadow-glow-purple'
                            : 'border-border hover:border-primary/30 bg-surface'
                        }`}
                      >
                        <div className="w-full aspect-[3/4] rounded-lg bg-surface-2 overflow-hidden mb-2 relative">
                          {anime.imageUrl ? (
                            <img
                              src={anime.imageUrl}
                              alt={anime.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                const parent = (e.target as HTMLImageElement).parentElement;
                                if (parent) parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-3xl">🎌</div>';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl">🎌</div>
                          )}
                        </div>
                        <p className="text-xs font-medium text-center truncate">{anime.name}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Characters from selected anime */}
              {selectedAnime && (
                <div>
                  <h3 className="font-bold mb-3 text-lg">{selectedAnime.name} дүрүүд</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedAnime.characters?.map((char: any) => {
                      const owned = ownedIds.has(char.id);
                      return (
                        <div
                          key={char.id}
                          className={`rounded-xl border p-4 ${
                            owned ? 'border-accent-green/50 bg-accent-green/5' : 'border-border bg-surface'
                          }`}
                        >
                          <div className="flex gap-3">
                            <div className="w-16 h-16 rounded-xl bg-surface-2 overflow-hidden flex-shrink-0">
                              {char.avatarUrl ? (
                                <img
                                  src={char.avatarUrl}
                                  alt={char.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-primary/20 to-accent-blue/10">🌟</div>
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold">{char.name}</h4>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {char.description}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                {char.isBaseForm ? (
                                  <span className="text-xs text-accent-green font-bold">🆓 ҮНЭГҮЙ</span>
                                ) : (
                                  <>
                                    <span className="text-sm font-bold text-accent">{char.price.toLocaleString()}₮</span>
                                    {char.characterPoints > 0 && (
                                      <span className="text-xs text-muted-foreground">
                                        эсвэл ⭐{char.characterPoints} CP
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {owned ? (
                            <div className="mt-3 text-center text-sm text-accent-green font-medium">
                              ✅ Эзэмшиж байна
                            </div>
                          ) : (
                            <div className="mt-3 flex gap-2">
                              {char.isBaseForm ? (
                                <button
                                  onClick={() => selectFreeMutation.mutate(char.id)}
                                  disabled={selectFreeMutation.isPending}
                                  className="flex-1 py-2 bg-accent-green/20 text-accent-green border border-accent-green/30 rounded-lg text-sm font-medium hover:bg-accent-green/30 transition-colors disabled:opacity-50 active:scale-95 flex items-center justify-center gap-1.5"
                                >
                                  {selectFreeMutation.isPending ? (
                                    <><div className="anime-spinner w-3 h-3" /> Авч байна...</>
                                  ) : '🆓 Үнэгүй авах'}
                                </button>
                              ) : (
                                <>
                                  {char.characterPoints > 0 && (
                                    <button
                                      onClick={() => buyWithPointsMutation.mutate(char.id)}
                                      disabled={buyWithPointsMutation.isPending}
                                      className="flex-1 py-2 bg-accent/20 text-accent border border-accent/30 rounded-lg text-sm font-medium hover:bg-accent/30 transition-colors disabled:opacity-50 active:scale-95"
                                    >
                                      ⭐ CP-ээр авах
                                    </button>
                                  )}
                                  <button
                                    onClick={() => { setPayingCharacterId(char.id); setActiveTab('payment'); }}
                                    className="flex-1 py-2 bg-primary/20 text-primary border border-primary/30 rounded-lg text-sm font-medium hover:bg-primary/30 transition-colors active:scale-95"
                                  >
                                    💳 Худалдах
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {!selectedAnimeId && animes.length > 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-3xl mb-2">👆</p>
                  <p>Дээрээс anime сонгоно уу</p>
                </div>
              )}
            </div>
          )}

          {/* PAYMENT */}
          {activeTab === 'payment' && (
            <div className="max-w-lg mx-auto space-y-6">
              <h3 className="text-xl font-bold text-center">💳 Төлбөрийн хэлбэр</h3>

              {!payingCharacterId ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-3xl mb-2">🛍️</p>
                  <p>Эхлээд дэлгүүрээс дүр сонгоно уу</p>
                  <button
                    onClick={() => setActiveTab('shop')}
                    className="mt-4 px-5 py-2 bg-primary/20 text-primary border border-primary/30 rounded-xl text-sm font-medium hover:bg-primary/30 transition-colors"
                  >
                    Дэлгүүр руу очих
                  </button>
                </div>
              ) : (
                <>
                  {/* Method selector */}
                  <div className="grid grid-cols-2 gap-3">
                    {(['qpay', 'bank'] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setPaymentMethod(m)}
                        className={`p-4 rounded-xl border text-center transition-all active:scale-95 ${
                          paymentMethod === m
                            ? 'border-primary bg-primary/15'
                            : 'border-border hover:border-primary/30'
                        }`}
                      >
                        <div className="text-2xl mb-1">{m === 'qpay' ? '📱' : '🏦'}</div>
                        <div className="font-bold">{m === 'qpay' ? 'QPay' : 'Банкны шилжүүлэг'}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {m === 'qpay' ? 'Автомат баталгаажилт' : 'Admin баталгаажилт (1-24ц)'}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* QPay */}
                  {paymentMethod === 'qpay' && !qpayData && (
                    <button
                      onClick={() => handleQpayPayment(payingCharacterId)}
                      className="w-full py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-glow transition-colors hover:shadow-glow-purple active:scale-95"
                    >
                      📱 QPay Invoice үүсгэх
                    </button>
                  )}

                  {paymentMethod === 'qpay' && qpayData && (
                    <div className="text-center space-y-4">
                      <div className="bg-white rounded-xl p-4 inline-block">
                        <img src={`data:image/png;base64,${qpayData.qrCode}`} alt="QPay QR" className="w-48 h-48" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        QPay апп нээж QR кодыг уншуулна уу
                      </p>
                      <p className="font-bold text-xl text-accent">
                        {qpayData.amount?.toLocaleString()}₮
                      </p>
                      {qpayData.deepLink && (
                        <a
                          href={qpayData.deepLink}
                          className="block py-3 bg-surface-2 border border-border rounded-xl text-sm hover:border-primary/30 transition-colors"
                        >
                          📱 QPay аппад нэвтрэх
                        </a>
                      )}
                    </div>
                  )}

                  {/* Bank transfer */}
                  {paymentMethod === 'bank' && !bankData && (
                    <button
                      onClick={() => handleBankTransfer(payingCharacterId)}
                      className="w-full py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-glow transition-colors hover:shadow-glow-purple active:scale-95"
                    >
                      🏦 Дансны мэдээлэл харах
                    </button>
                  )}

                  {paymentMethod === 'bank' && bankData && (
                    <div className="bg-surface-2 rounded-xl p-5 border border-border space-y-3">
                      <h4 className="font-bold text-center">Банкны дансны мэдээлэл</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Банк</span>
                          <span className="font-medium">{bankData.bankName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Дансны дугаар</span>
                          <span className="font-mono font-bold text-accent">{bankData.accountNo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Эзэмшигч</span>
                          <span className="font-medium">{bankData.accountName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Дүн</span>
                          <span className="font-bold text-xl text-accent">{bankData.amount?.toLocaleString()}₮</span>
                        </div>
                        <div className="border-t border-border pt-3">
                          <p className="text-accent-red font-bold text-center text-sm">
                            ⚠️ Гүйлгээний утганд заавал бичнэ:
                          </p>
                          <div className="mt-1 bg-surface rounded-lg p-3 text-center">
                            <p className="font-mono font-bold text-lg text-accent">{bankData.systemId}</p>
                          </div>
                          <p className="text-xs text-muted-foreground text-center mt-1">
                            Гүйлгээний утга оруулаагүй бол Admin баталгаажуулж чадахгүй
                          </p>
                        </div>
                      </div>
                      <div className="text-center text-xs text-muted-foreground mt-2">
                        Шилжүүлгийн дараа Admin 1-24 цагийн дотор баталгаажуулна
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* SKILLS */}
          {activeTab === 'skills' && (
            <div className="space-y-4">
              {!activeChar ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-3xl mb-2">⚡</p>
                  <p>Идэвхтэй дүр байхгүй байна</p>
                  <button
                    onClick={() => setActiveTab('characters')}
                    className="mt-4 px-5 py-2 bg-primary/20 text-primary border border-primary/30 rounded-xl text-sm font-medium hover:bg-primary/30 transition-colors"
                  >
                    Дүр сонгох
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="font-bold text-lg">⚡ {activeChar.character.name}-ийн Skills</h3>
                  {(!activeChar.character.skills || activeChar.character.skills.length === 0) ? (
                    <p className="text-muted-foreground text-center py-8">Skill байхгүй байна</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {activeChar.character.skills.map((skill: any) => {
                        const isUnlocked = activeChar.level >= skill.requiredLevel;
                        return (
                          <div
                            key={skill.id}
                            className={`rounded-xl border p-4 ${
                              isUnlocked
                                ? 'border-border bg-surface'
                                : 'border-border/30 bg-surface/50 opacity-60'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`font-bold ${SKILL_EFFECT_COLORS[skill.effectType] ?? ''}`}>
                                    ⚡ {skill.name}
                                  </span>
                                  {skill.isUltimate && (
                                    <span className="text-xs px-2 py-0.5 bg-accent/20 text-accent border border-accent/30 rounded-full font-bold">
                                      ULTIMATE
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{skill.description}</p>
                              </div>
                            </div>

                            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                              <div className="text-center">
                                <p className="text-muted-foreground">Damage</p>
                                <p className="font-bold text-accent-red">{skill.damageMin}-{skill.damageMax}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-muted-foreground">Energy</p>
                                <p className="font-bold text-accent-blue">{skill.energyCost}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-muted-foreground">Cooldown</p>
                                <p className="font-bold">{skill.cooldownSeconds}с</p>
                              </div>
                            </div>

                            {!isUnlocked && (
                              <div className="mt-2 text-xs text-center text-muted-foreground">
                                🔒 Level {skill.requiredLevel}+ шаардлагатай
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-20">
        <div className="anime-spinner w-10 h-10" />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
