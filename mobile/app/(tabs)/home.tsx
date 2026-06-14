import { useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth.store';
import { seasonApi, attackApi, usersApi } from '../../lib/api';
import { colors, spacing, radius, font } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

function PulseCircle({ size, color, delay }: { size: number; color: string; delay: number }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.4, duration: 2000, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 2000, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.3, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute', width: size, height: size, borderRadius: size / 2,
        backgroundColor: color, transform: [{ scale }], opacity,
      }}
    />
  );
}

const QUICK_ACTIONS = [
  { icon: '⚔️', label: 'PvP Тулаан', route: '/(tabs)/attack', color: '#EF4444' },
  { icon: '✨', label: 'Гача', route: '/(tabs)/gacha', color: colors.primary },
  { icon: '💬', label: 'Чат', route: '/(tabs)/chat', color: '#3B82F6' },
  { icon: '🏆', label: 'Жагсаалт', route: '/leaderboard', color: '#F59E0B' },
  { icon: '🎮', label: 'Тоглоом', route: '/games', color: '#10B981' },
  { icon: '🏰', label: 'Гилд', route: '/guild', color: '#8B5CF6' },
];

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const heroScale = useRef(new Animated.Value(0.9)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(heroScale, { toValue: 1, useNativeDriver: true, tension: 50 }),
      Animated.timing(heroOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const { data: season } = useQuery({ queryKey: ['season'], queryFn: seasonApi.getCurrent });
  const { data: myStats } = useQuery({ queryKey: ['myStats'], queryFn: attackApi.getMyStats, refetchInterval: 30_000 });

  const hpPct = myStats ? Math.round((myStats.currentHp / myStats.maxHp) * 100) : 100;
  const hpColor = hpPct > 60 ? colors.hp.high : hpPct > 30 ? colors.hp.mid : colors.hp.low;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <LinearGradient colors={['rgba(13,13,26,0.35)', 'transparent']} style={StyleSheet.absoluteFill} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Сайн байна уу,</Text>
            <Text style={styles.username}>{user?.displayName || user?.username} ⚡</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/profile')} style={styles.avatarBtn}>
            <LinearGradient colors={colors.gradient} style={styles.avatar}>
              <Text style={styles.avatarText}>{(user?.username ?? 'U')[0].toUpperCase()}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Hero Banner */}
        <Animated.View style={[styles.heroBanner, { transform: [{ scale: heroScale }], opacity: heroOpacity }]}>
          <LinearGradient colors={['#1A0A2E', '#0D1A2E']} style={styles.heroBannerInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <PulseCircle size={200} color={colors.primary} delay={0} />
            <PulseCircle size={150} color={colors.pink} delay={500} />
            <View style={styles.heroContent}>
              <Text style={styles.heroKanji}>紅</Text>
              <Text style={styles.heroTitle}>KURENAI</Text>
              <Text style={styles.heroSub}>Anime Battle Platform</Text>
              {season && (
                <View style={styles.seasonBadge}>
                  <Text style={styles.seasonText}>🏆 Season {season.id?.slice(-4) ?? '1'} идэвхтэй</Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Stats Row */}
        {myStats && (
          <View style={styles.statsRow}>
            {[
              { label: 'HP', value: `${myStats.currentHp}/${myStats.maxHp}`, color: hpColor },
              { label: 'Алалт', value: myStats.kills ?? 0, color: colors.error },
              { label: 'CP', value: user?.characterPoints ?? 0, color: colors.primary },
              { label: 'Нэр хүнд', value: user?.reputation ?? 0, color: colors.warning },
            ].map((stat) => (
              <View key={stat.label} style={styles.statCard}>
                <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* HP bar */}
        {myStats && (
          <View style={styles.hpBarWrap}>
            <View style={styles.hpBarBg}>
              <LinearGradient
                colors={[hpColor, hpColor + 'AA']}
                style={[styles.hpBarFill, { width: `${hpPct}%` }]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              />
            </View>
            <Text style={styles.hpLabel}>HP {hpPct}%</Text>
          </View>
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Үйлдлүүд</Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity key={action.label} onPress={() => router.push(action.route as any)} style={styles.actionCard}>
              <LinearGradient colors={[action.color + '22', action.color + '11']} style={styles.actionCardInner}>
                <View style={[styles.actionIcon, { backgroundColor: action.color + '33' }]}>
                  <Text style={styles.actionEmoji}>{action.icon}</Text>
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Points Banner */}
        <TouchableOpacity onPress={() => router.push('/(tabs)/gacha')} style={styles.pointsBanner}>
          <LinearGradient colors={colors.gradientDark} style={styles.pointsBannerInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.pointsText}>✨ {user?.characterPoints ?? 0} CP байна — Гача татах уу?</Text>
            <Text style={styles.pointsArrow}>→</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  scroll: { padding: spacing.md, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  greeting: { color: colors.textSecondary, fontSize: font.sm },
  username: { color: colors.text, fontSize: font.xl, fontWeight: '800' },
  avatarBtn: { borderRadius: 22 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: font.lg },
  heroBanner: { borderRadius: radius.xl, overflow: 'hidden', marginBottom: spacing.md, height: 180 },
  heroBannerInner: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  heroContent: { alignItems: 'center', zIndex: 2 },
  heroKanji: { fontSize: 40, color: colors.primaryLight, fontWeight: '900', opacity: 0.4 },
  heroTitle: { fontSize: 28, fontWeight: '900', color: colors.text, letterSpacing: 6, marginTop: -8 },
  heroSub: { color: colors.textSecondary, fontSize: font.sm, letterSpacing: 2 },
  seasonBadge: { marginTop: spacing.sm, backgroundColor: colors.primary + '33', paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.full, borderWidth: 1, borderColor: colors.primary + '55' },
  seasonText: { color: colors.primaryLight, fontSize: font.sm, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  statCard: { flex: 1, backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  statValue: { fontSize: font.md, fontWeight: '800' },
  statLabel: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  hpBarWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  hpBarBg: { flex: 1, height: 8, backgroundColor: colors.bgElevated, borderRadius: radius.full, overflow: 'hidden' },
  hpBarFill: { height: '100%', borderRadius: radius.full },
  hpLabel: { color: colors.textSecondary, fontSize: font.sm, width: 60 },
  sectionTitle: { color: colors.textSecondary, fontSize: font.sm, fontWeight: '700', letterSpacing: 2, marginBottom: spacing.sm },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  actionCard: { width: (width - spacing.md * 2 - spacing.sm * 2) / 3, borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  actionCardInner: { padding: spacing.md, alignItems: 'center' },
  actionIcon: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  actionEmoji: { fontSize: 22 },
  actionLabel: { color: colors.text, fontSize: font.sm, fontWeight: '600', textAlign: 'center' },
  pointsBanner: { borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.md },
  pointsBannerInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md },
  pointsText: { color: colors.text, fontWeight: '700', fontSize: font.md },
  pointsArrow: { color: colors.primaryLight, fontSize: 20 },
});
