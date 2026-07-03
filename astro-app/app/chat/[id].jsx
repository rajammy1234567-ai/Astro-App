import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { astroApi } from '../../services/astroApi';
import { colors } from '../../constants/theme';

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const listRef = useRef(null);
  const [chat, setChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

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
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
  }, [load]);

  const send = async () => {
    if (!message.trim()) return;
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
    Alert.alert('End Chat', 'End this consultation session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Chat', style: 'destructive',
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
        <Text style={{ color: colors.textMuted }}>Chat not found</Text>
      </View>
    );
  }

  const messages = chat.messages || [];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{chat.user?.name || 'Chat'}</Text>
          <Text style={styles.subtitle}>{chat.user?.phone}</Text>
        </View>
        {chat.isActive && (
          <TouchableOpacity onPress={endChat}>
            <Text style={styles.endBtn}>End</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.sender === 'astrologer' ? styles.mine : styles.theirs]}>
            <Text style={[styles.bubbleText, item.sender === 'astrologer' && styles.mineText]}>
              {item.content}
            </Text>
            {!!item.timestamp && (
              <Text style={[styles.time, item.sender === 'astrologer' && styles.mineTime]}>
                {new Date(item.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.noMsg}>No messages yet. Say Namaste!</Text>}
      />

      {chat.isActive ? (
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
              {sending ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.sendText}>Send</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      ) : (
        <View style={styles.closedBar}>
          <Text style={styles.closedText}>This chat session has ended</Text>
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
  messages: { padding: 16, paddingBottom: 8 },
  noMsg: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
  bubble: { maxWidth: '80%', borderRadius: 14, padding: 12, marginBottom: 8 },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.primary },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  bubbleText: { fontSize: 15, color: colors.text },
  mineText: { color: '#fff' },
  time: { fontSize: 10, color: colors.textMuted, marginTop: 4, alignSelf: 'flex-end' },
  mineTime: { color: 'rgba(255,255,255,0.7)' },
  inputRow: { flexDirection: 'row', padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: colors.border, alignItems: 'flex-end' },
  input: {
    flex: 1, backgroundColor: colors.card, borderRadius: 24, paddingHorizontal: 16,
    paddingVertical: 10, borderWidth: 1, borderColor: colors.border, color: colors.text, maxHeight: 100,
  },
  sendBtn: { backgroundColor: colors.primary, borderRadius: 24, paddingHorizontal: 20, paddingVertical: 12, justifyContent: 'center', minWidth: 70, alignItems: 'center' },
  sendText: { color: '#fff', fontWeight: '700' },
  closedBar: { padding: 16, backgroundColor: colors.card, alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border },
  closedText: { color: colors.textMuted, fontWeight: '600' },
});