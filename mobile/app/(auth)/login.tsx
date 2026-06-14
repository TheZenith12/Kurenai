import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Animated, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/auth.store';
import { colors, spacing, radius, font } from '../../constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const login = useAuthStore((s) => s.login);
  const loginGuest = useAuthStore((s) => s.loginGuest);
  const isLoading = useAuthStore((s) => s.isLoading);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) { shake(); return; }
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)/home');
    } catch (e: any) {
      shake();
      Alert.alert('Алдаа', e?.response?.data?.message ?? 'Нэвтрэх үед алдаа гарлаа');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={['#0A0A0F', '#1A0A2E', '#0A0A0F']} style={StyleSheet.absoluteFill} />

      {/* Floating particles */}
      <View style={styles.particle1} />
      <View style={styles.particle2} />
      <View style={styles.particle3} />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoWrap}>
          <LinearGradient colors={colors.gradient} style={styles.logoGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.logoK}>紅</Text>
          </LinearGradient>
          <Text style={styles.logoTitle}>KURENAI</Text>
          <Text style={styles.logoSub}>Anime Platform</Text>
        </View>

        {/* Form */}
        <Animated.View style={[styles.form, { transform: [{ translateX: shakeAnim }] }]}>
          <Text style={styles.formTitle}>Нэвтрэх</Text>

          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>И-мэйл / Нэр</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="example@mail.com"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Нууц үг</Text>
            <View style={styles.passWrap}>
              <TextInput
                style={[styles.input, { flex: 1, borderWidth: 0 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                <Text style={styles.eyeText}>{showPass ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Нууц үг мартсан уу?</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLogin} disabled={isLoading} style={styles.btnWrap}>
            <LinearGradient colors={colors.gradient} style={styles.btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.btnText}>{isLoading ? 'Нэвтрэж байна...' : 'Нэвтрэх ⚡'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.divLine} />
            <Text style={styles.divText}>эсвэл</Text>
            <View style={styles.divLine} />
          </View>

          <TouchableOpacity onPress={async () => {
            await loginGuest();
            router.replace('/(tabs)/home');
          }} style={styles.guestBtn}>
            <Text style={styles.guestText}>Зочинээр үргэлжлүүлэх</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.registerBtn}>
            <Text style={styles.registerText}>
              Бүртгэл байхгүй юу? <Text style={{ color: colors.primaryLight }}>Бүртгүүлэх</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },

  particle1: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: colors.primary, opacity: 0.08, top: 80, right: -30,
  },
  particle2: {
    position: 'absolute', width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.pink, opacity: 0.1, bottom: 180, left: -20,
  },
  particle3: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: colors.primaryDark, opacity: 0.06, top: 300, left: 100,
  },

  logoWrap: { alignItems: 'center', marginBottom: spacing.xxl },
  logoGrad: {
    width: 80, height: 80, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6, shadowRadius: 20, elevation: 12,
  },
  logoK: { fontSize: 36, color: '#fff', fontWeight: '900' },
  logoTitle: { fontSize: 28, fontWeight: '900', color: colors.text, letterSpacing: 6 },
  logoSub: { fontSize: font.sm, color: colors.textSecondary, letterSpacing: 3, marginTop: 4 },

  form: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl, padding: spacing.xl,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 8,
  },
  formTitle: { fontSize: font.xxl, fontWeight: '800', color: colors.text, marginBottom: spacing.lg },

  inputWrap: { marginBottom: spacing.md },
  inputLabel: { fontSize: font.sm, color: colors.textSecondary, marginBottom: 6, fontWeight: '600' },
  input: {
    backgroundColor: colors.bgElevated, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 14,
    color: colors.text, fontSize: font.md,
    borderWidth: 1, borderColor: colors.border,
  },
  passWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgElevated, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    paddingRight: spacing.md,
  },
  eyeBtn: { padding: 4 },
  eyeText: { fontSize: 16 },

  forgotBtn: { alignSelf: 'flex-end', marginBottom: spacing.lg },
  forgotText: { color: colors.primaryLight, fontSize: font.sm },

  btnWrap: { borderRadius: radius.md, overflow: 'hidden', marginBottom: spacing.md },
  btn: { paddingVertical: 16, alignItems: 'center', borderRadius: radius.md },
  btnText: { color: '#fff', fontSize: font.lg, fontWeight: '800', letterSpacing: 1 },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.md },
  divLine: { flex: 1, height: 1, backgroundColor: colors.border },
  divText: { color: colors.textMuted, marginHorizontal: spacing.md, fontSize: font.sm },

  guestBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  guestText: {
    color: colors.primaryLight,
    fontSize: font.md,
    fontWeight: '700',
  },
  registerBtn: { alignItems: 'center' },
  registerText: { color: colors.textSecondary, fontSize: font.md },
});
