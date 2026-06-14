import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { leaderboardApi } from '../../lib/api';
import { useAuthStore } from '../../store/auth.store';
import { colors, spacing, radius, font } from '../../constants/theme';
import { router } from 'expo-router';

const RANK_COLORS = ['#F59E0B', '#9CA3AF', '#CD7C3A', colors.primary, colors.primary];
const RANK_EMOJI = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

const TABS = ['PvP', 'Тоглоом', 'Гилд'];

export default function LeaderboardScreen() {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState(0);

  const { data: attackLb = [], isLoading: a } = useQuery({ queryKey: ['lb-attack'], queryFn: () => leaderboardApi.getAttack(50) });
  const { data: gameLb = [], isLoading: g } = useQuery({ queryKey: ['lb-game'], queryFn: () => leaderboardApi.getMiniGame('daily') });
  const { data: guildLb = [], isLoading: gl } = useQuery({ queryKey: ['lb-guild'], queryFn: leaderboardApi.getGuild });

  const lists = [attackLb, gameLb, guildLb] as any[][];
  const loading = [a, g, gl][tab];
  const data = lists[tab];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>←</Text></TouchableOpacity>
        <Text style={styles.title}>🏆 Жагсаалт</Text>
      </View>
      <View style={styles.tabRow}>
        {TABS.map((t, i) => (
          <TouchableOpacity key={t} onPress={() => setTab(i)} style={[styles.tab, tab === i && styles.tabActive]}>
            {tab === i && <LinearGradient colors={colors.gradient} style={StyleSheet.absoluteFill} />}
            <Text style={[styles.tabText, tab === i && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> : data.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏆</Text>
            <Text style={styles.emptyTitle}>Жагсаалт хоосон байна</Text>
            <Text style={styles.emptyDesc}>Идэвхтэй тоглож эхний байрыг эзэлээрэй!</Text>
          </View>
        ) : (
          data.map((entry: any, i) => {
            const isMe = entry.userId === user?.id;
            const color = RANK_COLORS[i] ?? colors.textMuted;
            return (
              <View key={entry.userId ?? entry.id ?? i} style={[styles.row, isMe && styles.rowMe]}>
                {isMe && <LinearGradient colors={colors.gradientDark} style={StyleSheet.absoluteFill} />}
                <View style={[styles.rankBadge, { backgroundColor: color + '22', borderColor: color + '55' }]}>
                  <Text style={[styles.rankText, { color }]}>{i < 3 ? RANK_EMOJI[i] : `#${i + 1}`}</Text>
                </View>
                <LinearGradient colors={colors.gradient} style={styles.avatar}>
                  <Text style={styles.avatarText}>{(entry.username ?? entry.name ?? 'G')[0].toUpperCase()}</Text>
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{entry.displayName ?? entry.username ?? entry.name}{isMe ? ' (Та)' : ''}</Text>
                  {entry.currentHp != null && (
                    <View style={styles.hpBar}>
                      <View style={[styles.hpFill, { width: `${Math.max(0, (entry.currentHp / (entry.maxHp ?? 100)) * 100)}%` as any }]} />
                    </View>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  {entry.kills != null && <Text style={styles.stat}>💀 {entry.kills}</Text>}
                  {entry.score != null && <Text style={styles.stat}>⭐ {entry.score}</Text>}
                  {entry.totalCp != null && <Text style={styles.stat}>💎 {entry.totalCp}</Text>}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { color: colors.text, fontSize: 22 },
  title: { color: colors.text, fontWeight: '800', fontSize: font.xl },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', overflow: 'hidden' },
  tabActive: {},
  tabText: { color: colors.textSecondary, fontSize: font.sm, fontWeight: '600' },
  tabTextActive: { color: '#fff', fontWeight: '800' },
  scroll: { padding: spacing.md, gap: spacing.sm, paddingBottom: 40 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  rowMe: { borderColor: colors.primary },
  rankBadge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  rankText: { fontWeight: '800', fontSize: 14 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700' },
  name: { color: colors.text, fontWeight: '600', fontSize: font.md },
  hpBar: { height: 4, backgroundColor: colors.bgElevated, borderRadius: 2, overflow: 'hidden', marginTop: 4, width: 120 },
  hpFill: { height: '100%', backgroundColor: colors.success, borderRadius: 2 },
  stat: { color: colors.textSecondary, fontSize: font.sm, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 70, gap: spacing.sm },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { color: colors.text, fontWeight: '900', fontSize: font.lg },
  emptyDesc: { color: colors.textSecondary, fontSize: font.sm, textAlign: 'center' },
});
