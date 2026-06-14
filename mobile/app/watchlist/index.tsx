import { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { watchlistApi, animeApi } from '../../lib/api';
import { colors, spacing, radius, font } from '../../constants/theme';
import { router } from 'expo-router';

const STATUS: Record<string, { label: string; color: string; icon: string }> = {
  PLANNING:  { label: 'Төлөвлөж буй', color: '#6B7280', icon: '📋' },
  WATCHING:  { label: 'Үзэж байна',   color: '#06B6D4', icon: '▶️' },
  COMPLETED: { label: 'Дууссан',      color: '#10B981', icon: '✅' },
  DROPPED:   { label: 'Орхисон',      color: '#EF4444', icon: '🚫' },
};
const ORDER = ['WATCHING', 'PLANNING', 'COMPLETED', 'DROPPED'];

export default function WatchlistScreen() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'list' | 'add'>('list');

  const { data: watchlist = [], isLoading } = useQuery({ queryKey: ['watchlist'], queryFn: watchlistApi.getAll });
  const { data: allAnime = [], isLoading: aLoad } = useQuery({ queryKey: ['all-anime'], queryFn: animeApi.getAll, enabled: tab === 'add' });

  const addMut = useMutation({
    mutationFn: ({ animeId, status }: any) => watchlistApi.add(animeId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watchlist'] }),
  });
  const removeMut = useMutation({
    mutationFn: (animeId: string) => watchlistApi.remove(animeId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watchlist'] }),
  });

  const watchedIds = new Set((watchlist as any[]).map((w: any) => w.animeId));

  const cycleStatus = (w: any) => {
    const idx = ORDER.indexOf(w.status);
    const next = ORDER[(idx + 1) % ORDER.length];
    addMut.mutate({ animeId: w.animeId, status: next });
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Text style={s.back}>←</Text></TouchableOpacity>
        <Text style={s.title}>📺 Жагсаалт</Text>
      </View>

      <View style={s.tabRow}>
        {[{ k: 'list', l: '📺 Миний жагсаалт' }, { k: 'add', l: '➕ Нэмэх' }].map((t) => (
          <TouchableOpacity key={t.k} onPress={() => setTab(t.k as any)} style={[s.tab, tab === t.k && s.tabActive]}>
            {tab === t.k && <LinearGradient colors={colors.gradient} style={StyleSheet.absoluteFill} />}
            <Text style={[s.tabText, tab === t.k && s.tabTextActive]}>{t.l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'list' ? (
        isLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> :
        (watchlist as any[]).length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>📺</Text>
            <Text style={s.emptyTitle}>Жагсаалт хоосон</Text>
            <Text style={s.emptyDesc}>Дуртай анимэгээ нэмээрэй</Text>
            <TouchableOpacity onPress={() => setTab('add')} style={s.cta}>
              <LinearGradient colors={['#0E7490', '#06B6D4']} style={s.ctaInner}><Text style={s.ctaText}>➕ Анимэ нэмэх</Text></LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={ORDER.filter((st) => (watchlist as any[]).some((w: any) => w.status === st))}
            keyExtractor={(st) => st}
            contentContainerStyle={s.list}
            renderItem={({ item: st }) => {
              const items = (watchlist as any[]).filter((w: any) => w.status === st);
              const cfg = STATUS[st];
              return (
                <View style={{ marginBottom: spacing.lg }}>
                  <View style={s.groupHead}>
                    <Text style={[s.groupLabel, { color: cfg.color }]}>{cfg.icon} {cfg.label}</Text>
                    <View style={[s.countBadge, { backgroundColor: cfg.color + '22' }]}><Text style={[s.countText, { color: cfg.color }]}>{items.length}</Text></View>
                  </View>
                  <View style={s.cardsRow}>
                    {items.map((w: any) => (
                      <View key={w.id} style={s.card}>
                        <Image source={{ uri: w.anime?.imageUrl }} style={s.cardImg} />
                        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={s.cardOverlay} />
                        <Text style={s.cardName} numberOfLines={2}>{w.anime?.name}</Text>
                        <TouchableOpacity style={[s.statusChip, { backgroundColor: cfg.color + 'CC' }]} onPress={() => cycleStatus(w)}>
                          <Text style={s.statusChipText}>{cfg.icon}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.removeBtn} onPress={() => removeMut.mutate(w.animeId)}>
                          <Text style={s.removeText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              );
            }}
          />
        )
      ) : (
        aLoad ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> : (
          <FlatList
            data={allAnime as any[]}
            keyExtractor={(a) => a.id}
            numColumns={3}
            contentContainerStyle={s.grid}
            columnWrapperStyle={{ gap: spacing.sm }}
            renderItem={({ item }) => {
              const inList = watchedIds.has(item.id);
              return (
                <TouchableOpacity
                  style={[s.addCard, inList && { borderColor: '#06B6D4' }]}
                  activeOpacity={0.8}
                  onPress={() => inList ? removeMut.mutate(item.id) : addMut.mutate({ animeId: item.id, status: 'PLANNING' })}>
                  <Image source={{ uri: item.imageUrl }} style={s.cardImg} />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={s.cardOverlay} />
                  <Text style={s.cardName} numberOfLines={2}>{item.name}</Text>
                  {inList && <View style={s.check}><Text style={{ fontSize: 12 }}>✓</Text></View>}
                </TouchableOpacity>
              );
            }}
          />
        )
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  back: { color: colors.text, fontSize: 22 },
  title: { color: colors.text, fontWeight: '800', fontSize: font.xl },
  tabRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, marginVertical: spacing.sm },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  tabActive: { borderColor: 'transparent' },
  tabText: { color: colors.textSecondary, fontWeight: '700', fontSize: font.sm },
  tabTextActive: { color: '#fff', fontWeight: '800' },
  list: { padding: spacing.md, paddingBottom: 40 },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  groupLabel: { fontWeight: '800', fontSize: font.sm, textTransform: 'uppercase', letterSpacing: 1 },
  countBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
  countText: { fontWeight: '900', fontSize: font.xs },
  cardsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  card: { width: '31%', aspectRatio: 0.7, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  cardImg: { width: '100%', height: '100%', position: 'absolute' },
  cardOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%' },
  cardName: { position: 'absolute', bottom: 6, left: 6, right: 6, color: '#fff', fontWeight: '800', fontSize: font.xs },
  statusChip: { position: 'absolute', top: 6, left: 6, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statusChipText: { fontSize: 12 },
  removeBtn: { position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  removeText: { color: '#fff', fontSize: 11 },
  grid: { padding: spacing.md, paddingBottom: 40 },
  addCard: { width: '31%', aspectRatio: 0.7, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  check: { position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: '#06B6D4', alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: spacing.sm },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { color: colors.text, fontWeight: '900', fontSize: font.lg },
  emptyDesc: { color: colors.textSecondary, fontSize: font.sm, textAlign: 'center' },
  cta: { marginTop: spacing.md, borderRadius: radius.lg, overflow: 'hidden' },
  ctaInner: { paddingHorizontal: 28, paddingVertical: 12 },
  ctaText: { color: '#fff', fontWeight: '900', fontSize: font.md },
});
