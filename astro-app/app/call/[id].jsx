/**
 * Astrologer Voice/Video Call Screen — real Agora RTC audio
 * Route: /call/[id]?type=voice|video
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Alert, Animated, Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { astroApi } from '../../services/astroApi';
import agoraService, { isAgoraNativeAvailable } from '../../services/agoraService';
import { safeGoBack } from '../../utils/navigation';
import { colors, COLORS } from '../../constants/theme';

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
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

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

  // Leave RTC only when leaving this screen
  useEffect(() => () => {
    agoraService.leaveChannel();
    clearInterval(timerRef.current);
    timerRef.current = null;
    joinedRef.current = false;
  }, []);

  // Join Agora once after accept (active/paused)
  useEffect(() => {
    if (!session) return;
    if (!['active', 'paused'].includes(session.status)) {
      if (!joinedRef.current) {
        setCallState(session.status === 'pending' ? 'connecting' : 'ended');
        setStatusHint(
          session.status === 'pending'
            ? 'Pehle request accept karein'
            : 'Session closed'
        );
      }
      return;
    }
    if (joinedRef.current) return;

    let cancelled = false;
    joinedRef.current = true;
    setCallState('connecting');
    setStatusHint('Call token le rahe hain…');

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
      Vibration.vibrate(100);
      startTimer();
    };

    (async () => {
      try {
        if (!isAgoraNativeAvailable()) {
          throw new Error(
            'Real call ke liye Partner APK / dev build chahiye. Expo Go me awaz nahi jaati.'
          );
        }

        const creds = await astroApi.getCallToken(id);
        if (cancelled) return;
        if (!creds?.token || !creds?.appId || !creds?.channelName) {
          throw new Error(creds?.message || 'Call token incomplete');
        }

        setStatusHint('Audio channel join…');
        await agoraService.joinChannel({
          appId: creds.appId,
          token: creds.token,
          channelName: creds.channelName,
          uid: creds.uid || 2,
          video: isVideo,
          onJoinSuccess: () => {
            goLive('Connected — waiting for user…');
          },
          onUserJoined: () => {
            setRemoteJoined(true);
            goLive('Live — dono taraf awaz open');
          },
          onUserOffline: () => {
            setRemoteJoined(false);
            setStatusHint('User left the call');
          },
          onError: (err) => {
            console.warn('[AstroCall] error', err);
            if (!cancelled) setStatusHint(err?.message || 'Audio error');
          },
        });

        if (!cancelled) goLive('Connected — waiting for user…');
      } catch (err) {
        console.warn('[AstroCall] join failed', err);
        if (cancelled) return;
        joinedRef.current = false;
        setCallState('error');
        setStatusHint(err?.message || 'Call connect nahi hua');
        Alert.alert('Call audio failed', err?.message || 'Mic / APK check karein');
      }
    })();

    return () => {
      cancelled = true;
    };
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
    Alert.alert('End Call', 'Is call ko end karein?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End', style: 'destructive',
        onPress: async () => {
          await agoraService.leaveChannel();
          clearInterval(timerRef.current);
          try { await astroApi.closeChat(id); } catch { /* ok */ }
          safeGoBack(router, '/(tabs)/calls');
        },
      },
    ]);
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

  const userName = session?.user?.name || session?.userBirthDetails?.name || 'User';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.bg}>
        <View style={styles.bgGradientTop} />
        <View style={styles.bgGradientBottom} />
      </View>

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => safeGoBack(router, '/(tabs)/calls')}>
          <Ionicons name="chevron-down" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.callTypeLabel}>
          {isVideo ? '📹 Video Call' : '📞 Voice Call'}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.mainArea}>
        <Animated.View style={[
          styles.avatarWrap,
          callState === 'connecting' && { transform: [{ scale: pulseAnim }] },
        ]}>
          <View style={[styles.avatarRing, callState === 'active' && styles.avatarRingActive]}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
            </View>
          </View>
          {callState === 'active' && remoteJoined && <View style={styles.activeDot} />}
        </Animated.View>

        <Text style={styles.callerName}>{userName}</Text>
        <Text style={styles.callerSub}>
          {session?.user?.phone || 'Consultation'}
        </Text>

        <View style={styles.statusRow}>
          {callState === 'connecting' ? (
            <>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.statusText}>{statusHint || 'Connecting…'}</Text>
            </>
          ) : callState === 'active' ? (
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.timerText}>{formatDuration(duration)}</Text>
              <Text style={styles.liveHint}>
                {remoteJoined
                  ? '🟢 Live — user ki awaz sunni chahiye'
                  : '🟡 Aap live — user channel join kare to awaz aayegi'}
              </Text>
              {!!statusHint && <Text style={styles.subHint}>{statusHint}</Text>}
            </View>
          ) : callState === 'error' ? (
            <View style={{ alignItems: 'center', gap: 10 }}>
              <Text style={styles.endedText}>Audio fail</Text>
              <Text style={styles.subHint}>{statusHint}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={retryJoin}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.endedText}>Call Ended</Text>
          )}
        </View>
      </View>

      <View style={styles.controls}>
        <View style={styles.controlRow}>
          <TouchableOpacity
            style={[styles.ctrlBtn, isMuted && styles.ctrlBtnActive]}
            onPress={handleMute}
          >
            <Ionicons
              name={isMuted ? 'mic-off' : 'mic'}
              size={26}
              color={isMuted ? COLORS.error : '#fff'}
            />
            <Text style={styles.ctrlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.ctrlBtn, isSpeaker && styles.ctrlBtnActive]}
            onPress={handleSpeaker}
          >
            <Ionicons
              name={isSpeaker ? 'volume-high' : 'volume-mute'}
              size={26}
              color={isSpeaker ? COLORS.primary : '#fff'}
            />
            <Text style={styles.ctrlLabel}>Speaker</Text>
          </TouchableOpacity>

          {isVideo ? (
            <TouchableOpacity
              style={[styles.ctrlBtn, !isCameraOn && styles.ctrlBtnActive]}
              onPress={handleCamera}
            >
              <Ionicons
                name={isCameraOn ? 'videocam' : 'videocam-off'}
                size={26}
                color={!isCameraOn ? COLORS.error : '#fff'}
              />
              <Text style={styles.ctrlLabel}>{isCameraOn ? 'Camera' : 'Cam Off'}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.ctrlBtn} />
          )}

          {isVideo ? (
            <TouchableOpacity style={styles.ctrlBtn} onPress={handleFlip}>
              <Ionicons name="camera-reverse" size={26} color="#fff" />
              <Text style={styles.ctrlLabel}>Flip</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.ctrlBtn} />
          )}
        </View>

        <TouchableOpacity style={styles.endCallBtn} onPress={handleEndCall}>
          <Ionicons name="call" size={32} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.endLabel}>End Call</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingScreen: { flex: 1, backgroundColor: '#0d0d2b', justifyContent: 'center', alignItems: 'center' },
  safe: { flex: 1, backgroundColor: '#0d0d2b' },
  bg: { ...StyleSheet.absoluteFillObject },
  bgGradientTop: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '55%',
    backgroundColor: '#1a1040',
  },
  bgGradientBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%',
    backgroundColor: '#0a0a1a',
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center',
  },
  callTypeLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600' },
  mainArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  avatarWrap: { alignItems: 'center', marginBottom: 24 },
  avatarRing: {
    width: 140, height: 140, borderRadius: 70,
    borderWidth: 3, borderColor: 'rgba(253,185,19,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarRingActive: { borderColor: COLORS.primary },
  avatar: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(253,185,19,0.15)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(253,185,19,0.4)',
  },
  avatarText: { fontSize: 52, fontWeight: '800', color: COLORS.primary },
  activeDot: {
    position: 'absolute', bottom: 8, right: 8,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: COLORS.success, borderWidth: 3, borderColor: '#0d0d2b',
  },
  callerName: { fontSize: 28, fontWeight: '800', color: '#fff', textAlign: 'center' },
  callerSub: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 4, textAlign: 'center' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, paddingHorizontal: 10 },
  statusText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, flexShrink: 1 },
  timerText: { color: COLORS.primary, fontSize: 22, fontWeight: '700', letterSpacing: 2, textAlign: 'center' },
  liveHint: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 8, textAlign: 'center', fontWeight: '600' },
  subHint: { color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 6, textAlign: 'center', lineHeight: 16 },
  endedText: { color: COLORS.error, fontSize: 18, fontWeight: '700' },
  retryBtn: {
    backgroundColor: COLORS.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20,
  },
  retryText: { color: '#1A1A1A', fontWeight: '800', fontSize: 13 },
  controls: { paddingHorizontal: 24, paddingBottom: 32, alignItems: 'center' },
  controlRow: {
    flexDirection: 'row', gap: 12, marginBottom: 32,
    justifyContent: 'center', width: '100%',
  },
  ctrlBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16,
    gap: 6,
  },
  ctrlBtnActive: { backgroundColor: 'rgba(255,255,255,0.15)' },
  ctrlLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '600' },
  endCallBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.error,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
  },
  endLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 8 },
});
