import { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated,
  Dimensions, Modal, FlatList, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gachaApi } from '../../lib/api';
import { useAuthStore } from '../../store/auth.store';
import { colors, spacing, radius, font } from '../../constants/theme';

const { width } = Dimensions.get('window');

const RARITY_CONFIG = {
  SSR: { color: '#F59E0B', glow: '#F59E0B', emoji: '👑', label: 'SSR', gradient: ['#F59E0B', '#D97706'] as [string,string] },
  SR:  { color: '#A78BFA', glow: '#8B5CF6', emoji: '💎', label: 'SR',  gradient: ['#8B5CF6', '#6D28D9'] as [string,string] },
  R:   { color: '#60A5FA', glow: '#3B82F6', emoji: '⭐', label: 'R',   gradient: ['#3B82F6', '#1D4ED8'] as [string,string] },
};

function CardFlip({ char, index, onReveal }: { char: any; index: number; onReveal: () => void }) {
  const flipAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [flipped, setFlipped] = useState(false);

  const rarity = char.character?.rarity ?? 'R';
  const cfg = RARITY_CONFIG[rarity as keyof typeof RARITY_CONFIG] ?? RARITY_CONFIG.R;

  useEffect(() => {
    const delay = index * 120;
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        setTimeout(() => {
          Animated.spring(flipAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }).start(() => {
            setFlipped(true);
            if (rarity === 'SSR') onReveal();
          });
        }, 400);
      });
    }, delay);
  }, []);

  const frontRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  return (
    <Animated.View style={[card.wrap, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
      {/* Front (hidden side) */}
      <Animated.View style={[card.face, { transform: [{ rotateY: frontRotate }], backfaceVisibility: 'hidden' }]}>
        <LinearGradient colors={colors.gradientDark} style={card.faceInner}>
          <Text style={card.questionMark}>?</Text>
          <Text style={card.kanji}>紅</Text>
        </LinearGradient>
      </Animated.View>

      {/* Back (revealed side) */}
      <Animated.View style={[card.face, card.back, {
        transform: [{ rotateY: backRotate }],
        backfaceVisibility: 'hidden',
        shadowColor: cfg.glow, shadowOffset: { width: 0, height: 0 }, shadowOpacity: flipped ? 0.8 : 0, shadowRadius: 12, elevation: 8,
      }]}>
        <LinearGradient colors={cfg.gradient} style={card.faceInner}>
          <Text style={card.charEmoji}>{cfg.emoji}</Text>
          <Text style={card.charName} numberOfLines={2}>{char.character?.name ?? '???'}</Text>
          <View style={[card.rarityBadge, { backgroundColor: cfg.color + '33', borderColor: cfg.color }]}>
            <Text style={[card.rarityText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
          {char.isNew && <Text style={card.newBadge}>NEW!</Text>}
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
}

const card = StyleSheet.create({
  wrap: { width: (width - spacing.md * 2 - spacing.sm * 2) / 3, height: 130, marginBottom: spacing.sm },
  face: { position: 'absolute', width: '100%', height: '100%', borderRadius: radius.md, overflow: 'hidden', backfaceVisibility: 'hidden' },
  back: { top: 0, left: 0 },
  faceInner: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xs, borderRadius: radius.md },
  questionMark: { fontSize: 36, color: colors.primaryLight, fontWeight: '900', opacity: 0.6 },
  kanji: { fontSize: 16, color: colors.textMuted, position: 'absolute', bottom: 8 },
  charEmoji: { fontSize: 28, marginBottom: 4 },
  charName: { color: '#fff', fontSize: 10, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  rarityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full, borderWidth: 1 },
  rarityText: { fontSize: 10, fontWeight: '800' },
  newBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: colors.error, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
});

// SSR Celebration overlay
function SsrCelebration({ char, onDone }: { char: any; onDone: () => void }) {
  const ringScale = useRef(new Animated.Value(0)).current;
  const ringOpacity = useRef(new Animated.Value(1)).current;
  const contentScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ringScale, { toValue: 1.8, duration: 1500, useNativeDriver: true }),
          Animated.timing(ringOpacity, { toValue: 0, duration: 1500, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(ringScale, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.timing(ringOpacity, { toValue: 1, duration: 0, useNativeDriver: true }),
        ]),
      ])
    ).start();
    Animated.spring(contentScale, { toValue: 1, useNativeDriver: true, tension: 40 }).start();
    setTimeout(onDone, 3500);
  }, []);

  return (
    <Modal transparent animationType="fade">
      <BlurView intensity={60} style={StyleSheet.absoluteFill} />
      <View style={ssr.root}>
        <Animated.View style={[ssr.ring, { transform: [{ scale: ringScale }], opacity: ringOpacity }]} />
        <Animated.View style={[ssr.ring, ssr.ring2, { transform: [{ scale: ringScale }], opacity: ringOpacity }]} />
        <Animated.View style={[ssr.content, { transform: [{ scale: contentScale }] }]}>
          <Text style={ssr.crown}>👑</Text>
          <Text style={ssr.ssrText}>SSR</Text>
          <Text style={ssr.charName}>{char?.character?.name ?? 'Legend'}</Text>
          <Text style={ssr.sub}>Хошууч дүр олж авлаа!</Text>
        </Animated.View>
        <TouchableOpacity onPress={onDone} style={ssr.closeBtn}>
          <Text style={ssr.closeText}>Үргэлжлүүлэх →</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const ssr = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 300, height: 300, borderRadius: 150, borderWidth: 3, borderColor: '#F59E0B55' },
  ring2: { width: 200, height: 200, borderRadius: 100, borderColor: '#F59E0BAA' },
  content: { alignItems: 'center' },
  crown: { fontSize: 80 },
  ssrText: { fontSize: 48, fontWeight: '900', color: '#F59E0B', letterSpacing: 8, textShadowColor: '#F59E0B', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20 },
  charName: { fontSize: 24, fontWeight: '800', color: '#fff', marginTop: 8 },
  sub: { color: colors.textSecondary, fontSize: font.md, marginTop: 4 },
  closeBtn: { marginTop: spacing.xl, backgroundColor: '#F59E0B22', padding: spacing.md, borderRadius: radius.full, borderWidth: 1, borderColor: '#F59E0B55' },
  closeText: { color: '#F59E0B', fontWeight: '700' },
});

export default function GachaScreen() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [selectedPool, setSelectedPool] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [ssrChar, setSsrChar] = useState<any>(null);

  const { data: pools = [], isLoading } = useQuery({ queryKey: ['gachaPools'], queryFn: gachaApi.getPools });
  const { data: pity } = useQuery({
    queryKey: ['pity', selectedPool?.id],
    queryFn: () => gachaApi.getPity(selectedPool.id),
    enabled: !!selectedPool,
  });

  const rollMut = useMutation({
    mutationFn: ({ poolId, count }: { poolId: string; count: 1 | 10 }) => gachaApi.roll(poolId, count),
    onSuccess: (data: any[]) => {
      setResults(data);
      setShowResults(true);
      qc.invalidateQueries({ queryKey: ['pity', selectedPool?.id] });
      const ssr = data.find((c: any) => c.character?.rarity === 'SSR');
      if (ssr) setTimeout(() => setSsrChar(ssr), (data.indexOf(ssr) + 1) * 120 + 800);
    },
    onError: (e: any) => Alert.alert('Алдаа', e?.response?.data?.message ?? 'Гача татахад алдаа гарлаа'),
  });

  const pityVal = pity?.pity ?? 0;
  const pityColor = pityVal >= 75 ? colors.warning : pityVal >= 50 ? colors.primary : colors.textMuted;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {ssrChar && <SsrCelebration char={ssrChar} onDone={() => setSsrChar(null)} />}

      {/* Results Modal */}
      <Modal visible={showResults} animationType="slide" transparent>
        <BlurView intensity={40} style={StyleSheet.absoluteFill} />
        <View style={styles.resultsModal}>
          <Text style={styles.resultsTitle}>🎴 Үр дүн</Text>
          <FlatList
            data={results}
            keyExtractor={(_, i) => String(i)}
            numColumns={3}
            columnWrapperStyle={{ gap: spacing.sm, justifyContent: 'center' }}
            contentContainerStyle={{ padding: spacing.md }}
            renderItem={({ item, index }) => (
              <CardFlip char={item} index={index} onReveal={() => setSsrChar(item)} />
            )}
          />
          <TouchableOpacity onPress={() => setShowResults(false)} style={styles.closeResultsBtn}>
            <LinearGradient colors={colors.gradient} style={styles.closeResultsBtnInner}>
              <Text style={styles.closeResultsText}>Хаах</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient colors={['#1A0A2E', colors.bg]} style={styles.header}>
          <Text style={styles.title}>✨ ГАЧА</Text>
          <Text style={styles.subtitle}>Легенд дүрүүдийг нээ</Text>
          <Text style={styles.cpBadge}>💎 {user?.characterPoints ?? 0} CP</Text>
        </LinearGradient>

        {/* Pool selection */}
        {isLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> : (
          <>
            <Text style={styles.sectionTitle}>Гача Pool</Text>
            {(pools as any[]).map((pool: any) => (
              <TouchableOpacity key={pool.id} onPress={() => setSelectedPool(pool)} style={[styles.poolCard, selectedPool?.id === pool.id && styles.poolCardSelected]}>
                <LinearGradient colors={selectedPool?.id === pool.id ? colors.gradientDark : ['transparent', 'transparent']} style={StyleSheet.absoluteFill} />
                <Text style={styles.poolEmoji}>🎌</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.poolName}>{pool.name}</Text>
                  <Text style={styles.poolDesc} numberOfLines={2}>{pool.description}</Text>
                </View>
                {selectedPool?.id === pool.id && <Text style={styles.selectedCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </>
        )}

        {selectedPool && (
          <>
            {/* Pity */}
            <View style={styles.pityWrap}>
              <Text style={styles.pityLabel}>Pity:</Text>
              <View style={styles.pityBar}>
                <View style={[styles.pityFill, { width: `${(pityVal / 90) * 100}%` as any, backgroundColor: pityColor }]} />
              </View>
              <Text style={[styles.pityVal, { color: pityColor }]}>{pityVal}/90</Text>
              {pityVal >= 75 && <Text style={styles.pityWarning}>⚠️ Soft pity!</Text>}
            </View>

            {/* Roll buttons */}
            <View style={styles.rollRow}>
              <TouchableOpacity
                onPress={() => rollMut.mutate({ poolId: selectedPool.id, count: 1 })}
                disabled={rollMut.isPending}
                style={styles.roll1Wrap}
              >
                <LinearGradient colors={colors.gradient} style={styles.rollBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={styles.rollBtnText}>✨ 1x Татах</Text>
                  <Text style={styles.rollCost}>160 CP</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => rollMut.mutate({ poolId: selectedPool.id, count: 10 })}
                disabled={rollMut.isPending}
                style={styles.roll10Wrap}
              >
                <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.rollBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {rollMut.isPending ? <ActivityIndicator color="#fff" /> : (
                    <>
                      <Text style={styles.rollBtnText}>⭐ 10x Татах</Text>
                      <Text style={styles.rollCost}>1600 CP</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Rates */}
            <View style={styles.rates}>
              {[
                { rarity: 'SSR', rate: '1.6%', color: '#F59E0B' },
                { rarity: 'SR', rate: '13%', color: '#A78BFA' },
                { rarity: 'R', rate: '85.4%', color: '#60A5FA' },
              ].map((r) => (
                <View key={r.rarity} style={styles.rateItem}>
                  <Text style={[styles.rarityLabel, { color: r.color }]}>{r.rarity}</Text>
                  <Text style={styles.rateVal}>{r.rate}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  scroll: { paddingBottom: 100 },
  header: { padding: spacing.xl, alignItems: 'center', paddingTop: spacing.xxl },
  title: { fontSize: 32, fontWeight: '900', color: colors.text, letterSpacing: 4 },
  subtitle: { color: colors.textSecondary, fontSize: font.md, marginTop: 4 },
  cpBadge: { marginTop: spacing.sm, backgroundColor: colors.primary + '33', paddingHorizontal: 16, paddingVertical: 6, borderRadius: radius.full, color: colors.primaryLight, fontWeight: '700' },
  sectionTitle: { color: colors.textSecondary, fontSize: font.sm, fontWeight: '700', letterSpacing: 2, marginHorizontal: spacing.md, marginTop: spacing.md, marginBottom: spacing.sm },
  poolCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, margin: spacing.md, marginTop: 0, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgCard, overflow: 'hidden' },
  poolCardSelected: { borderColor: colors.primary },
  poolEmoji: { fontSize: 28 },
  poolName: { color: colors.text, fontWeight: '700', fontSize: font.lg },
  poolDesc: { color: colors.textSecondary, fontSize: font.sm, marginTop: 2 },
  selectedCheck: { color: colors.primary, fontSize: 20, fontWeight: '900' },
  pityWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginHorizontal: spacing.md, marginBottom: spacing.md },
  pityLabel: { color: colors.textSecondary, fontSize: font.sm },
  pityBar: { flex: 1, height: 8, backgroundColor: colors.bgElevated, borderRadius: radius.full, overflow: 'hidden' },
  pityFill: { height: '100%', borderRadius: radius.full },
  pityVal: { fontSize: font.sm, fontWeight: '700', minWidth: 40, textAlign: 'right' },
  pityWarning: { color: colors.warning, fontSize: font.sm, fontWeight: '700' },
  rollRow: { flexDirection: 'row', gap: spacing.sm, marginHorizontal: spacing.md, marginBottom: spacing.md },
  roll1Wrap: { flex: 1, borderRadius: radius.md, overflow: 'hidden' },
  roll10Wrap: { flex: 1, borderRadius: radius.md, overflow: 'hidden' },
  rollBtn: { paddingVertical: 18, alignItems: 'center', borderRadius: radius.md },
  rollBtnText: { color: '#fff', fontWeight: '800', fontSize: font.lg },
  rollCost: { color: 'rgba(255,255,255,0.7)', fontSize: font.sm },
  rates: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xl, marginHorizontal: spacing.md, padding: spacing.md, backgroundColor: colors.bgCard, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  rateItem: { alignItems: 'center' },
  rarityLabel: { fontWeight: '800', fontSize: font.md },
  rateVal: { color: colors.textSecondary, fontSize: font.sm },
  resultsModal: { flex: 1, backgroundColor: colors.bgCard + 'EE', paddingTop: 60 },
  resultsTitle: { color: colors.text, fontSize: font.xxl, fontWeight: '900', textAlign: 'center', marginBottom: spacing.md },
  closeResultsBtn: { margin: spacing.lg, borderRadius: radius.md, overflow: 'hidden' },
  closeResultsBtnInner: { paddingVertical: 16, alignItems: 'center' },
  closeResultsText: { color: '#fff', fontWeight: '800', fontSize: font.lg },
});
