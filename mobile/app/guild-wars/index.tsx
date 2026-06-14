import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { guildWarsApi, guildApi } from '../../lib/api';
import { colors, spacing, radius, font } from '../../constants/theme';
import { router } from 'expo-router';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  PENDING:   { label: 'Хүлээгдэж байна', color: '#f59e0b', icon: '⏳' },
  ACCEPTED:  { label: 'Хүлээн авсан',    color: '#06b6d4', icon: '✅' },
  ACTIVE:    { label: 'Тулаан!',         color: '#10b981', icon: '⚔️' },
  FINISHED:  { label: 'Дууссан',         color: '#6b7280', icon: '🏁' },
  CANCELLED: { label: 'Цуцлагдсан',      color: '#ef4444', icon: '❌' },
};

export default function GuildWarsScreen() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'my' | 'challenge'>('my');

  const { data: myGuild, isLoading: guildLoading } = useQuery({
    queryKey: ['my-guild'],
    queryFn: guildApi.getMyGuild,
    retry: false,
  });

  const { data: myWars = [], isLoading: warsLoading } = useQuery({
    queryKey: ['my-guild-wars'],
    queryFn: guildWarsApi.getMy,
    enabled: !!myGuild,
    refetchInterval: 30000,
  });

  const { data: activeWars = [], isLoading: activeLoading } = useQuery({
    queryKey: ['active-guild-wars'],
    queryFn: guildWarsApi.getActive,
    enabled: tab === 'challenge',
  });

  const acceptMut = useMutation({
    mutationFn: (warId: string) => guildWarsApi.accept(warId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-guild-wars'] });
      Alert.alert('✅', 'Guild дайн хүлээн авлаа!');
    },
    onError: (e: any) => Alert.alert('Алдаа', e?.response?.data?.message ?? 'Алдаа гарлаа'),
  });

  const challengeMut = useMutation({
    mutationFn: (defenderGuildId: string) => guildWarsApi.challenge(defenderGuildId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-guild-wars'] });
      Alert.alert('⚔️', 'Guild дайны сорилго явуулсан!');
    },
    onError: (e: any) => Alert.alert('Алдаа', e?.response?.data?.message ?? 'Алдаа гарлаа'),
  });

  const isLoading = guildLoading || warsLoading;

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>⚔️ Guild Дайн</Text>
      </View>

      {/* No guild state */}
      {!guildLoading && !myGuild ? (
        <View style={s.emptyWrap}>
          <Text style={s.emptyIcon}>🏰</Text>
          <Text style={s.emptyTitle}>Guild-д нэгдээгүй байна</Text>
          <Text style={s.emptyDesc}>Guild дайнд оролцохын тулд эхлээд guild-д нэгдэнэ үү</Text>
          <TouchableOpacity onPress={() => router.push('/guild')} style={s.emptyBtn}>
            <LinearGradient colors={colors.gradient} style={s.emptyBtnInner}>
              <Text style={s.emptyBtnText}>🏰 Guild-д нэгдэх</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* My guild info */}
          {myGuild && (
            <View style={s.guildCard}>
              <LinearGradient colors={['rgba(220,38,38,0.15)', 'rgba(0,0,0,0.5)']} style={StyleSheet.absoluteFill} />
              <Text style={s.guildIcon}>🏰</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.guildName}>{myGuild.name}</Text>
                <Text style={s.guildMeta}>{myGuild._count?.members ?? 0} гишүүн</Text>
              </View>
            </View>
          )}

          {/* Tabs */}
          <View style={s.tabRow}>
            {[
              { key: 'my'        as const, label: 'Миний дайнууд' },
              { key: 'challenge' as const, label: 'Сорилго явуулах' },
            ].map((t) => (
              <TouchableOpacity key={t.key} onPress={() => setTab(t.key)} style={[s.tab, tab === t.key && s.tabActive]}>
                {tab === t.key && <LinearGradient colors={colors.gradient} style={StyleSheet.absoluteFill} />}
                <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
            {/* My wars */}
            {tab === 'my' && (
              <View style={s.section}>
                {isLoading ? (
                  <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
                ) : (myWars as any[]).length === 0 ? (
                  <View style={s.emptyWrap}>
                    <Text style={s.emptyIcon}>⚔️</Text>
                    <Text style={s.emptyTitle}>Идэвхтэй дайн байхгүй</Text>
                    <Text style={s.emptyDesc}>«Сорилго явуулах» дарж дайн эхлүүлнэ үү</Text>
                  </View>
                ) : (
                  (myWars as any[]).map((war: any) => {
                    const cfg = STATUS_CONFIG[war.status] ?? STATUS_CONFIG.PENDING;
                    const isPending = war.status === 'PENDING' && war.defenderGuildId === myGuild?.id;
                    return (
                      <View key={war.id} style={s.warCard}>
                        <LinearGradient colors={[`${cfg.color}15`, 'rgba(0,0,0,0.5)']} style={StyleSheet.absoluteFill} />
                        <View style={s.warHeader}>
                          <Text style={s.warIcon}>{cfg.icon}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={s.warTitle}>
                              {war.challengerGuild?.name} vs {war.defenderGuild?.name}
                            </Text>
                            <Text style={[s.warStatus, { color: cfg.color }]}>{cfg.label}</Text>
                          </View>
                        </View>
                        {war.status === 'ACTIVE' && (
                          <View style={s.warScore}>
                            <Text style={s.scoreText}>{war.challengerScore ?? 0}</Text>
                            <Text style={s.scoreSep}>vs</Text>
                            <Text style={s.scoreText}>{war.defenderScore ?? 0}</Text>
                          </View>
                        )}
                        {isPending && (
                          <TouchableOpacity onPress={() => acceptMut.mutate(war.id)} style={s.acceptBtn}>
                            <LinearGradient colors={colors.gradient} style={s.acceptBtnInner}>
                              <Text style={s.acceptBtnText}>⚔️ Хүлээн авах</Text>
                            </LinearGradient>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })
                )}
              </View>
            )}

            {/* Challenge */}
            {tab === 'challenge' && (
              <View style={s.section}>
                {activeLoading ? (
                  <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
                ) : (activeWars as any[]).filter((w: any) => w.challengerGuildId !== myGuild?.id && w.defenderGuildId !== myGuild?.id).length === 0 ? (
                  <View style={s.emptyWrap}>
                    <Text style={s.emptyIcon}>🏰</Text>
                    <Text style={s.emptyTitle}>Сорилго явуулах guild байхгүй</Text>
                    <Text style={s.emptyDesc}>Одоогоор бусад guild-тэй тулалдах боломжгүй байна</Text>
                  </View>
                ) : (
                  (activeWars as any[]).filter((w: any) => w.id !== myGuild?.id).map((guild: any) => (
                    <View key={guild.id} style={s.challengeCard}>
                      <Text style={s.challengeIcon}>🏰</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={s.challengeName}>{guild.name ?? guild.defenderGuild?.name}</Text>
                        <Text style={s.challengeMeta}>{guild._count?.members ?? 0} гишүүн</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => Alert.alert('Сорилго явуулах?', `${guild.name ?? 'Guild'} рүү сорилго явуулах уу?`,
                          [{ text: 'Болих', style: 'cancel' }, { text: '⚔️ Явуулах', onPress: () => challengeMut.mutate(guild.id) }])}
                        style={s.challengeBtn}>
                        <Text style={s.challengeBtnText}>⚔️ Сорих</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            )}
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backText: { color: colors.text, fontSize: 22 },
  title: { color: colors.text, fontWeight: '800', fontSize: font.xl },
  guildCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, margin: spacing.md, padding: spacing.md, borderRadius: radius.xl, borderWidth: 1, borderColor: 'rgba(220,38,38,0.3)', overflow: 'hidden' },
  guildIcon: { fontSize: 28 },
  guildName: { color: colors.text, fontWeight: '900', fontSize: font.lg },
  guildMeta: { color: colors.textSecondary, fontSize: font.sm },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', overflow: 'hidden' },
  tabActive: {},
  tabText: { color: colors.textSecondary, fontSize: font.sm, fontWeight: '600' },
  tabTextActive: { color: '#fff', fontWeight: '800' },
  scroll: { padding: spacing.md, paddingBottom: 40 },
  section: { gap: spacing.md },
  warCard: { borderRadius: radius.xl, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.sm, overflow: 'hidden' },
  warHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  warIcon: { fontSize: 24 },
  warTitle: { color: colors.text, fontWeight: '800', fontSize: font.md },
  warStatus: { fontSize: font.sm, fontWeight: '600', marginTop: 2 },
  warScore: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  scoreText: { color: colors.primary, fontWeight: '900', fontSize: 28 },
  scoreSep: { color: colors.textSecondary, fontWeight: '700' },
  acceptBtn: { borderRadius: radius.md, overflow: 'hidden' },
  acceptBtnInner: { paddingVertical: 10, alignItems: 'center' },
  acceptBtnText: { color: '#fff', fontWeight: '900', fontSize: font.md },
  challengeCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, backgroundColor: colors.bgCard, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border },
  challengeIcon: { fontSize: 24 },
  challengeName: { color: colors.text, fontWeight: '800', fontSize: font.md },
  challengeMeta: { color: colors.textSecondary, fontSize: font.sm },
  challengeBtn: { backgroundColor: 'rgba(220,38,38,0.15)', borderWidth: 1, borderColor: 'rgba(220,38,38,0.3)', borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 7 },
  challengeBtnText: { color: '#f87171', fontWeight: '800', fontSize: font.sm },
  emptyWrap: { alignItems: 'center', paddingVertical: 60, gap: spacing.md },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { color: colors.text, fontWeight: '900', fontSize: font.xl },
  emptyDesc: { color: colors.textSecondary, fontSize: font.sm, textAlign: 'center' },
  emptyBtn: { borderRadius: radius.xl, overflow: 'hidden', marginTop: spacing.sm },
  emptyBtnInner: { paddingHorizontal: 32, paddingVertical: 12 },
  emptyBtnText: { color: '#fff', fontWeight: '900', fontSize: font.md },
});
