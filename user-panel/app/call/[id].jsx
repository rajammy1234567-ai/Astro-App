/**
 * User Voice/Video Call Screen
 * ==============================
 * Full-featured call UI with Agora dummy integration.
 * Route: /call/[id]?type=voice|video&astroName=...
 *
 * To activate real Agora:
 *   - Replace agoraService stubs with real react-native-agora calls
 *   - Add RtcLocalView / RtcRemoteView for real video streams
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
import agoraService from '../../services/agoraService';
import { COLORS } from '../../constants/colors';

function formatDuration(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function UserCallScreen() {
  const { id, type, astroName } = useLocalSearchParams();
  const router = useRouter();
  const isVideo = type === 'video';
  const displayName = astroName || 'Astrologer';

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  // waiting = astrologer not accepted yet | connecting | active | ended
  const [callState, setCallState] = useState('waiting');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(isVideo);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef(null);
  const joinedRef = useRef(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation while waiting / connecting
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
      Alert.alert('Error', 'Session load nahi ho saka');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { loadSession(); }, [loadSession]);

  // Poll until astrologer accepts (or session ends)
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
    // pending / accepted — keep polling
    setCallState('waiting');
    const interval = setInterval(loadSession, 2500);
    return () => clearInterval(interval);
  }, [session?.status, loadSession, session]);

  // Join Agora only after session is active (and keep call resumable if user left screen)
  useEffect(() => {
    if (!session) return undefined;
    if (session.status !== 'active' && session.status !== 'paused') return undefined;
    if (joinedRef.current) return undefined;

    joinedRef.current = true;
    setCallState('connecting');
    const channelName = session.agoraChannel || `session_${id}`;

    // Immediately mark active for billing/timer UX; agora is dummy until real App ID
    const goActive = () => {
      setCallState('active');
      Vibration.vibrate(120);
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          setDuration((prev) => prev + 1);
        }, 1000);
      }
    };

    agoraService.joinChannel({
      channelName,
      uid: 0,
      token: null,
      onUserJoined: () => goActive(),
      onUserOffline: () => {
        setCallState('ended');
        clearInterval(timerRef.current);
        timerRef.current = null;
      },
      onError: (err) => {
        console.warn('[Agora] error:', err);
        // Still allow UI call session if media stack fails
        goActive();
      },
    });

    // Safety: if dummy callback delayed, still open call
    const safety = setTimeout(goActive, 1200);

    return () => {
      clearTimeout(safety);
      agoraService.leaveChannel();
      clearInterval(timerRef.current);
      timerRef.current = null;
      joinedRef.current = false;
    };
  }, [session?.status, id, session]);

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
    Alert.alert('End Call', 'Call end karna chahte ho?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End', style: 'destructive',
        onPress: async () => {
          await agoraService.leaveChannel();
          clearInterval(timerRef.current);
          try { await sessionApi.end(id); } catch {}
          router.replace('/sessions');
        },
      },
    ]);
  };

  const leaveWithoutEnding = () => {
    // Session stays open — user can resume from Chat tab / History
    router.replace('/sessions');
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
      {/* Background */}
      <View style={styles.bgTop} />
      <View style={styles.bgBottom} />

      {/* Header */}
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

      {/* Main */}
      <View style={styles.mainArea}>
        {isVideo && isCameraOn && (
          <View style={styles.videoPlaceholder}>
            <Ionicons name="videocam-off" size={48} color="rgba(255,255,255,0.2)" />
            <Text style={styles.videoNote}>Agora video stream</Text>
            <Text style={styles.videoNoteSub}>(real App ID se activate hoga)</Text>
          </View>
        )}

        {/* Avatar */}
        <Animated.View style={[
          styles.avatarWrap,
          (callState === 'connecting' || callState === 'waiting') && { transform: [{ scale: pulseAnim }] },
        ]}>
          {/* Outer glow ring */}
          <View style={[
            styles.outerRing,
            callState === 'active' && styles.outerRingActive,
          ]}>
            <View style={[
              styles.innerRing,
              callState === 'active' && styles.innerRingActive,
            ]}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{nameDisplay.charAt(0).toUpperCase()}</Text>
              </View>
            </View>
          </View>
          {callState === 'active' && <View style={styles.activeDot} />}
        </Animated.View>

        <Text style={styles.callerName}>{nameDisplay}</Text>
        <Text style={styles.callerSub}>
          {astro?.specialty || 'Astrology Consultation'}
        </Text>

        {/* Rating */}
        {astro?.rating && (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color={COLORS.primary} />
            <Text style={styles.ratingText}>{astro.rating}</Text>
          </View>
        )}

        {/* Status */}
        <View style={styles.statusRow}>
          {callState === 'waiting' ? (
            <>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.statusText}>Waiting for astrologer to accept...</Text>
            </>
          ) : callState === 'connecting' ? (
            <>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.statusText}>Connecting...</Text>
            </>
          ) : callState === 'active' ? (
            <Text style={styles.timerText}>{formatDuration(duration)}</Text>
          ) : (
            <Text style={styles.endedText}>
              {session?.status === 'rejected' ? 'Call Declined' : 'Call Ended'}
            </Text>
          )}
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <View style={styles.controlRow}>
          {/* Mute */}
          <TouchableOpacity
            style={[styles.ctrlBtn, isMuted && styles.ctrlBtnDanger]}
            onPress={handleMute}
          >
            <View style={styles.ctrlIcon}>
              <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={24} color={isMuted ? COLORS.error : '#fff'} />
            </View>
            <Text style={styles.ctrlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
          </TouchableOpacity>

          {/* Speaker */}
          <TouchableOpacity
            style={[styles.ctrlBtn, isSpeaker && styles.ctrlBtnPrimary]}
            onPress={handleSpeaker}
          >
            <View style={styles.ctrlIcon}>
              <Ionicons name={isSpeaker ? 'volume-high' : 'volume-mute'} size={24} color={isSpeaker ? COLORS.primary : '#fff'} />
            </View>
            <Text style={styles.ctrlLabel}>Speaker</Text>
          </TouchableOpacity>

          {/* Camera (video only) */}
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

        {/* End Call */}
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
  videoPlaceholder: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#0a0a14', justifyContent: 'center', alignItems: 'center',
  },
  videoNote: { color: 'rgba(255,255,255,0.35)', marginTop: 12, fontSize: 14 },
  videoNoteSub: { color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 4 },
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
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20 },
  statusText: { color: 'rgba(255,255,255,0.55)', fontSize: 15 },
  timerText: { color: COLORS.primary, fontSize: 24, fontWeight: '800', letterSpacing: 3 },
  endedText: { color: COLORS.error, fontSize: 18, fontWeight: '700' },
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
  ctrlIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
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
