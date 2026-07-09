import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { astroApi } from '../../services/astroApi';
import { safeGoBack } from '../../utils/navigation';
import { colors, COLORS } from '../../constants/theme';

function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

function formatMsgTime(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch { return ''; }
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const listRef = useRef(null);
  const [chat, setChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const load = useCallback(async () => {
    try {
      const data = await astroApi.getChat(id);
      setChat(data);
    } catch {
      setChat(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const interval = setInterval(load, 2500);
    return () => clearInterval(interval);
  }, [load]);

  const billing = chat?.billing;
  const isPending = chat?.status === 'pending';
  const isCall = chat?.type === 'call';
  const isEnded = chat?.status === 'ended';
  const canReply = (chat?.status === 'active' || chat?.status === 'paused') && !isCall;

  const accept = async () => {
    setAccepting(true);
    try {
      const res = await astroApi.acceptChat(id);
      setChat(res.session || res);
    } catch (err) {
      Alert.alert('Failed', err.message);
    } finally {
      setAccepting(false);
    }
  };

  const send = async () => {
    if (!message.trim() || !canReply) return;
    setSending(true);
    try {
      const updated = await astroApi.sendMessage(id, message.trim());
      setChat(updated);
      setMessage('');
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err) {
      Alert.alert('Failed', err.message || 'Message nahi gaya');
    } finally {
      setSending(false);
    }
  };

  const endChat = () => {
    Alert.alert('End Session', 'Is consultation ko end karein?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End', style: 'destructive',
        onPress: async () => {
          try {
            await astroApi.closeChat(id);
            safeGoBack(router, '/(tabs)/chats');
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  const openCall = (type = 'voice') => {
    const userName = chat?.user?.name || 'User';
    router.push(`/call/${id}?type=${type === 'video' ? 'video' : 'voice'}&userName=${encodeURIComponent(userName)}`);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!chat) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
        <Text style={{ color: colors.textMuted, marginTop: 8 }}>Session nahi mila</Text>
      </View>
    );
  }

  const messages = chat.messages || [];
  const birth = chat.userBirthDetails || {};
  const userName = birth.name || chat.user?.name || 'User';
  const genderMap = { male: 'Male', female: 'Female', other: 'Other' };
  const birthAge = (() => {
    const dob = birth.dateOfBirth;
    if (!dob || !/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dob)) return null;
    const [d, m, y] = dob.split('/').map(Number);
    const b = new Date(y, m - 1, d);
    if (Number.isNaN(b.getTime())) return null;
    const t = new Date();
    let a = t.getFullYear() - b.getFullYear();
    const md = t.getMonth() - b.getMonth();
    if (md < 0 || (md === 0 && t.getDate() < b.getDate())) a -= 1;
    return a >= 0 && a <= 120 ? a : null;
  })();

  const timerText = isPending
    ? 'Accept karo to start karein'
    : billing?.phase === 'free'
      ? `FREE: ${formatTime(billing.freeSecondsRemaining)}`
      : billing?.phase === 'paid'
        ? `Paid: ${formatTime(billing.totalSecondsRemaining)}`
        : billing?.phase === 'paused'
          ? 'User recharge karega'
          : isEnded ? 'Session ended' : chat.status;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeGoBack(router, '/(tabs)/chats')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>{userName.charAt(0)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerName}>{userName}</Text>
          <Text style={styles.headerSub}>
            {isCall ? '📞 Call' : '💬 Chat'} · {chat.status}
          </Text>
        </View>
        {/* Call buttons */}
        {!isPending && !isEnded && (
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => openCall('voice')}>
              <Ionicons name="call" size={18} color={COLORS.success} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => openCall('video')}>
              <Ionicons name="videocam" size={18} color={COLORS.link} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.endBtn} onPress={endChat}>
              <Text style={styles.endBtnText}>End</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Timer Bar */}
      <View style={[
        styles.timerBar,
        billing?.phase === 'free' && styles.timerFree,
        billing?.phase === 'paused' && styles.timerPaused,
        isPending && styles.timerPending,
        isEnded && styles.timerEnded,
      ]}>
        <Ionicons
          name={isPending ? 'hourglass-outline' : isEnded ? 'checkmark-circle' : 'time-outline'}
          size={14}
          color={isEnded ? COLORS.success : billing?.phase === 'paused' ? COLORS.error : colors.text}
        />
        <Text style={[
          styles.timerText,
          billing?.phase === 'paused' && { color: COLORS.error },
          isEnded && { color: COLORS.success },
        ]}>
          {timerText}
        </Text>
        <Text style={styles.rateHint}>₹{chat.pricePerMin || 0}/min</Text>
      </View>

      {/* Always-visible client kundli card for astrologer */}
      {(birth.dateOfBirth || birth.placeOfBirth || birth.timeOfBirth) ? (
        <View style={styles.kundliCard}>
          <View style={styles.kundliTitleRow}>
            <Ionicons name="planet" size={16} color={COLORS.primary} />
            <Text style={styles.kundliTitle}>Client Kundli Details</Text>
          </View>
          <Text style={styles.kundliLine}>👤 {userName}</Text>
          {!!birth.dateOfBirth && (
            <Text style={styles.kundliLine}>
              🎂 DOB: {birth.dateOfBirth}{birthAge != null ? ` (Age ${birthAge})` : ''}
            </Text>
          )}
          {!!birth.timeOfBirth && <Text style={styles.kundliLine}>⏰ TOB: {birth.timeOfBirth}</Text>}
          {!!birth.placeOfBirth && <Text style={styles.kundliLine}>📍 POB: {birth.placeOfBirth}</Text>}
          {!!birth.gender && (
            <Text style={styles.kundliLine}>⚧ Sex: {genderMap[birth.gender] || birth.gender}</Text>
          )}
        </View>
      ) : null}

      {/* Pending Accept Card */}
      {isPending && (
        <Animated.View style={[styles.pendingCard, { transform: [{ scale: pulseAnim }] }]}>
          <View style={[styles.pendingTypeChip, isCall ? styles.pendingTypeCall : styles.pendingTypeChat]}>
            <Ionicons name={isCall ? 'call' : 'chatbubble'} size={12} color="#fff" />
            <Text style={styles.pendingTypeText}>New {isCall ? 'Call' : 'Chat'} Request</Text>
          </View>
          <Text style={styles.pendingTitle}>{userName}</Text>
          <Text style={styles.pendingSub}>
            {isCall ? 'Voice call consultation' : 'Text chat · Pehla 1 minute FREE hai!'}
          </Text>
          {(birth.dateOfBirth || birth.placeOfBirth) ? (
            <Text style={styles.pendingBirth}>
              {birth.dateOfBirth ? `DOB ${birth.dateOfBirth}` : ''}
              {birth.timeOfBirth ? ` · ${birth.timeOfBirth}` : ''}
              {birth.placeOfBirth ? ` · ${birth.placeOfBirth}` : ''}
            </Text>
          ) : null}
          <TouchableOpacity style={styles.acceptBtn} onPress={accept} disabled={accepting}>
            {accepting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.acceptText}>Accept & Start</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Call Active UI */}
      {isCall && chat.status === 'active' && (
        <View style={styles.callCard}>
          <View style={styles.callIconCircle}>
            <Ionicons name="call" size={36} color="#fff" />
          </View>
          <Text style={styles.callTitle}>Call In Progress</Text>
          <Text style={styles.callSub}>{formatTime(billing?.totalSecondsRemaining || 0)} remaining</Text>
          <TouchableOpacity style={styles.openCallBtn} onPress={() => openCall('voice')}>
            <Ionicons name="call" size={18} color="#fff" />
            <Text style={styles.openCallText}>Open Call UI</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Messages */}
      {!isCall && (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            if (item.sender === 'system') {
              return (
                <View style={styles.systemBubble}>
                  <Text style={styles.systemText}>{item.content}</Text>
                </View>
              );
            }
            const isAstro = item.sender === 'astrologer';
            return (
              <View style={[styles.bubbleWrap, isAstro ? styles.bubbleRight : styles.bubbleLeft]}>
                <View style={[styles.bubble, isAstro ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={[styles.bubbleText, isAstro && styles.bubbleTextMine]}>
                    {item.content}
                  </Text>
                  {item.createdAt && (
                    <Text style={[styles.bubbleTime, isAstro && styles.bubbleTimeMine]}>
                      {formatMsgTime(item.createdAt)}
                    </Text>
                  )}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            !isPending && (
              <View style={styles.emptyMsg}>
                <Ionicons name="chatbubble-ellipses-outline" size={36} color={colors.border} />
                <Text style={styles.emptyMsgText}>No messages yet</Text>
              </View>
            )
          }
        />
      )}

      {/* Input */}
      {canReply && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={message}
              onChangeText={setMessage}
              placeholder="Reply karein..."
              placeholderTextColor={colors.textMuted}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, !message.trim() && styles.sendBtnDisabled]}
              onPress={send}
              disabled={sending || !message.trim()}
            >
              {sending
                ? <ActivityIndicator color="#1A1A1A" size="small" />
                : <Ionicons name="send" size={18} color="#1A1A1A" />}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* Ended Bar */}
      {isEnded && (
        <View style={styles.endedBar}>
          <Ionicons name="lock-closed" size={13} color={colors.textMuted} />
          <Text style={styles.endedText}>Session closed</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg, gap: 8 },

  header: {
    flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.card,
  },
  backBtn: { padding: 4 },
  headerAvatar: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.yellowLight,
    justifyContent: 'center', alignItems: 'center',
  },
  headerAvatarText: { fontSize: 15, fontWeight: '800', color: COLORS.primary },
  headerName: { fontSize: 15, fontWeight: '700', color: colors.text },
  headerSub: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center',
  },
  endBtn: {
    backgroundColor: COLORS.errorLight, borderWidth: 1, borderColor: COLORS.error,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
  },
  endBtnText: { color: COLORS.error, fontWeight: '800', fontSize: 12 },

  timerBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: COLORS.yellowLight, borderBottomWidth: 1, borderBottomColor: 'rgba(253,185,19,0.3)',
  },
  timerFree: { backgroundColor: COLORS.successLight, borderBottomColor: 'rgba(46,175,93,0.3)' },
  timerPaused: { backgroundColor: COLORS.errorLight, borderBottomColor: 'rgba(229,57,53,0.3)' },
  timerPending: { backgroundColor: colors.borderLight, borderBottomColor: colors.border },
  timerEnded: { backgroundColor: COLORS.successLight },
  timerText: { flex: 1, fontSize: 12, fontWeight: '700', color: colors.text },
  rateHint: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },

  pendingCard: {
    margin: 16, padding: 20, backgroundColor: colors.card,
    borderRadius: 20, borderWidth: 2, borderColor: COLORS.primary, alignItems: 'center',
  },
  pendingTypeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, marginBottom: 12,
  },
  pendingTypeCall: { backgroundColor: COLORS.success },
  pendingTypeChat: { backgroundColor: COLORS.link },
  pendingTypeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  pendingTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  pendingSub: { fontSize: 13, color: colors.textMuted, marginTop: 6, textAlign: 'center', lineHeight: 19 },
  pendingBirth: {
    fontSize: 12, color: colors.text, marginTop: 10, textAlign: 'center',
    lineHeight: 18, fontWeight: '600',
  },
  kundliCard: {
    marginHorizontal: 12, marginTop: 10, marginBottom: 4,
    backgroundColor: COLORS.yellowLight, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: 'rgba(253,185,19,0.45)',
  },
  kundliTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  kundliTitle: { fontSize: 13, fontWeight: '800', color: colors.text },
  kundliLine: { fontSize: 12, color: colors.text, lineHeight: 18, marginTop: 1 },
  acceptBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.success, paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 14, marginTop: 18, minWidth: 180, justifyContent: 'center',
  },
  acceptText: { color: '#fff', fontWeight: '900', fontSize: 15 },

  callCard: { alignItems: 'center', paddingVertical: 36 },
  callIconCircle: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: COLORS.success,
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  callTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  callSub: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  openCallBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 16, backgroundColor: COLORS.success,
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12,
  },
  openCallText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  messages: { padding: 14, paddingBottom: 8, flexGrow: 1 },
  emptyMsg: { alignItems: 'center', paddingTop: 40, gap: 8 },
  emptyMsgText: { color: colors.textMuted, fontSize: 13 },
  systemBubble: {
    alignSelf: 'center', backgroundColor: colors.borderLight,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, marginBottom: 8,
  },
  systemText: { fontSize: 11, color: colors.textMuted, textAlign: 'center' },
  bubbleWrap: { marginBottom: 6 },
  bubbleRight: { alignItems: 'flex-end' },
  bubbleLeft: { alignItems: 'flex-start' },
  bubble: { maxWidth: '80%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMine: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 15, color: colors.text, lineHeight: 21 },
  bubbleTextMine: { color: '#1A1A1A' },
  bubbleTime: { fontSize: 10, color: colors.textMuted, marginTop: 4, textAlign: 'right' },
  bubbleTimeMine: { color: 'rgba(0,0,0,0.4)' },

  inputRow: {
    flexDirection: 'row', padding: 12, gap: 10,
    borderTopWidth: 1, borderTopColor: colors.border, alignItems: 'flex-end',
    backgroundColor: colors.card,
  },
  input: {
    flex: 1, backgroundColor: colors.bg, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1, borderColor: colors.border, color: colors.text, maxHeight: 100, fontSize: 15,
  },
  sendBtn: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: colors.borderLight },
  endedBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: 14, backgroundColor: colors.borderLight,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  endedText: { color: colors.textMuted, fontWeight: '600', fontSize: 12 },
});