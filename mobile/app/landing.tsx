import { useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, spacing, radius, font } from '../constants/theme';

const { width } = Dimensions.get('window');

const ANIME_TAGS = [
  { label: 'Naruto', color: '#fb923c' },
  { label: 'One Piece', color: '#facc15' },
  { label: 'Bleach', color: '#38bdf8' },
  { label: 'Dragon Ball Z', color: '#fbbf24' },
  { label: 'Demon Slayer', color: '#f87171' },
];

const STATS = [
  { v: '8', label: 'Anime world' },
  { v: '20+', label: 'Дүр' },
  { v: '4', label: 'Mini game' },
  { v: '∞', label: 'PvP Season' },
];

const FEATURES = [
  { icon: '⚔️', title: 'PvP Тулаан', desc: 'Долоо хоног бүр Season. HP/Energy/Skill бодит тулаан.', color: '#ef4444' },
  { icon: '💬', title: 'Anime Чат', desc: 'Нийт, Anime, хувийн, Guild — бодит цагийн чат.', color: '#3b82f6' },
  { icon: '🎭', title: 'Anime Дүрүүд', desc: 'Naruto, One Piece, Bleach, DBZ, Demon Slayer. 20+ дүр.', color: '#fb923c' },
  { icon: '🎮', title: 'Мини тоглоом', desc: 'Reaction, Quiz, Dodge — Attack Point олж авна.', color: '#34d399' },
  { icon: '🏆', title: 'Leaderboard', desc: 'Олон төрлийн rank. Season ялагчид шагнал.', color: '#fbbf24' },
  { icon: '🏰', title: 'Guild систем', desc: 'Anime бүрт Guild. Guild chat, rank, хамтын тулаан.', color: '#22d3ee' },
];

const STEPS = [
  { n: '01', title: 'Бүртгүүлэх', desc: 'Имэйл + нэрээ оруул. 30 секунд.', color: '#38bdf8' },
  { n: '02', title: 'Дүр авах', desc: 'Дуртай anime-ийнхаа үнэгүй дүрийг сонго.', color: '#fbbf24' },
  { n: '03', title: 'Тулалдах', desc: 'Season, chat, mini game — нэгэн зэрэг!', color: '#f87171' },
];

export default function Landing() {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, tension: 40, friction: 9, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      {/* Top bar */}
      <View style={s.topbar}>
        <View style={s.logoRow}>
          <Text style={s.logoKurenai}>KURENAI</Text>
          <Text style={s.logoKanji}>紅</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={s.loginPill}>
          <Text style={s.loginPillText}>Нэвтрэх</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* HERO */}
        <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
          {/* Anime tags */}
          <View style={s.tags}>
            {ANIME_TAGS.map((t) => (
              <View key={t.label} style={[s.tag, { borderColor: t.color + '66', backgroundColor: t.color + '18' }]}>
                <Text style={[s.tagText, { color: t.color }]}>{t.label}</Text>
              </View>
            ))}
          </View>

          {/* Big title */}
          <Text style={s.titleAnime}>ANIME</Text>
          <Text style={s.titlePlatform}>PLATFORM</Text>

          <Text style={s.subtitle}>
            Монголын хамгийн том <Text style={s.subStrong}>anime community</Text> + <Text style={s.subOrange}>PvP тоглоом</Text>
          </Text>
          <Text style={s.subtitle2}>Дүр сонгоорой · Тулалдаарай · League-ийн дээгүүр гар</Text>

          {/* CTA */}
          <TouchableOpacity onPress={() => router.push('/(auth)/register')} activeOpacity={0.85} style={s.ctaPrimary}>
            <LinearGradient colors={['#dc2626', '#991b1b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.ctaPrimaryInner}>
              <Text style={s.ctaPrimaryText}>⚡ Үнэгүй эхлэх</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')} activeOpacity={0.8} style={s.ctaSecondary}>
            <Text style={s.ctaSecondaryText}>Нэвтрэх →</Text>
          </TouchableOpacity>

          {/* Stats */}
          <View style={s.statsBox}>
            {STATS.map((st) => (
              <View key={st.label} style={s.stat}>
                <Text style={s.statVal}>{st.v}</Text>
                <Text style={s.statLbl}>{st.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Divider */}
        <LinearGradient colors={['transparent', '#38bdf8', '#dc2626', '#f59e0b', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.divider} />

        {/* FEATURES */}
        <Text style={s.sectionTitle}>Үндсэн онцлогууд</Text>
        <Text style={s.sectionSub}>Anime world дахь бүхий л зүйл нэг дор</Text>
        <View style={s.featGrid}>
          {FEATURES.map((f) => (
            <View key={f.title} style={[s.featCard, { borderColor: f.color + '40' }]}>
              <LinearGradient colors={[f.color + '20', 'transparent']} style={StyleSheet.absoluteFill} />
              <View style={[s.featIcon, { backgroundColor: f.color + '22', borderColor: f.color + '50' }]}>
                <Text style={{ fontSize: 22 }}>{f.icon}</Text>
              </View>
              <Text style={s.featTitle}>{f.title}</Text>
              <Text style={s.featDesc}>{f.desc}</Text>
            </View>
          ))}
        </View>

        {/* STEPS */}
        <Text style={[s.sectionTitle, { marginTop: spacing.xl }]}>Хэрхэн эхлэх вэ?</Text>
        <View style={s.steps}>
          {STEPS.map((st) => (
            <View key={st.n} style={s.stepCard}>
              <View style={[s.stepNum, { borderColor: st.color + '70', backgroundColor: st.color + '20' }]}>
                <Text style={[s.stepNumText, { color: st.color }]}>{st.n}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.stepTitle}>{st.title}</Text>
                <Text style={s.stepDesc}>{st.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* FINAL CTA */}
        <View style={s.finalWrap}>
          <LinearGradient colors={['rgba(56,189,248,0.6)', 'rgba(220,38,38,0.8)', 'rgba(245,158,11,0.5)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.finalBorder}>
            <View style={s.finalInner}>
              <Text style={s.finalTitle}>Нэгдэхэд бэлэн үү?</Text>
              <Text style={s.finalSub}>Бүртгэл үнэгүй · Дүр шууд авна · Тулалдаан эхэлнэ</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')} activeOpacity={0.85} style={s.finalBtn}>
                <LinearGradient colors={['#dc2626', '#991b1b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.finalBtnInner}>
                  <Text style={s.finalBtnText}>Одоо эхлэх — Үнэгүй</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        <Text style={s.footer}>Kurenai 紅 · Монголын anime нийгэмлэг · 2026</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  logoRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  logoKurenai: { color: '#ff4444', fontWeight: '900', fontSize: 22, letterSpacing: 2, textShadowColor: 'rgba(220,38,38,0.8)', textShadowRadius: 10 },
  logoKanji: { color: '#ff6b35', fontWeight: '900', fontSize: 20 },
  loginPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(0,0,0,0.3)' },
  loginPillText: { color: 'rgba(255,255,255,0.85)', fontWeight: '700', fontSize: font.sm },
  scroll: { paddingHorizontal: spacing.md, paddingBottom: 40 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: spacing.lg, marginBottom: spacing.xl },
  tag: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.full, borderWidth: 1 },
  tagText: { fontWeight: '700', fontSize: font.xs },
  titleAnime: { textAlign: 'center', color: '#ff2020', fontWeight: '900', fontSize: 72, letterSpacing: 2, lineHeight: 76, textShadowColor: 'rgba(220,38,38,0.85)', textShadowRadius: 24 },
  titlePlatform: { textAlign: 'center', color: '#3b82f6', fontWeight: '900', fontSize: 54, letterSpacing: 1, lineHeight: 58, textShadowColor: 'rgba(37,99,235,0.8)', textShadowRadius: 22, marginTop: -6 },
  subtitle: { textAlign: 'center', color: 'rgba(255,255,255,0.85)', fontSize: font.lg, lineHeight: 24, marginTop: spacing.lg, paddingHorizontal: spacing.md },
  subStrong: { color: '#fff', fontWeight: '800' },
  subOrange: { color: '#ff6b35', fontWeight: '800' },
  subtitle2: { textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: font.sm, marginTop: spacing.sm },
  ctaPrimary: { marginTop: spacing.xl, borderRadius: radius.xl, overflow: 'hidden', shadowColor: '#dc2626', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 6 } },
  ctaPrimaryInner: { paddingVertical: 16, alignItems: 'center' },
  ctaPrimaryText: { color: '#fff', fontWeight: '900', fontSize: font.lg },
  ctaSecondary: { marginTop: spacing.sm, paddingVertical: 14, alignItems: 'center', borderRadius: radius.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(0,0,0,0.25)' },
  ctaSecondaryText: { color: 'rgba(255,255,255,0.75)', fontWeight: '700', fontSize: font.md },
  statsBox: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.xl, padding: spacing.md, borderRadius: radius.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.38)' },
  stat: { alignItems: 'center' },
  statVal: { color: '#ffd700', fontWeight: '900', fontSize: 24, textShadowColor: 'rgba(255,200,0,0.8)', textShadowRadius: 12 },
  statLbl: { color: 'rgba(255,255,255,0.5)', fontSize: font.xs, marginTop: 2 },
  divider: { height: 1, marginVertical: spacing.xl },
  sectionTitle: { textAlign: 'center', color: '#fff', fontWeight: '900', fontSize: 26, letterSpacing: 1 },
  sectionSub: { textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: font.md, marginTop: 4, marginBottom: spacing.lg },
  featGrid: { gap: spacing.sm },
  featCard: { borderRadius: radius.xl, padding: spacing.md, borderWidth: 1, overflow: 'hidden' },
  featIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: spacing.sm },
  featTitle: { color: '#fff', fontWeight: '800', fontSize: font.md },
  featDesc: { color: 'rgba(255,255,255,0.55)', fontSize: font.sm, marginTop: 4, lineHeight: 18 },
  steps: { gap: spacing.sm, marginTop: spacing.sm },
  stepCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(4,0,10,0.55)' },
  stepNum: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  stepNumText: { fontWeight: '900', fontSize: font.md },
  stepTitle: { color: '#fff', fontWeight: '800', fontSize: font.md },
  stepDesc: { color: 'rgba(255,255,255,0.5)', fontSize: font.sm, marginTop: 2 },
  finalWrap: { marginTop: spacing.xl },
  finalBorder: { borderRadius: radius.xl + 4, padding: 1.5 },
  finalInner: { borderRadius: radius.xl + 3, padding: spacing.xl, alignItems: 'center', backgroundColor: 'rgba(4,0,10,0.92)' },
  finalTitle: { color: '#fff', fontWeight: '900', fontSize: 24, textAlign: 'center' },
  finalSub: { color: 'rgba(255,255,255,0.5)', fontSize: font.sm, textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.lg },
  finalBtn: { borderRadius: radius.xl, overflow: 'hidden', width: '100%' },
  finalBtnInner: { paddingVertical: 15, alignItems: 'center' },
  finalBtnText: { color: '#fff', fontWeight: '900', fontSize: font.md },
  footer: { textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: font.xs, marginTop: spacing.xl },
});
