import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { questsApi } from '../../lib/api';
import { colors, spacing, radius, font } from '../../constants/theme';
import { router } from 'expo-router';

const QUEST_COLORS: Record<string, [string, string]> = {
  PLAY_GAMES:    ['#7C3AED', '#A855F7'],
  SEND_MESSAGES: ['#0E7490', '#22D3EE'],
  ATTACK_PLAYER: ['#DC2626', '#F87171'],
  LEVEL_UP:      ['#065F46', '#34D399'],
  LOGIN:         ['#92400E', '#FBBF24'],
  default:       ['#374151', '#6B7280'],
};

export default function QuestsScreen() {
  const qc = useQueryClient();
  const { data: quests = [], isLoading } = useQuery({
    queryKey: ['quests-today'],
    queryFn: questsApi.getToday,
    refetchInterval: 60000,
  });

  const claimMut = useMutation({
    mutationFn: questsApi.claim,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quests-today'] });
      Alert.alert('✅ Амжилттай!', 'Шагнал амжилттай авлаа!');
    },
    onError: (e: any) => Alert.alert('Алдаа', e?.response?.data?.message ?? 'Алдаа'),
  });

  const total = (quests as any[]).length;
  const done = (quests as any[]).filter((q: any) => q.isCompleted).length;
  const pct = total > 0 ? (done / total) * 100 : 0;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🎯 Өдрийн даалгавар</Text>
      </View>

      {/* Progress banner */}
      <View style={styles.progressBanner}>
        <LinearGradient colors={['rgba(124,58,237,0.2)', 'rgba(0,0,0,0.5)']} style={StyleSheet.absoluteFill} />
        <View style={styles.progressTop}>
          <Text style={styles.progressLabel}>{done}/{total} гүйцэтгэсэн</Text>
          {done === total && total > 0 && (
            <View style={styles.allDoneBadge}>
              <Text style={styles.allDoneText}>🎉 Бүгд!</Text>
            </View>
          )}
        </View>
        <View style={styles.progressBar}>
          <LinearGradient colors={colors.gradient} style={[styles.progressFill, { width: `${pct}%` as any }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
        </View>
        <Text style={styles.progressSub}>{Math.round(pct)}% гүйцэтгэсэн</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={quests as any[]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const canClaim = item.isCompleted && !item.isClaimed;
            const progressPct = Math.min(100, ((item.progress ?? 0) / (item.goal ?? 1)) * 100);
            const gradColors = QUEST_COLORS[item.type] ?? QUEST_COLORS.default;
            return (
              <View style={[styles.card, canClaim && styles.cardHighlight]}>
                {canClaim && <LinearGradient colors={[`${gradColors[0]}22`, 'rgba(0,0,0,0.7)']} style={StyleSheet.absoluteFill} />}
                <View style={styles.cardInner}>
                  <View style={[styles.iconWrap, { backgroundColor: `${gradColors[0]}33` }]}>
                    <Text style={styles.iconText}>{item.icon ?? '🎯'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.questName, item.isCompleted && { color: colors.primaryLight }]}>{item.title}</Text>
                    <Text style={styles.questDesc} numberOfLines={1}>{item.description}</Text>
                    <View style={styles.questBar}>
                      <LinearGradient colors={item.isCompleted ? colors.gradient : [gradColors[0], gradColors[1]]}
                        style={[styles.questFill, { width: `${progressPct}%` as any }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                    </View>
                    <View style={styles.questMeta}>
                      <Text style={styles.questProgress}>{item.progress ?? 0}/{item.goal ?? 1}</Text>
                      {item.pointsReward > 0 && <Text style={[styles.reward, { color: gradColors[1] }]}>+{item.pointsReward} CP</Text>}
                    </View>
                  </View>
                  {canClaim ? (
                    <TouchableOpacity onPress={() => claimMut.mutate(item.id)} style={styles.claimBtn}>
                      <LinearGradient colors={colors.gradient} style={styles.claimBtnInner}>
                        <Text style={styles.claimBtnText}>Авах</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ) : item.isClaimed ? (
                    <View style={styles.claimedBadge}><Text style={styles.claimedText}>✓</Text></View>
                  ) : null}
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backText: { color: colors.text, fontSize: 22 },
  title: { color: colors.text, fontWeight: '800', fontSize: font.xl },
  progressBanner: { margin: spacing.md, borderRadius: radius.xl, padding: spacing.md, borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)', overflow: 'hidden', gap: spacing.sm },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { color: colors.text, fontWeight: '800', fontSize: font.lg },
  allDoneBadge: { backgroundColor: 'rgba(16,185,129,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full, borderWidth: 1, borderColor: 'rgba(16,185,129,0.4)' },
  allDoneText: { color: '#4ade80', fontWeight: '800', fontSize: font.sm },
  progressBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressSub: { color: colors.textSecondary, fontSize: font.xs },
  list: { padding: spacing.md, gap: spacing.md, paddingBottom: 40 },
  card: { borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', backgroundColor: colors.bgCard },
  cardHighlight: { borderColor: 'rgba(124,58,237,0.4)' },
  cardInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  iconWrap: { width: 48, height: 48, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  iconText: { fontSize: 24 },
  questName: { color: colors.text, fontWeight: '800', fontSize: font.md, marginBottom: 2 },
  questDesc: { color: colors.textSecondary, fontSize: font.xs, marginBottom: 6 },
  questBar: { height: 5, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  questFill: { height: '100%', borderRadius: 3 },
  questMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  questProgress: { color: colors.textSecondary, fontSize: font.xs },
  reward: { fontWeight: '800', fontSize: font.xs },
  claimBtn: { borderRadius: radius.md, overflow: 'hidden', flexShrink: 0 },
  claimBtnInner: { paddingHorizontal: 12, paddingVertical: 8 },
  claimBtnText: { color: '#fff', fontWeight: '900', fontSize: font.sm },
  claimedBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(16,185,129,0.2)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.4)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  claimedText: { color: '#4ade80', fontWeight: '900', fontSize: font.sm },
});
