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

export default function UserChatScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const balance = useSelector((s) => s.wallet.balance);
  const listRef = useRef(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [paying, setPaying] = useState(false);

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

  // Poll only while session can still change (not ended/rejected)
  useEffect(() => {
    if (session?.status === 'ended' || session?.status === 'rejected') return undefined;
    const interval = setInterval(load, 2500);
    return () => clearInterval(interval);
  }, [load, session?.status]);

  const billing = session?.billing;
  const isCall = session?.type === 'call';
  const isPending = session?.status === 'pending';
  const isEnded = session?.status === 'ended' || session?.status === 'rejected';
  const isPaused = billing?.requiresPayment || session?.status === 'paused';
  const canSend = billing?.canChat && !isPending && !isEnded;

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
        Alert.alert('Failed', err.message || 'Message not sent');
      }
    } finally {
      setSending(false);
    }
  };

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
      Alert.alert('Success', res.message);
    } catch (err) {
      Alert.alert('Payment Failed', err.message || 'Could not pay');
    } finally {
      setPaying(false);
    }
  };

  const handleEnd = () => {
    Alert.alert('End Session', 'Kya aap session end karna chahte ho?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End',
        style: 'destructive',
        onPress: async () => {
          try {
            await sessionApi.end(id);
            router.back();
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
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
        <Header title="Session" />
        <View style={styles.center}>
          <Text style={styles.muted}>Session not found</Text>
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
        ? 'Waiting for astrologer...'
        : isPaused
          ? 'Time ended — pay to continue'
          : session.status;

  return (
    <Screen edges={['left', 'right', 'bottom']} style={styles.screen}>
      <Header
        title={`${astroName} — ${isCall ? 'Call' : 'Chat'}`}
        rightComponent={
          !isEnded ? (
            <TouchableOpacity onPress={handleEnd}>
              <Text style={styles.endText}>End</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <View style={[
        styles.timerBar,
        billing?.phase === 'free' && styles.timerFree,
        isPaused && styles.timerPaused,
        isPending && styles.timerPending,
      ]}>
        <Ionicons
          name={isCall ? 'call' : isPending ? 'hourglass-outline' : isPaused ? 'wallet-outline' : 'time-outline'}
          size={16}
          color={isPaused ? COLORS.error : COLORS.text}
        />
        <Text style={[styles.timerText, isPaused && { color: COLORS.error }]}>{timerLabel}</Text>
        <Text style={styles.rateText}>₹{session.pricePerMin}/min</Text>
      </View>

      {isPending && (
        <View style={styles.waitingBox}>
          <ActivityIndicator color={COLORS.primary} />
          <Text style={styles.waitingTitle}>Request bhej di gayi hai</Text>
          <Text style={styles.waitingSub}>
            {astroName} accept karenge tab {isCall ? 'call' : 'chat'} start hogi
            {!isCall ? ' — pehla 1 minute FREE!' : ''}
          </Text>
        </View>
      )}

      {isCall && session.status === 'active' && (
        <View style={styles.callBox}>
          <View style={styles.callCircle}>
            <Ionicons name="call" size={36} color="#FFF" />
          </View>
          <Text style={styles.callTitle}>Call Connected</Text>
          <Text style={styles.callSub}>{formatTime(billing?.totalSecondsRemaining || 0)} remaining</Text>
        </View>
      )}

      {!isCall && (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          style={styles.list}
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
            const isUser = item.sender === 'user';
            return (
              <View style={[styles.bubble, isUser ? styles.mine : styles.theirs]}>
                <Text style={[styles.bubbleText, isUser && styles.mineText]}>{item.content}</Text>
              </View>
            );
          }}
          ListEmptyComponent={<Text style={styles.muted}>No messages yet</Text>}
        />
      )}

      {isPaused && (
        <View style={styles.payBox}>
          <Text style={styles.payTitle}>
            {isCall ? 'Call time khatam!' : 'Free minute khatam!'}
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
                <Text style={styles.payBtnMins}>{mins} min</Text>
                <Text style={styles.payBtnPrice}>₹{(session.pricePerMin || 20) * mins}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.balanceText}>Wallet: ₹{balance || 0}</Text>
        </View>
      )}

      {!isCall && canSend && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={message}
              onChangeText={setMessage}
              placeholder="Type message..."
              placeholderTextColor={COLORS.textLight}
              multiline
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={sending}>
              {sending ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Ionicons name="send" size={18} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {session.status === 'ended' && (
        <View style={styles.closedBar}>
          <Text style={styles.closedText}>Session ended</Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: COLORS.cream },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  muted: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 20 },
  endText: { color: COLORS.error, fontWeight: '700', fontSize: 14 },
  timerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 14,
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: COLORS.yellowLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  timerFree: { backgroundColor: COLORS.successLight, borderColor: COLORS.success },
  timerPaused: { backgroundColor: COLORS.errorLight, borderColor: COLORS.error },
  timerPending: { backgroundColor: COLORS.borderLight, borderColor: COLORS.border },
  timerText: { flex: 1, fontSize: 13, fontWeight: '700', color: COLORS.text },
  rateText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
  waitingBox: {
    alignItems: 'center',
    padding: 32,
    marginHorizontal: 14,
    marginTop: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  waitingTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginTop: 12 },
  waitingSub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: 6, lineHeight: 18 },
  callBox: { alignItems: 'center', paddingVertical: 40 },
  callCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  callTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  callSub: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  list: { flex: 1 },
  messages: { padding: 14, paddingBottom: 8 },
  systemBubble: {
    alignSelf: 'center',
    backgroundColor: COLORS.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
    maxWidth: '90%',
  },
  systemText: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center' },
  bubble: { maxWidth: '80%', borderRadius: 14, padding: 12, marginBottom: 8 },
  mine: { alignSelf: 'flex-end', backgroundColor: COLORS.primary },
  theirs: { alignSelf: 'flex-start', backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  bubbleText: { fontSize: 15, color: COLORS.text },
  mineText: { color: COLORS.text },
  payBox: {
    margin: 14,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  payTitle: { fontSize: 16, fontWeight: '800', color: COLORS.error },
  paySub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4, marginBottom: 12 },
  payRow: { flexDirection: 'row', gap: 10 },
  payBtn: {
    flex: 1,
    backgroundColor: COLORS.yellowLight,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  payBtnMins: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  payBtnPrice: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  balanceText: { fontSize: 12, color: COLORS.textSecondary, marginTop: 10, textAlign: 'center' },
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'flex-end',
    backgroundColor: COLORS.surface,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.cream,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closedBar: { padding: 16, alignItems: 'center', backgroundColor: COLORS.borderLight },
  closedText: { color: COLORS.textSecondary, fontWeight: '600' },
});