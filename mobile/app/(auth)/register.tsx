import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { authApi } from '../../lib/api';
import { colors, spacing, radius, font } from '../../constants/theme';

export default function RegisterScreen() {
  const [form, setForm] = useState({ email: '', username: '', displayName: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    if (!form.email || !form.username || !form.password) {
      Alert.alert('Алдаа', 'Бүх талбарыг бөглөнө үү'); return;
    }
    if (form.password !== form.confirm) {
      Alert.alert('Алдаа', 'Нууц үг таарахгүй байна'); return;
    }
    if (form.password.length < 6) {
      Alert.alert('Алдаа', 'Нууц үг хамгийн багадаа 6 тэмдэгт байна'); return;
    }
    setLoading(true);
    try {
      await authApi.register({ email: form.email, username: form.username, displayName: form.displayName, password: form.password });
      Alert.alert('Амжилттай! 🎉', 'Бүртгэл амжилттай үүслээ. Нэвтэрнэ үү.', [
        { text: 'Нэвтрэх', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (e: any) {
      Alert.alert('Алдаа', e?.response?.data?.message ?? 'Бүртгэлийн үед алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={['#0A0A0F', '#1A0A2E', '#0A0A0F']} style={StyleSheet.absoluteFill} />
      <View style={styles.particle1} />
      <View style={styles.particle2} />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Буцах</Text>
          </TouchableOpacity>
          <LinearGradient colors={colors.gradient} style={styles.logoGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.logoK}>紅</Text>
          </LinearGradient>
          <Text style={styles.title}>Бүртгүүлэх</Text>
          <Text style={styles.subtitle}>Anime тулалдаанд нэгдэ</Text>
        </View>

        <View style={styles.form}>
          {[
            { key: 'email', label: 'И-мэйл *', placeholder: 'example@mail.com', keyboard: 'email-address' as any },
            { key: 'username', label: 'Хэрэглэгчийн нэр *', placeholder: 'kurenai_user' },
            { key: 'displayName', label: 'Дэлгэцийн нэр', placeholder: '紅 Warrior' },
            { key: 'password', label: 'Нууц үг *', placeholder: '••••••••', secure: true },
            { key: 'confirm', label: 'Нууц үг давтах *', placeholder: '••••••••', secure: true },
          ].map(({ key, label, placeholder, keyboard, secure }) => (
            <View key={key} style={styles.inputWrap}>
              <Text style={styles.inputLabel}>{label}</Text>
              <TextInput
                style={styles.input}
                value={form[key as keyof typeof form]}
                onChangeText={(v) => set(key as keyof typeof form, v)}
                placeholder={placeholder}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                keyboardType={keyboard}
                secureTextEntry={secure}
              />
            </View>
          ))}

          <TouchableOpacity onPress={handleRegister} disabled={loading} style={styles.btnWrap}>
            <LinearGradient colors={colors.gradient} style={styles.btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.btnText}>{loading ? 'Бүртгэж байна...' : 'Бүртгүүлэх ✨'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={styles.loginBtn}>
            <Text style={styles.loginText}>
              Бүртгэл байна уу? <Text style={{ color: colors.primaryLight }}>Нэвтрэх</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  scroll: { flexGrow: 1, padding: spacing.lg, paddingTop: 60 },
  particle1: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: colors.primary, opacity: 0.06, top: 100, right: -40 },
  particle2: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: colors.pink, opacity: 0.08, bottom: 200, left: -30 },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  backBtn: { alignSelf: 'flex-start', marginBottom: spacing.lg },
  backText: { color: colors.textSecondary, fontSize: font.md },
  logoGrad: { width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  logoK: { fontSize: 28, color: '#fff', fontWeight: '900' },
  title: { fontSize: font.xxl, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: font.md, color: colors.textSecondary, marginTop: 4 },
  form: { backgroundColor: colors.bgCard, borderRadius: radius.xl, padding: spacing.xl, borderWidth: 1, borderColor: colors.border },
  inputWrap: { marginBottom: spacing.md },
  inputLabel: { fontSize: font.sm, color: colors.textSecondary, marginBottom: 6, fontWeight: '600' },
  input: { backgroundColor: colors.bgElevated, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 14, color: colors.text, fontSize: font.md, borderWidth: 1, borderColor: colors.border },
  btnWrap: { borderRadius: radius.md, overflow: 'hidden', marginTop: spacing.sm, marginBottom: spacing.md },
  btn: { paddingVertical: 16, alignItems: 'center', borderRadius: radius.md },
  btnText: { color: '#fff', fontSize: font.lg, fontWeight: '800' },
  loginBtn: { alignItems: 'center' },
  loginText: { color: colors.textSecondary, fontSize: font.md },
});
