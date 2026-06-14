import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { authApi } from '../../lib/api';
import { colors, spacing, radius, font } from '../../constants/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [newPass, setNewPass] = useState('');

  const handleSend = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email.trim()) as any;
      setSent(true);
      if (res?.devCode) setCode(res.devCode);
      Alert.alert('Илгээсэн ✉️', 'Нууц үг сэргээх код илгээгдлээ');
    } catch (e: any) {
      Alert.alert('Алдаа', e?.response?.data?.message ?? 'Алдаа гарлаа');
    } finally { setLoading(false); }
  };

  const handleReset = async () => {
    if (!code || !newPass) return;
    setLoading(true);
    try {
      await authApi.resetPassword(code, newPass);
      Alert.alert('Амжилттай! ✅', 'Нууц үг шинэчлэгдлээ', [
        { text: 'Нэвтрэх', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (e: any) {
      Alert.alert('Алдаа', e?.response?.data?.message ?? 'Алдаа гарлаа');
    } finally { setLoading(false); }
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#0A0A0F', '#1A0A2E', '#0A0A0F']} style={StyleSheet.absoluteFill} />
      <View style={styles.inner}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Буцах</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Нууц үг сэргээх</Text>
        <Text style={styles.subtitle}>И-мэйлээ оруулна уу</Text>

        <View style={styles.form}>
          {!sent ? (
            <>
              <TextInput
                style={styles.input} value={email} onChangeText={setEmail}
                placeholder="example@mail.com" placeholderTextColor={colors.textMuted}
                autoCapitalize="none" keyboardType="email-address"
              />
              <TouchableOpacity onPress={handleSend} disabled={loading} style={styles.btnWrap}>
                <LinearGradient colors={colors.gradient} style={styles.btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={styles.btnText}>{loading ? 'Илгээж байна...' : 'Код илгээх 📧'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.sentMsg}>Код илгээгдлээ. И-мэйлээ шалгаарай.</Text>
              <TextInput
                style={styles.input} value={code} onChangeText={setCode}
                placeholder="Сэргээх код" placeholderTextColor={colors.textMuted}
              />
              <TextInput
                style={[styles.input, { marginTop: spacing.sm }]} value={newPass} onChangeText={setNewPass}
                placeholder="Шинэ нууц үг" placeholderTextColor={colors.textMuted}
                secureTextEntry
              />
              <TouchableOpacity onPress={handleReset} disabled={loading} style={styles.btnWrap}>
                <LinearGradient colors={colors.gradient} style={styles.btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={styles.btnText}>{loading ? 'Шинэчилж байна...' : 'Нууц үг шинэчлэх ✅'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  inner: { flex: 1, padding: spacing.lg, paddingTop: 80 },
  backBtn: { marginBottom: spacing.xl },
  backText: { color: colors.textSecondary, fontSize: font.md },
  title: { fontSize: font.xxl, fontWeight: '800', color: colors.text, marginBottom: spacing.xs },
  subtitle: { fontSize: font.md, color: colors.textSecondary, marginBottom: spacing.xl },
  form: { backgroundColor: colors.bgCard, borderRadius: radius.xl, padding: spacing.xl, borderWidth: 1, borderColor: colors.border },
  input: { backgroundColor: colors.bgElevated, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 14, color: colors.text, fontSize: font.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  btnWrap: { borderRadius: radius.md, overflow: 'hidden' },
  btn: { paddingVertical: 16, alignItems: 'center', borderRadius: radius.md },
  btnText: { color: '#fff', fontSize: font.lg, fontWeight: '800' },
  sentMsg: { color: colors.success, marginBottom: spacing.md, fontSize: font.md },
});
