import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/common/Screen';
import Header from '../../components/common/Header';
import { sessionApi } from '../../services/sessionApi';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWallet } from '../../redux/walletSlice';
import { COLORS } from '../../constants/colors';

function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

function formatMessageTime(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return '';
  }
}

export default function UserChatScreen() {
  const { id, returnTo } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const balance = useSelector((s) => s.wallet.balance);
  const listRef = useRef(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [paying, setPaying] = useState(false);
  const [notice, setNotice] = useState(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for pending state
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const load = useCallback(async () => {
    try {
      const data = await sessionApi.get(id);
      setSession(data);
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    dispatch(fetchWallet());
  }, [load, dispatch]);

  const billing = session?.billing;
  const isCall = session?.type === 'call';
  const isPending = session?.status === 'pending';
  const isEnded = session?.status === 'ended';
  const isPaused = billing?.requiresPayment || session?.status === 'paused';
  const canSend = billing?.canChat && !isPending && !isEnded;

  useEffect(() => {
    if (!session) return;

    if (isEnded) {
      setNotice({
        type: 'success',
        icon: 'checkmark-circle-outline',
        message: 'Session end ho gaya. Puri history yahan dekh sakte ho.',
      });
    } else if (isPending) {
      setNotice({
        type: 'info',
        icon: 'notifications-outline',
        message: 'Request send ho gayi. Jab astrologer accept karein, chat shuru ho jayegi.',
      });
    } else if (isPaused) {
      setNotice({
        type: 'warning',
        icon: 'wallet-outline',
        message: 'Free time khatam! Chat continue karne ke liye recharge karo.',
      });
    } else {
      setNotice(null);
    }
  }, [session, isPending, isPaused, isEnded]);

  // Auto-refresh only for active/pending sessions
  useEffect(() => {
    if (isEnded) return; // Don't poll for ended sessions
    const interval = setInterval(load, 2500);
    return () => clearInterval(interval);
  }, [load, isEnded]);

  const handleSend = async () => {
    if (!message.trim() || !canSend) return;
    setSending(true);
    try {
      const updated = await sessionApi.sendMessage(id, message.trim());
      setSession(updated);
      setMessage('');
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err) {
      if (err.requiresPayment) {
        await load();
        Alert.alert('Time Up!', 'Chat continue karne ke liye recharge karo.');
      } else {
        Alert.alert('Failed', err.message || 'Message nahi gaya');
      }
    } finally {
      setSending(false);
    }
  };

  const handleBack = useCallback(() => {
    if (typeof returnTo === 'string' && returnTo) {
      router.replace(returnTo);
      return;
    }
    router.back();
  }, [returnTo, router]);

  const handlePay = async (minutes) => {
    const cost = (session?.pricePerMin || 20) * minutes;
    if (balance < cost) {
      Alert.alert('Low Balance', `₹${cost} chahiye. Wallet mein paise daalo.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Add Money', onPress: () => router.push('/wallet/add-money') },
      ]);
      return;
    }
    setPaying(true);
    try {
      const res = await sessionApi.pay(id, minutes);
      setSession(res.session);
      dispatch(fetchWallet());
      setNotice({
        type: 'success',
        icon: 'checkmark-circle-outline',
        message: 'Recharge successful! Chat continue karo.',
      });
    } catch (err) {
      Alert.alert('Payment Failed', err.message || 'Payment nahi ho saka');
    } finally {
      setPaying(false);
    }
  };

  const handleEnd = () => {
    Alert.alert('End Session', 'Kya aap session end karna chahte ho?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End', style: 'destructive',
        onPress: async () => {
          try {
            await sessionApi.end(id);
            await load(); // Reload to show ended state with history
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  const handleOpenCall = () => {
    router.push(`/call/${id}?type=voice&astroName=${encodeURIComponent(session?.astrologer?.name || 'Astrologer')}`);
  };

  const handleOpenVideoCall = () => {
    router.push(`/call/${id}?type=video&astroName=${encodeURIComponent(session?.astrologer?.name || 'Astrologer')}`);
  };

  if (loading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </Screen>
    );
  }

  if (!session) {
    return (
      <Screen>
        <Header title="Session" onBack={handleBack} />
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.textSecondary} />
          <Text style={styles.muted}>Session nahi mila</Text>
        </View>
      </Screen>
    );
  }

  const astroName = session.astrologer?.name || 'Astrologer';
  const messages = session.messages || [];

  const timerLabel = billing?.phase === 'free'
    ? `FREE: ${formatTime(billing.freeSecondsRemaining)}`
    : billing?.phase === 'paid'
      ? `PAID: ${formatTime(billing.totalSecondsRemaining)}`
      : isPending
        ? 'Astrologer ka wait karo...'
        : isPaused
          ? 'Time khatam — recharge karo'
          : isEnded
            ? 'Session ended'
            : session.status;

  return (
    <Screen edges={['left', 'right', 'bottom']} style={styles.screen}>
      <Header
        title={astroName}
        subtitle={isCall ? '📞 Voice Call' : '💬 Chat'}
        onBack={handleBack}
        rightComponent={
          !isEnded && !isPending ? (
            <View style={styles.headerActions}>
              {/* Voice call button */}
              <TouchableOpacity style={styles.callIconBtn} onPress={handleOpenCall}>
                <Ionicons name="call" size={18} color={COLORS.success} />
              </TouchableOpacity>
              {/* Video call button */}
              <TouchableOpacity style={styles.callIconBtn} onPress={handleOpenVideoCall}>
                <Ionicons name="videocam" size={18} color={COLORS.link} />
              </TouchableOpacity>
              {/* End */}
              <TouchableOpacity onPress={handleEnd}>
                <Text style={styles.endText}>End</Text>
              </TouchableOpacity>
            </View>
          ) : isEnded ? null : null
        }
      />

      {/* Notice Banner */}
      {notice ? (
        <View style={[
          styles.noticeBox,
          notice.type === 'warning' && styles.noticeWarning,
          notice.type === 'success' && styles.noticeSuccess,
        ]}>
          <Ionicons
            name={notice.icon}
            size={16}
            color={
              notice.type === 'warning' ? COLORS.error
              : notice.type === 'success' ? COLORS.success
              : COLORS.primary
            }
          />
          <Text style={styles.noticeText}>{notice.message}</Text>
          {notice.type === 'warning' && (
            <TouchableOpacity onPress={() => router.push('/wallet/add-money')}>
              <Text style={styles.noticeLink}>Recharge</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}

      {/* Timer Bar */}
      {!isEnded && (
        <View style={[
          styles.timerBar,
          billing?.phase === 'free' && styles.timerFree,
          isPaused && styles.timerPaused,
          isPending && styles.timerPending,
        ]}>
          <Ionicons
            name={
              isCall ? 'call'
              : isPending ? 'hourglass-outline'
              : isPaused ? 'wallet-outline'
              : 'time-outline'
            }
            size={15}
            color={isPaused ? COLORS.error : COLORS.textSecondary}
          />
          <Text style={[styles.timerText, isPaused && { color: COLORS.error }]}>
            {timerLabel}
          </Text>
          <Text style={styles.rateText}>₹{session.pricePerMin}/min</Text>
        </View>
      )}

      {/* Ended Header */}
      {isEnded && (
        <View style={styles.endedBar}>
          <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
          <Text style={styles.endedBarText}>Session ended · Puri history neechey dekho</Text>
        </View>
      )}

      {/* Pending Waiting */}
      {isPending && (
        <Animated.View style={[styles.waitingBox, { transform: [{ scale: pulseAnim }] }]}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.waitingTitle}>Request bheji gayi hai</Text>
          <Text style={styles.waitingSub}>
            {astroName} accept karenge tab {isCall ? 'call' : 'chat'} start hogi
            {!isCall ? '\nPehla 1 minute FREE!' : ''}
          </Text>
        </Animated.View>
      )}

      {/* Call UI */}
      {isCall && session.status === 'active' && (
        <View style={styles.callBox}>
          <View style={styles.callCircle}>
            <Ionicons name="call" size={38} color="#FFF" />
          </View>
          <Text style={styles.callTitle}>Call Connected</Text>
          <Text style={styles.callSub}>
            {formatTime(billing?.totalSecondsRemaining || 0)} remaining
          </Text>
          <TouchableOpacity style={styles.joinCallBtn} onPress={handleOpenCall}>
            <Ionicons name="call" size={20} color="#fff" />
            <Text style={styles.joinCallText}>Open Call</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Messages */}
      {!isCall && messages.length > 0 && (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          style={styles.list}
          contentContainerStyle={styles.messagesContainer}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            if (item.sender === 'system') {
              return (
                <View style={styles.systemBubble}>
                  <Text style={styles.systemText}>{item.content}</Text>
                </View>
              );
            }
            const isUser = item.sender === 'user';
            return (
              <View style={[styles.bubbleWrap, isUser ? styles.bubbleWrapRight : styles.bubbleWrapLeft]}>
                <View style={[styles.bubble, isUser ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={[styles.bubbleText, isUser && styles.bubbleTextMine]}>
                    {item.content}
                  </Text>
                  {item.createdAt && (
                    <Text style={[styles.bubbleTime, isUser && styles.bubbleTimeMine]}>
                      {formatMessageTime(item.createdAt)}
                    </Text>
                  )}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            !isPending && (
              <View style={styles.emptyMessages}>
                <Ionicons name="chatbubble-ellipses-outline" size={40} color={COLORS.borderLight} />
                <Text style={styles.muted}>Koi message nahi abhi tak</Text>
              </View>
            )
          }
        />
      )}

      {/* Empty messages for non-call */}
      {!isCall && messages.length === 0 && !isPending && (
        <View style={[styles.list, styles.emptyMessages]}>
          <Ionicons name="chatbubble-ellipses-outline" size={40} color={COLORS.borderLight} />
          <Text style={styles.muted}>Koi message nahi abhi tak</Text>
        </View>
      )}

      {/* Paused — Pay Options */}
      {isPaused && !isEnded && (
        <View style={styles.payBox}>
          <Text style={styles.payTitle}>
            {isCall ? '⏱ Call time khatam!' : '⏱ Free minute khatam!'}
          </Text>
          <Text style={styles.paySub}>Continue karne ke liye minutes khareedo</Text>
          <View style={styles.payRow}>
            {[1, 5, 10].map((mins) => (
              <TouchableOpacity
                key={mins}
                style={styles.payBtn}
                onPress={() => handlePay(mins)}
                disabled={paying}
              >
                {paying ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <>
                    <Text style={styles.payBtnMins}>{mins} min</Text>
                    <Text style={styles.payBtnPrice}>₹{(session.pricePerMin || 20) * mins}</Text>
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.balanceText}>Wallet: ₹{balance || 0}</Text>
        </View>
      )}

      {/* Input */}
      {!isCall && canSend && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={message}
              onChangeText={setMessage}
              placeholder="Message likho..."
              placeholderTextColor={COLORS.textLight}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, !message.trim() && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={sending || !message.trim()}
            >
              {sending ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Ionicons name="send" size={18} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* Ended Bar */}
      {isEnded && (
        <View style={styles.closedBar}>
          <Ionicons name="lock-closed" size={14} color={COLORS.textSecondary} />
          <Text style={styles.closedText}>Session closed · Chat history saved</Text>
          <TouchableOpacity
            style={styles.newSessionBtn}
            onPress={() => router.push(`/astrologers/${session.astrologer?._id || ''}`)}
          >
            <Text style={styles.newSessionText}>New Session</Text>
          </TouchableOpacity>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: COLORS.cream },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  muted: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 8, fontSize: 14 },
  endText: { color: COLORS.error, fontWeight: '700', fontSize: 13 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  callIconBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: COLORS.borderLight,
    justifyContent: 'center', alignItems: 'center',
  },
  noticeBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 14, marginTop: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 12, backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  noticeWarning: { borderColor: COLORS.error, backgroundColor: COLORS.errorLight },
  noticeSuccess: { borderColor: COLORS.success, backgroundColor: COLORS.successLight },
  noticeText: { flex: 1, fontSize: 12, color: COLORS.text, fontWeight: '500', lineHeight: 17 },
  noticeLink: { color: COLORS.primary, fontSize: 12, fontWeight: '800' },
  timerBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 14, marginTop: 8, padding: 10, borderRadius: 10,
    backgroundColor: COLORS.yellowLight, borderWidth: 1, borderColor: COLORS.primary,
  },
  timerFree: { backgroundColor: COLORS.successLight, borderColor: COLORS.success },
  timerPaused: { backgroundColor: COLORS.errorLight, borderColor: COLORS.error },
  timerPending: { backgroundColor: COLORS.borderLight, borderColor: COLORS.border },
  timerText: { flex: 1, fontSize: 12, fontWeight: '700', color: COLORS.text },
  rateText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
  endedBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: 14, marginTop: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, backgroundColor: COLORS.successLight,
    borderWidth: 1, borderColor: COLORS.success,
  },
  endedBarText: { fontSize: 12, color: COLORS.success, fontWeight: '600' },
  waitingBox: {
    alignItems: 'center', padding: 32,
    marginHorizontal: 14, marginTop: 20,
    backgroundColor: COLORS.surface, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  waitingTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text, marginTop: 12 },
  waitingSub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: 6, lineHeight: 19 },
  callBox: { alignItems: 'center', paddingVertical: 36 },
  callCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: COLORS.success,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  callTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  callSub: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  joinCallBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 16, backgroundColor: COLORS.success,
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12,
  },
  joinCallText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  list: { flex: 1 },
  messagesContainer: { padding: 14, paddingBottom: 8 },
  emptyMessages: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
  systemBubble: {
    alignSelf: 'center', backgroundColor: COLORS.borderLight,
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14,
    marginBottom: 10, maxWidth: '85%',
  },
  systemText: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center' },
  bubbleWrap: { marginBottom: 6 },
  bubbleWrapRight: { alignItems: 'flex-end' },
  bubbleWrapLeft: { alignItems: 'flex-start' },
  bubble: { maxWidth: '80%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMine: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 15, color: COLORS.text, lineHeight: 21 },
  bubbleTextMine: { color: '#1A1A1A' },
  bubbleTime: { fontSize: 10, color: COLORS.textSecondary, marginTop: 4, textAlign: 'right' },
  bubbleTimeMine: { color: 'rgba(0,0,0,0.45)' },
  payBox: {
    margin: 14, padding: 16,
    backgroundColor: COLORS.surface, borderRadius: 16,
    borderWidth: 1.5, borderColor: COLORS.error,
  },
  payTitle: { fontSize: 16, fontWeight: '800', color: COLORS.error },
  paySub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4, marginBottom: 14 },
  payRow: { flexDirection: 'row', gap: 10 },
  payBtn: {
    flex: 1, backgroundColor: COLORS.yellowLight, borderRadius: 12,
    padding: 12, alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.primary,
  },
  payBtnMins: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  payBtnPrice: { fontSize: 11, color: COLORS.textSecondary, marginTop: 3 },
  balanceText: { fontSize: 12, color: COLORS.textSecondary, marginTop: 10, textAlign: 'center' },
  inputRow: {
    flexDirection: 'row', padding: 12, gap: 10,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    alignItems: 'flex-end', backgroundColor: COLORS.surface,
  },
  input: {
    flex: 1, backgroundColor: COLORS.cream, borderRadius: 24,
    paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1, borderColor: COLORS.border,
    color: COLORS.text, maxHeight: 100, fontSize: 15,
  },
  sendBtn: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: COLORS.borderLight },
  closedBar: {
    flexDirection: 'row', alignItems: 'center', padding: 14, gap: 6,
    backgroundColor: COLORS.borderLight,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    justifyContent: 'center',
  },
  closedText: { flex: 1, color: COLORS.textSecondary, fontWeight: '600', fontSize: 12 },
  newSessionBtn: {
    backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6,
  },
  newSessionText: { color: COLORS.text, fontWeight: '800', fontSize: 12 },
});