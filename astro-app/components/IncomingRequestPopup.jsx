import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity, Vibration, Alert, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSocket } from '../utils/socket';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { COLORS } from '../constants/theme';
import { astroApi } from '../services/astroApi';
import { resolveMediaUrl } from '../utils/mediaUrl';

/**
 * WhatsApp-style full-screen-ish banner for incoming chat/call.
 * Uses astrologer id from AuthContext (NOT user — that was a bug).
 */
export default function IncomingRequestPopup() {
  const { astrologer } = useAuth();
  const router = useRouter();
  const [request, setRequest] = useState(null);
  const slideAnim = useRef(new Animated.Value(-220)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!astrologer?._id) return undefined;

    const socket = getSocket();
    socket.emit('join-astro', astrologer._id);

    const handleIncoming = (data) => {
      // Only show if this partner is online for that mode
      if (data?.type === 'call' && astrologer.callOnline === false) return;
      if (data?.type === 'chat' && astrologer.chatOnline === false) return;

      setRequest(data);
      Vibration.vibrate([400, 600, 400, 600, 400, 600], true);

      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 6,
      }).start();
    };

    socket.on('incoming-request', handleIncoming);
    return () => {
      socket.off('incoming-request', handleIncoming);
      Vibration.cancel();
    };
  }, [astrologer?._id, astrologer?.chatOnline, astrologer?.callOnline, slideAnim]);

  useEffect(() => {
    if (!request) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [request, pulse]);

  const closePopup = () => {
    Vibration.cancel();
    Animated.timing(slideAnim, {
      toValue: -220,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setRequest(null));
  };

  const handleAccept = async () => {
    if (!request) return;
    try {
      await astroApi.acceptChat(request.sessionId);
      const socket = getSocket();
      socket.emit('accept-request', {
        ...request,
        userId: request.userId,
        sessionId: request.sessionId,
      });
      const targetSessionId = request.sessionId;
      const isCall = request.type === 'call';
      closePopup();

      if (isCall) {
        router.push({ pathname: `/call/${targetSessionId}`, params: { type: 'voice' } });
      } else {
        router.push(`/chat/${targetSessionId}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Accept fail: ' + (error.message || 'try again'));
      closePopup();
    }
  };

  const handleDecline = async () => {
    if (!request) return;
    try {
      await astroApi.rejectChat(request.sessionId);
      getSocket().emit('decline-request', request);
    } catch {
      getSocket().emit('decline-request', request);
    }
    closePopup();
  };

  if (!request) return null;

  const isCall = request.type === 'call';
  const name = request.userName || 'User';

  return (
    <Animated.View style={[styles.overlay, { transform: [{ translateY: slideAnim }] }]}>
      <View style={[styles.card, isCall && styles.cardCall]}>
        <Text style={styles.ringLabel}>
          {isCall ? 'Incoming voice call' : 'Incoming chat request'}
        </Text>

        <Animated.View style={[styles.avatarWrap, { transform: [{ scale: pulse }] }]}>
          {request.userImage ? (
            <Image source={{ uri: resolveMediaUrl(request.userImage) }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarLetter}>{name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </Animated.View>

        <Text style={styles.name}>{name}</Text>
        <Text style={styles.sub}>
          {isCall ? 'Tap green to answer · red to decline' : 'Chat consultation request'}
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.declineBtn} onPress={handleDecline} activeOpacity={0.85}>
            <Ionicons
              name={isCall ? 'call' : 'close'}
              size={28}
              color="#fff"
              style={isCall ? { transform: [{ rotate: '135deg' }] } : undefined}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept} activeOpacity={0.85}>
            <Ionicons name={isCall ? 'call' : 'checkmark'} size={28} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.actionLabels}>
          <Text style={styles.actionLbl}>Decline</Text>
          <Text style={styles.actionLbl}>Accept</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingTop: 48,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#1F2C34',
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  cardCall: {
    backgroundColor: '#0B141A',
    borderColor: 'rgba(37,211,102,0.35)',
  },
  ringLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  avatarWrap: { marginBottom: 12 },
  avatar: { width: 84, height: 84, borderRadius: 42 },
  avatarFallback: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#075E54',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontSize: 36, fontWeight: '800', color: '#fff' },
  name: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  sub: { fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 22, textAlign: 'center' },
  actions: {
    flexDirection: 'row',
    gap: 48,
    alignItems: 'center',
  },
  declineBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabels: {
    flexDirection: 'row',
    gap: 48,
    marginTop: 8,
    width: 64 * 2 + 48,
    justifyContent: 'space-between',
  },
  actionLbl: {
    width: 64,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontWeight: '600',
  },
});
