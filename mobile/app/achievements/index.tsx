import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { achievementsApi } from '../../lib/api';
import { colors, spacing, radius, font } from '../../constants/theme';
import { router } from 'expo-router';

const RARITY_CONFIG: Record<string, { color: string; label: string; gradient: [string, string] }> = {
  COMMON:    { color: '#6B7280', label: 'Энгийн',    gradient: ['#374151', '#6B7280'] },
  RARE:      { color: '#3B82F6', label: 'Ховор',     gradient: ['#1E40AF', '#3B82F6'] },
  EPIC:      { color: '#8B5CF6', label: 'Эпик',      gradient: ['#5B21B6', '#8B5CF6'] },
  LEGENDARY: { color: '#F59E0B', label: 'Домогт',    gradient: ['#92400E', '#F59E0B'] },
};

export default function AchievementsScreen() {
  const qc = useQueryClient();
  const { data: all = [], isLoading: aLoad } = useQuery({ queryKey: ['achievements-all'], queryFn: achievementsApi.getAll });
  const { data: my = [], isLoading: mLoad } = useQuery({ queryKey: ['achievements-my'],  queryFn: achievementsApi.getMy });

  const claimMut = useMutation({
    mutationFn: achievementsApi.claim,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['achievements-my'] });
      Alert.alert('🏅 Амжилттай!', 'Шагнал авлаа!');
    },
    onError: (e: any) => Alert.alert('Алдаа', e?.response?.data?.message ?? 'Алдаа'),
  });

  const myMap = new Map((my as any[]).map((m: any) => [m.achievementId, m]));
  const earned = (my as any[]).filter((m: any) => m.isUnlocked).length;
  const total = (all as any[]).length;

  const isLoading = aLoad || mLoad;

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>🏅 Амжилтууд</Text>
      </View>

      {/* Summary */}
      <View style={s.summary}>
        <LinearGradient colors={['rgba(245,158,11,0.15)', 'rgba(0,0,0,0.5)']} style={StyleSheet.absoluteFill} />
        <Text style={s.summaryCount}>{earned}/{total}</Text>
        <Text style={s.summaryLabel}>Амжилт гүйцэтгэсэн</Text>
        <View style={s.summaryBar}>
          <LinearGradient colors={['#92400E', '#F59E0B']} style={[s.summaryFill, { width: `${total > 0 ? (earned / total) * 100 : 0}%` as any }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={all as any[]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const myEntry = myMap.get(item.id);
            const earned = !!myEntry?.isUnlocked;
            const claimed = !!myEntry?.isClaimed;
            const canClaim = earned && !claimed;
            const cfg = RARITY_CONFIG[item.rarity] ?? RARITY_CONFIG.COMMON;
            const progressPct = Math.min(100, ((myEntry?.progress ?? 0) / (item.goal ?? 1)) * 100);

            return (
              <View style={[s.card, earned && !claimed && { borderColor: `${cfg.color}60` }]}>
                {earned && !claimed && <LinearGradient colors={[`${cfg.gradient[0]}22`, 'rgba(0,0,0,0.7)']} style={StyleSheet.absoluteFill} />}
                <View style={s.cardInner}>
                  {/* Badge */}
                  <View style={[s.badge, { backgroundColor: `${cfg.color}20`, borderColor: `${cfg.color}40` }, !earned && s.badgeLocked]}>
                    <Text style={[s.badgeIcon, !earned && s.badgeIconLocked]}>{earned ? (item.icon ?? '🏅') : '🔒'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={s.nameRow}>
                      <Text style={[s.name, !earned && s.nameLocked]}>{item.title}</Text>
                      <View style={[s.rarityBadge, { backgroundColor: `${cfg.color}20` }]}>
                        <Text style={[s.rarityText, { color: cfg.color }]}>{cfg.label}</Text>
                      </View>
                    </View>
                    <Text style={s.desc} numberOfLines={2}>{item.description}</Text>
                    {!earned && item.goal > 0 && (
                      <>
                        <View style={s.progBar}>
                          <View style={[s.progFill, { width: `${progressPct}%`, backgroundColor: cfg.color }]} />
                        </View>
                        <Text style={s.progText}>{myEntry?.progress ?? 0}/{item.goal}</Text>
                      </>
                    )}
                    {item.pointsReward > 0 && (
                      <Text style={[s.reward, { color: cfg.color }]}>+{item.pointsReward} CP</Text>
                    )}
                  </View>
                  {canClaim && (
                    <TouchableOpacity onPress={() => claimMut.mutate(item.id)} style={s.claimBtn}>
                      <LinearGradient colors={cfg.gradient} style={s.claimBtnInner}>
                        <Text style={s.claimText}>Авах</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                  {claimed && (
                    <View style={[s.claimedBadge, { borderColor: `${cfg.color}40`, backgroundColor: `${cfg.color}20` }]}>
                      <Text style={[s.claimedText, { color: cfg.color }]}>✓</Text>
                    </View>
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
  summary: { margin: spacing.md, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', overflow: 'hidden', alignItems: 'center', gap: spacing.sm },
  summaryCount: { color: '#fbbf24', fontWeight: '900', fontSize: 40, lineHeight: 48 },
  summaryLabel: { color: colors.textSecondary, fontSize: font.sm },
  summaryBar: { width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' },
  summaryFill: { height: '100%', borderRadius: 3 },
  list: { padding: spacing.md, gap: spacing.sm, paddingBottom: 40 },
  card: { borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', backgroundColor: colors.bgCard },
  cardInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  badge: { width: 52, height: 52, borderRadius: radius.lg, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  badgeLocked: { opacity: 0.4 },
  badgeIcon: { fontSize: 26 },
  badgeIconLocked: { opacity: 0.5 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 2 },
  name: { color: colors.text, fontWeight: '800', fontSize: font.md, flex: 1 },
  nameLocked: { color: colors.textSecondary },
  rarityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm },
  rarityText: { fontSize: 9, fontWeight: '800' },
  desc: { color: colors.textSecondary, fontSize: font.xs, lineHeight: 16 },
  progBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden', marginTop: 4 },
  progFill: { height: '100%', borderRadius: 2 },
  progText: { color: colors.textSecondary, fontSize: 9, marginTop: 2 },
  reward: { fontSize: font.xs, fontWeight: '800', marginTop: 2 },
  claimBtn: { borderRadius: radius.md, overflow: 'hidden', flexShrink: 0 },
  claimBtnInner: { paddingHorizontal: 10, paddingVertical: 8 },
  claimText: { color: '#fff', fontWeight: '900', fontSize: font.sm },
  claimedBadge: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  claimedText: { fontWeight: '900', fontSize: font.sm },
});
