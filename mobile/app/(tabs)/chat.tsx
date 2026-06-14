import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Image,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Modal, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useChatStore } from '../../store/chat.store';
import { useAuthStore } from '../../store/auth.store';
import { socketManager } from '../../lib/socket';
import { chatApi, characterApi } from '../../lib/api';
import { colors, spacing, radius, font } from '../../constants/theme';
import { SkillCastOverlay, SkillCast, getEffect } from '../../components/SkillCastOverlay';

const BACKEND = (process.env.EXPO_PUBLIC_API_URL || '').replace('/api/v1', '');
const abs = (u?: string) => (u && !u.startsWith('http') ? BACKEND + u : u);

// ─── Message bubble ───────────────────────────────────────────────────
function MessageBubble({ msg, myId }: { msg: any; myId: string }) {
  const isMine = msg.senderId === myId;
  const meta = msg.metadata ?? {};
  const skillCast: SkillCast | undefined = meta.skillCast;
  const imageUrl: string | undefined = meta.imageUrl;
  const charName = meta.characterName;
  const fx = skillCast ? getEffect(skillCast.type) : null;

  const openProfile = () => { if (msg.senderId) router.push(`/user/${msg.senderId}` as any); };

  return (
    <View style={[ms.wrap, isMine && ms.wrapMine]}>
      {!isMine && (
        <TouchableOpacity onPress={openProfile} activeOpacity={0.7}>
          {meta.avatarUrl ? (
            <Image source={{ uri: abs(meta.avatarUrl) }} style={ms.avatar} />
          ) : (
            <LinearGradient colors={['#dc2626', '#7c3aed']} style={ms.avatar}>
              <Text style={ms.avatarText}>{msg.username?.[0]?.toUpperCase() ?? '?'}</Text>
            </LinearGradient>
          )}
        </TouchableOpacity>
      )}

      <View style={{ maxWidth: '78%' }}>
        {!isMine && (
          <TouchableOpacity onPress={openProfile} activeOpacity={0.7} style={ms.nameRow}>
            {charName ? (
              <>
                <Text style={[ms.charName, fx && { color: fx.ring }]} numberOfLines={1}>{charName}</Text>
                <Text style={ms.userHandle} numberOfLines={1}>@{msg.username}</Text>
              </>
            ) : (
              <Text style={ms.username} numberOfLines={1}>{msg.username}</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Skill cast bubble */}
        {skillCast && fx ? (
          <View style={[ms.bubble, isMine && ms.bubbleMine, { borderColor: fx.ring + '88', backgroundColor: fx.colors[1] + '33' }]}>
            <View style={ms.skillRow}>
              <Text style={ms.skillEmoji}>{fx.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[ms.skillName, { color: fx.ring }]}>{skillCast.name}</Text>
                <Text style={ms.skillLabel}>{fx.label} чадвар хэрэглэлээ!</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={[ms.bubble, isMine && ms.bubbleMine]}>
            {imageUrl && <Image source={{ uri: abs(imageUrl) }} style={ms.image} resizeMode="cover" />}
            {!!msg.content && <Text style={ms.content}>{msg.isFiltered ? '***' : msg.content}</Text>}
            <Text style={ms.time}>{new Date(msg.createdAt).toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const ms = StyleSheet.create({
  wrap: { flexDirection: 'row', marginBottom: spacing.sm, paddingHorizontal: spacing.md, gap: spacing.sm, alignItems: 'flex-start' },
  wrapMine: { flexDirection: 'row-reverse' },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 14 },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2, marginLeft: 4 },
  charName: { color: colors.primaryLight, fontSize: 12, fontWeight: '800', maxWidth: 130 },
  userHandle: { color: colors.textMuted, fontSize: 10 },
  username: { color: colors.primaryLight, fontSize: 11, fontWeight: '700' },
  bubble: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.sm, borderWidth: 1, borderColor: colors.border },
  bubbleMine: { backgroundColor: (colors.primaryDark ?? '#7f1d1d') + '55', borderColor: colors.primary + '44' },
  content: { color: colors.text, fontSize: font.md, lineHeight: 20 },
  time: { color: colors.textMuted, fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  image: { width: 200, height: 200, borderRadius: radius.md, marginBottom: 6 },
  skillRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  skillEmoji: { fontSize: 30 },
  skillName: { fontSize: font.md, fontWeight: '900' },
  skillLabel: { color: colors.textSecondary, fontSize: font.xs, marginTop: 1 },
});

const ROOMS = [
  { id: 'all', label: '🌐 Нийт', type: 'ALL' },
  { id: 'anime', label: '🎌 Аниме', type: 'ANIME' },
];

export default function ChatScreen() {
  const user = useAuthStore((s) => s.user);
  const { messages, typingUsers, activeRoom, setActiveRoom, addMessage, setHistory, setTyping, setOnlineCount, onlineCount } = useChatStore();
  const [text, setText] = useState('');
  const [connected, setConnected] = useState(false);
  const [activeCast, setActiveCast] = useState<SkillCast | null>(null);
  const [skillSheet, setSkillSheet] = useState(false);
  const [uploading, setUploading] = useState(false);
  const flatRef = useRef<FlatList>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const { data: animeRooms = [] } = useQuery({ queryKey: ['animeRooms'], queryFn: chatApi.getMyAnimeRooms });
  const { data: myChars = [] } = useQuery({ queryKey: ['my-characters'], queryFn: characterApi.getMyCharacters });

  const activeChar = (myChars as any[]).find((c: any) => c.isActive)?.character
    ?? (myChars as any[])[0]?.character;
  const skills: any[] = activeChar?.skills ?? [];

  const allRooms = [...ROOMS, ...(animeRooms as any[]).map((r: any) => ({ id: r.id, label: '🎴 ' + r.name, type: 'ANIME' }))];
  const roomMessages = messages[activeRoom] ?? [];
  const typing = typingUsers[activeRoom] ?? [];

  useEffect(() => {
    let unsubs: Array<() => void> = [];
    socketManager.connect().then(() => {
      setConnected(true);
      socketManager.joinRoom(activeRoom);
      unsubs.push(socketManager.onMessage((msg) => {
        addMessage(msg.roomId, msg);
        if (msg.metadata?.skillCast) setActiveCast(msg.metadata.skillCast);
      }));
      unsubs.push(socketManager.onHistory((data) => { setHistory(data.roomId, data.messages ?? []); }));
      unsubs.push(socketManager.onTyping(({ userId, username, isTyping }) => setTyping(activeRoom, { userId, username }, isTyping)));
      unsubs.push(socketManager.onOnlineCount(({ count }) => setOnlineCount(count)));
    });
    return () => { unsubs.forEach((u) => u()); };
  }, [activeRoom]);

  const sendMessage = useCallback(() => {
    if (!text.trim() || !connected) return;
    socketManager.sendMessage(activeRoom, text.trim());
    setText('');
    socketManager.sendTyping(activeRoom, false);
  }, [text, activeRoom, connected]);

  const handleTyping = (val: string) => {
    setText(val);
    socketManager.sendTyping(activeRoom, true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socketManager.sendTyping(activeRoom, false), 2000);
  };

  const switchRoom = (roomId: string) => {
    if (roomId === activeRoom) return;
    socketManager.leaveRoom(activeRoom);
    setActiveRoom(roomId);
    socketManager.joinRoom(roomId);
  };

  const castSkill = (skill: any) => {
    setSkillSheet(false);
    const cast: SkillCast = {
      type: skill.effectType,
      name: skill.name,
      character: activeChar?.name,
      animeName: activeChar?.anime?.name,
      avatarUrl: abs(activeChar?.avatarUrl),
      username: user?.username,
    };
    socketManager.sendMessage(activeRoom, `${skill.name}!`, activeChar?.id, { skillCast: cast });
  };

  const pickAndSendImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Зөвшөөрөл', 'Зураг сонгохын тулд зөвшөөрөл хэрэгтэй'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (res.canceled || !res.assets?.[0]) return;
    try {
      setUploading(true);
      const { url } = await chatApi.uploadImage(res.assets[0].uri);
      socketManager.sendMessage(activeRoom, '', activeChar?.id, { imageUrl: url });
    } catch (e: any) {
      Alert.alert('Алдаа', 'Зураг илгээхэд алдаа гарлаа');
    } finally { setUploading(false); }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {activeCast && <SkillCastOverlay cast={activeCast} onDone={() => setActiveCast(null)} />}

      {/* Room tabs */}
      <View style={styles.roomTabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roomTabsInner}>
          {allRooms.map((room) => (
            <TouchableOpacity key={room.id} onPress={() => switchRoom(room.id)} style={[styles.roomTab, activeRoom === room.id && styles.roomTabActive]}>
              {activeRoom === room.id && <LinearGradient colors={colors.gradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />}
              <Text style={[styles.roomTabText, activeRoom === room.id && styles.roomTabTextActive]}>{room.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.onlineIndicator}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineCount}>{onlineCount}</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        {!connected && (
          <View style={styles.connecting}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.connectingText}>Холбогдож байна...</Text>
          </View>
        )}

        <FlatList
          ref={flatRef}
          data={roomMessages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble msg={item} myId={user?.id ?? ''} />}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
          contentContainerStyle={{ paddingVertical: spacing.md }}
          showsVerticalScrollIndicator={false}
        />

        {typing.length > 0 && (
          <Text style={styles.typingText}>{typing.map((u) => u.username).join(', ')} бичиж байна...</Text>
        )}

        <View style={styles.inputRow}>
          {/* Image button */}
          <TouchableOpacity onPress={pickAndSendImage} disabled={uploading} style={styles.iconBtn}>
            <Text style={styles.iconBtnText}>{uploading ? '⏳' : '🖼️'}</Text>
          </TouchableOpacity>
          {/* Skill button */}
          <TouchableOpacity onPress={() => skills.length ? setSkillSheet(true) : Alert.alert('Дүр сонгоно уу', 'Чадвар хэрэглэхийн тулд дүртэй байх ёстой')} style={styles.iconBtn}>
            <LinearGradient colors={['#a855f7', '#dc2626']} style={styles.skillBtnInner}><Text style={styles.iconBtnText}>⚡</Text></LinearGradient>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            value={text}
            onChangeText={handleTyping}
            placeholder="Мессеж бичих..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={500}
          />
          <TouchableOpacity onPress={sendMessage} disabled={!text.trim()} style={styles.sendBtn}>
            <LinearGradient colors={colors.gradient} style={styles.sendBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.sendIcon}>➤</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Skill picker sheet */}
      <Modal visible={skillSheet} transparent animationType="slide" onRequestClose={() => setSkillSheet(false)}>
        <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={() => setSkillSheet(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>⚡ Чадвар хэрэглэх</Text>
              {activeChar && <Text style={styles.sheetSub}>{activeChar.name}{activeChar.anime?.name ? ` · ${activeChar.anime.name}` : ''}</Text>}
            </View>
            <ScrollView contentContainerStyle={styles.skillList}>
              {skills.map((sk) => {
                const fx = getEffect(sk.effectType);
                return (
                  <TouchableOpacity key={sk.id} onPress={() => castSkill(sk)} activeOpacity={0.8} style={[styles.skillItem, { borderColor: fx.ring + '55' }]}>
                    <LinearGradient colors={[fx.colors[0] + '33', fx.colors[1] + '22']} style={StyleSheet.absoluteFill} />
                    <View style={[styles.skillIcon, { backgroundColor: fx.colors[0] + '44', borderColor: fx.ring }]}>
                      <Text style={{ fontSize: 24 }}>{fx.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.skillItemName}>{sk.name}{sk.isUltimate ? '  👑' : ''}</Text>
                      <Text style={[styles.skillItemFx, { color: fx.ring }]}>{fx.label}{sk.damageMax ? ` · ${sk.damageMin}-${sk.damageMax} dmg` : ''}</Text>
                    </View>
                    <Text style={styles.skillCast}>▶</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  roomTabs: { borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center' },
  roomTabsInner: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  roomTab: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.full, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  roomTabActive: { borderColor: colors.primary },
  roomTabText: { color: colors.textSecondary, fontSize: font.sm, fontWeight: '600' },
  roomTabTextActive: { color: '#fff', fontWeight: '700' },
  onlineIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingRight: spacing.md, marginLeft: 'auto' },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  onlineCount: { color: colors.textSecondary, fontSize: font.sm },
  connecting: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  connectingText: { color: colors.textSecondary, fontSize: font.sm },
  typingText: { color: colors.textMuted, fontSize: 11, paddingHorizontal: spacing.md, paddingBottom: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bgCard },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border },
  skillBtnInner: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  iconBtnText: { fontSize: 18 },
  input: { flex: 1, backgroundColor: colors.bgElevated, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: 10, color: colors.text, fontSize: font.md, maxHeight: 100, borderWidth: 1, borderColor: colors.border },
  sendBtn: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  sendBtnInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sendIcon: { color: '#fff', fontSize: 18, fontWeight: '900' },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#0a0512', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)', paddingBottom: 30, maxHeight: '70%' },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginTop: 10 },
  sheetHead: { padding: spacing.md, alignItems: 'center' },
  sheetTitle: { color: '#fff', fontWeight: '900', fontSize: font.lg },
  sheetSub: { color: colors.textSecondary, fontSize: font.sm, marginTop: 2 },
  skillList: { paddingHorizontal: spacing.md, gap: spacing.sm },
  skillItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  skillIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  skillItemName: { color: '#fff', fontWeight: '800', fontSize: font.md },
  skillItemFx: { fontSize: font.xs, fontWeight: '700', marginTop: 2 },
  skillCast: { color: 'rgba(255,255,255,0.5)', fontSize: 16 },
});
