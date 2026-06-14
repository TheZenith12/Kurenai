import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { usersApi, characterApi } from '../lib/api';
import { useAuthStore } from '../store/auth.store';
import { colors, spacing, radius, font } from '../constants/theme';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const { data: myChars = [], isLoading } = useQuery({ queryKey: ['myCharsProfile'], queryFn: characterApi.getMyCharacters });

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>←</Text></TouchableOpacity>
        <Text style={styles.title}>👤 Профайл</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={colors.gradientDark} style={styles.profileCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <LinearGradient colors={colors.gradient} style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.username ?? 'U')[0].toUpperCase()}</Text>
          </LinearGradient>
          <Text style={styles.displayName}>{user?.displayName ?? user?.username}</Text>
          <Text style={styles.username}>@{user?.username}</Text>
          <Text style={styles.email}>{user?.email ?? ''}</Text>
          <View style={styles.statsRow}>
            {[
              { label: 'CP', value: user?.characterPoints ?? 0 },
              { label: 'Нэр хүнд', value: user?.reputation ?? 0 },
            ].map((s) => (
              <View key={s.label} style={styles.stat}>
                <Text style={styles.statVal}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <Text style={styles.sectionTitle}>⚔️ Миний дүрүүд</Text>
        {isLoading ? <ActivityIndicator color={colors.primary} /> : (
          (myChars as any[]).map((c: any) => (
            <View key={c.id} style={[styles.charCard, c.isActive && styles.charCardActive]}>
              {c.isActive && <LinearGradient colors={colors.gradientDark} style={StyleSheet.absoluteFill} />}
              <Text style={styles.charEmoji}>⚔️</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.charName, c.isActive && { color: colors.primaryLight }]}>{c.character?.name ?? 'Unknown'}</Text>
                <Text style={styles.charAnime}>{c.character?.anime?.name ?? ''}</Text>
                <Text style={styles.charLevel}>Lv.{c.level ?? 1} • XP: {c.xp ?? 0}</Text>
              </View>
              {c.isActive && <Text style={styles.activeBadge}>✅ Идэвхтэй</Text>}
            </View>
          ))
        )}

        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>🚪 Гарах</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { color: colors.text, fontSize: 22 },
  title: { color: colors.text, fontWeight: '800', fontSize: font.xl },
  scroll: { padding: spacing.md, paddingBottom: 40 },
  profileCard: { borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 32 },
  displayName: { color: colors.text, fontWeight: '800', fontSize: font.xxl },
  username: { color: colors.textSecondary, fontSize: font.md },
  email: { color: colors.textMuted, fontSize: font.sm },
  statsRow: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.md },
  stat: { alignItems: 'center' },
  statVal: { color: colors.primary, fontWeight: '900', fontSize: font.xxl },
  statLabel: { color: colors.textMuted, fontSize: font.sm },
  sectionTitle: { color: colors.textSecondary, fontSize: font.sm, fontWeight: '700', letterSpacing: 2, marginBottom: spacing.sm },
  charCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm, overflow: 'hidden' },
  charCardActive: { borderColor: colors.primary },
  charEmoji: { fontSize: 28 },
  charName: { color: colors.text, fontWeight: '700', fontSize: font.md },
  charAnime: { color: colors.textSecondary, fontSize: font.sm },
  charLevel: { color: colors.textMuted, fontSize: font.sm, marginTop: 2 },
  activeBadge: { color: colors.success, fontWeight: '700', fontSize: font.sm },
  logoutBtn: { padding: spacing.md, backgroundColor: colors.error + '22', borderRadius: radius.lg, alignItems: 'center', marginTop: spacing.lg, borderWidth: 1, borderColor: colors.error + '44' },
  logoutText: { color: colors.error, fontWeight: '700', fontSize: font.md },
});
