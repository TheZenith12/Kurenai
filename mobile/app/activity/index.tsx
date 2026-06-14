import { View, Text, SectionList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { activityApi } from '../../lib/api';
import { colors, spacing, radius, font } from '../../constants/theme';
import { router } from 'expo-router';

const TYPE: Record<string, { icon: string; color: string; label: string }> = {
  ATTACK_RECEIVED:      { icon: '⚔️', color: '#EF4444', label: 'Дайралт' },
  ACHIEVEMENT_UNLOCKED: { icon: '🏆', color: '#F59E0B', label: 'Амжилт' },
  QUEST_COMPLETED:      { icon: '📋', color: '#10B981', label: 'Даалгавар' },
  GUILD_INVITE:         { icon: '🏰', color: '#8B5CF6', label: 'Гилд' },
  GUILD_WAR:            { icon: '⚔️', color: '#DC2626', label: 'Гилд дайн' },
  SEASON_START:         { icon: '🗓️', color: '#06B6D4', label: 'Сезон' },
  SEASON_END:           { icon: '🏁', color: '#F97316', label: 'Сезон' },
  PAYMENT_CONFIRMED:    { icon: '💳', color: '#22C55E', label: 'Төлбөр' },
  SYSTEM:               { icon: '📢', color: '#6B7280', label: 'Систем' },
};

function timeAgo(date: string) {
  const m = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (m < 1) return 'сая'; if (m < 60) return `${m}м`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}ц`;
  return `${Math.floor(h / 24)}ө`;
}
function dayLabel(d: string) {
  const date = new Date(d), today = new Date(), y = new Date(); y.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Өнөөдөр';
  if (date.toDateString() === y.toDateString()) return 'Өчигдөр';
  return date.toLocaleDateString('mn-MN', { month: 'long', day: 'numeric' });
}

export default function ActivityScreen() {
  const { data: feed = [], isLoading } = useQuery({ queryKey: ['activity-feed'], queryFn: activityApi.getFeed, refetchInterval: 60000 });

  const groups: Record<string, any[]> = {};
  (feed as any[]).forEach((n: any) => { const k = new Date(n.createdAt).toDateString(); (groups[k] ??= []).push(n); });
  const sections = Object.entries(groups).map(([k, data]) => ({ title: dayLabel(data[0].createdAt), data }));

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Text style={s.back}>←</Text></TouchableOpacity>
        <Text style={s.title}>📡 Үйл ажиллагаа</Text>
      </View>

      {isLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> :
      sections.length === 0 ? (
        <View style={s.empty}><Text style={s.emptyIcon}>📡</Text><Text style={s.emptyTitle}>Үйл явдал байхгүй</Text><Text style={s.emptyDesc}>Тоглоод, тулалдаад идэвхтэй байгаарай!</Text></View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(it) => it.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          renderSectionHeader={({ section }) => <Text style={s.dayHead}>{section.title}</Text>}
          renderItem={({ item }) => {
            const cfg = TYPE[item.type] ?? TYPE.SYSTEM;
            return (
              <View style={s.row}>
                <View style={[s.iconWrap, { backgroundColor: cfg.color + '18', borderColor: cfg.color + '30' }]}><Text style={s.icon}>{cfg.icon}</Text></View>
                <View style={{ flex: 1 }}>
                  <View style={s.rowTop}>
                    <Text style={s.rowTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={s.time}>{timeAgo(item.createdAt)}</Text>
                  </View>
                  <Text style={s.body} numberOfLines={2}>{item.body}</Text>
                  <View style={[s.tag, { backgroundColor: cfg.color + '15' }]}><Text style={[s.tagText, { color: cfg.color }]}>{cfg.label}</Text></View>
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
  back: { color: colors.text, fontSize: 22 },
  title: { color: colors.text, fontWeight: '800', fontSize: font.xl },
  list: { padding: spacing.md, paddingBottom: 40 },
  dayHead: { color: colors.textMuted, fontSize: font.xs, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginTop: spacing.md, marginBottom: spacing.sm, backgroundColor: colors.bg },
  row: { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  iconWrap: { width: 38, height: 38, borderRadius: radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 18 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowTitle: { color: colors.text, fontWeight: '800', fontSize: font.sm, flex: 1 },
  time: { color: colors.textMuted, fontSize: font.xs },
  body: { color: colors.textSecondary, fontSize: font.xs, marginTop: 2, lineHeight: 16 },
  tag: { alignSelf: 'flex-start', borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2, marginTop: 6 },
  tagText: { fontWeight: '800', fontSize: 9 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: spacing.sm },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { color: colors.text, fontWeight: '900', fontSize: font.lg },
  emptyDesc: { color: colors.textSecondary, fontSize: font.sm, textAlign: 'center' },
});
