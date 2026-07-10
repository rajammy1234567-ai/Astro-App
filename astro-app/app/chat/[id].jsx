import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { astroApi } from '../../services/astroApi';
import { colors, COLORS } from '../../constants/theme';

function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
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
    if (chat?.status === 'ended' || chat?.status === 'rejected') return undefined;
    const interval = setInterval(load, 2500);
    return () => clearInterval(interval);
  }, [load, chat?.status]);

  const billing = chat?.billing;
  const isPending = chat?.status === 'pending';
  const isCall = chat?.type === 'call';
  const canReply = chat?.status === 'active' || chat?.status === 'paused';

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
      Alert.alert('Failed', err.message || 'Could not send message');
    } finally {
      setSending(false);
    }
  };

  const endChat = () => {
    Alert.alert('End Session', 'End this consultation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End', style: 'destructive',
        onPress: async () => {
          try {
            await astroApi.closeChat(id);
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
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!chat) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.textMuted }}>Session not found</Text>
      </View>
    );
  }

  const messages = chat.messages || [];
  const timerText = isPending
    ? 'Waiting for you to accept'
    : billing?.phase === 'free'
      ? `User FREE time: ${formatTime(billing.freeSecondsRemaining)}`
      : billing?.phase === 'paid'
        ? `Time left: ${formatTime(billing.totalSecondsRemaining)}`
        : billing?.phase === 'paused'
          ? 'User needs to pay to continue'
          : chat.status;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{chat.user?.name || 'User'}</Text>
          <Text style={styles.subtitle}>
            {isCall ? '📞 Call' : '💬 Chat'} · {chat.status}
          </Text>
        </View>
        {!isPending && (
          <TouchableOpacity onPress={endChat}>
            <Text style={styles.endBtn}>End</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.timerBar}>
        <Text style={styles.timerText}>{timerText}</Text>
      </View>

      {isPending && (
        <View style={styles.pendingBox}>
          <Text style={styles.pendingTitle}>New {isCall ? 'Call' : 'Chat'} Request!</Text>
          <Text style={styles.pendingSub}>
            {chat.user?.name} wants to {isCall ? 'call' : 'chat'} with you
          </Text>
          <TouchableOpacity style={styles.acceptBtn} onPress={accept} disabled={accepting}>
            {accepting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.acceptText}>Accept & Start</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {isCall && chat.status === 'active' && (
        <View style={styles.callBox}>
          <Text style={styles.callIcon}>📞</Text>
          <Text style={styles.callTitle}>Call in progress</Text>
          <Text style={styles.callSub}>{formatTime(billing?.totalSecondsRemaining || 0)} left</Text>
        </View>
      )}

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
            return (
              <View style={[styles.bubble, item.sender === 'astrologer' ? styles.mine : styles.theirs]}>
                <Text style={[styles.bubbleText, item.sender === 'astrologer' && styles.mineText]}>
                  {item.content}
                </Text>
              </View>
            );
          }}
          ListEmptyComponent={<Text style={styles.noMsg}>No messages yet</Text>}
        />
      )}

      {canReply && !isCall && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={message}
              onChangeText={setMessage}
              placeholder="Type a message..."
              placeholderTextColor={colors.textMuted}
              multiline
            />
            <TouchableOpacity style={styles.sendBtn} onPress={send} disabled={sending}>
              {sending ? <ActivityIndicator color={COLORS.text} size="small" /> : <Text style={styles.sendText}>Send</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {chat.status === 'ended' && (
        <View style={styles.closedBar}>
          <Text style={styles.closedText}>Session ended</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { color: colors.primary, fontSize: 16 },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 12, color: colors.textMuted },
  endBtn: { color: colors.danger, fontWeight: '700', fontSize: 14 },
  timerBar: { backgroundColor: colors.primaryLight, padding: 10, alignItems: 'center' },
  timerText: { fontSize: 12, fontWeight: '700', color: colors.text },
  pendingBox: { margin: 16, padding: 20, backgroundColor: colors.card, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.primary },
  pendingTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  pendingSub: { fontSize: 13, color: colors.textMuted, marginTop: 6, textAlign: 'center' },
  acceptBtn: { backgroundColor: colors.success, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10, marginTop: 16, minWidth: 160, alignItems: 'center' },
  acceptText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  callBox: { alignItems: 'center', padding: 40 },
  callIcon: { fontSize: 48 },
  callTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 8 },
  callSub: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  messages: { padding: 16, paddingBottom: 8, flexGrow: 1 },
  noMsg: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
  systemBubble: { alignSelf: 'center', backgroundColor: colors.border, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginBottom: 8 },
  systemText: { fontSize: 11, color: colors.textMuted, textAlign: 'center' },
  bubble: { maxWidth: '80%', borderRadius: 14, padding: 12, marginBottom: 8 },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.primary },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  bubbleText: { fontSize: 15, color: colors.text },
  mineText: { color: COLORS.text },
  inputRow: { flexDirection: 'row', padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: colors.border, alignItems: 'flex-end' },
  input: {
    flex: 1, backgroundColor: colors.card, borderRadius: 24, paddingHorizontal: 16,
    paddingVertical: 10, borderWidth: 1, borderColor: colors.border, color: colors.text, maxHeight: 100,
  },
  sendBtn: { backgroundColor: colors.primary, borderRadius: 24, paddingHorizontal: 20, paddingVertical: 12, justifyContent: 'center', minWidth: 70, alignItems: 'center' },
  sendText: { color: COLORS.text, fontWeight: '700' },
  closedBar: { padding: 16, backgroundColor: colors.card, alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border },
  closedText: { color: colors.textMuted, fontWeight: '600' },
});