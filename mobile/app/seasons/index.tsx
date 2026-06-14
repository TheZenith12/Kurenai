import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { seasonApi } from '../../lib/api';
import { colors, spacing, radius, font } from '../../constants/theme';
import { router } from 'expo-router';

const TIER: Record<string, string> = { BRONZE: '🥉', SILVER: '🥈', GOLD: '🥇', PLATINUM: '💎', DIAMOND: '🔷' };

export default function SeasonsScreen() {
  const { data: history = [], isLoading } = useQuery({ queryKey: ['season-history'], queryFn: seasonApi.getHistory });
  const { data: current } = useQuery({ queryKey: ['season-current'], queryFn: seasonApi.getCurrent });

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Text style={s.back}>←</Text></TouchableOpacity>
        <Text style={s.title}>🏆 Сезоны түүх</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {current && (
          <View style={s.currentCard}>
            <LinearGradient colors={['rgba(220,38,38,0.18)', 'rgba(0,0,0,0.5)']} style={StyleSheet.absoluteFill} />
            <View style={s.liveBadge}><View style={s.liveDot} /><Text style={s.liveText}>ИДЭВХТЭЙ</Text></View>
            <Text style={s.currentLabel}>Одоогийн сезон</Text>
            <Text style={s.currentName}>{current.name ?? `Сезон ${current.number ?? '1'}`}</Text>
            <Text style={s.currentDate}>Эхэлсэн: {current.startedAt ? new Date(current.startedAt).toLocaleDateString('mn-MN') : '—'}</Text>
          </View>
        )}

        {isLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> :
        (history as any[]).length === 0 ? (
          <View style={s.empty}><Text style={s.emptyIcon}>📅</Text><Text style={s.emptyTitle}>Өнгөрсөн сезон байхгүй</Text><Text style={s.emptyDesc}>Эхний сезон дуусахад түүх энд харагдана</Text></View>
        ) : (
          <>
            <Text style={s.sectionTitle}>ӨНГӨРСӨН СЕЗОНУУД</Text>
            {(history as any[]).map((season: any, idx: number) => (
              <View key={season.id} style={s.card}>
                <View style={s.cardHead}>
                  <View>
                    <Text style={s.cardName}>{season.name ?? `Сезон ${season.number ?? idx + 1}`}</Text>
                    <Text style={s.cardDate}>
                      {season.startedAt ? new Date(season.startedAt).toLocaleDateString('mn-MN') : '—'} — {season.endedAt ? new Date(season.endedAt).toLocaleDateString('mn-MN') : '—'}
                    </Text>
                  </View>
                  <View style={s.doneBadge}><Text style={s.doneText}>Дууссан</Text></View>
                </View>
                {season.stats && season.stats.length > 0 && (
                  <View style={s.topList}>
                    {season.stats.slice(0, 5).map((st: any, ri: number) => (
                      <View key={st.userId} style={s.topRow}>
                        <Text style={s.topRank}>{['👑', '🥈', '🥉'][ri] ?? `${ri + 1}`}</Text>
                        <Text style={s.topName} numberOfLines={1}>{st.user?.username ?? 'Unknown'}</Text>
                        <Text style={s.topTier}>{TIER[st.mastery ?? 'BRONZE'] ?? '🥉'}</Text>
                        <Text style={s.topAp}>{st.attackPoint ?? 0} AP</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  back: { color: colors.text, fontSize: 22 },
  title: { color: colors.text, fontWeight: '800', fontSize: font.xl },
  scroll: { padding: spacing.md, paddingBottom: 40 },
  currentCard: { borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: 'rgba(220,38,38,0.3)', overflow: 'hidden', marginBottom: spacing.lg },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, position: 'absolute', top: spacing.md, right: spacing.md, backgroundColor: 'rgba(34,197,94,0.15)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)', borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' },
  liveText: { color: '#4ade80', fontWeight: '800', fontSize: 9 },
  currentLabel: { color: colors.textSecondary, fontSize: font.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  currentName: { color: colors.text, fontWeight: '900', fontSize: font.xl, marginTop: 2 },
  currentDate: { color: colors.textSecondary, fontSize: font.sm, marginTop: spacing.sm },
  sectionTitle: { color: colors.textMuted, fontSize: font.xs, fontWeight: '700', letterSpacing: 2, marginBottom: spacing.sm },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  cardName: { color: colors.text, fontWeight: '800', fontSize: font.md },
  cardDate: { color: colors.textSecondary, fontSize: font.xs, marginTop: 2 },
  doneBadge: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: colors.border, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  doneText: { color: colors.textSecondary, fontSize: font.xs, fontWeight: '700' },
  topList: { gap: 6, marginTop: spacing.xs },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  topRank: { width: 24, textAlign: 'center', fontSize: font.sm },
  topName: { flex: 1, color: colors.textSecondary, fontWeight: '600', fontSize: font.sm },
  topTier: { fontSize: font.sm },
  topAp: { color: '#fbbf24', fontWeight: '800', fontSize: font.xs },
  empty: { alignItems: 'center', paddingVertical: 60, gap: spacing.sm },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { color: colors.text, fontWeight: '900', fontSize: font.lg },
  emptyDesc: { color: colors.textSecondary, fontSize: font.sm, textAlign: 'center' },
});
