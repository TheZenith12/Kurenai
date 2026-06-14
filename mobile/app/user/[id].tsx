import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, router } from 'expo-router';
import { usersApi } from '../../lib/api';
import { colors, spacing, radius, font } from '../../constants/theme';

const BACKEND = (process.env.EXPO_PUBLIC_API_URL || '').replace('/api/v1', '');
const abs = (u?: string) => (u && !u.startsWith('http') ? BACKEND + u : u);

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile', id],
    queryFn: () => usersApi.getProfile(id as string),
    enabled: !!id,
  });

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Text style={s.back}>←</Text></TouchableOpacity>
        <Text style={s.title}>Профайл</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      ) : !profile ? (
        <View style={s.empty}><Text style={s.emptyIcon}>😔</Text><Text style={s.emptyTitle}>Хэрэглэгч олдсонгүй</Text></View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <View style={s.card}>
            <LinearGradient colors={['rgba(220,38,38,0.15)', 'rgba(0,0,0,0.4)']} style={StyleSheet.absoluteFill} />
            <View style={s.avatarWrap}>
              {profile.avatarUrl ? (
                <Image source={{ uri: abs(profile.avatarUrl) }} style={s.avatar} />
              ) : (
                <LinearGradient colors={['#dc2626', '#7c3aed']} style={s.avatar}>
                  <Text style={s.avatarText}>{profile.username?.[0]?.toUpperCase() ?? '?'}</Text>
                </LinearGradient>
              )}
            </View>
            <Text style={s.name}>{profile.displayName ?? profile.username}</Text>
            <Text style={s.handle}>@{profile.username}</Text>
            {profile.systemId && <Text style={s.sysId}>#{profile.systemId}</Text>}

            <View style={s.stats}>
              <View style={s.stat}><Text style={[s.statVal, { color: '#fbbf24' }]}>{profile.characterPoints ?? 0}</Text><Text style={s.statLbl}>CP</Text></View>
              <View style={s.stat}><Text style={[s.statVal, { color: '#a855f7' }]}>{profile._count?.ownedCharacters ?? 0}</Text><Text style={s.statLbl}>Дүр</Text></View>
              <View style={s.stat}><Text style={[s.statVal, { color: '#06b6d4' }]}>{profile.reputation ?? 100}</Text><Text style={s.statLbl}>Нэр хүнд</Text></View>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  back: { color: colors.text, fontSize: 22 },
  title: { color: colors.text, fontWeight: '800', fontSize: font.xl },
  scroll: { padding: spacing.md },
  card: { borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: 'rgba(220,38,38,0.25)', overflow: 'hidden', alignItems: 'center' },
  avatarWrap: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: 'rgba(255,255,255,0.15)', overflow: 'hidden', marginBottom: spacing.md },
  avatar: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 38 },
  name: { color: colors.text, fontWeight: '900', fontSize: font.xl },
  handle: { color: colors.textSecondary, fontSize: font.md, marginTop: 2 },
  sysId: { color: colors.textMuted, fontSize: font.xs, marginTop: 2 },
  stats: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.lg },
  stat: { alignItems: 'center' },
  statVal: { fontWeight: '900', fontSize: font.xl },
  statLbl: { color: colors.textSecondary, fontSize: font.xs, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 70, gap: spacing.sm },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { color: colors.text, fontWeight: '900', fontSize: font.lg },
});
