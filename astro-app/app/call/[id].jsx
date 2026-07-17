/**
 * Astrologer Call Screen — WhatsApp-style voice call UI
 * Route: /call/[id]?type=voice|video
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Alert, Animated, Vibration, Image, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { astroApi } from '../../services/astroApi';
import agoraService, { isAgoraNativeAvailable } from '../../services/agoraService';
import { safeGoBack } from '../../utils/navigation';
import { resolveMediaUrl } from '../../utils/mediaUrl';

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

export default function AstroCallScreen() {
  const { id, type } = useLocalSearchParams();
  const router = useRouter();
  const isVideo = type === 'video';

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [callState, setCallState] = useState('connecting');
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
    if (callState !== 'connecting') return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim, callState]);

  const loadSession = useCallback(async () => {
    try {
      const data = await astroApi.getChat(id);
      setSession(data);
    } catch {
      Alert.alert('Error', 'Session load failed');
      safeGoBack(router, '/(tabs)/calls');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { loadSession(); }, [loadSession]);

  useEffect(() => () => {
    agoraService.leaveChannel();
    clearInterval(timerRef.current);
    timerRef.current = null;
    joinedRef.current = false;
  }, []);

  useEffect(() => {
    if (!session) return;
    if (!['active', 'paused'].includes(session.status)) {
      if (!joinedRef.current) {
        setCallState(session.status === 'pending' ? 'connecting' : 'ended');
        setStatusHint(
          session.status === 'pending'
            ? 'Accept request first'
            : 'Session closed'
        );
      }
      return;
    }
    if (joinedRef.current) return;

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
          goLive();
          setStatusHint('Call live (audio module optional on this build)');
          return;
        }

        const creds = await astroApi.getCallToken(id);
        if (cancelled) return;
        if (!creds?.token || !creds?.appId || !creds?.channelName) {
          throw new Error(creds?.message || 'Call token incomplete');
        }

        await agoraService.joinChannel({
          appId: creds.appId,
          token: creds.token,
          channelName: creds.channelName,
          uid: creds.uid || 2,
          video: isVideo,
          onJoinSuccess: () => setStatusHint('Waiting for user…'),
          onUserJoined: () => {
            setRemoteJoined(true);
            goLive();
          },
          onUserOffline: () => {
            setRemoteJoined(false);
            setStatusHint('User left');
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
        Alert.alert('Call audio', err?.message || 'Could not connect audio');
      }
    })();

    return () => { cancelled = true; };
  }, [session?.status, id, isVideo]);

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

  const handleFlip = async () => {
    await agoraService.switchCamera();
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
          try { await astroApi.closeChat(id); } catch { /* ok */ }
          safeGoBack(router, '/(tabs)/calls');
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

  const userName = session?.user?.name || session?.userBirthDetails?.name || 'User';
  const photo = session?.user?.avatar || session?.user?.image;

  let statusLine = 'Connecting…';
  if (callState === 'connecting') statusLine = statusHint || 'Connecting…';
  else if (callState === 'active') statusLine = formatDuration(duration);
  else if (callState === 'error') statusLine = statusHint || 'Failed';
  else statusLine = 'Call ended';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={WA.bg} />
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => safeGoBack(router, '/(tabs)/calls')}
        >
          <Ionicons name="chevron-down" size={28} color={WA.text} />
        </TouchableOpacity>
        <Text style={styles.encrypted}>
          <Ionicons name="lock-closed" size={12} color={WA.muted} /> Partner call
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.center}>
        <Animated.View
          style={[
            styles.avatarRing,
            callState === 'connecting' && { transform: [{ scale: pulseAnim }] },
          ]}
        >
          {photo ? (
            <Image source={{ uri: resolveMediaUrl(photo) }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarLetter}>{userName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          {callState === 'active' && remoteJoined ? <View style={styles.liveDot} /> : null}
        </Animated.View>

        <Text style={styles.name}>{userName}</Text>
        <Text style={styles.status}>{statusLine}</Text>
        {session?.user?.phone ? (
          <Text style={styles.phone}>{session.user.phone}</Text>
        ) : null}
        {callState === 'active' && !remoteJoined && (
          <Text style={styles.hint}>User join ka wait… awaz open hogi</Text>
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
            <Ctrl icon="person" label="Client" onPress={() => {}} />
          )}
          {isVideo ? (
            <Ctrl icon="camera-reverse" label="Flip" onPress={handleFlip} />
          ) : null}
        </View>

        {(callState === 'connecting' || callState === 'active' || callState === 'error') && (
          <TouchableOpacity style={styles.endBtn} onPress={handleEndCall} activeOpacity={0.9}>
            <Ionicons name="call" size={32} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
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
  phone: { marginTop: 6, fontSize: 13, color: WA.muted },
  hint: {
    marginTop: 14,
    fontSize: 13,
    color: WA.muted,
    textAlign: 'center',
  },
  bottom: { paddingBottom: 28, paddingHorizontal: 24, alignItems: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-evenly', width: '100%', marginBottom: 28 },
  ctrl: { alignItems: 'center', width: 72 },
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
});
