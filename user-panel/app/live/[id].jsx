import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList,
  ActivityIndicator, KeyboardAvoidingView, Platform, Image, Alert, StatusBar, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import liveApi from '../../services/liveApi';
import { getSocket, joinLiveRoom, leaveLiveRoom } from '../../utils/socket';
import { COLORS } from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';

const { height: H } = Dimensions.get('window');
const MAX_RECENT = 40;

export default function WatchLiveScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const listRef = useRef(null);

  const trimRecent = (list) => {
    const arr = Array.isArray(list) ? list : [];
    return arr.length > MAX_RECENT ? arr.slice(-MAX_RECENT) : arr;
  };

  const goBack = () => {
    if (router.canGoBack?.()) router.back();
    else router.replace('/live');
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
      setComments(trimRecent(list));
      liveApi.joinLive(id).then((joined) => {
        if (joined?.viewerCount != null) setViewerCount(joined.viewerCount);
      }).catch(() => {});
    } catch (e) {
      setComments([]);
      Alert.alert('Live', e.message || 'Live session not available', [
        { text: 'OK', onPress: goBack },
      ]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!id) return undefined;
    joinLiveRoom(id);
    const socket = getSocket();

    const onComment = (c) => {
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
      setComments([]);
      setSession(null);
      Alert.alert('Live Ended', 'Astrologer ne live end kar diya.', [
        { text: 'OK', onPress: goBack },
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
  }, [id]);

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
      <View style={styles.boot}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const astro = session?.astrologer;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* FULL SCREEN VIDEO */}
      <View style={styles.videoFull}>
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
              <Image source={{ uri: astro.image }} style={styles.previewImg} resizeMode="cover" blurRadius={1} />
            ) : null}
            <View style={styles.dim} />
            <View style={styles.centerLabel}>
              <View style={styles.pulseDot} />
              <Text style={styles.watchingLabel}>LIVE STREAM</Text>
            </View>
          </View>
        )}
      </View>

      {/* TOP OVERLAY */}
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={goBack} style={styles.circleBtn}>
          <Ionicons name="chevron-down" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.astroChip}>
          <View style={styles.astroMiniAvatar}>
            <Text style={styles.astroMiniLetter}>{astro?.name?.charAt(0) || 'A'}</Text>
          </View>
          <View>
            <Text style={styles.astroName} numberOfLines={1}>{astro?.name || 'Astrologer'}</Text>
            <Text style={styles.astroSpec} numberOfLines={1}>{astro?.specialty || 'Live'}</Text>
          </View>
        </View>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
          <Text style={styles.viewers}>👁 {viewerCount}</Text>
        </View>
      </View>

      {/* BOTTOM: comments overlay on full screen */}
      <KeyboardAvoidingView
        style={[styles.bottomOverlay, { paddingBottom: Math.max(insets.bottom, 10) }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={comments}
          keyExtractor={(item, i) => item._id || String(i)}
          style={styles.commentList}
          contentContainerStyle={styles.commentContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <View style={[styles.comment, item.authorType === 'astrologer' && styles.astroReply]}>
              <Text style={styles.commentAuthor}>
                {item.authorName}
                {item.authorType === 'astrologer' ? ' · Astrologer' : ''}
              </Text>
              <Text style={styles.commentBody}>{item.text}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyComments}>Say hi 👋 — recent comments yahan dikhenge</Text>
          }
        />
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Comment likho..."
            placeholderTextColor="rgba(255,255,255,0.45)"
            value={commentText}
            onChangeText={setCommentText}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendComment} disabled={sending}>
            {sending ? (
              <ActivityIndicator color="#1A1A1A" size="small" />
            ) : (
              <Ionicons name="send" size={18} color="#1A1A1A" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  boot: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  root: { flex: 1, backgroundColor: '#000' },
  videoFull: { ...StyleSheet.absoluteFillObject },
  previewImg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  liveStream: { flex: 1, backgroundColor: '#0a0614' },
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  centerLabel: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  pulseDot: {
    width: 14, height: 14, borderRadius: 7, backgroundColor: '#E53935', marginBottom: 10,
  },
  watchingLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '800', letterSpacing: 1.5 },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#12081F' },
  avatar: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 40, fontWeight: '900', color: '#1A1A1A' },
  camOffLabel: { color: '#aaa', marginTop: 12, fontSize: 13 },

  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, zIndex: 5,
  },
  circleBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center',
  },
  astroChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 22, paddingVertical: 6, paddingHorizontal: 8,
  },
  astroMiniAvatar: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  astroMiniLetter: { fontWeight: '900', color: '#1A1A1A', fontSize: 13 },
  astroName: { color: '#fff', fontWeight: '800', fontSize: 13, maxWidth: 120 },
  astroSpec: { color: 'rgba(255,255,255,0.65)', fontSize: 10 },
  livePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(220,38,38,0.95)', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 18,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
  liveText: { color: '#fff', fontWeight: '900', fontSize: 11 },
  viewers: { color: '#fff', fontSize: 11, fontWeight: '600' },

  bottomOverlay: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    maxHeight: H * 0.42, paddingHorizontal: 12, paddingTop: 8, zIndex: 5,
  },
  commentList: { flexGrow: 0, maxHeight: H * 0.28 },
  commentContent: { paddingBottom: 8 },
  comment: {
    alignSelf: 'flex-start', maxWidth: '88%',
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 8, marginBottom: 6,
  },
  astroReply: {
    backgroundColor: 'rgba(253,185,19,0.88)',
  },
  commentAuthor: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.85)' },
  commentBody: { fontSize: 13, color: '#fff', marginTop: 2, lineHeight: 17 },
  emptyComments: {
    color: 'rgba(255,255,255,0.5)', textAlign: 'center', paddingVertical: 12, fontSize: 12,
  },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)', borderRadius: 24,
    paddingHorizontal: 16, paddingVertical: 11, color: '#fff', fontSize: 14,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
});
