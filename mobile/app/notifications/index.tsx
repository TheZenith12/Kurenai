import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../../lib/api';
import { colors, spacing, radius, font } from '../../constants/theme';
import { router } from 'expo-router';

const TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  ATTACK_RECEIVED:      { icon: '⚔️', color: '#EF4444' },
  ACHIEVEMENT_UNLOCKED: { icon: '🏆', color: '#F59E0B' },
  QUEST_COMPLETED:      { icon: '📋', color: '#10B981' },
  GUILD_INVITE:         { icon: '🏰', color: '#8B5CF6' },
  GUILD_WAR:            { icon: '⚔️', color: '#DC2626' },
  SEASON_START:         { icon: '🗓️', color: '#06B6D4' },
  SEASON_END:           { icon: '🏁', color: '#F97316' },
  PAYMENT_CONFIRMED:    { icon: '💳', color: '#22C55E' },
  SYSTEM:               { icon: '📢', color: '#6B7280' },
};

function timeAgo(date: string) {
  const m = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (m < 1) return 'Дөнгөж сая';
  if (m < 60) return `${m} мин өмнө`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} цаг өмнө`;
  return `${Math.floor(h / 24)} өдөр өмнө`;
}

export default function NotificationsScreen() {
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll(100),
    refetchInterval: 30000,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const markAll = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unread = (items as any[]).filter((n: any) => !n.isRead).length;

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Text style={s.back}>←</Text></TouchableOpacity>
        <Text style={s.title}>🔔 Мэдэгдэл</Text>
        {unread > 0 && (
          <TouchableOpacity onPress={() => markAll.mutate()} style={s.markAllBtn}>
            <Text style={s.markAllText}>Бүгдийг уншсан</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (items as any[]).length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>🔔</Text>
          <Text style={s.emptyTitle}>Мэдэгдэл байхгүй</Text>
          <Text style={s.emptyDesc}>Шинэ мэдэгдэл ирэхэд энд харагдана</Text>
        </View>
      ) : (
        <FlatList
          data={items as any[]}
          keyExtractor={(it) => it.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.SYSTEM;
            return (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => !item.isRead && markRead.mutate(item.id)}
                style={[s.card, { opacity: item.isRead ? 0.6 : 1, borderColor: item.isRead ? colors.border : cfg.color + '40' }]}>
                <View style={[s.iconWrap, { backgroundColor: cfg.color + '20', borderColor: cfg.color + '40' }]}>
                  <Text style={s.icon}>{cfg.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle}>{item.title}</Text>
                  <Text style={s.cardBody} numberOfLines={2}>{item.body}</Text>
                  <Text style={s.time}>{timeAgo(item.createdAt)}</Text>
                </View>
                {!item.isRead && <View style={[s.dot, { backgroundColor: cfg.color }]} />}
              </TouchableOpacity>
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
  title: { color: colors.text, fontWeight: '800', fontSize: font.xl, flex: 1 },
  markAllBtn: { backgroundColor: 'rgba(245,158,11,0.15)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', borderRadius: radius.md, paddingHorizontal: 10, paddingVertical: 6 },
  markAllText: { color: '#fbbf24', fontWeight: '700', fontSize: font.xs },
  list: { padding: spacing.md, gap: spacing.sm, paddingBottom: 40 },
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1 },
  iconWrap: { width: 40, height: 40, borderRadius: radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 20 },
  cardTitle: { color: colors.text, fontWeight: '800', fontSize: font.md },
  cardBody: { color: colors.textSecondary, fontSize: font.sm, marginTop: 2, lineHeight: 18 },
  time: { color: colors.textMuted, fontSize: font.xs, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  empty: { alignItems: 'center', paddingVertical: 70, gap: spacing.sm },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { color: colors.text, fontWeight: '900', fontSize: font.lg },
  emptyDesc: { color: colors.textSecondary, fontSize: font.sm, textAlign: 'center' },
});
