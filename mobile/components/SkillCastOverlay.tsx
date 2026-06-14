import { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: W, height: H } = Dimensions.get('window');

export interface SkillCast {
  type: string;        // effectType (FIRE, RASENGAN, ...)
  name: string;        // skill name
  character?: string;  // character name
  animeName?: string;
  avatarUrl?: string;
  username?: string;
}

interface EffectStyle { label: string; emoji: string; colors: [string, string]; particle: string; ring: string; }

export const SKILL_EFFECTS: Record<string, EffectStyle> = {
  FIRE:      { label: 'Гал',        emoji: '🔥', colors: ['#ff6b00', '#dc2626'], particle: '🔥', ring: '#ff7a00' },
  WATER:     { label: 'Ус',         emoji: '💧', colors: ['#0ea5e9', '#1d4ed8'], particle: '💧', ring: '#38bdf8' },
  LIGHTNING: { label: 'Аянга',      emoji: '⚡', colors: ['#fde047', '#f59e0b'], particle: '⚡', ring: '#fcd34d' },
  WIND:      { label: 'Салхи',      emoji: '🌪️', colors: ['#34d399', '#059669'], particle: '🍃', ring: '#6ee7b7' },
  DARK:      { label: 'Харанхуй',   emoji: '🌑', colors: ['#7c3aed', '#3b0764'], particle: '🟣', ring: '#a855f7' },
  LIGHT:     { label: 'Гэрэл',      emoji: '✨', colors: ['#fef9c3', '#fbbf24'], particle: '✨', ring: '#fde68a' },
  EARTH:     { label: 'Газар',      emoji: '🪨', colors: ['#d97706', '#78350f'], particle: '🪨', ring: '#f59e0b' },
  VOID:      { label: 'Хоосон',     emoji: '🕳️', colors: ['#6366f1', '#1e1b4b'], particle: '🌌', ring: '#818cf8' },
  RASENGAN:  { label: 'Расенган',   emoji: '🌀', colors: ['#22d3ee', '#2563eb'], particle: '🌀', ring: '#67e8f9' },
  SHARINGAN: { label: 'Шаринган',   emoji: '👁️', colors: ['#ef4444', '#7f1d1d'], particle: '🔴', ring: '#f87171' },
  SPIRIT:    { label: 'Сүнс',       emoji: '💗', colors: ['#f472b6', '#be185d'], particle: '💗', ring: '#f9a8d4' },
  ICE:       { label: 'Мөс',        emoji: '❄️', colors: ['#a5f3fc', '#0891b2'], particle: '❄️', ring: '#cffafe' },
  DEFAULT:   { label: 'Чадвар',     emoji: '⚔️', colors: ['#a855f7', '#6d28d9'], particle: '⭐', ring: '#c084fc' },
};

export function getEffect(type?: string): EffectStyle {
  if (!type) return SKILL_EFFECTS.DEFAULT;
  return SKILL_EFFECTS[type.toUpperCase()] ?? SKILL_EFFECTS.DEFAULT;
}

const PARTICLE_COUNT = 14;

export function SkillCastOverlay({ cast, onDone }: { cast: SkillCast; onDone: () => void }) {
  const fx = getEffect(cast.type);

  const backdrop = useRef(new Animated.Value(0)).current;
  const avatarY = useRef(new Animated.Value(70)).current;
  const avatarScale = useRef(new Animated.Value(0.3)).current;
  const ringScale = useRef(new Animated.Value(0)).current;
  const ringRotate = useRef(new Animated.Value(0)).current;
  const auraPulse = useRef(new Animated.Value(0)).current;
  const nameScale = useRef(new Animated.Value(2.4)).current;
  const nameOpacity = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const shockwave = useRef(new Animated.Value(0)).current;
  const particles = useRef(Array.from({ length: PARTICLE_COUNT }, () => new Animated.Value(0))).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // continuous ring spin
    Animated.loop(
      Animated.timing(ringRotate, { toValue: 1, duration: 1100, easing: Easing.linear, useNativeDriver: true }),
    ).start();
    // continuous aura pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(auraPulse, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(auraPulse, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();

    Animated.sequence([
      // 1. Backdrop + avatar entrance + ring grow
      Animated.parallel([
        Animated.timing(backdrop, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.spring(avatarY, { toValue: 0, tension: 60, friction: 7, useNativeDriver: true }),
        Animated.spring(avatarScale, { toValue: 1, tension: 70, friction: 6, useNativeDriver: true }),
        Animated.timing(ringScale, { toValue: 1, duration: 500, easing: Easing.out(Easing.back(2)), useNativeDriver: true }),
      ]),
      // 2. Charge hold
      Animated.delay(420),
      // 3. Name slam + BURST (flash, shockwave, particles)
      Animated.parallel([
        Animated.spring(nameScale, { toValue: 1, tension: 120, friction: 6, useNativeDriver: true }),
        Animated.timing(nameOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(flash, { toValue: 1, duration: 90, useNativeDriver: true }),
          Animated.timing(flash, { toValue: 0, duration: 350, useNativeDriver: true }),
        ]),
        Animated.timing(shockwave, { toValue: 1, duration: 700, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.stagger(28, particles.map((p) =>
          Animated.timing(p, { toValue: 1, duration: 850, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        )),
      ]),
      // 4. Hold then fade out
      Animated.delay(900),
      Animated.timing(exitOpacity, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start(() => onDone());
  }, []);

  const spin = ringRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const auraScaleI = auraPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] });
  const auraOpacityI = auraPulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.7] });
  const shockScale = shockwave.interpolate({ inputRange: [0, 1], outputRange: [0.2, 4.5] });
  const shockOpacity = shockwave.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.8, 0] });

  return (
    <Animated.View style={[styles.root, { opacity: exitOpacity }]} pointerEvents="none">
      {/* Backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: backdrop }]}>
        <LinearGradient colors={[fx.colors[1] + '55', '#000000ee', fx.colors[0] + '44']} style={StyleSheet.absoluteFill} />
      </Animated.View>

      {/* Shockwave ring */}
      <Animated.View style={[styles.shock, { borderColor: fx.ring, transform: [{ scale: shockScale }], opacity: shockOpacity }]} />

      {/* Aura glow behind avatar */}
      <Animated.View style={[styles.aura, { backgroundColor: fx.colors[0], opacity: auraOpacityI, transform: [{ scale: auraScaleI }] }]} />

      {/* Spinning energy ring */}
      <Animated.View style={[styles.energyRing, { borderColor: fx.ring, transform: [{ scale: ringScale }, { rotate: spin }] }]}>
        <View style={[styles.ringDot, { backgroundColor: fx.ring, top: -6 }]} />
        <View style={[styles.ringDot, { backgroundColor: fx.ring, bottom: -6 }]} />
        <View style={[styles.ringDot, { backgroundColor: fx.colors[0], left: -6 }]} />
        <View style={[styles.ringDot, { backgroundColor: fx.colors[0], right: -6 }]} />
      </Animated.View>

      {/* Character avatar */}
      <Animated.View style={[styles.avatarWrap, { borderColor: fx.ring, transform: [{ translateY: avatarY }, { scale: avatarScale }] }]}>
        {cast.avatarUrl ? (
          <Image source={{ uri: cast.avatarUrl }} style={styles.avatarImg} />
        ) : (
          <LinearGradient colors={fx.colors} style={styles.avatarImg}>
            <Text style={styles.avatarEmoji}>{fx.emoji}</Text>
          </LinearGradient>
        )}
      </Animated.View>

      {/* Exploding particles */}
      {particles.map((p, i) => {
        const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
        const dist = 130 + (i % 4) * 35;
        const tx = p.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(angle) * dist] });
        const ty = p.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(angle) * dist] });
        const pOpacity = p.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] });
        const pScale = p.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.4] });
        return (
          <Animated.Text key={i} style={[styles.particle, { opacity: pOpacity, transform: [{ translateX: tx }, { translateY: ty }, { scale: pScale }] }]}>
            {fx.particle}
          </Animated.Text>
        );
      })}

      {/* Skill name + meta */}
      <Animated.View style={[styles.nameBox, { opacity: nameOpacity, transform: [{ scale: nameScale }] }]}>
        <Text style={[styles.skillName, { textShadowColor: fx.ring }]}>{cast.name}</Text>
        <LinearGradient colors={fx.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.effectBadge}>
          <Text style={styles.effectBadgeText}>{fx.emoji} {fx.label}</Text>
        </LinearGradient>
        {(cast.character || cast.username) && (
          <Text style={styles.caster}>{cast.character ?? ''}{cast.animeName ? ` · ${cast.animeName}` : ''}</Text>
        )}
        {cast.username && <Text style={styles.casterUser}>@{cast.username} ашиглалаа!</Text>}
      </Animated.View>

      {/* White impact flash */}
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#fff', opacity: flash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.85] }) }]} />
    </Animated.View>
  );
}

const RING = 150;
const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, alignItems: 'center', justifyContent: 'center' },
  shock: { position: 'absolute', width: RING, height: RING, borderRadius: RING / 2, borderWidth: 4 },
  aura: { position: 'absolute', width: 180, height: 180, borderRadius: 90 },
  energyRing: { position: 'absolute', width: RING, height: RING, borderRadius: RING / 2, borderWidth: 3, borderStyle: 'dashed' },
  ringDot: { position: 'absolute', width: 12, height: 12, borderRadius: 6, alignSelf: 'center' },
  avatarWrap: { width: 116, height: 116, borderRadius: 58, borderWidth: 3, overflow: 'hidden', marginBottom: 4 },
  avatarImg: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 52 },
  particle: { position: 'absolute', fontSize: 26 },
  nameBox: { position: 'absolute', bottom: H * 0.24, alignItems: 'center', paddingHorizontal: 24 },
  skillName: { color: '#fff', fontSize: 38, fontWeight: '900', letterSpacing: 1, textAlign: 'center', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 18 },
  effectBadge: { marginTop: 10, paddingHorizontal: 16, paddingVertical: 5, borderRadius: 999 },
  effectBadgeText: { color: '#fff', fontWeight: '800', fontSize: 14, letterSpacing: 1 },
  caster: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '700', marginTop: 12 },
  casterUser: { color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 2 },
});
