import { View, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Global app background — replicates the web dashboard look:
 * near-black base + hero battle image (low opacity) + red energy glow + dark vignette.
 * Rendered once behind the navigator; every screen sits on top with transparent roots.
 */
export function AppBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Base near-black */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#020008' }]} />

      {/* Hero battle image — faint, like web's 0.13 opacity */}
      <Image
        source={require('../assets/hero-bg.jpg')}
        style={[StyleSheet.absoluteFill, { opacity: 0.14 }]}
        resizeMode="cover"
      />

      {/* Red energy bloom from top-right (Sukuna shrine vibe) */}
      <LinearGradient
        colors={['rgba(220,20,20,0.18)', 'rgba(220,20,20,0.04)', 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.2, y: 0.6 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Cyan accent bloom bottom-left */}
      <LinearGradient
        colors={['transparent', 'rgba(56,189,248,0.05)']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Dark vignette — edges fade to black for depth */}
      <LinearGradient
        colors={['rgba(2,0,8,0.35)', 'transparent', 'rgba(2,0,8,0.75)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
