/**
 * User Call Screen — WhatsApp-style voice call UI
 * Route: /call/[id]?type=voice|video&astroName=...
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Alert, Animated, Vibration, Image, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { sessionApi } from '../../services/sessionApi';
import agoraService, { isAgoraNativeAvailable } from '../../services/agoraService';
import { getSocket } from '../../utils/socket';
import { useAuth } from '../../hooks/useAuth';

// WhatsApp-like palette
const WA = {
  bg: '#0B141A',
  green: '#25D366',
  greenDark: '#128C7E',
  red: '#E53935',
  text: '#E9EDEF',
  muted: 'rgba(233,237,239,0.6)',
  chip: 'rgba(255,255,255,0.08)',
};

function formatDuration(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function UserCallScreen() {
  const { id, type, astroName } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const isVideo = type === 'video';
  const displayName = astroName || 'Astrologer';

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [callState, setCallState] = useState('waiting');
  const [statusHint, setStatusHint] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(isVideo);
  const [remoteJoined, setRemoteJoined] = useState(false);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef(null);
  const joinedRef = useRef(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (callState !== 'waiting' && callState !== 'connecting') return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim, callState]);

  const loadSession = useCallback(async () => {
    try {
      const data = await sessionApi.get(id);
      setSession(data);
    } catch {
      Alert.alert('Error', 'Could not load this session');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { loadSession(); }, [loadSession]);

  useEffect(() => {
    if (!session || !user?._id) return undefined;
    if (['ended', 'rejected', 'active', 'paused'].includes(session.status)) return undefined;

    const socket = getSocket();
    socket.emit('join-user', user._id);
    socket.emit('initiate-request', {
      astroId: session.astrologer?._id || session.astrologer,
      userId: user._id,
      sessionId: id,
      type: 'call',
      userName: user.name || 'User',
      userImage: user.avatar || user.image || '',
    });

    const handleAccepted = (data) => {
      if (String(data.sessionId) === String(id)) loadSession();
    };
    const handleDeclined = (data) => {
      if (String(data.sessionId) === String(id)) {
        setCallState('ended');
        Alert.alert('Call declined', 'Astrologer ne call decline kar di.');
        setTimeout(() => router.back(), 1800);
      }
    };

    socket.on('request-accepted', handleAccepted);
    socket.on('request-declined', handleDeclined);
    return () => {
      socket.off('request-accepted', handleAccepted);
      socket.off('request-declined', handleDeclined);
    };
  }, [session?.status, session?.astrologer, user?._id, user?.name, user?.avatar, user?.image, id, router, loadSession]);

  useEffect(() => {
    if (!session) return undefined;
    if (session.status === 'ended' || session.status === 'rejected') {
      setCallState('ended');
      return undefined;
    }
    if (session.status === 'active' || session.status === 'paused') return undefined;
    setCallState('waiting');
    const interval = setInterval(loadSession, 2500);
    return () => clearInterval(interval);
  }, [session?.status, loadSession, session]);

  useEffect(() => () => {
    agoraService.leaveChannel();
    clearInterval(timerRef.current);
    timerRef.current = null;
    joinedRef.current = false;
  }, []);

  useEffect(() => {
    if (!session) return;

    if (session.status === 'pending') {
      setCallState('waiting');
      setStatusHint('Ringing…');
      return;
    }

    const canJoinRtc =
      session.callPaidUpfront
      && ['accepted', 'active', 'paused'].includes(session.status);
    if (!canJoinRtc) return;
    if (joinedRef.current) {
      if (session.status === 'active' || session.status === 'paused') {
        if (remoteJoined) {
          setCallState('active');
          setStatusHint('');
        } else if (callState === 'waiting' || callState === 'connecting') {
          setCallState('connecting');
          setStatusHint('Connecting…');
        }
      }
      return;
    }

    let cancelled = false;
    joinedRef.current = true;
    setCallState('connecting');
    setStatusHint('Connecting…');

    const startTimer = () => {
      if (!timerRef.current) {
        timerRef.current = setInterval(() => setDuration((p) => p + 1), 1000);
      }
    };

    const goLive = () => {
      if (cancelled) return;
      setCallState('active');
      setStatusHint('');
      Vibration.vibrate(80);
      startTimer();
    };

    (async () => {
      try {
        if (!isAgoraNativeAvailable()) {
          // Soft live mode without native RTC (APK without Agora)
          goLive();
          setStatusHint('Call connected (audio module optional on this build)');
          return;
        }

        const creds = await sessionApi.getCallToken(id);
        if (cancelled) return;
        if (!creds?.token || !creds?.appId || !creds?.channelName) {
          throw new Error(creds?.message || 'Call token incomplete');
        }

        await agoraService.joinChannel({
          appId: creds.appId,
          token: creds.token,
          channelName: creds.channelName,
          uid: creds.uid || 1,
          video: isVideo,
          onJoinSuccess: () => setStatusHint('Connected…'),
          onUserJoined: () => {
            setRemoteJoined(true);
            goLive();
          },
          onUserOffline: () => {
            setRemoteJoined(false);
            setStatusHint('Astrologer left');
          },
          onError: (err) => {
            if (!cancelled) setStatusHint(err?.message || 'Audio error');
          },
        });
        if (!cancelled) goLive();
      } catch (err) {
        if (cancelled) return;
        joinedRef.current = false;
        setCallState('error');
        setStatusHint(err?.message || 'Call failed');
      }
    })();

    return () => { cancelled = true; };
  }, [session?.status, session?.callPaidUpfront, id, isVideo]);

  const handleMute = async () => {
    const next = !isMuted;
    setIsMuted(next);
    await agoraService.setMuted(next);
  };

  const handleSpeaker = async () => {
    const next = !isSpeaker;
    setIsSpeaker(next);
    await agoraService.setSpeakerphone(next);
  };

  const handleCamera = async () => {
    const next = !isCameraOn;
    setIsCameraOn(next);
    await agoraService.setCameraEnabled(next);
  };

  const handleEndCall = () => {
    Alert.alert('End call?', 'Is call ko end karein?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End',
        style: 'destructive',
        onPress: async () => {
          await agoraService.leaveChannel();
          clearInterval(timerRef.current);
          try { await sessionApi.end(id); } catch { /* ok */ }
          router.replace({ pathname: '/sessions', params: { type: 'call' } });
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.boot}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={WA.green} />
      </View>
    );
  }

  const astro = session?.astrologer;
  const nameDisplay = astro?.name || displayName;
  const photo = astro?.image;

  let statusLine = 'Calling…';
  if (callState === 'waiting') statusLine = 'Ringing…';
  else if (callState === 'connecting') statusLine = statusHint || 'Connecting…';
  else if (callState === 'active') statusLine = formatDuration(duration);
  else if (callState === 'error') statusLine = statusHint || 'Failed';
  else if (callState === 'ended') {
    statusLine = session?.status === 'rejected' ? 'Declined' : 'Call ended';
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={WA.bg} />
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.replace({ pathname: '/sessions', params: { type: 'call' } })}
        >
          <Ionicons name="chevron-down" size={28} color={WA.text} />
        </TouchableOpacity>
        <Text style={styles.encrypted}>
          <Ionicons name="lock-closed" size={12} color={WA.muted} /> End-to-end consultation
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.center}>
        <Animated.View
          style={[
            styles.avatarRing,
            (callState === 'waiting' || callState === 'connecting') && {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          {photo ? (
            <Image source={{ uri: photo }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarLetter}>{nameDisplay.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          {callState === 'active' && remoteJoined ? <View style={styles.liveDot} /> : null}
        </Animated.View>

        <Text style={styles.name}>{nameDisplay}</Text>
        <Text style={styles.status}>{statusLine}</Text>
        {callState === 'active' && !!session?.pricePerMin && (
          <Text style={styles.rate}>₹{session.pricePerMin}/min</Text>
        )}
        {callState === 'active' && !remoteJoined && (
          <Text style={styles.hint}>Waiting for astrologer audio…</Text>
        )}
        {callState === 'waiting' && (
          <Text style={styles.hint}>Astrologer accept kare — jab Call Online ON ho</Text>
        )}
      </View>

      <View style={styles.bottom}>
        <View style={styles.row}>
          <Ctrl
            icon={isMuted ? 'mic-off' : 'mic'}
            label={isMuted ? 'Unmute' : 'Mute'}
            active={isMuted}
            danger={isMuted}
            onPress={handleMute}
          />
          <Ctrl
            icon={isSpeaker ? 'volume-high' : 'volume-medium'}
            label="Speaker"
            active={isSpeaker}
            onPress={handleSpeaker}
          />
          {isVideo ? (
            <Ctrl
              icon={isCameraOn ? 'videocam' : 'videocam-off'}
              label="Camera"
              active={!isCameraOn}
              danger={!isCameraOn}
              onPress={handleCamera}
            />
          ) : (
            <Ctrl icon="ellipsis-horizontal" label="More" onPress={() => {}} />
          )}
        </View>

        {(callState === 'waiting' || callState === 'connecting' || callState === 'active' || callState === 'error') && (
          <TouchableOpacity style={styles.endBtn} onPress={handleEndCall} activeOpacity={0.9}>
            <Ionicons name="call" size={32} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
          </TouchableOpacity>
        )}
        {callState === 'ended' && (
          <TouchableOpacity
            style={styles.backHome}
            onPress={() => router.replace({ pathname: '/(tabs)/call' })}
          >
            <Text style={styles.backHomeText}>Back to Call list</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

function Ctrl({ icon, label, onPress, active, danger }) {
  return (
    <TouchableOpacity style={styles.ctrl} onPress={onPress} activeOpacity={0.85}>
      <View
        style={[
          styles.ctrlCircle,
          active && styles.ctrlActive,
          danger && styles.ctrlDanger,
        ]}
      >
        <Ionicons name={icon} size={24} color="#fff" />
      </View>
      <Text style={styles.ctrlLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  boot: { flex: 1, backgroundColor: WA.bg, justifyContent: 'center', alignItems: 'center' },
  safe: { flex: 1, backgroundColor: WA.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  encrypted: { color: WA.muted, fontSize: 12, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  avatarRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 22,
    borderWidth: 3,
    borderColor: 'rgba(37,211,102,0.35)',
    overflow: 'hidden',
  },
  avatar: { width: '100%', height: '100%' },
  avatarFallback: {
    flex: 1,
    backgroundColor: WA.greenDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontSize: 56, fontWeight: '800', color: '#fff' },
  liveDot: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: WA.green,
    borderWidth: 3,
    borderColor: WA.bg,
  },
  name: { fontSize: 28, fontWeight: '700', color: WA.text, textAlign: 'center' },
  status: {
    marginTop: 10,
    fontSize: 16,
    color: WA.muted,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  rate: { marginTop: 8, fontSize: 13, color: WA.green, fontWeight: '700' },
  hint: {
    marginTop: 14,
    fontSize: 13,
    color: WA.muted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  bottom: { paddingBottom: 28, paddingHorizontal: 24, alignItems: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-evenly', width: '100%', marginBottom: 28 },
  ctrl: { alignItems: 'center', width: 80 },
  ctrlCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: WA.chip,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  ctrlActive: { backgroundColor: 'rgba(255,255,255,0.22)' },
  ctrlDanger: { backgroundColor: 'rgba(229,57,53,0.85)' },
  ctrlLabel: { color: WA.muted, fontSize: 12, fontWeight: '600' },
  endBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: WA.red,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
  },
  backHome: {
    backgroundColor: WA.green,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
  },
  backHomeText: { color: '#0B141A', fontWeight: '800', fontSize: 15 },
});
