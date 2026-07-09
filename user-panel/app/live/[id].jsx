import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList,
  ActivityIndicator, KeyboardAvoidingView, Platform, Image, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/common/Screen';
import liveApi from '../../services/liveApi';
import { getSocket, joinLiveRoom, leaveLiveRoom } from '../../utils/socket';
import { COLORS } from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';

export default function WatchLiveScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const listRef = useRef(null);
  const MAX_RECENT = 40;

  const trimRecent = (list) => {
    const arr = Array.isArray(list) ? list : [];
    return arr.length > MAX_RECENT ? arr.slice(-MAX_RECENT) : arr;
  };

  const load = useCallback(async () => {
    try {
      const [live, list] = await Promise.all([
        liveApi.getLive(id),
        liveApi.getComments(id),
      ]);
      if (!live || live.status !== 'live') {
        throw new Error('Live session ended or not found');
      }
      setSession(live);
      setViewerCount(live.viewerCount || 0);
      setIsCameraOff(!!live.isCameraOff);
      // Sirf is live ke recent comments
      setComments(trimRecent(list));
      liveApi.joinLive(id).then((joined) => {
        if (joined?.viewerCount != null) setViewerCount(joined.viewerCount);
      }).catch(() => {});
    } catch (e) {
      setComments([]);
      Alert.alert('Live', e.message || 'Live session not available', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!id) return undefined;
    joinLiveRoom(id);
    const socket = getSocket();

    const onComment = (c) => {
      // Same live session ke naye comments hi append
      const sid = String(c?.liveSession || c?.liveSessionId || '');
      if (sid && sid !== String(id)) return;
      setComments((prev) => {
        const nextId = c?._id ? String(c._id) : null;
        if (nextId && prev.some((x) => String(x._id) === nextId)) return prev;
        return trimRecent([...prev, c]);
      });
    };
    const onViewers = (d) => setViewerCount(d.viewerCount ?? 0);
    const onControls = (d) => {
      if (typeof d.isCameraOff === 'boolean') setIsCameraOff(d.isCameraOff);
    };
    const onEnded = () => {
      // Live end → comments clear
      setComments([]);
      setSession(null);
      Alert.alert('Live Ended', 'Astrologer ne live end kar diya.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    };

    socket.on('live-comment', onComment);
    socket.on('live-viewers', onViewers);
    socket.on('live-controls', onControls);
    socket.on('live-ended', onEnded);

    return () => {
      liveApi.leaveLive(id).catch(() => {});
      leaveLiveRoom(id);
      socket.off('live-comment', onComment);
      socket.off('live-viewers', onViewers);
      socket.off('live-controls', onControls);
      socket.off('live-ended', onEnded);
    };
  }, [id, router]);

  const sendComment = async () => {
    const text = commentText.trim();
    if (!text || sending) return;
    if (!user) {
      Alert.alert('Login', 'Comment karne ke liye login karo');
      router.push('/(auth)/login');
      return;
    }
    setSending(true);
    setCommentText('');
    try {
      await liveApi.postComment(id, text);
    } catch (e) {
      setCommentText(text);
      Alert.alert('Error', e.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </Screen>
    );
  }

  const astro = session?.astrologer;

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <View style={styles.videoArea}>
        {isCameraOff ? (
          <View style={styles.placeholder}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{astro?.name?.charAt(0) || 'A'}</Text>
            </View>
            <Text style={styles.camOffLabel}>Camera is off</Text>
          </View>
        ) : (
          <View style={styles.liveStream}>
            {astro?.image ? (
              <Image source={{ uri: astro.image }} style={styles.previewImg} resizeMode="cover" blurRadius={2} />
            ) : null}
            <View style={styles.liveStreamOverlay}>
              <View style={styles.pulseDot} />
              <Text style={styles.watchingLabel}>Watching Live</Text>
            </View>
          </View>
        )}
        <View style={styles.overlayTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
            <Text style={styles.viewers}>👁 {viewerCount}</Text>
          </View>
        </View>
        <View style={styles.astroInfo}>
          <Text style={styles.astroName}>{astro?.name}</Text>
          <Text style={styles.astroSpec}>{astro?.specialty}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.commentsWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={listRef}
          data={comments}
          keyExtractor={(item) => item._id}
          style={styles.commentList}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <View style={[styles.comment, item.authorType === 'astrologer' && styles.astroReply]}>
              <Text style={styles.commentAuthor}>{item.authorName}</Text>
              <Text style={styles.commentBody}>{item.text}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyComments}>Pehle comment karo! 👋</Text>
          }
        />
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Comment likho..."
            placeholderTextColor={COLORS.textLight}
            value={commentText}
            onChangeText={setCommentText}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendComment} disabled={sending}>
            {sending ? (
              <ActivityIndicator color={COLORS.text} size="small" />
            ) : (
              <Ionicons name="send" size={18} color={COLORS.text} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  videoArea: { height: 320, backgroundColor: '#111', position: 'relative' },
  previewImg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', opacity: 0.35 },
  liveStream: { flex: 1, backgroundColor: '#0d0d0d', position: 'relative' },
  liveStreamOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pulseDot: {
    width: 14, height: 14, borderRadius: 7, backgroundColor: '#E53935', marginBottom: 10,
  },
  watchingLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a1a' },
  avatar: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 36, fontWeight: '800', color: COLORS.text },
  camOffLabel: { color: '#aaa', marginTop: 10, fontSize: 13 },
  overlayTop: {
    position: 'absolute', top: 8, left: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn: { padding: 8, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 20 },
  livePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(220,38,38,0.9)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  liveText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  viewers: { color: '#fff', fontSize: 11 },
  astroInfo: {
    position: 'absolute', bottom: 12, left: 12,
    backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
  },
  astroName: { color: '#fff', fontWeight: '800', fontSize: 16 },
  astroSpec: { color: '#ddd', fontSize: 12, marginTop: 2 },
  commentsWrap: { flex: 1, backgroundColor: COLORS.cream, padding: 12 },
  commentList: { flex: 1 },
  comment: {
    backgroundColor: COLORS.surface, borderRadius: 10, padding: 10, marginBottom: 6,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  astroReply: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  commentAuthor: { fontSize: 12, fontWeight: '700', color: COLORS.text },
  commentBody: { fontSize: 13, color: COLORS.text, marginTop: 2 },
  emptyComments: { textAlign: 'center', color: COLORS.textSecondary, padding: 20 },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingTop: 8 },
  input: {
    flex: 1, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 22, paddingHorizontal: 14, paddingVertical: 10, color: COLORS.text,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
});