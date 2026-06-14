import { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { usersApi, animeApi } from '../../lib/api';
import { colors, spacing, radius, font } from '../../constants/theme';
import { router } from 'expo-router';

function useDebounce(value: string, ms = 350) {
  const [d, setD] = useState(value);
  useEffect(() => { const t = setTimeout(() => setD(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return d;
}

export default function SearchScreen() {
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<'users' | 'anime'>('users');
  const dq = useDebounce(q);

  const { data: users = [], isFetching } = useQuery({
    queryKey: ['search-users', dq],
    queryFn: () => usersApi.search(dq),
    enabled: dq.length >= 2 && tab === 'users',
  });
  const { data: allAnime = [], isLoading: aLoad } = useQuery({
    queryKey: ['all-anime'],
    queryFn: animeApi.getAll,
    enabled: tab === 'anime',
  });
  const anime = (allAnime as any[]).filter((a: any) => !dq || a.name?.toLowerCase().includes(dq.toLowerCase()));

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Text style={s.back}>←</Text></TouchableOpacity>
        <Text style={s.title}>🔍 Хайлт</Text>
      </View>

      <View style={s.searchWrap}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder={tab === 'users' ? 'Хэрэглэгчийн нэр...' : 'Анимений нэр...'}
          placeholderTextColor={colors.textMuted}
          style={s.input}
          autoFocus
        />
        {q.length > 0 && <TouchableOpacity onPress={() => setQ('')}><Text style={s.clear}>✕</Text></TouchableOpacity>}
      </View>

      <View style={s.tabRow}>
        {[{ k: 'users', l: '👤 Хэрэглэгч' }, { k: 'anime', l: '🎌 Аниме' }].map((t) => (
          <TouchableOpacity key={t.k} onPress={() => setTab(t.k as any)} style={[s.tab, tab === t.k && s.tabActive]}>
            {tab === t.k && <LinearGradient colors={colors.gradient} style={StyleSheet.absoluteFill} />}
            <Text style={[s.tabText, tab === t.k && s.tabTextActive]}>{t.l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'users' ? (
        dq.length < 2 ? (
          <View style={s.empty}><Text style={s.emptyIcon}>🔎</Text><Text style={s.emptyTitle}>Хэрэглэгч хайх</Text><Text style={s.emptyDesc}>2+ тэмдэгт оруулна уу</Text></View>
        ) : isFetching ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : (users as any[]).length === 0 ? (
          <View style={s.empty}><Text style={s.emptyIcon}>😔</Text><Text style={s.emptyTitle}>Олдсонгүй</Text><Text style={s.emptyDesc}>«{dq}» нэртэй хэрэглэгч алга</Text></View>
        ) : (
          <FlatList
            data={users as any[]}
            keyExtractor={(u) => u.id}
            contentContainerStyle={s.list}
            renderItem={({ item }) => (
              <TouchableOpacity style={s.userRow} activeOpacity={0.7} onPress={() => router.push(`/profile` as any)}>
                <LinearGradient colors={['#DC2626', '#7C3AED']} style={s.avatar}>
                  <Text style={s.avatarText}>{item.username?.[0]?.toUpperCase()}</Text>
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={s.userName}>{item.displayName ?? item.username}</Text>
                  <Text style={s.userHandle}>@{item.username}</Text>
                </View>
                <Text style={s.rep}>⭐ {item.reputation}</Text>
              </TouchableOpacity>
            )}
          />
        )
      ) : (
        aLoad ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : anime.length === 0 ? (
          <View style={s.empty}><Text style={s.emptyIcon}>🎌</Text><Text style={s.emptyTitle}>Аниме олдсонгүй</Text></View>
        ) : (
          <FlatList
            data={anime}
            keyExtractor={(a) => a.id}
            numColumns={3}
            contentContainerStyle={s.grid}
            columnWrapperStyle={{ gap: spacing.sm }}
            renderItem={({ item }) => (
              <View style={s.animeCard}>
                <Image source={{ uri: item.imageUrl }} style={s.animeImg} />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={s.animeOverlay} />
                <Text style={s.animeName} numberOfLines={2}>{item.name}</Text>
              </View>
            )}
          />
        )
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
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, margin: spacing.md, paddingHorizontal: spacing.md, backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  searchIcon: { fontSize: 16 },
  input: { flex: 1, color: colors.text, fontSize: font.md, paddingVertical: 12 },
  clear: { color: colors.textMuted, fontSize: 16, padding: 4 },
  tabRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  tabActive: { borderColor: 'transparent' },
  tabText: { color: colors.textSecondary, fontWeight: '700', fontSize: font.sm },
  tabTextActive: { color: '#fff', fontWeight: '800' },
  list: { padding: spacing.md, gap: spacing.sm, paddingBottom: 40 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  avatar: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: font.lg },
  userName: { color: colors.text, fontWeight: '800', fontSize: font.md },
  userHandle: { color: colors.textSecondary, fontSize: font.sm },
  rep: { color: '#fbbf24', fontWeight: '700', fontSize: font.sm },
  grid: { padding: spacing.md, gap: spacing.sm, paddingBottom: 40 },
  animeCard: { flex: 1 / 3, aspectRatio: 0.7, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  animeImg: { width: '100%', height: '100%', position: 'absolute' },
  animeOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%' },
  animeName: { position: 'absolute', bottom: 6, left: 6, right: 6, color: '#fff', fontWeight: '800', fontSize: font.xs },
  empty: { alignItems: 'center', paddingVertical: 60, gap: spacing.sm },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { color: colors.text, fontWeight: '900', fontSize: font.lg },
  emptyDesc: { color: colors.textSecondary, fontSize: font.sm, textAlign: 'center' },
});
