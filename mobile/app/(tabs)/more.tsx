import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/auth.store';
import { colors, spacing, radius, font } from '../../constants/theme';

const MENU_ITEMS = [
  { icon: '🔍', label: 'Хайлт',           desc: 'Хэрэглэгч, аниме хайх',   route: '/search' },
  { icon: '🔔', label: 'Мэдэгдэл',        desc: 'Мэдэгдлийн түүх',         route: '/notifications' },
  { icon: '📡', label: 'Үйл ажиллагаа',   desc: 'Сүүлийн үйл явдлууд',     route: '/activity' },
  { icon: '🏆', label: 'Рейтинг',         desc: 'Шилдэг тоглогчид',        route: '/leaderboard' },
  { icon: '✨', label: 'Гача',            desc: 'Дүр татах',               route: '/gacha' },
  { icon: '📺', label: 'Жагсаалт',        desc: 'Аниме watchlist',         route: '/watchlist' },
  { icon: '🏰', label: 'Гилд',            desc: 'Гилд байгуулах / нэгдэх', route: '/guild' },
  { icon: '⚔️', label: 'Гилд дайн',       desc: 'Guild vs Guild тулаан',  route: '/guild-wars' },
  { icon: '🎯', label: 'Даалгавар',       desc: 'Өдрийн даалгавар',        route: '/quests' },
  { icon: '🏅', label: 'Амжилтууд',       desc: 'Гүйцэтгэлийн шагнал',     route: '/achievements' },
  { icon: '🎨', label: 'Гоёлын зүйлс',    desc: 'Avatar frame, тууз',      route: '/cosmetics' },
  { icon: '🗓️', label: 'Сезон',           desc: 'Сезоны түүх',            route: '/seasons' },
  { icon: '👤', label: 'Профайл',         desc: 'Бүртгэл, тохиргоо',       route: '/profile' },
];

export default function MoreScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <LinearGradient colors={colors.gradientDark} style={styles.profileCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <LinearGradient colors={colors.gradient} style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.username ?? 'U')[0].toUpperCase()}</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.displayName}>{user?.displayName ?? user?.username}</Text>
            <Text style={styles.username}>@{user?.username}</Text>
            <View style={styles.badgeRow}>
              {user?.role !== 'USER' && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{user?.role === 'ADMIN' ? '🛡 Admin' : '👑 Super Admin'}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.cp}>{user?.characterPoints ?? 0}</Text>
            <Text style={styles.cpLabel}>CP</Text>
          </View>
        </LinearGradient>

        {/* Menu */}
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity key={item.label} onPress={() => router.push(item.route as any)} style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <Text style={styles.menuEmoji}>{item.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuDesc}>{item.desc}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>🚪 Гарах</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Kurenai v1.0.0 • Anime Platform</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  scroll: { padding: spacing.md, paddingBottom: 100 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: font.xl },
  displayName: { color: colors.text, fontWeight: '800', fontSize: font.lg },
  username: { color: colors.textSecondary, fontSize: font.sm },
  badgeRow: { flexDirection: 'row', gap: spacing.xs, marginTop: 4 },
  badge: { backgroundColor: colors.primary + '33', paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
  badgeText: { color: colors.primaryLight, fontSize: 10, fontWeight: '700' },
  cp: { color: colors.primary, fontWeight: '900', fontSize: font.xxl },
  cpLabel: { color: colors.textMuted, fontSize: font.sm },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, backgroundColor: colors.bgCard, borderRadius: radius.lg, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  menuIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center' },
  menuEmoji: { fontSize: 22 },
  menuLabel: { color: colors.text, fontWeight: '700', fontSize: font.md },
  menuDesc: { color: colors.textSecondary, fontSize: font.sm, marginTop: 2 },
  menuArrow: { color: colors.textMuted, fontSize: 22 },
  logoutBtn: { padding: spacing.md, backgroundColor: colors.error + '22', borderRadius: radius.lg, alignItems: 'center', marginTop: spacing.md, borderWidth: 1, borderColor: colors.error + '44' },
  logoutText: { color: colors.error, fontWeight: '700', fontSize: font.md },
  version: { color: colors.textMuted, textAlign: 'center', fontSize: font.sm, marginTop: spacing.xl },
});
