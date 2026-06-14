import { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cosmeticsApi } from '../../lib/api';
import { colors, spacing, radius, font } from '../../constants/theme';
import { router } from 'expo-router';

const TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  AVATAR_FRAME:   { label: 'Avatar Frame', icon: '🖼️', color: '#8B5CF6' },
  CHAT_ANIMATION: { label: 'Чат анимаци',  icon: '💬', color: '#06B6D4' },
  CHAT_EFFECT:    { label: 'Чат эффект',   icon: '✨', color: '#F59E0B' },
  TITLE:          { label: 'Гарчиг',       icon: '🏷️', color: '#10B981' },
};

const RARITY_CONFIG: Record<string, { label: string; color: string }> = {
  COMMON:    { label: 'Энгийн', color: '#6B7280' },
  RARE:      { label: 'Ховор',  color: '#3B82F6' },
  EPIC:      { label: 'Эпик',   color: '#8B5CF6' },
  LEGENDARY: { label: 'Домогт', color: '#F59E0B' },
};

export default function CosmeticsScreen() {
  const qc = useQueryClient();
  const [filterType, setFilterType] = useState<string | null>(null);

  const { data: all = [], isLoading: allLoad } = useQuery({ queryKey: ['cosmetics-all'], queryFn: cosmeticsApi.getAll });
  const { data: my = [], isLoading: myLoad } = useQuery({ queryKey: ['cosmetics-my'],   queryFn: cosmeticsApi.getMy });
  const { data: equipped = [] }              = useQuery({ queryKey: ['cosmetics-equipped'], queryFn: cosmeticsApi.getEquipped });

  const buyMut = useMutation({
    mutationFn: cosmeticsApi.buy,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cosmetics-my'] }); Alert.alert('✅', 'Худалдан авлаа!'); },
    onError: (e: any) => Alert.alert('Алдаа', e?.response?.data?.message ?? 'Алдаа'),
  });

  const equipMut = useMutation({
    mutationFn: cosmeticsApi.equip,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cosmetics-equipped'] }); Alert.alert('✅', 'Тоноглолоо!'); },
    onError: (e: any) => Alert.alert('Алдаа', e?.response?.data?.message ?? 'Алдаа'),
  });

  const unequipMut = useMutation({
    mutationFn: cosmeticsApi.unequip,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cosmetics-equipped'] }); },
  });

  const myIds = new Set((my as any[]).map((m: any) => m.cosmeticId ?? m.id));
  const equippedIds = new Set((equipped as any[]).map((e: any) => e.cosmeticId ?? e.id));

  const types = Object.keys(TYPE_CONFIG);
  const filteredAll = filterType
    ? (all as any[]).filter((item: any) => item.type === filterType)
    : (all as any[]);

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>🎨 Гоёлын зүйлс</Text>
      </View>

      {/* Type filter */}
      <View style={s.filterRow}>
        <TouchableOpacity onPress={() => setFilterType(null)} style={[s.filterChip, !filterType && s.filterChipActive]}>
          {!filterType && <LinearGradient colors={colors.gradient} style={StyleSheet.absoluteFill} />}
          <Text style={[s.filterText, !filterType && s.filterTextActive]}>Бүгд</Text>
        </TouchableOpacity>
        {types.map((t) => {
          const cfg = TYPE_CONFIG[t];
          const active = filterType === t;
          return (
            <TouchableOpacity key={t} onPress={() => setFilterType(t)} style={[s.filterChip, active && s.filterChipActive, active && { borderColor: `${cfg.color}60` }]}>
              {active && <LinearGradient colors={[`${cfg.color}40`, `${cfg.color}20`]} style={StyleSheet.absoluteFill} />}
              <Text style={[s.filterText, active && { color: cfg.color }]}>{cfg.icon} {cfg.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {(allLoad || myLoad) ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredAll}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={{ gap: spacing.md }}
          renderItem={({ item }) => {
            const typeCfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.AVATAR_FRAME;
            const rarityCfg = RARITY_CONFIG[item.rarity] ?? RARITY_CONFIG.COMMON;
            const owned = myIds.has(item.id);
            const isEquipped = equippedIds.has(item.id);

            return (
              <View style={[s.card, owned && { borderColor: `${typeCfg.color}40` }]}>
                {owned && <LinearGradient colors={[`${typeCfg.color}15`, 'rgba(0,0,0,0.6)']} style={StyleSheet.absoluteFill} />}

                {/* Preview area */}
                <View style={[s.preview, { backgroundColor: `${typeCfg.color}15` }]}>
                  <Text style={s.previewIcon}>{item.previewUrl ? '' : typeCfg.icon}</Text>
                  {isEquipped && (
                    <View style={s.equippedBadge}>
                      <Text style={s.equippedText}>✓ Тоноглосон</Text>
                    </View>
                  )}
                </View>

                <View style={s.cardBody}>
                  <Text style={s.cardName} numberOfLines={1}>{item.name}</Text>
                  <View style={s.cardMeta}>
                    <View style={[s.rarityBadge, { backgroundColor: `${rarityCfg.color}20` }]}>
                      <Text style={[s.rarityText, { color: rarityCfg.color }]}>{rarityCfg.label}</Text>
                    </View>
                    {item.pointsCost > 0 && <Text style={s.cost}>{item.pointsCost} CP</Text>}
                    {item.price > 0 && <Text style={s.cost}>₮{item.price}</Text>}
                  </View>

                  {owned ? (
                    isEquipped ? (
                      <TouchableOpacity onPress={() => unequipMut.mutate(item.id)} style={[s.actionBtn, { backgroundColor: `${typeCfg.color}20`, borderColor: `${typeCfg.color}40` }]}>
                        <Text style={[s.actionText, { color: typeCfg.color }]}>Тайлах</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity onPress={() => equipMut.mutate(item.id)} style={s.actionBtn}>
                        <LinearGradient colors={[typeCfg.color, `${typeCfg.color}BB`]} style={StyleSheet.absoluteFill} />
                        <Text style={s.actionTextWhite}>Тоноглох</Text>
                      </TouchableOpacity>
                    )
                  ) : (
                    <TouchableOpacity onPress={() => Alert.alert('Худалдан авах?', `${item.name} худалдан авах уу?`,
                      [{ text: 'Болих', style: 'cancel' }, { text: 'Авах', onPress: () => buyMut.mutate(item.id) }])}
                      style={[s.actionBtn, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.15)' }]}>
                      <Text style={s.actionText}>{item.pointsCost > 0 ? `${item.pointsCost} CP` : item.price > 0 ? `₮${item.price}` : 'Авах'}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backText: { color: colors.text, fontSize: 22 },
  title: { color: colors.text, fontWeight: '800', fontSize: font.xl },
  filterRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, flexWrap: 'wrap' },
  filterChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  filterChipActive: { borderColor: 'rgba(255,255,255,0.3)' },
  filterText: { color: colors.textSecondary, fontSize: font.xs, fontWeight: '700' },
  filterTextActive: { color: '#fff', fontWeight: '800' },
  list: { padding: spacing.md, gap: spacing.md, paddingBottom: 40 },
  card: { flex: 1, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', backgroundColor: colors.bgCard },
  preview: { height: 100, alignItems: 'center', justifyContent: 'center' },
  previewIcon: { fontSize: 40 },
  equippedBadge: { position: 'absolute', bottom: 6, left: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: radius.sm, paddingVertical: 3, alignItems: 'center' },
  equippedText: { color: '#4ade80', fontSize: 9, fontWeight: '800' },
  cardBody: { padding: spacing.sm, gap: 6 },
  cardName: { color: colors.text, fontWeight: '800', fontSize: font.sm },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  rarityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm },
  rarityText: { fontSize: 9, fontWeight: '800' },
  cost: { color: colors.primary, fontWeight: '800', fontSize: font.xs },
  actionBtn: { borderRadius: radius.md, paddingVertical: 7, alignItems: 'center', borderWidth: 1, borderColor: 'transparent', overflow: 'hidden' },
  actionText: { color: colors.text, fontWeight: '800', fontSize: font.xs },
  actionTextWhite: { color: '#fff', fontWeight: '900', fontSize: font.xs },
});
