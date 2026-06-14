import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated,
  Dimensions, Modal, FlatList, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attackApi, seasonApi, characterApi } from '../../lib/api';
import { useAuthStore } from '../../store/auth.store';
import { colors, spacing, radius, font } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

// ─── Skill Effect Overlay ─────────────────────────────────────────────
const SKILL_EFFECTS: Record<string, { name: string; emoji: string; color: string; desc: string }> = {
  rasengan:    { name: 'RASENGAN', emoji: '🌀', color: '#3B82F6', desc: 'Нарутогийн тэргүүн техник' },
  chidori:     { name: 'CHIDORI', emoji: '⚡', color: '#93C5FD', desc: 'Мянган шувуу' },
  kamehameha:  { name: 'KAMEHAMEHA', emoji: '💥', color: '#FBBF24', desc: 'Ki дэгдэлт' },
  sharingan:   { name: 'SHARINGAN', emoji: '🔴', color: '#EF4444', desc: 'Уголзлагч нүд' },
  getsuga:     { name: "GETSUGA TENSHŌ", emoji: '🌙', color: '#6D28D9', desc: 'Сарны нуман дайрлага' },
  default:     { name: 'SKILL', emoji: '✨', color: colors.primary, desc: '' },
};

function AttackSkillOverlay({ skill, damage, onDone }: { skill: any; damage: number; onDone: () => void }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const damageY = useRef(new Animated.Value(0)).current;
  const damageOpacity = useRef(new Animated.Value(0)).current;

  const key = skill?.name?.toLowerCase().replace(/\s/g, '') ?? 'default';
  const effect = SKILL_EFFECTS[key] ?? SKILL_EFFECTS.default;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 40 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(damageY, { toValue: -60, duration: 800, useNativeDriver: true }),
        Animated.timing(damageOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]),
      Animated.delay(400),
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(damageOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start(() => onDone());
  }, []);

  return (
    <View style={ov.root} pointerEvents="none">
      <BlurView intensity={40} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={[effect.color + '44', '#00000099', effect.color + '22']}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[ov.content, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
        <Text style={ov.emoji}>{effect.emoji}</Text>
        <Text style={[ov.skillName, { color: effect.color }]}>{effect.name}</Text>
        <Text style={ov.desc}>{effect.desc}</Text>
      </Animated.View>
      <Animated.Text style={[ov.damage, { transform: [{ translateY: damageY }], opacity: damageOpacity }]}>
        -{damage} HP
      </Animated.Text>
    </View>
  );
}

const ov = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200, alignItems: 'center', justifyContent: 'center' },
  content: { alignItems: 'center' },
  emoji: { fontSize: 96, marginBottom: spacing.md },
  skillName: { fontSize: 28, fontWeight: '900', letterSpacing: 4, textShadowColor: '#000', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 },
  desc: { color: colors.textSecondary, fontSize: font.md, marginTop: 8 },
  damage: { position: 'absolute', fontSize: 48, fontWeight: '900', color: '#EF4444', textShadowColor: '#000', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 },
});

// ─── HP Bar ────────────────────────────────────────────────────────────
function HpBar({ current, max, username }: { current: number; max: number; username: string }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const color = pct > 60 ? colors.hp.high : pct > 30 ? colors.hp.mid : colors.hp.low;
  const widthAnim = useRef(new Animated.Value(pct)).current;

  useEffect(() => {
    Animated.timing(widthAnim, { toValue: pct, duration: 600, useNativeDriver: false }).start();
  }, [pct]);

  return (
    <View style={hp.wrap}>
      <View style={hp.header}>
        <Text style={hp.username} numberOfLines={1}>{username}</Text>
        <Text style={[hp.pct, { color }]}>{Math.round(pct)}%</Text>
      </View>
      <View style={hp.bar}>
        <Animated.View style={[hp.fill, { width: widthAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }), backgroundColor: color }]} />
      </View>
      <Text style={hp.vals}>{current}/{max} HP</Text>
    </View>
  );
}

const hp = StyleSheet.create({
  wrap: { marginBottom: spacing.xs },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  username: { color: colors.text, fontSize: font.sm, fontWeight: '600', flex: 1, marginRight: 8 },
  pct: { fontSize: font.sm, fontWeight: '700' },
  bar: { height: 8, backgroundColor: colors.bgElevated, borderRadius: radius.full, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.full },
  vals: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
});

// ─── Skill Card ────────────────────────────────────────────────────────
function SkillCard({ skill, selected, onSelect, cooldownLeft }: any) {
  const progress = useRef(new Animated.Value(0)).current;
  const key = skill?.name?.toLowerCase().replace(/\s/g, '') ?? 'default';
  const effect = SKILL_EFFECTS[key] ?? SKILL_EFFECTS.default;
  const onCd = cooldownLeft > 0;

  useEffect(() => {
    if (onCd) {
      Animated.timing(progress, { toValue: 1, duration: cooldownLeft * 1000, useNativeDriver: false }).start();
    } else {
      progress.setValue(0);
    }
  }, [onCd, cooldownLeft]);

  return (
    <TouchableOpacity onPress={() => !onCd && onSelect(skill.id)} style={[sk.card, selected && sk.selected, onCd && sk.onCd]}>
      {selected && !onCd && (
        <LinearGradient colors={colors.gradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      )}
      {onCd && (
        <Animated.View style={[sk.cdOverlay, {
          width: progress.interpolate({ inputRange: [0, 1], outputRange: ['100%', '0%'] }),
        }]} />
      )}
      <Text style={sk.emoji}>{effect.emoji}</Text>
      <Text style={[sk.name, selected && !onCd && { color: '#fff' }]} numberOfLines={2}>{skill.name}</Text>
      {onCd && <Text style={sk.cdText}>{cooldownLeft}s</Text>}
      <Text style={[sk.dmg, selected && !onCd && { color: '#fff' }]}>{skill.baseDamage} DMG</Text>
    </TouchableOpacity>
  );
}

const sk = StyleSheet.create({
  card: { width: (width - spacing.md * 2 - spacing.sm * 2) / 3, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgCard, padding: spacing.sm, alignItems: 'center', overflow: 'hidden', minHeight: 90 },
  selected: { borderColor: colors.primary },
  onCd: { opacity: 0.6 },
  cdOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, backgroundColor: colors.bgElevated + 'AA' },
  emoji: { fontSize: 24, marginBottom: 4 },
  name: { color: colors.text, fontSize: 10, fontWeight: '600', textAlign: 'center', marginBottom: 2 },
  cdText: { color: colors.warning, fontSize: 10, fontWeight: '700' },
  dmg: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
});

const TABS = ['Жагсаалт', 'Дайрах', 'Түүх'];

export default function AttackScreen() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [tab, setTab] = useState(1);
  const [selectedTarget, setSelectedTarget] = useState<any>(null);
  const [selectedSkill, setSelectedSkill] = useState<string>('');
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const [skillOverlay, setSkillOverlay] = useState<{ skill: any; damage: number } | null>(null);
  const [energyLeft, setEnergyLeft] = useState(0);

  const { data: leaderboard = [], isLoading: lbLoading } = useQuery({
    queryKey: ['attackLeaderboard'], queryFn: attackApi.getLeaderboard, refetchInterval: 30_000,
  });
  const { data: myStats, refetch: refetchStats } = useQuery({
    queryKey: ['myAttackStats'], queryFn: attackApi.getMyStats, refetchInterval: 10_000,
  });
  const { data: history = [] } = useQuery({ queryKey: ['attackHistory'], queryFn: attackApi.getHistory });
  const { data: myChars = [] } = useQuery({ queryKey: ['myChars'], queryFn: characterApi.getMyCharacters });

  useEffect(() => {
    if (!myStats) return;
    setEnergyLeft(myStats.energyRefillsAt ? Math.max(0, Math.ceil((new Date(myStats.energyRefillsAt).getTime() - Date.now()) / 1000)) : 0);
    const t = setInterval(() => setEnergyLeft((e) => Math.max(0, e - 1)), 1000);
    return () => clearInterval(t);
  }, [myStats?.energyRefillsAt]);

  useEffect(() => {
    const t = setInterval(() => {
      setCooldowns((prev) => {
        const next: Record<string, number> = {};
        for (const [id, left] of Object.entries(prev)) {
          if (left > 1) next[id] = left - 1;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const attackMut = useMutation({
    mutationFn: ({ defenderId, skillId }: any) => attackApi.attack(defenderId, skillId),
    onSuccess: (data: any) => {
      const skill = (myChars as any[]).flatMap((c: any) => c.character?.skills ?? []).find((s: any) => s.id === selectedSkill);
      setSkillOverlay({ skill, damage: data.damage ?? 0 });
      setCooldowns((prev) => ({ ...prev, [selectedSkill]: skill?.cooldown ?? 10 }));
      setSelectedSkill('');
      refetchStats();
      qc.invalidateQueries({ queryKey: ['attackLeaderboard'] });
    },
    onError: (e: any) => Alert.alert('Дайрах боломжгүй', e?.response?.data?.message ?? 'Алдаа гарлаа'),
  });

  const skills = (myChars as any[]).flatMap((c: any) => c.character?.skills ?? []);
  const ap = myStats?.attackPoints ?? 0;

  const handleAttack = () => {
    if (!selectedTarget || !selectedSkill) { Alert.alert('', 'Дайсан болон чадварыг сонгоно уу'); return; }
    if (ap < 5) { Alert.alert('Эрчим хүч хүрэхгүй', `${energyLeft}s дараа нөхөгдөнө`); return; }
    attackMut.mutate({ defenderId: selectedTarget.userId, skillId: selectedSkill });
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {skillOverlay && (
        <AttackSkillOverlay
          skill={skillOverlay.skill}
          damage={skillOverlay.damage}
          onDone={() => setSkillOverlay(null)}
        />
      )}

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map((t, i) => (
          <TouchableOpacity key={t} onPress={() => setTab(i)} style={[styles.tab, tab === i && styles.tabActive]}>
            {tab === i && <LinearGradient colors={colors.gradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />}
            <Text style={[styles.tabText, tab === i && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* LEADERBOARD TAB */}
        {tab === 0 && (
          <>
            <Text style={styles.sectionTitle}>⚔️ Тулааны жагсаалт</Text>
            {lbLoading && <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />}
            {(leaderboard as any[]).map((p: any, i) => {
              const pct = p.maxHp ? Math.max(0, Math.min(100, (p.currentHp / p.maxHp) * 100)) : 100;
              const hpColor = pct > 60 ? colors.hp.high : pct > 30 ? colors.hp.mid : colors.hp.low;
              const isMe = p.userId === user?.id;
              return (
                <TouchableOpacity key={p.userId} onPress={() => { setSelectedTarget(p); setTab(1); }} style={[styles.playerCard, isMe && styles.playerCardMe]}>
                  <LinearGradient colors={isMe ? colors.gradientDark : ['transparent', 'transparent']} style={StyleSheet.absoluteFill} />
                  <Text style={styles.rank}>#{i + 1}</Text>
                  <LinearGradient colors={colors.gradient} style={styles.playerAvatar}>
                    <Text style={styles.playerAvatarText}>{p.username?.[0]?.toUpperCase()}</Text>
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.playerName}>{p.displayName ?? p.username}{isMe ? ' (Та)' : ''}</Text>
                    <View style={styles.hpBarSmall}>
                      <View style={[styles.hpFillSmall, { width: `${pct}%` as any, backgroundColor: hpColor }]} />
                    </View>
                    <Text style={styles.hpText}>{p.currentHp}/{p.maxHp}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.kills}>💀 {p.kills ?? 0}</Text>
                    {!isMe && (
                      <View style={styles.attackBadge}>
                        <Text style={styles.attackBadgeText}>⚔️</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {/* ATTACK TAB */}
        {tab === 1 && (
          <>
            {/* My stats */}
            {myStats && (
              <View style={styles.myStatsCard}>
                <LinearGradient colors={colors.gradientDark} style={StyleSheet.absoluteFill} />
                <Text style={styles.myStatsTitle}>Таны стат</Text>
                <HpBar current={myStats.currentHp ?? 0} max={myStats.maxHp ?? 100} username={user?.username ?? ''} />
                <View style={styles.apRow}>
                  <Text style={styles.apLabel}>⚡ АP:</Text>
                  <Text style={styles.apVal}>{ap}/10</Text>
                  {energyLeft > 0 && <Text style={styles.apRefill}>+1 {energyLeft}s дараа</Text>}
                </View>
              </View>
            )}

            {/* Target selector */}
            <Text style={styles.sectionTitle}>🎯 Дайсан сонгох</Text>
            {!selectedTarget ? (
              <TouchableOpacity onPress={() => setTab(0)} style={styles.selectTargetBtn}>
                <Text style={styles.selectTargetText}>← Жагсаалтаас сонгох</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setSelectedTarget(null)} style={styles.targetCard}>
                <LinearGradient colors={['#2A0A1E', '#1A0A0E']} style={StyleSheet.absoluteFill} />
                <LinearGradient colors={colors.gradient} style={styles.playerAvatar}>
                  <Text style={styles.playerAvatarText}>{selectedTarget.username?.[0]?.toUpperCase()}</Text>
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={styles.playerName}>{selectedTarget.displayName ?? selectedTarget.username}</Text>
                  <HpBar current={selectedTarget.currentHp} max={selectedTarget.maxHp} username="" />
                </View>
                <Text style={styles.clearTarget}>✕</Text>
              </TouchableOpacity>
            )}

            {/* Skill selector */}
            <Text style={styles.sectionTitle}>⚡ Чадвар сонгох</Text>
            {skills.length === 0 ? (
              <Text style={styles.noSkills}>Чадвар олдсонгүй. Гачаас дүр авна уу.</Text>
            ) : (
              <View style={styles.skillsGrid}>
                {skills.map((skill: any) => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    selected={selectedSkill === skill.id}
                    onSelect={setSelectedSkill}
                    cooldownLeft={cooldowns[skill.id] ?? 0}
                  />
                ))}
              </View>
            )}

            {/* Attack button */}
            <TouchableOpacity
              onPress={handleAttack}
              disabled={!selectedTarget || !selectedSkill || ap < 5 || attackMut.isPending}
              style={[styles.attackBtnWrap, (!selectedTarget || !selectedSkill || ap < 5) && styles.attackBtnDisabled]}
            >
              <LinearGradient colors={['#EF4444', '#B91C1C']} style={styles.attackBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.attackBtnText}>
                  {attackMut.isPending ? '⚔️ Дайрч байна...' : '⚔️ ДАЙРАХ (5 AP)'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        {/* HISTORY TAB */}
        {tab === 2 && (
          <>
            <Text style={styles.sectionTitle}>📜 Тулааны түүх</Text>
            {(history as any[]).map((h: any, i) => {
              const isAttacker = h.attackerId === user?.id;
              return (
                <View key={h.id ?? i} style={styles.histCard}>
                  <Text style={styles.histIcon}>{isAttacker ? '⚔️' : '🛡'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.histTitle}>
                      {isAttacker ? `→ ${h.defenderUsername ?? 'Unknown'}` : `← ${h.attackerUsername ?? 'Unknown'}`}
                    </Text>
                    <Text style={styles.histDetail}>
                      {h.damage} DMG • {h.skillName ?? 'Skill'} • HP: {h.defenderHpBefore}→{h.defenderHpAfter}
                    </Text>
                  </View>
                  {h.isKill && <Text style={styles.killBadge}>KILL 💀</Text>}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', overflow: 'hidden' },
  tabActive: {},
  tabText: { color: colors.textSecondary, fontWeight: '600', fontSize: font.sm },
  tabTextActive: { color: '#fff', fontWeight: '800' },
  sectionTitle: { color: colors.textSecondary, fontSize: font.sm, fontWeight: '700', letterSpacing: 1, marginBottom: spacing.sm, marginTop: spacing.md },
  myStatsCard: { borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  myStatsTitle: { color: colors.text, fontWeight: '700', fontSize: font.md, marginBottom: spacing.sm },
  apRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  apLabel: { color: colors.textSecondary, fontSize: font.sm },
  apVal: { color: colors.primary, fontWeight: '800', fontSize: font.lg },
  apRefill: { color: colors.textMuted, fontSize: font.sm },
  playerCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', backgroundColor: colors.bgCard },
  playerCardMe: { borderColor: colors.primary },
  rank: { color: colors.textSecondary, width: 30, fontWeight: '700', fontSize: font.md },
  playerAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  playerAvatarText: { color: '#fff', fontWeight: '800' },
  playerName: { color: colors.text, fontWeight: '600', fontSize: font.md, marginBottom: 4 },
  hpBarSmall: { height: 6, backgroundColor: colors.bgElevated, borderRadius: 3, overflow: 'hidden', marginBottom: 2 },
  hpFillSmall: { height: '100%', borderRadius: 3 },
  hpText: { color: colors.textMuted, fontSize: 10 },
  kills: { color: colors.error, fontWeight: '700', fontSize: font.sm },
  attackBadge: { marginTop: 4, backgroundColor: colors.error + '33', padding: 4, borderRadius: radius.sm },
  attackBadgeText: { fontSize: 14 },
  selectTargetBtn: { backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', alignItems: 'center', marginBottom: spacing.md },
  selectTargetText: { color: colors.primaryLight, fontWeight: '600' },
  targetCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.error + '55', overflow: 'hidden', marginBottom: spacing.md },
  clearTarget: { color: colors.textMuted, fontSize: 20 },
  skillsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  noSkills: { color: colors.textMuted, textAlign: 'center', padding: spacing.lg },
  attackBtnWrap: { borderRadius: radius.md, overflow: 'hidden', marginTop: spacing.md },
  attackBtnDisabled: { opacity: 0.5 },
  attackBtn: { paddingVertical: 18, alignItems: 'center' },
  attackBtnText: { color: '#fff', fontWeight: '900', fontSize: font.xl, letterSpacing: 2 },
  histCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  histIcon: { fontSize: 24 },
  histTitle: { color: colors.text, fontWeight: '600', fontSize: font.md },
  histDetail: { color: colors.textSecondary, fontSize: font.sm, marginTop: 2 },
  killBadge: { color: colors.error, fontWeight: '800', fontSize: font.sm },
});
