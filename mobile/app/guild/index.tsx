import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { guildApi, characterApi } from '../../lib/api';
import { useAuthStore } from '../../store/auth.store';
import { colors, spacing, radius, font } from '../../constants/theme';
import { router } from 'expo-router';

export default function GuildScreen() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [tab, setTab] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', animeId: '' });

  const { data: myGuild, isLoading: myGuildLoading } = useQuery({ queryKey: ['myGuild'], queryFn: guildApi.getMyGuild });
  const { data: lb = [], isLoading: lbLoading } = useQuery({ queryKey: ['guildLb'], queryFn: guildApi.getLeaderboard });
  const { data: animes = [] } = useQuery({ queryKey: ['animes'], queryFn: characterApi.getAnimes });

  const joinMut = useMutation({
    mutationFn: guildApi.joinGuild,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['myGuild'] }); Alert.alert('🏰 Нэгдлээ!'); },
    onError: (e: any) => Alert.alert('Алдаа', e?.response?.data?.message ?? 'Алдаа'),
  });

  const leaveMut = useMutation({
    mutationFn: guildApi.leaveGuild,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['myGuild'] }); Alert.alert('Гарлаа'); },
  });

  const createMut = useMutation({
    mutationFn: guildApi.createGuild,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['myGuild'] }); setShowCreate(false); Alert.alert('🏰 Гилд үүслээ!'); },
    onError: (e: any) => Alert.alert('Алдаа', e?.response?.data?.message ?? 'Алдаа'),
  });

  const TABS = ['Миний гилд', 'Жагсаалт'];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>←</Text></TouchableOpacity>
        <Text style={styles.title}>🏰 Гилд</Text>
      </View>

      <View style={styles.tabRow}>
        {TABS.map((t, i) => (
          <TouchableOpacity key={t} onPress={() => setTab(i)} style={[styles.tab, tab === i && styles.tabActive]}>
            {tab === i && <LinearGradient colors={colors.gradient} style={StyleSheet.absoluteFill} />}
            <Text style={[styles.tabText, tab === i && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {tab === 0 && (
          myGuildLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> :
          !myGuild ? (
            <View style={styles.noGuild}>
              <Text style={styles.noGuildEmoji}>🏰</Text>
              <Text style={styles.noGuildTitle}>Та одоогоор гилдэд байхгүй байна</Text>
              <Text style={styles.noGuildDesc}>Жагсаалтаас нэгдэх эсвэл шинэ гилд байгуул</Text>
              <TouchableOpacity onPress={() => setShowCreate(true)} style={styles.createBtnWrap}>
                <LinearGradient colors={colors.gradient} style={styles.createBtn}>
                  <Text style={styles.createBtnText}>🏰 Гилд байгуулах</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setTab(1)} style={styles.joinBtnWrap}>
                <Text style={styles.joinBtnText}>Жагсаалт харах →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.myGuildCard}>
              <LinearGradient colors={colors.gradientDark} style={StyleSheet.absoluteFill} />
              <View style={styles.guildHeader}>
                <Text style={styles.guildEmoji}>🏰</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.guildName}>{myGuild.name}</Text>
                  <Text style={styles.guildDesc}>{myGuild.description}</Text>
                </View>
              </View>
              <View style={styles.guildStats}>
                {[
                  { label: 'Гишүүд', value: myGuild.memberCount ?? 0 },
                  { label: 'Нийт CP', value: myGuild.totalCp ?? 0 },
                  { label: 'Ранк', value: `#${myGuild.rank ?? '?'}` },
                ].map((s) => (
                  <View key={s.label} style={styles.guildStat}>
                    <Text style={styles.guildStatVal}>{s.value}</Text>
                    <Text style={styles.guildStatLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.membersTitle}>Гишүүд</Text>
              {(myGuild.members ?? []).map((m: any) => (
                <View key={m.userId} style={styles.memberRow}>
                  <LinearGradient colors={colors.gradient} style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>{m.username?.[0]?.toUpperCase()}</Text>
                  </LinearGradient>
                  <Text style={styles.memberName}>{m.displayName ?? m.username}</Text>
                  <View style={[styles.roleBadge, m.role === 'LEADER' && styles.roleBadgeLeader]}>
                    <Text style={styles.roleText}>{m.role === 'LEADER' ? '👑' : m.role === 'OFFICER' ? '⭐' : '⚔️'}</Text>
                  </View>
                </View>
              ))}
              <TouchableOpacity onPress={() => Alert.alert('Гарах', 'Гилдээс гарах уу?', [
                { text: 'Болих' },
                { text: 'Гарах', style: 'destructive', onPress: () => leaveMut.mutate() },
              ])} style={styles.leaveBtn}>
                <Text style={styles.leaveBtnText}>Гилдээс гарах</Text>
              </TouchableOpacity>
            </View>
          )
        )}

        {tab === 1 && (
          <>
            {lbLoading && <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />}
            {(lb as any[]).map((g: any, i) => (
              <View key={g.id ?? i} style={styles.lbCard}>
                <Text style={styles.lbRank}>#{i + 1}</Text>
                <Text style={styles.lbEmoji}>🏰</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lbName}>{g.name}</Text>
                  <Text style={styles.lbSub}>{g.memberCount ?? 0} гишүүн • {g.totalCp ?? 0} CP</Text>
                </View>
                {!myGuild && (
                  <TouchableOpacity onPress={() => joinMut.mutate(g.id)} style={styles.joinBtn}>
                    <LinearGradient colors={colors.gradient} style={styles.joinBtnInner}>
                      <Text style={styles.joinBtnLabel}>Нэгдэх</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Create Guild Modal */}
      {showCreate && (
        <View style={styles.createModal}>
          <LinearGradient colors={['#0A0A0F', '#1A0A2E']} style={StyleSheet.absoluteFill} />
          <TouchableOpacity onPress={() => setShowCreate(false)} style={styles.modalClose}>
            <Text style={styles.modalCloseText}>✕ Хаах</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>🏰 Шинэ гилд</Text>
          <TextInput style={styles.input} value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Гилдийн нэр" placeholderTextColor={colors.textMuted} />
          <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={form.description} onChangeText={(v) => setForm((f) => ({ ...f, description: v }))} placeholder="Тайлбар" placeholderTextColor={colors.textMuted} multiline />
          <Text style={styles.inputLabel}>Аниме сонгох:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
            {(animes as any[]).map((a: any) => (
              <TouchableOpacity key={a.id} onPress={() => setForm((f) => ({ ...f, animeId: a.id }))} style={[styles.animeChip, form.animeId === a.id && styles.animeChipActive]}>
                <Text style={styles.animeChipText}>{a.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity onPress={() => createMut.mutate(form)} disabled={!form.name || !form.animeId || createMut.isPending} style={styles.createBtnWrap}>
            <LinearGradient colors={colors.gradient} style={styles.createBtn}>
              <Text style={styles.createBtnText}>{createMut.isPending ? 'Үүсгэж байна...' : 'Үүсгэх 🏰'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { color: colors.text, fontSize: 22 },
  title: { color: colors.text, fontWeight: '800', fontSize: font.xl },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', overflow: 'hidden' },
  tabActive: {},
  tabText: { color: colors.textSecondary, fontSize: font.sm, fontWeight: '600' },
  tabTextActive: { color: '#fff', fontWeight: '800' },
  scroll: { padding: spacing.md, paddingBottom: 40 },
  noGuild: { alignItems: 'center', gap: spacing.md, paddingTop: spacing.xxl },
  noGuildEmoji: { fontSize: 64 },
  noGuildTitle: { color: colors.text, fontWeight: '700', fontSize: font.lg, textAlign: 'center' },
  noGuildDesc: { color: colors.textSecondary, textAlign: 'center' },
  createBtnWrap: { borderRadius: radius.md, overflow: 'hidden', width: '100%' },
  createBtn: { paddingVertical: 16, alignItems: 'center' },
  createBtnText: { color: '#fff', fontWeight: '800', fontSize: font.lg },
  joinBtnWrap: { padding: spacing.md },
  joinBtnText: { color: colors.primaryLight, fontWeight: '600' },
  myGuildCard: { borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', gap: spacing.md },
  guildHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  guildEmoji: { fontSize: 40 },
  guildName: { color: colors.text, fontWeight: '800', fontSize: font.xl },
  guildDesc: { color: colors.textSecondary, fontSize: font.sm },
  guildStats: { flexDirection: 'row', gap: spacing.md },
  guildStat: { flex: 1, alignItems: 'center', backgroundColor: colors.bgElevated, borderRadius: radius.md, padding: spacing.sm },
  guildStatVal: { color: colors.primary, fontWeight: '900', fontSize: font.lg },
  guildStatLabel: { color: colors.textMuted, fontSize: 10 },
  membersTitle: { color: colors.textSecondary, fontWeight: '700', fontSize: font.sm },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  memberAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  memberAvatarText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  memberName: { flex: 1, color: colors.text, fontSize: font.md },
  roleBadge: { backgroundColor: colors.bgElevated, borderRadius: radius.sm, padding: 4 },
  roleBadgeLeader: { backgroundColor: '#F59E0B33' },
  roleText: { fontSize: 14 },
  leaveBtn: { alignItems: 'center', padding: spacing.md, borderWidth: 1, borderColor: colors.error + '44', borderRadius: radius.md },
  leaveBtnText: { color: colors.error, fontWeight: '600' },
  lbCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  lbRank: { color: colors.textSecondary, width: 28, fontWeight: '700' },
  lbEmoji: { fontSize: 24 },
  lbName: { color: colors.text, fontWeight: '700' },
  lbSub: { color: colors.textSecondary, fontSize: font.sm },
  joinBtn: { borderRadius: radius.sm, overflow: 'hidden' },
  joinBtnInner: { paddingHorizontal: 12, paddingVertical: 6 },
  joinBtnLabel: { color: '#fff', fontWeight: '700', fontSize: font.sm },
  createModal: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, padding: spacing.lg, paddingTop: 80 },
  modalClose: { alignSelf: 'flex-end', marginBottom: spacing.md },
  modalCloseText: { color: colors.textSecondary },
  modalTitle: { color: colors.text, fontWeight: '800', fontSize: font.xxl, marginBottom: spacing.lg },
  input: { backgroundColor: colors.bgElevated, borderRadius: radius.md, padding: spacing.md, color: colors.text, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  inputLabel: { color: colors.textSecondary, fontSize: font.sm, marginBottom: spacing.sm },
  animeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, marginRight: spacing.sm },
  animeChipActive: { borderColor: colors.primary, backgroundColor: colors.primary + '22' },
  animeChipText: { color: colors.text, fontSize: font.sm },
});
