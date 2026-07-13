/**
 * User Voice/Video Call Screen — real Agora RTC audio
 * Route: /call/[id]?type=voice|video&astroName=...
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Alert, Animated, Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { sessionApi } from '../../services/sessionApi';
import agoraService, { isAgoraNativeAvailable } from '../../services/agoraService';
import { COLORS } from '../../constants/colors';
import { getSocket } from '../../utils/socket';
import { useAuth } from '../../hooks/useAuth';

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
  // waiting | connecting | active | ended | error
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
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 900, useNativeDriver: true }),
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

  // Socket signaling: notify astrologer of incoming call + faster accept/decline
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
    });

    const handleAccepted = (data) => {
      if (String(data.sessionId) === String(id)) {
        loadSession();
      }
    };
    const handleDeclined = (data) => {
      if (String(data.sessionId) === String(id)) {
        setCallState('ended');
        Alert.alert('Call Declined', 'Astrologer ne call decline kar diya hai.');
        setTimeout(() => router.back(), 2000);
      }
    };

    socket.on('request-accepted', handleAccepted);
    socket.on('request-declined', handleDeclined);
    return () => {
      socket.off('request-accepted', handleAccepted);
      socket.off('request-declined', handleDeclined);
    };
  }, [session?.status, session?.astrologer, user?._id, user?.name, id, router, loadSession]);

  // Poll until astrologer accepts
  useEffect(() => {
    if (!session) return undefined;
    const status = session.status;
    if (status === 'ended' || status === 'rejected') {
      setCallState('ended');
      return undefined;
    }
    if (status === 'active' || status === 'paused') {
      return undefined;
    }
    setCallState('waiting');
    const interval = setInterval(loadSession, 2500);
    return () => clearInterval(interval);
  }, [session?.status, loadSession, session]);

  // Leave RTC only when leaving this screen
  useEffect(() => () => {
    agoraService.leaveChannel();
    clearInterval(timerRef.current);
    timerRef.current = null;
    joinedRef.current = false;
  }, []);

  // Join Agora ONLY after astrologer accepts (active/paused) — not while pending
  useEffect(() => {
    if (!session) return;

    if (session.status === 'pending') {
      setCallState('waiting');
      setStatusHint('Request bhej diya — jab astrologer Online ho aur Accept kare tab call start hoga');
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
          setStatusHint('Live — dono taraf awaz open');
        } else if (callState === 'waiting' || callState === 'connecting') {
          setCallState('connecting');
          setStatusHint('Astrologer accepted — connecting audio…');
        }
      }
      return;
    }

    let cancelled = false;
    joinedRef.current = true;
    setCallState('connecting');
    setStatusHint('Accepted! Getting secure call token…');

    const startTimer = () => {
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          setDuration((prev) => prev + 1);
        }, 1000);
      }
    };

    const goLive = (hint) => {
      if (cancelled) return;
      setCallState('active');
      setStatusHint(hint || '');
      Vibration.vibrate(120);
      startTimer();
    };

    (async () => {
      try {
        if (!isAgoraNativeAvailable()) {
          throw new Error(
            'Real call ke liye APK / development build chahiye. Expo Go me mic stream nahi chalta.'
          );
        }

        const creds = await sessionApi.getCallToken(id);
        if (cancelled) return;
        if (!creds?.token || !creds?.appId || !creds?.channelName) {
          throw new Error(creds?.message || 'Call token incomplete from server');
        }

        setStatusHint('Connecting your microphone…');
        await agoraService.joinChannel({
          appId: creds.appId,
          token: creds.token,
          channelName: creds.channelName,
          uid: creds.uid || 1,
          video: isVideo,
          onJoinSuccess: () => {
            if (cancelled) return;
            setStatusHint('Mic live — waiting for astrologer…');
          },
          onUserJoined: () => {
            setRemoteJoined(true);
            goLive('Live — dono taraf awaz open');
          },
          onUserOffline: () => {
            setRemoteJoined(false);
            setStatusHint('Astrologer left the call');
          },
          onError: (err) => {
            console.warn('[Call] agora error', err);
            if (!cancelled) setStatusHint(err?.message || 'Audio error');
          },
        });
      } catch (err) {
        console.warn('[Call] join failed', err);
        if (cancelled) return;
        joinedRef.current = false;
        setCallState('error');
        setStatusHint(err?.message || 'Call connect nahi hua');
        Alert.alert(
          'Call audio failed',
          err?.message || 'Could not start call audio. APK build + mic permission check karein.'
        );
      }
    })();

    return () => {
      cancelled = true;
    };
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
    Alert.alert('End Call', 'Do you want to end this call?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End', style: 'destructive',
        onPress: async () => {
          await agoraService.leaveChannel();
          clearInterval(timerRef.current);
          try { await sessionApi.end(id); } catch { /* ok */ }
          router.replace({ pathname: '/sessions', params: { type: 'call' } });
        },
      },
    ]);
  };

  const leaveWithoutEnding = () => {
    router.replace({ pathname: '/sessions', params: { type: 'call' } });
  };

  const retryJoin = () => {
    joinedRef.current = false;
    setCallState('connecting');
    setSession((s) => (s ? { ...s } : s));
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const astro = session?.astrologer;
  const nameDisplay = astro?.name || displayName;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.bgTop} />
      <View style={styles.bgBottom} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={leaveWithoutEnding}>
          <Ionicons name="chevron-down" size={28} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>
            {isVideo ? '📹 Video Call' : '📞 Voice Call'}
          </Text>
          {callState === 'active' && (
            <Text style={styles.headerRateHint}>
              ₹{session?.pricePerMin || 20}/min
            </Text>
          )}
        </View>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.mainArea}>
        <Animated.View style={[
          styles.avatarWrap,
          (callState === 'connecting' || callState === 'waiting') && { transform: [{ scale: pulseAnim }] },
        ]}>
          <View style={[styles.outerRing, callState === 'active' && styles.outerRingActive]}>
            <View style={[styles.innerRing, callState === 'active' && styles.innerRingActive]}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{nameDisplay.charAt(0).toUpperCase()}</Text>
              </View>
            </View>
          </View>
          {callState === 'active' && remoteJoined && <View style={styles.activeDot} />}
        </Animated.View>

        <Text style={styles.callerName}>{nameDisplay}</Text>
        <Text style={styles.callerSub}>
          {astro?.specialty || 'Astrology Consultation'}
        </Text>

        {astro?.rating ? (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color={COLORS.primary} />
            <Text style={styles.ratingText}>{astro.rating}</Text>
          </View>
        ) : null}

        <View style={styles.statusRow}>
          {callState === 'waiting' ? (
            <>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.statusText}>Waiting for astrologer to accept...</Text>
            </>
          ) : callState === 'connecting' ? (
            <>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.statusText}>{statusHint || 'Connecting audio…'}</Text>
            </>
          ) : callState === 'active' ? (
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.timerText}>{formatDuration(duration)}</Text>
              <Text style={styles.liveHint}>
                {remoteJoined
                  ? '🟢 Live — dono taraf awaz open'
                  : '🟡 Aap connected — astrologer join ka wait…'}
              </Text>
              {!!statusHint && <Text style={styles.subHint}>{statusHint}</Text>}
            </View>
          ) : callState === 'error' ? (
            <View style={{ alignItems: 'center', gap: 10 }}>
              <Text style={styles.endedText}>Audio connect fail</Text>
              <Text style={styles.subHint}>{statusHint}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={retryJoin}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.endedText}>
              {session?.status === 'rejected' ? 'Call Declined' : 'Call Ended'}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.controls}>
        <View style={styles.controlRow}>
          <TouchableOpacity
            style={[styles.ctrlBtn, isMuted && styles.ctrlBtnDanger]}
            onPress={handleMute}
          >
            <View style={styles.ctrlIcon}>
              <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={24} color={isMuted ? COLORS.error : '#fff'} />
            </View>
            <Text style={styles.ctrlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.ctrlBtn, isSpeaker && styles.ctrlBtnPrimary]}
            onPress={handleSpeaker}
          >
            <View style={styles.ctrlIcon}>
              <Ionicons name={isSpeaker ? 'volume-high' : 'volume-mute'} size={24} color={isSpeaker ? COLORS.primary : '#fff'} />
            </View>
            <Text style={styles.ctrlLabel}>Speaker</Text>
          </TouchableOpacity>

          {isVideo ? (
            <TouchableOpacity
              style={[styles.ctrlBtn, !isCameraOn && styles.ctrlBtnDanger]}
              onPress={handleCamera}
            >
              <View style={styles.ctrlIcon}>
                <Ionicons name={isCameraOn ? 'videocam' : 'videocam-off'} size={24} color={!isCameraOn ? COLORS.error : '#fff'} />
              </View>
              <Text style={styles.ctrlLabel}>{isCameraOn ? 'Camera' : 'Cam Off'}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.ctrlBtnEmpty} />
          )}
        </View>

        <TouchableOpacity style={styles.endCallBtn} onPress={handleEndCall}>
          <Ionicons name="call" size={34} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.endLabel}>End Call</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingScreen: { flex: 1, backgroundColor: '#0f0a1e', justifyContent: 'center', alignItems: 'center' },
  safe: { flex: 1, backgroundColor: '#0f0a1e' },
  bgTop: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%', backgroundColor: '#1e1040' },
  bgBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', backgroundColor: '#080818' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  headerRateHint: { color: COLORS.primary, fontSize: 11, textAlign: 'center', fontWeight: '600' },
  mainArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  avatarWrap: { alignItems: 'center', marginBottom: 24 },
  outerRing: {
    width: 156, height: 156, borderRadius: 78,
    borderWidth: 2, borderColor: 'rgba(253,185,19,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  outerRingActive: { borderColor: 'rgba(253,185,19,0.35)' },
  innerRing: {
    width: 136, height: 136, borderRadius: 68,
    borderWidth: 2, borderColor: 'rgba(253,185,19,0.25)',
    justifyContent: 'center', alignItems: 'center',
  },
  innerRingActive: { borderColor: 'rgba(253,185,19,0.5)' },
  avatar: {
    width: 116, height: 116, borderRadius: 58,
    backgroundColor: 'rgba(253,185,19,0.12)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(253,185,19,0.5)',
  },
  avatarText: { fontSize: 48, fontWeight: '900', color: COLORS.primary },
  activeDot: {
    position: 'absolute', bottom: 12, right: 12,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: COLORS.success, borderWidth: 3, borderColor: '#0f0a1e',
  },
  callerName: { fontSize: 30, fontWeight: '900', color: '#fff', textAlign: 'center' },
  callerSub: { fontSize: 14, color: 'rgba(255,255,255,0.45)', marginTop: 6, textAlign: 'center' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  ratingText: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, paddingHorizontal: 12 },
  statusText: { color: 'rgba(255,255,255,0.55)', fontSize: 14, flexShrink: 1 },
  timerText: { color: COLORS.primary, fontSize: 24, fontWeight: '800', letterSpacing: 3, textAlign: 'center' },
  liveHint: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 8, textAlign: 'center', fontWeight: '600' },
  subHint: { color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 6, textAlign: 'center', lineHeight: 16 },
  endedText: { color: COLORS.error, fontSize: 18, fontWeight: '700' },
  retryBtn: {
    marginTop: 4, backgroundColor: COLORS.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20,
  },
  retryText: { color: '#1A1A1A', fontWeight: '800', fontSize: 13 },
  controls: { paddingHorizontal: 28, paddingBottom: 40, alignItems: 'center' },
  controlRow: {
    flexDirection: 'row', gap: 14, marginBottom: 36,
    justifyContent: 'center', width: '100%',
  },
  ctrlBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 16,
    backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 20, gap: 8,
  },
  ctrlBtnDanger: { backgroundColor: 'rgba(229,57,53,0.15)' },
  ctrlBtnPrimary: { backgroundColor: 'rgba(253,185,19,0.1)' },
  ctrlBtnEmpty: { flex: 1 },
  ctrlIcon: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
  ctrlLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '600' },
  endCallBtn: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: '#E53935',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#E53935',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 16,
  },
  endLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 10 },
});
