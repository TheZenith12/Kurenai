'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { adminApi, seasonAdminApi } from '../../lib/api';
import { useAuthStore } from '../../store/auth.store';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

const BACKEND = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3001';

function toFullUrl(url: string) {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('//')) return url;
  return `${BACKEND}${url}`;
}

// ─── Image Uploader ──────────────────────────────────────────────────────────
function ImageUploader({ value, onChange, label, placeholder }: {
  value: string;
  onChange: (url: string) => void;
  label: string;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [urlMode, setUrlMode] = useState(!!value && !value.startsWith('/uploads'));

  const handleFile = async (file: File) => {
    if (file.size > 8 * 1024 * 1024) { toast.error('Файл 8MB-аас бага байх ёстой'); return; }
    setUploading(true);
    try {
      const result = await adminApi.uploadImage(file);
      onChange(result.url);
      setUrlMode(false);
      toast.success('Зураг амжилттай upload хийгдлээ ✓');
    } catch {
      toast.error('Upload амжилтгүй боллоо');
    } finally {
      setUploading(false);
    }
  };

  const preview = toFullUrl(value);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs text-muted-foreground font-medium">{label}</label>
        <button
          type="button"
          onClick={() => setUrlMode((x) => !x)}
          className="text-xs text-primary hover:underline"
        >
          {urlMode ? '📁 Файлаас оруулах' : '🔗 URL оруулах'}
        </button>
      </div>

      {urlMode ? (
        <input
          className="w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
          placeholder={placeholder ?? 'https://...'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          className={clsx(
            'relative border-2 border-dashed rounded-xl transition-colors cursor-pointer overflow-hidden',
            uploading ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-surface-2',
            preview ? 'h-32' : 'h-20',
          )}
        >
          {preview ? (
            <>
              <img src={preview} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = ''; }} />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <span className="text-white text-sm font-medium">✏️ Зураг солих</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-1 text-muted-foreground">
              {uploading ? (
                <><div className="anime-spinner w-6 h-6" /><span className="text-xs">Upload хийж байна...</span></>
              ) : (
                <><span className="text-2xl">🖼️</span><span className="text-xs">Зураг чирж оруул эсвэл дарж сонго</span></>
              )}
            </div>
          )}
          {uploading && <div className="absolute inset-0 bg-primary/10 flex items-center justify-center"><div className="anime-spinner w-8 h-8" /></div>}
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
    </div>
  );
}

type AdminTab = 'dashboard' | 'users' | 'payments' | 'reports' | 'monitor' | 'content';

// ─── Skill effect options ─────────────────────────────────────────────────────
const SKILL_EFFECTS = [
  { value: 'FIRE',      label: '🔥 Гал',         color: 'text-orange-400' },
  { value: 'WATER',     label: '💧 Ус',           color: 'text-blue-400' },
  { value: 'LIGHTNING', label: '⚡ Цахилгаан',    color: 'text-yellow-400' },
  { value: 'WIND',      label: '🌪️ Салхи',        color: 'text-green-400' },
  { value: 'DARK',      label: '🌑 Харанхуй',     color: 'text-purple-400' },
  { value: 'LIGHT',     label: '✨ Гэрэл',        color: 'text-yellow-200' },
  { value: 'EARTH',     label: '🪨 Газар',        color: 'text-amber-700' },
  { value: 'VOID',      label: '🕳️ Хоосон орчлон', color: 'text-gray-400' },
  { value: 'RASENGAN',  label: '🌀 Rasengan',     color: 'text-cyan-400' },
  { value: 'SHARINGAN', label: '👁️ Sharingan',    color: 'text-red-500' },
  { value: 'SPIRIT',    label: '💗 Сүнс',         color: 'text-pink-400' },
  { value: 'ICE',       label: '❄️ Мөс',          color: 'text-sky-300' },
];

const TIERS = [
  { value: 'BRONZE',   label: '🥉 Bronze',   color: 'text-amber-600' },
  { value: 'SILVER',   label: '🥈 Silver',   color: 'text-gray-300' },
  { value: 'GOLD',     label: '🥇 Gold',     color: 'text-yellow-400' },
  { value: 'PLATINUM', label: '💎 Platinum', color: 'text-blue-200' },
  { value: 'DIAMOND',  label: '💠 Diamond',  color: 'text-cyan-300' },
];

// ─── Tier by price helper ────────────────────────────────────────────────────
function getTierByPrice(price: number, characterPoints: number, isBase: boolean) {
  if (isBase) return { label: '🆓 Үнэгүй', color: 'text-green-400 bg-green-400/10' };
  if (price > 0) return { label: '💎 Premium', color: 'text-cyan-300 bg-cyan-300/10' };
  if (characterPoints >= 2000) return { label: '💠 Platinum', color: 'text-blue-200 bg-blue-200/10' };
  if (characterPoints >= 500) return { label: '🥇 Gold', color: 'text-yellow-400 bg-yellow-400/10' };
  if (characterPoints >= 100) return { label: '🥈 Silver', color: 'text-gray-300 bg-gray-300/10' };
  return { label: '🥉 Bronze', color: 'text-amber-600 bg-amber-600/10' };
}

// ─── Input helper ────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground font-medium">{label}</label>
      {children}
    </div>
  );
}
const inp = 'w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors';

// ─── Add Anime Form ──────────────────────────────────────────────────────────
function AddAnimeForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({ name: '', description: '', imageUrl: '', bannerUrl: '', sortOrder: 0 });
  const createMutation = useMutation({
    mutationFn: () => adminApi.createAnime(form),
    onSuccess: () => { toast.success('Anime нэмэгдлээ! 🎉'); onSuccess(); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Алдаа гарлаа'),
  });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="bg-surface-2 rounded-xl border border-border p-4 space-y-3">
      <h4 className="font-bold text-sm text-accent">+ Шинэ Anime нэмэх</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Нэр *"><input className={inp} placeholder="Jujutsu Kaisen" value={form.name} onChange={set('name')} /></Field>
        <Field label="Sort дараалал"><input className={inp} type="number" value={form.sortOrder} onChange={set('sortOrder')} /></Field>
        <ImageUploader
          label="Ерөнхий зураг (imageUrl) *"
          value={form.imageUrl}
          onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
          placeholder="https://..."
        />
        <ImageUploader
          label="Banner зураг (нэмэлт)"
          value={form.bannerUrl}
          onChange={(url) => setForm((f) => ({ ...f, bannerUrl: url }))}
          placeholder="https://..."
        />
        <div className="sm:col-span-2">
          <Field label="Тайлбар *">
            <textarea className={inp} rows={2} placeholder="Anime-ийн товч тайлбар" value={form.description} onChange={set('description')} />
          </Field>
        </div>
      </div>
      <button
        onClick={() => createMutation.mutate()}
        disabled={!form.name || !form.description || !form.imageUrl || createMutation.isPending}
        className="px-5 py-2 bg-primary/20 text-primary border border-primary/30 rounded-lg text-sm font-bold hover:bg-primary/30 disabled:opacity-40 transition-colors active:scale-95"
      >
        {createMutation.isPending ? '...' : '✓ Нэмэх'}
      </button>
    </div>
  );
}

// ─── Add Character Form ──────────────────────────────────────────────────────
function AddCharacterForm({ animeId, onSuccess }: { animeId: string; onSuccess: () => void }) {
  const [form, setForm] = useState({
    name: '', description: '', avatarUrl: '', fullImageUrl: '',
    isBaseForm: false, price: 0, characterPoints: 0, sortOrder: 0,
  });
  const createMutation = useMutation({
    mutationFn: () => adminApi.createCharacter(animeId, form),
    onSuccess: () => { toast.success('Дүр нэмэгдлээ! 🎉'); onSuccess(); setForm({ name: '', description: '', avatarUrl: '', fullImageUrl: '', isBaseForm: false, price: 0, characterPoints: 0, sortOrder: 0 }); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Алдаа гарлаа'),
  });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.type === 'number' ? +e.target.value : e.target.value }));

  const tier = getTierByPrice(form.price, form.characterPoints, form.isBaseForm);

  return (
    <div className="bg-surface-2/60 rounded-xl border border-primary/20 p-4 space-y-3 mt-3">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-sm">+ Шинэ дүр нэмэх</h4>
        <span className={clsx('text-xs px-2 py-0.5 rounded-full font-bold', tier.color)}>{tier.label}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Дүрийн нэр *"><input className={inp} placeholder="Gojo Satoru" value={form.name} onChange={set('name')} /></Field>
        <Field label="Sort"><input className={inp} type="number" value={form.sortOrder} onChange={set('sortOrder')} /></Field>
        <ImageUploader
          label="Avatar зураг (жижиг, дүрийн нүүр) *"
          value={form.avatarUrl}
          onChange={(url) => setForm((f) => ({ ...f, avatarUrl: url }))}
          placeholder="https://cdn.myanimelist.net/..."
        />
        <ImageUploader
          label="Full зураг (дэлгэрэнгүй, нэмэлт)"
          value={form.fullImageUrl}
          onChange={(url) => setForm((f) => ({ ...f, fullImageUrl: url }))}
          placeholder="https://..."
        />
        <div className="sm:col-span-2">
          <Field label="Тайлбар *">
            <input className={inp} placeholder="Дүрийн товч тайлбар" value={form.description} onChange={set('description')} />
          </Field>
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              onClick={() => setForm((f) => ({ ...f, isBaseForm: !f.isBaseForm, price: 0, characterPoints: 0 }))}
              className={clsx('w-10 h-5 rounded-full transition-colors relative', form.isBaseForm ? 'bg-green-500' : 'bg-surface-2 border border-border')}
            >
              <div className={clsx('absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all', form.isBaseForm ? 'left-5' : 'left-0.5')} />
            </div>
            <span className="text-sm">Үнэгүй эхлэлийн дүр (isBaseForm)</span>
          </label>
        </div>
      </div>

      {!form.isBaseForm && (
        <div className="grid grid-cols-2 gap-3 p-3 bg-surface rounded-lg border border-border">
          <Field label="💳 Мөнгөн үнэ (MNT) — QPay/Банк">
            <input className={inp} type="number" min={0} value={form.price} onChange={set('price')} />
          </Field>
          <Field label="⭐ Character Points (CP) — оноогоор">
            <input className={inp} type="number" min={0} value={form.characterPoints} onChange={set('characterPoints')} />
          </Field>
          <p className="col-span-2 text-xs text-muted-foreground">
            💡 Нэг нь 0 биш байвал тэрхүү замаар авах боломжтой болно. Хоёуланг нь тохируулж болно.
          </p>
        </div>
      )}

      <button
        onClick={() => createMutation.mutate()}
        disabled={!form.name || !form.description || !form.avatarUrl || createMutation.isPending}
        className="px-5 py-2 bg-accent-blue/20 text-accent-blue border border-accent-blue/30 rounded-lg text-sm font-bold hover:bg-accent-blue/30 disabled:opacity-40 transition-colors active:scale-95"
      >
        {createMutation.isPending ? '...' : '+ Дүр нэмэх'}
      </button>
    </div>
  );
}

// ─── Add Skill Form ──────────────────────────────────────────────────────────
function AddSkillForm({ characterId, onSuccess }: { characterId: string; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '',
    damageMin: 50, damageMax: 100,
    energyCost: 30, cooldownSeconds: 5,
    effectType: 'FIRE', isUltimate: false,
    requiredLevel: 1, requiredTier: 'BRONZE',
  });
  const createMutation = useMutation({
    mutationFn: () => adminApi.createSkill(characterId, form),
    onSuccess: () => {
      toast.success('Skill нэмэгдлээ!');
      onSuccess();
      setOpen(false);
      setForm({ name: '', description: '', damageMin: 50, damageMax: 100, energyCost: 30, cooldownSeconds: 5, effectType: 'FIRE', isUltimate: false, requiredLevel: 1, requiredTier: 'BRONZE' });
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Алдаа гарлаа'),
  });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.type === 'number' ? +e.target.value : e.target.value }));
  const selectedEffect = SKILL_EFFECTS.find((e) => e.value === form.effectType);

  if (!open) return (
    <button onClick={() => setOpen(true)} className="mt-2 text-xs px-3 py-1 bg-accent/10 text-accent border border-accent/20 rounded-lg hover:bg-accent/20 transition-colors">
      + Skill нэмэх
    </button>
  );

  return (
    <div className="mt-2 p-3 bg-surface rounded-xl border border-accent/20 space-y-3">
      <div className="flex items-center justify-between">
        <h5 className="text-xs font-bold text-accent">+ Шинэ Skill</h5>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Skill нэр *"><input className={inp} placeholder="Hollow Purple" value={form.name} onChange={set('name')} /></Field>
        <Field label="Effect төрөл">
          <select className={inp} value={form.effectType} onChange={set('effectType')}>
            {SKILL_EFFECTS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>
        </Field>
        <Field label="Хохирол min"><input className={inp} type="number" value={form.damageMin} onChange={set('damageMin')} /></Field>
        <Field label="Хохирол max"><input className={inp} type="number" value={form.damageMax} onChange={set('damageMax')} /></Field>
        <Field label="Энерги зарцуулалт"><input className={inp} type="number" value={form.energyCost} onChange={set('energyCost')} /></Field>
        <Field label="Cooldown (секунд)"><input className={inp} type="number" value={form.cooldownSeconds} onChange={set('cooldownSeconds')} /></Field>
        <Field label="Шаардлагатай level"><input className={inp} type="number" min={1} value={form.requiredLevel} onChange={set('requiredLevel')} /></Field>
        <Field label="Шаардлагатай Tier">
          <select className={inp} value={form.requiredTier} onChange={set('requiredTier')}>
            {TIERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Field>
        <Field label="Тайлбар">
          <input className={inp} placeholder="Skill-ийн тайлбар" value={form.description} onChange={set('description')} />
        </Field>
        <label className="flex items-center gap-2 text-sm cursor-pointer self-end pb-2">
          <input type="checkbox" checked={form.isUltimate} onChange={(e) => setForm((f) => ({ ...f, isUltimate: e.target.checked }))} className="accent-primary" />
          ⚡ Ultimate skill
        </label>
      </div>

      {/* Effect preview */}
      <div className={clsx('text-xs p-2 rounded-lg bg-surface-2', selectedEffect?.color)}>
        {selectedEffect?.label} — тоглоомд энэ skillийг ашиглахад <strong>{selectedEffect?.label.split(' ')[1]}</strong> өнгийн glow эффект автоматаар харагдана. Нэмэлт тохиргоо шаардлагагүй.
      </div>

      <button
        onClick={() => createMutation.mutate()}
        disabled={!form.name || createMutation.isPending}
        className="px-4 py-1.5 bg-accent/20 text-accent border border-accent/30 rounded-lg text-xs font-bold hover:bg-accent/30 disabled:opacity-40 transition-colors active:scale-95"
      >
        {createMutation.isPending ? '...' : '✓ Skill нэмэх'}
      </button>
    </div>
  );
}

// ─── Character Card ──────────────────────────────────────────────────────────
function CharacterCard({ char, animeId, onRefresh }: { char: any; animeId: string; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const deleteMut = useMutation({
    mutationFn: () => adminApi.deleteCharacter(char.id),
    onSuccess: () => { toast.success('Дүр идэвхгүй болгогдлоо'); onRefresh(); },
  });
  const tier = getTierByPrice(char.price, char.characterPoints, char.isBaseForm);

  return (
    <div className={clsx('rounded-xl border p-3 transition-colors', char.isActive ? 'border-border bg-surface' : 'border-border/40 bg-surface/50 opacity-50')}>
      <div className="flex items-center gap-3">
        {char.avatarUrl && (
          <img src={char.avatarUrl} alt={char.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-border" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-sm">{char.name}</p>
            <span className={clsx('text-xs px-1.5 py-0.5 rounded font-medium', tier.color)}>{tier.label}</span>
            {!char.isActive && <span className="text-xs text-muted-foreground">(идэвхгүй)</span>}
          </div>
          <p className="text-xs text-muted-foreground truncate">{char.description}</p>
          <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
            {char.price > 0 && <span>💳 {char.price.toLocaleString()}₮</span>}
            {char.characterPoints > 0 && <span>⭐ {char.characterPoints.toLocaleString()} CP</span>}
            <span>🗡️ {char.skills?.length ?? 0} skill</span>
          </div>
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          <button onClick={() => setExpanded((x) => !x)} className="text-xs px-2 py-1 bg-surface-2 border border-border rounded-lg hover:bg-surface transition-colors">
            {expanded ? '▲' : '▼'}
          </button>
          <button
            onClick={() => { if (confirm(`"${char.name}" дүрийг идэвхгүй болгох уу?`)) deleteMut.mutate(); }}
            className="text-xs px-2 py-1 bg-accent-red/10 text-accent-red border border-accent-red/20 rounded-lg hover:bg-accent-red/20 transition-colors"
          >
            🗑
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="mt-3 pt-3 border-t border-border">
              {/* Skills list */}
              {char.skills?.length > 0 && (
                <div className="space-y-1 mb-2">
                  <p className="text-xs font-bold text-muted-foreground mb-1.5">Skills:</p>
                  {char.skills.map((skill: any) => {
                    const fx = SKILL_EFFECTS.find((e) => e.value === skill.effectType);
                    return (
                      <div key={skill.id} className="flex items-center gap-2 p-2 rounded-lg bg-surface-2">
                        <span className={clsx('text-sm', fx?.color)}>{fx?.label.split(' ')[0]}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium">{skill.name} {skill.isUltimate && '⚡'}</p>
                          <p className="text-xs text-muted-foreground">{skill.damageMin}–{skill.damageMax} dmg · {skill.energyCost} energy · {skill.cooldownSeconds}s CD</p>
                        </div>
                        {!skill.isActive && <span className="text-xs text-muted-foreground">(off)</span>}
                      </div>
                    );
                  })}
                </div>
              )}
              <AddSkillForm characterId={char.id} onSuccess={onRefresh} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Anime Card ──────────────────────────────────────────────────────────────
function AnimeCard({ anime, onRefresh }: { anime: any; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [showAddChar, setShowAddChar] = useState(false);
  const deleteMut = useMutation({
    mutationFn: () => adminApi.deleteAnime(anime.id),
    onSuccess: () => { toast.success('Anime идэвхгүй болгогдлоо'); onRefresh(); },
  });

  return (
    <motion.div
      layout
      className={clsx('rounded-2xl border overflow-hidden', anime.isActive ? 'border-border bg-surface' : 'border-border/40 bg-surface/50 opacity-60')}
    >
      {/* Header */}
      <div className="flex items-center gap-4 p-4">
        {anime.imageUrl && (
          <img src={anime.imageUrl} alt={anime.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-border" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-black">{anime.name}</h4>
            {!anime.isActive && <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-surface-2 rounded">(идэвхгүй)</span>}
          </div>
          <p className="text-sm text-muted-foreground truncate mt-0.5">{anime.description}</p>
          <p className="text-xs text-muted-foreground mt-1">👥 {anime.characters?.length ?? 0} дүр</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => setExpanded((x) => !x)}
            className="px-3 py-1.5 text-sm bg-surface-2 border border-border rounded-lg hover:bg-surface transition-colors"
          >
            {expanded ? '▲ Хаах' : '▼ Нээх'}
          </button>
          <button
            onClick={() => { if (confirm(`"${anime.name}" идэвхгүй болгох уу?`)) deleteMut.mutate(); }}
            className="px-3 py-1.5 text-sm bg-accent-red/10 text-accent-red border border-accent-red/20 rounded-lg hover:bg-accent-red/20 transition-colors"
          >
            🗑
          </button>
        </div>
      </div>

      {/* Expanded: characters */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-border pt-4">
              {/* Characters */}
              {anime.characters?.length > 0 ? (
                <div className="space-y-2">
                  {anime.characters.map((char: any) => (
                    <CharacterCard key={char.id} char={char} animeId={anime.id} onRefresh={onRefresh} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Дүр байхгүй байна</p>
              )}

              {/* Toggle add character form */}
              <button
                onClick={() => setShowAddChar((x) => !x)}
                className="w-full py-2 text-sm text-accent-blue border border-accent-blue/20 rounded-xl hover:bg-accent-blue/5 transition-colors font-medium"
              >
                {showAddChar ? '▲ Хаах' : '+ Шинэ дүр нэмэх'}
              </button>

              <AnimatePresence>
                {showAddChar && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    <AddCharacterForm animeId={anime.id} onSuccess={() => { onRefresh(); setShowAddChar(false); }} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Content Tab ─────────────────────────────────────────────────────────────
function ContentTab() {
  const queryClient = useQueryClient();
  const [showAddAnime, setShowAddAnime] = useState(false);

  const { data: animes = [], isLoading } = useQuery({
    queryKey: ['admin-animes'],
    queryFn: adminApi.getAllAnimes,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-animes'] });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg">🎬 Anime & Дүрийн удирдлага</h3>
          <p className="text-sm text-muted-foreground">Anime нэмэх, дүр нэмэх, skill тохируулах</p>
        </div>
        <button
          onClick={() => setShowAddAnime((x) => !x)}
          className="px-4 py-2 bg-primary/20 text-primary border border-primary/30 rounded-xl text-sm font-bold hover:bg-primary/30 transition-colors active:scale-95"
        >
          {showAddAnime ? '▲ Хаах' : '+ Anime нэмэх'}
        </button>
      </div>

      {/* Add anime form */}
      <AnimatePresence>
        {showAddAnime && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <AddAnimeForm onSuccess={() => { refresh(); setShowAddAnime(false); }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skill effects legend */}
      <div className="bg-surface-2 rounded-xl border border-border p-4">
        <p className="text-xs font-bold text-muted-foreground mb-2">⚡ Skill Effect тайлбар — дараах өнгүүд тоглоомд автоматаар харагдана:</p>
        <div className="flex flex-wrap gap-2">
          {SKILL_EFFECTS.map((e) => (
            <span key={e.value} className={clsx('text-xs px-2 py-1 bg-surface rounded-lg border border-border', e.color)}>
              {e.label}
            </span>
          ))}
        </div>
      </div>

      {/* Anime list */}
      {isLoading ? (
        <div className="flex justify-center py-8"><div className="anime-spinner w-8 h-8" /></div>
      ) : (animes as any[]).length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-3xl mb-2">🎬</p>
          <p>Anime байхгүй байна. Дээрх товчоор нэмнэ үү.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(animes as any[]).map((anime: any) => (
            <AnimeCard key={anime.id} anime={anime} onRefresh={refresh} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
export default function AdminPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [userSearch, setUserSearch] = useState('');
  const [banUserId, setBanUserId] = useState('');
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState<number | undefined>(24);

  useEffect(() => {
    if (!user || user.role === 'USER') {
      router.push('/dashboard/profile');
    }
  }, [user, router]);

  if (!user || user.role === 'USER') return null;

  const { data: dashboard } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: adminApi.getDashboard,
    refetchInterval: 30000,
    enabled: tab === 'dashboard',
  });

  const { data: usersData } = useQuery({
    queryKey: ['admin-users', userSearch],
    queryFn: () => adminApi.getUsers(userSearch ? `search=${userSearch}` : ''),
    enabled: tab === 'users',
  });

  const { data: pendingPayments = [] } = useQuery({
    queryKey: ['admin-pending-payments'],
    queryFn: adminApi.getPendingPayments,
    enabled: tab === 'payments',
    refetchInterval: 30000,
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: adminApi.getReports,
    enabled: tab === 'reports',
  });

  const { data: metrics } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: adminApi.getMetrics,
    enabled: tab === 'monitor',
    refetchInterval: 10000,
  });

  const banMutation = useMutation({
    mutationFn: ({ userId, reason, duration }: any) => adminApi.banUser(userId, reason, duration),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Хэрэглэгч хориглогдлоо');
      setBanUserId(''); setBanReason('');
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Алдаа гарлаа'),
  });

  const unbanMutation = useMutation({
    mutationFn: (userId: string) => adminApi.unbanUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Хориглолт арилгагдлаа');
    },
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: (paymentId: string) => adminApi.verifyPayment(paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-payments'] });
      toast.success('✅ Төлбөр баталгаажлаа. Дүр unlock хийгдлээ!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Алдаа гарлаа'),
  });

  const rejectPaymentMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminApi.rejectPayment(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-payments'] });
      toast.success('Төлбөр цуцлагдлаа');
    },
  });

  const startSeasonMutation = useMutation({
    mutationFn: seasonAdminApi.startSeason,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] }); toast.success('🗓️ Шинэ season эхэллээ!'); },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Season эхлүүлэхэд алдаа гарлаа'),
  });

  const endSeasonMutation = useMutation({
    mutationFn: seasonAdminApi.endSeason,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] }); toast.success('🏁 Season дууслаа'); },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Алдаа гарлаа'),
  });

  const TABS: { key: AdminTab; label: string; icon: string }[] = [
    { key: 'dashboard', label: 'Хянах самбар', icon: '📊' },
    { key: 'content',   label: 'Anime & Дүр',  icon: '🎬' },
    { key: 'users',     label: 'Хэрэглэгчид',  icon: '👥' },
    { key: 'payments',  label: 'Төлбөрүүд',    icon: '💳' },
    { key: 'reports',   label: 'Гомдолууд',    icon: '📋' },
    { key: 'monitor',   label: 'Сервер',        icon: '🖥️' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Admin header */}
      <div className="sticky top-0 z-50 border-b border-border glass">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard/profile')} className="text-muted-foreground hover:text-foreground text-sm">
              ← Буцах
            </button>
            <h1 className="font-black text-lg">🛡️ Admin Panel</h1>
            <span className="text-xs px-2 py-0.5 bg-accent/20 text-accent border border-accent/30 rounded-full">{user.role}</span>
          </div>
          <span className="text-sm text-muted-foreground">{user.username}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1.5 border-b border-border pb-1 mb-6 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={clsx(
                'flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-sm font-medium whitespace-nowrap transition-colors',
                tab === t.key ? 'bg-primary/20 text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── DASHBOARD ── */}
        {tab === 'dashboard' && (
          <div className="space-y-6">
            {dashboard && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: 'Нийт хэрэглэгч', value: dashboard.totalUsers, icon: '👥', color: 'text-foreground' },
                  { label: 'Онлайн', value: dashboard.onlineCount, icon: '🟢', color: 'text-accent-green' },
                  { label: 'Идэвхтэй', value: dashboard.activeUsers, icon: '✅', color: 'text-accent-blue' },
                  { label: 'Хориглогдсон', value: dashboard.bannedUsers, icon: '🚫', color: 'text-accent-red' },
                  { label: 'Хүлээгдэж буй төлбөр', value: dashboard.pendingPayments, icon: '💳', color: 'text-accent' },
                  { label: 'Season оролцогч', value: dashboard.activeSeasonParticipants, icon: '⚔️', color: 'text-primary' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-surface border border-border rounded-xl p-4">
                    <p className="text-2xl mb-1">{stat.icon}</p>
                    <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="bg-surface border border-accent-red/20 rounded-xl p-5">
              <h4 className="font-bold mb-3">⚔️ Season удирдлага</h4>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => startSeasonMutation.mutate()} disabled={startSeasonMutation.isPending} className="px-5 py-2.5 bg-accent-green/20 text-accent-green border border-accent-green/30 rounded-xl text-sm font-bold hover:bg-accent-green/30 transition-colors disabled:opacity-50 active:scale-95">
                  {startSeasonMutation.isPending ? '...' : '▶ Шинэ Season эхлүүлэх'}
                </button>
                <button onClick={() => endSeasonMutation.mutate()} disabled={endSeasonMutation.isPending} className="px-5 py-2.5 bg-accent-red/20 text-accent-red border border-accent-red/30 rounded-xl text-sm font-bold hover:bg-accent-red/30 transition-colors disabled:opacity-50 active:scale-95">
                  {endSeasonMutation.isPending ? '...' : '⏹ Season дуусгах'}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Season автоматаар Даваа 00:00-д эхэлж, Баасан 23:59-д дуусна.</p>
            </div>
          </div>
        )}

        {/* ── CONTENT ── */}
        {tab === 'content' && <ContentTab />}

        {/* ── USERS ── */}
        {tab === 'users' && (
          <div className="space-y-4">
            <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Нэр, имэйл, systemID хайх..." className="w-full px-4 py-2 bg-surface-2 border border-border rounded-xl text-sm focus:outline-none focus:border-primary" />
            <div className="bg-surface border border-accent-red/30 rounded-xl p-4">
              <h4 className="font-bold mb-3 text-accent-red">⛔ Хэрэглэгч хориглох</h4>
              <div className="flex flex-col sm:flex-row gap-2">
                <input value={banUserId} onChange={(e) => setBanUserId(e.target.value)} placeholder="User ID эсвэл username" className="flex-1 px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary" />
                <input value={banReason} onChange={(e) => setBanReason(e.target.value)} placeholder="Шалтгаан" className="flex-1 px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary" />
                <select value={banDuration ?? ''} onChange={(e) => setBanDuration(e.target.value ? parseInt(e.target.value) : undefined)} className="px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm">
                  <option value="24">24ц</option>
                  <option value="72">3 хоног</option>
                  <option value="168">7 хоног</option>
                  <option value="">Байнгын</option>
                </select>
                <button onClick={() => banMutation.mutate({ userId: banUserId, reason: banReason, duration: banDuration })} disabled={!banUserId || !banReason || banMutation.isPending} className="px-4 py-2 bg-accent-red/20 text-accent-red border border-accent-red/30 rounded-lg text-sm font-medium hover:bg-accent-red/30 disabled:opacity-40 transition-colors">
                  Хориглох
                </button>
              </div>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-2">
                    {['Хэрэглэгч', 'SystemID', 'Статус', 'Үүрэг', 'Үйлдэл'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-muted-foreground font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {usersData?.users?.map((u: any) => (
                    <tr key={u.id} className="border-b border-border hover:bg-surface-2 transition-colors">
                      <td className="px-4 py-3"><p className="font-medium">{u.username}</p><p className="text-xs text-muted-foreground">{u.email}</p></td>
                      <td className="px-4 py-3 font-mono text-xs text-accent">{u.systemId}</td>
                      <td className="px-4 py-3">
                        <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', u.isBanned ? 'bg-accent-red/20 text-accent-red' : u.isMuted ? 'bg-accent/20 text-accent' : 'bg-accent-green/20 text-accent-green')}>
                          {u.isBanned ? '🚫 Banned' : u.isMuted ? '🔇 Muted' : '✅ Active'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">{u.role}</td>
                      <td className="px-4 py-3">
                        {u.isBanned ? (
                          <button onClick={() => unbanMutation.mutate(u.id)} className="text-xs px-3 py-1 bg-accent-green/20 text-accent-green border border-accent-green/30 rounded-lg hover:bg-accent-green/30 transition-colors">Хориглолт арилгах</button>
                        ) : (
                          <button onClick={() => { setBanUserId(u.id); setBanReason('Admin action'); }} className="text-xs px-3 py-1 bg-accent-red/20 text-accent-red border border-accent-red/30 rounded-lg hover:bg-accent-red/30 transition-colors">Хориглох</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── PAYMENTS ── */}
        {tab === 'payments' && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg">💳 Хүлээгдэж буй банкны шилжүүлгүүд</h3>
            {(pendingPayments as any[]).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground"><p>Хүлээгдэж буй төлбөр байхгүй байна</p></div>
            ) : (
              (pendingPayments as any[]).map((payment: any) => (
                <div key={payment.id} className="bg-surface border border-border rounded-xl p-5">
                  <div className="flex flex-col sm:flex-row gap-4 justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold">{payment.user?.username}</span>
                        <span className="text-xs font-mono text-accent bg-accent/10 px-2 py-0.5 rounded">{payment.user?.systemId}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{payment.user?.email}</p>
                      <div className="mt-2 flex gap-3 text-sm">
                        <span className="font-bold text-accent-green">{payment.amount?.toLocaleString()}₮</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">{new Date(payment.createdAt).toLocaleString('mn-MN')}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 items-start">
                      <button onClick={() => verifyPaymentMutation.mutate(payment.id)} disabled={verifyPaymentMutation.isPending} className="px-4 py-2 bg-accent-green/20 text-accent-green border border-accent-green/30 rounded-lg text-sm font-medium hover:bg-accent-green/30 disabled:opacity-50 transition-colors">✅ Баталгаажуулах</button>
                      <button onClick={() => rejectPaymentMutation.mutate({ id: payment.id, reason: 'Буруу гүйлгээ' })} className="px-4 py-2 bg-accent-red/20 text-accent-red border border-accent-red/30 rounded-lg text-sm font-medium hover:bg-accent-red/30 transition-colors">✕ Цуцлах</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── REPORTS ── */}
        {tab === 'reports' && (
          <div className="space-y-3">
            <h3 className="font-bold text-lg">📋 Хянагдаагүй гомдолууд</h3>
            {(reports as any[]).length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Гомдол байхгүй байна</p>
            ) : (
              (reports as any[]).map((report: any) => (
                <div key={report.id} className="bg-surface border border-border rounded-xl p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium"><span className="text-muted-foreground">{report.reporter?.username}</span>{' → '}<span className="text-accent-red">{report.reported?.username}</span></p>
                      <p className="text-sm text-muted-foreground mt-1">{report.reason}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{new Date(report.createdAt).toLocaleString('mn-MN')}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => adminApi.resolveReport(report.id, 'resolve')} className="text-xs px-3 py-1 bg-accent-green/20 text-accent-green border border-accent-green/30 rounded-lg hover:bg-accent-green/30">Шийдэх</button>
                      <button onClick={() => adminApi.resolveReport(report.id, 'dismiss')} className="text-xs px-3 py-1 bg-surface-2 text-muted-foreground border border-border rounded-lg hover:bg-surface">Хаах</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── MONITOR ── */}
        {tab === 'monitor' && metrics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-surface border border-border rounded-xl p-4">
              <h4 className="font-bold mb-3">🌐 Хэрэглэгчид</h4>
              <p className="text-3xl font-black text-accent-green">{metrics.onlineUsers}</p>
              <p className="text-sm text-muted-foreground">Онлайн хэрэглэгч</p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4">
              <h4 className="font-bold mb-3">💾 Memory</h4>
              <p className="text-2xl font-black">{metrics.memory?.heapUsed}MB</p>
              <p className="text-sm text-muted-foreground">/ {metrics.memory?.heapTotal}MB heap</p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4">
              <h4 className="font-bold mb-3">⏱ Uptime</h4>
              <p className="text-2xl font-black">{Math.floor(metrics.uptime / 3600)}ц {Math.floor((metrics.uptime % 3600) / 60)}м</p>
              <p className="text-sm text-muted-foreground">Node {metrics.nodeVersion}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
