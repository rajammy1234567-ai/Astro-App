import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import liveApi from '../../services/liveApi';
import { getSocket, joinLiveRoom, leaveLiveRoom } from '../../utils/socket';
import { safeGoBack } from '../../utils/navigation';
import { colors, COLORS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

export default function GoLiveScreen() {
  const router = useRouter();
  const { astrologer } = useAuth();
  const [session, setSession] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [title, setTitle] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [camPerm, requestCamPerm] = useCameraPermissions();
  const [micPerm, requestMicPerm] = useMicrophonePermissions();
  const listRef = useRef(null);
  const MAX_RECENT = 40;

  const trimRecent = (list) => {
    const arr = Array.isArray(list) ? list : [];
    return arr.length > MAX_RECENT ? arr.slice(-MAX_RECENT) : arr;
  };

  const loadSession = useCallback(async () => {
    try {
      const live = await liveApi.getMyLive();
      if (live) {
        setSession(live);
        setIsMuted(!!live.isMuted);
        setIsCameraOff(!!live.isCameraOff);
        setViewerCount(live.viewerCount || 0);
        // Sirf current live ke recent comments
        const list = await liveApi.getComments(live._id);
        setComments(trimRecent(list));
      } else {
        setSession(null);
        setComments([]);
      }
    } catch {
      setSession(null);
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSession(); }, [loadSession]);

  useEffect(() => {
    if (!session?._id) return undefined;
    joinLiveRoom(session._id);
    const socket = getSocket();
    const sessionId = String(session._id);

    const onComment = (c) => {
      const sid = String(c?.liveSession || c?.liveSessionId || '');
      if (sid && sid !== sessionId) return;
      setComments((prev) => {
        const nextId = c?._id ? String(c._id) : null;
        if (nextId && prev.some((x) => String(x._id) === nextId)) return prev;
        return trimRecent([...prev, c]);
      });
    };
    const onViewers = (d) => setViewerCount(d.viewerCount ?? 0);
    const onControls = (d) => {
      if (typeof d.isMuted === 'boolean') setIsMuted(d.isMuted);
      if (typeof d.isCameraOff === 'boolean') setIsCameraOff(d.isCameraOff);
    };
    const onEnded = () => {
      setComments([]);
      setSession(null);
      Alert.alert('Live Ended', 'Session has ended.');
      safeGoBack(router, '/(tabs)/dashboard');
    };

    socket.on('live-comment', onComment);
    socket.on('live-viewers', onViewers);
    socket.on('live-controls', onControls);
    socket.on('live-ended', onEnded);

    return () => {
      leaveLiveRoom(session._id);
      socket.off('live-comment', onComment);
      socket.off('live-viewers', onViewers);
      socket.off('live-controls', onControls);
      socket.off('live-ended', onEnded);
    };
  }, [session?._id, router]);

  const ensurePermissions = async () => {
    if (!camPerm?.granted) {
      const r = await requestCamPerm();
      if (!r.granted) {
        Alert.alert('Camera', 'Live ke liye camera permission chahiye');
        return false;
      }
    }
    if (!micPerm?.granted) {
      const r = await requestMicPerm();
      if (!r.granted) {
        Alert.alert('Microphone', 'Live ke liye mic permission chahiye');
        return false;
      }
    }
    return true;
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      const live = await liveApi.startLive(title.trim() || `${astrologer?.name} is Live`);
      // Naya live → comments hamesha empty se start
      setSession(live);
      setComments([]);
      setViewerCount(0);
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not start live');
    } finally {
      setStarting(false);
    }
  };

  const handleEnd = () => {
    Alert.alert('End Live', 'Kya aap live end karna chahte hain?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Live',
        style: 'destructive',
        onPress: async () => {
          setEnding(true);
          try {
            await liveApi.endLive(session._id);
            setComments([]);
            setSession(null);
            safeGoBack(router, '/(tabs)/dashboard');
          } catch (e) {
            Alert.alert('Error', e.message);
          } finally {
            setEnding(false);
          }
        },
      },
    ]);
  };

  const toggleMute = async () => {
    const next = !isMuted;
    setIsMuted(next);
    try {
      await liveApi.updateControls(session._id, { isMuted: next });
    } catch {
      setIsMuted(!next);
    }
  };

  const toggleCamera = async () => {
    const next = !isCameraOff;
    setIsCameraOff(next);
    try {
      await liveApi.updateControls(session._id, { isCameraOff: next });
    } catch {
      setIsCameraOff(!next);
    }
  };

  const sendReply = async () => {
    const text = replyText.trim();
    if (!text || !session) return;
    setReplyText('');
    try {
      await liveApi.replyComment(session._id, text, replyTo?._id);
      setReplyTo(null);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.preHeader}>
          <TouchableOpacity onPress={() => safeGoBack(router, '/(tabs)/dashboard')}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.preTitle}>Go Live</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.preBody}>
          <Text style={styles.preEmoji}>🔴</Text>
          <Text style={styles.preHead}>Start Live Session</Text>
          <Text style={styles.preSub}>Users aapko live dekh sakte hain aur comments kar sakte hain</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="Live title (optional)"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
          />
          <TouchableOpacity style={styles.startBtn} onPress={handleStart} disabled={starting}>
            {starting ? (
              <ActivityIndicator color={COLORS.text} />
            ) : (
              <Text style={styles.startBtnText}>GO LIVE</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.liveRoot}>
      {/* FULL SCREEN camera */}
      <View style={styles.videoFull}>
        {!isCameraOff && camPerm?.granted ? (
          <CameraView style={styles.camera} facing="front" mute={isMuted} />
        ) : !isCameraOff && !camPerm?.granted ? (
          <TouchableOpacity style={styles.cameraOff} onPress={ensurePermissions}>
            <Text style={styles.cameraOffText}>📷 Camera permission tap karo</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.cameraOff}>
            <View style={styles.avatarBig}>
              <Text style={styles.avatarLetter}>{astrologer?.name?.charAt(0) || 'A'}</Text>
            </View>
            <Text style={styles.cameraOffText}>Camera Off</Text>
          </View>
        )}
      </View>

      <SafeAreaView style={styles.overlaySafe} edges={['top', 'left', 'right', 'bottom']} pointerEvents="box-none">
        <View style={styles.liveTopBar}>
          <TouchableOpacity onPress={() => safeGoBack(router, '/(tabs)/dashboard')} style={styles.topBtn}>
            <Ionicons name="chevron-down" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>LIVE</Text>
            <Text style={styles.viewerText}>👁 {viewerCount}</Text>
          </View>
          <TouchableOpacity onPress={handleEnd} disabled={ending} style={styles.endTopBtn}>
            <Text style={styles.endTopText}>{ending ? '...' : 'End'}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1 }} pointerEvents="box-none" />

        {/* Comments overlay bottom */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.commentOverlay}
        >
          <FlatList
            ref={listRef}
            data={comments}
            keyExtractor={(item, i) => item._id || String(i)}
            style={styles.commentList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.commentRow, item.authorType === 'astrologer' && styles.astroComment]}
                onPress={() => item.authorType === 'user' && setReplyTo(item)}
              >
                <Text style={styles.commentName}>
                  {item.authorName}
                  {item.authorType === 'astrologer' ? ' (You)' : ''}
                </Text>
                <Text style={styles.commentText}>{item.text}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.noComments}>Recent comments yahan…</Text>}
          />

          {replyTo && (
            <View style={styles.replyBar}>
              <Text style={styles.replyingTo} numberOfLines={1}>Replying to {replyTo.authorName}</Text>
              <TouchableOpacity onPress={() => setReplyTo(null)}>
                <Ionicons name="close" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.controls}>
            <TouchableOpacity style={styles.ctrlBtn} onPress={toggleMute}>
              <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.ctrlBtn} onPress={toggleCamera}>
              <Ionicons name={isCameraOff ? 'videocam-off' : 'videocam'} size={20} color="#fff" />
            </TouchableOpacity>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.replyInput}
                placeholder="Reply to viewers..."
                placeholderTextColor="rgba(255,255,255,0.45)"
                value={replyText}
                onChangeText={setReplyText}
              />
              <TouchableOpacity style={styles.sendBtn} onPress={sendReply}>
                <Ionicons name="send" size={16} color="#1A1A1A" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.ctrlBtn, styles.endCtrl]} onPress={handleEnd}>
              <Ionicons name="stop" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  preHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  preTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  preBody: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  preEmoji: { fontSize: 48, marginBottom: 12 },
  preHead: { fontSize: 22, fontWeight: '800', color: colors.text },
  preSub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  titleInput: {
    width: '100%', marginTop: 24, backgroundColor: colors.card, borderWidth: 1,
    borderColor: colors.border, borderRadius: 10, padding: 14, color: colors.text,
  },
  startBtn: {
    marginTop: 16, width: '100%', backgroundColor: COLORS.yellow, borderRadius: 12,
    padding: 16, alignItems: 'center',
  },
  startBtnText: { color: COLORS.text, fontWeight: '800', fontSize: 16 },
  liveRoot: { flex: 1, backgroundColor: '#000' },
  videoFull: { ...StyleSheet.absoluteFillObject, backgroundColor: '#111' },
  camera: { flex: 1 },
  cameraOff: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#12081F' },
  avatarBig: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { fontSize: 42, fontWeight: '800', color: '#1A1A1A' },
  cameraOffText: { color: '#aaa', marginTop: 12, fontSize: 14 },
  overlaySafe: { flex: 1 },
  liveTopBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingTop: 4,
  },
  topBtn: { padding: 8, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 20 },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(220,38,38,0.92)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  liveBadgeText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  viewerText: { color: '#fff', fontSize: 11, marginLeft: 4 },
  endTopBtn: { backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 },
  endTopText: { color: '#fff', fontWeight: '700' },
  commentOverlay: { paddingHorizontal: 12, paddingBottom: 8, maxHeight: '42%' },
  commentList: { maxHeight: 160, marginBottom: 8 },
  commentRow: {
    alignSelf: 'flex-start', maxWidth: '90%',
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 12, padding: 10, marginBottom: 5,
  },
  astroComment: { backgroundColor: 'rgba(253,185,19,0.88)' },
  commentName: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.9)' },
  commentText: { fontSize: 13, color: '#fff', marginTop: 2 },
  noComments: { textAlign: 'center', color: 'rgba(255,255,255,0.45)', padding: 10, fontSize: 12 },
  replyBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(253,185,19,0.25)', padding: 8, borderRadius: 8, marginBottom: 6,
  },
  replyingTo: { flex: 1, fontSize: 12, color: '#fff', fontWeight: '600' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ctrlBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  endCtrl: { backgroundColor: 'rgba(220,38,38,0.9)' },
  inputRow: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center' },
  replyInput: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)', borderRadius: 22,
    paddingHorizontal: 12, paddingVertical: 10, color: '#fff', fontSize: 13,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
});