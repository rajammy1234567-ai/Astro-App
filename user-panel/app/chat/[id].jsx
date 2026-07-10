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
  Image,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Screen from '../../components/common/Screen';
import Header from '../../components/common/Header';
import { sessionApi } from '../../services/sessionApi';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWallet } from '../../redux/walletSlice';
import { COLORS } from '../../constants/colors';
import { resolveMediaUrl } from '../../utils/mediaUrl';

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
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await sessionApi.get(id);
      // Call sessions open full call screen
      if (data?.type === 'call' && data.status !== 'ended' && data.status !== 'rejected') {
        router.replace({
          pathname: `/call/${id}`,
          params: {
            type: 'voice',
            astroName: data.astrologer?.name || 'Astrologer',
          },
        });
        return;
      }
      setSession(data);
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    load();
    dispatch(fetchWallet());
  }, [load, dispatch]);

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

  const pickAndSendMedia = async (kind) => {
    if (!canSend) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission', 'Gallery access chahiye photo/video bhejne ke liye.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: kind === 'video'
        ? ImagePicker.MediaTypeOptions.Videos
        : ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: true,
      videoMaxDuration: 30,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const mime = asset.mimeType
      || (kind === 'video' ? 'video/mp4' : 'image/jpeg');
    if (!asset.base64) {
      Alert.alert('Error', 'File read nahi ho paya. Chhoti photo/video try karo.');
      return;
    }

    setUploading(true);
    try {
      const dataUrl = `data:${mime};base64,${asset.base64}`;
      const up = await sessionApi.uploadMedia(dataUrl);
      const mediaType = up.mediaType || kind;
      const updated = await sessionApi.sendMessage(id, '', {
        mediaType,
        mediaUrl: up.url,
      });
      setSession(updated);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err) {
      Alert.alert('Upload failed', err.message || 'Media nahi bhej paye');
    } finally {
      setUploading(false);
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
            router.replace('/sessions');
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
          <TouchableOpacity style={styles.historyBtn} onPress={() => router.push('/sessions')}>
            <Text style={styles.historyBtnText}>My Chats dekho</Text>
          </TouchableOpacity>
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
            {astroName} accept karenge tab chat start hogi — pehla 1 minute FREE!
          </Text>
          <Text style={styles.waitingHint}>
            Back jao to bhi chat khatam nahi hoti. Profile → Chat & Call History se wapas aa sakte ho.
          </Text>
        </View>
      )}

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
          const mediaUrl = item.mediaUrl ? resolveMediaUrl(item.mediaUrl) : '';
          const isImage = item.mediaType === 'image' && mediaUrl;
          const isVideo = item.mediaType === 'video' && mediaUrl;
          return (
            <View style={[styles.bubble, isUser ? styles.mine : styles.theirs]}>
              {isImage ? (
                <Image source={{ uri: mediaUrl }} style={styles.mediaImage} resizeMode="cover" />
              ) : null}
              {isVideo ? (
                <TouchableOpacity
                  style={styles.videoChip}
                  onPress={() => Linking.openURL(mediaUrl).catch(() => {})}
                >
                  <Ionicons name="play-circle" size={28} color={isUser ? COLORS.text : COLORS.primary} />
                  <Text style={[styles.bubbleText, isUser && styles.mineText]}>Video open karo</Text>
                </TouchableOpacity>
              ) : null}
              {!!item.content && !(isImage && item.content === '📷 Photo') && !(isVideo && item.content === '🎥 Video') ? (
                <Text style={[styles.bubbleText, isUser && styles.mineText]}>{item.content}</Text>
              ) : null}
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.muted}>No messages yet</Text>}
      />

      {isPaused && (
        <View style={styles.payBox}>
          <Text style={styles.payTitle}>Free minute khatam!</Text>
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

      {canSend && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.inputRow}>
            <TouchableOpacity
              style={styles.attachBtn}
              onPress={() => pickAndSendMedia('image')}
              disabled={uploading || sending}
            >
              <Ionicons name="image-outline" size={22} color={COLORS.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.attachBtn}
              onPress={() => pickAndSendMedia('video')}
              disabled={uploading || sending}
            >
              <Ionicons name="videocam-outline" size={22} color={COLORS.text} />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              value={message}
              onChangeText={setMessage}
              placeholder="Type message..."
              placeholderTextColor={COLORS.textLight}
              multiline
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={sending || uploading}>
              {sending || uploading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Ionicons name="send" size={18} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {isEnded && (
        <View style={styles.closedBar}>
          <Text style={styles.closedText}>Session ended</Text>
          <TouchableOpacity onPress={() => router.push('/sessions')}>
            <Text style={styles.historyLink}>History dekho</Text>
          </TouchableOpacity>
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
    padding: 24,
    marginHorizontal: 14,
    marginTop: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  waitingTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginTop: 12 },
  waitingSub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: 6, lineHeight: 18 },
  waitingHint: {
    fontSize: 12, color: COLORS.primaryDark || COLORS.textSecondary,
    textAlign: 'center', marginTop: 10, lineHeight: 17, fontWeight: '600',
  },
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
  bubble: { maxWidth: '80%', borderRadius: 14, padding: 10, marginBottom: 8 },
  mine: { alignSelf: 'flex-end', backgroundColor: COLORS.primary },
  theirs: { alignSelf: 'flex-start', backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  bubbleText: { fontSize: 15, color: COLORS.text },
  mineText: { color: COLORS.text },
  mediaImage: { width: 200, height: 200, borderRadius: 10, marginBottom: 6, backgroundColor: '#ddd' },
  videoChip: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
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
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'flex-end',
    backgroundColor: COLORS.surface,
  },
  attachBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.cream, borderWidth: 1, borderColor: COLORS.border,
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
  closedBar: { padding: 16, alignItems: 'center', backgroundColor: COLORS.borderLight, gap: 8 },
  closedText: { color: COLORS.textSecondary, fontWeight: '600' },
  historyLink: { color: COLORS.primaryDark || COLORS.text, fontWeight: '800' },
  historyBtn: {
    marginTop: 16, backgroundColor: COLORS.primary, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12,
  },
  historyBtnText: { fontWeight: '800', color: COLORS.text },
});
