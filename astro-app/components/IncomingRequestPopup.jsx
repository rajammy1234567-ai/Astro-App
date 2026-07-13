import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Vibration, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSocket } from '../utils/socket';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { COLORS } from '../constants/theme';
import { astroApi } from '../services/astroApi';

export default function IncomingRequestPopup() {
  const { user } = useAuth();
  const router = useRouter();
  const [request, setRequest] = useState(null);
  const slideAnim = useRef(new Animated.Value(-150)).current;

  useEffect(() => {
    if (!user?._id) return;

    const socket = getSocket();
    socket.emit('join-astro', user._id);

    const handleIncoming = (data) => {
      // data: { astroId, userId, sessionId, type: 'call' | 'chat', userName }
      setRequest(data);
      // Ring/vibrate pattern: Vibrate for 500ms, pause 1000ms, repeat
      Vibration.vibrate([500, 1000, 500, 1000], true);
      
      Animated.spring(slideAnim, {
        toValue: 20, // top position offset
        useNativeDriver: true,
        bounciness: 8,
      }).start();
    };

    socket.on('incoming-request', handleIncoming);

    return () => {
      socket.off('incoming-request', handleIncoming);
      Vibration.cancel();
    };
  }, [user]);

  const closePopup = () => {
    Vibration.cancel();
    Animated.timing(slideAnim, {
      toValue: -150,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setRequest(null));
  };

  const handleAccept = async () => {
    if (!request) return;
    try {
      await astroApi.acceptChat(request.sessionId);
      const socket = getSocket();
      socket.emit('accept-request', request);
      const targetSessionId = request.sessionId;
      const isCall = request.type === 'call';
      closePopup();

      if (isCall) {
        router.push(`/call/${targetSessionId}`);
      } else {
        router.push(`/chat/${targetSessionId}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not accept the request: ' + error.message);
      closePopup();
    }
  };

  const handleDecline = async () => {
    if (!request) return;
    try {
      await astroApi.rejectChat(request.sessionId);
      const socket = getSocket();
      socket.emit('decline-request', request);
      closePopup();
    } catch (error) {
      // Decline anyway if backend errors or handle gracefully
      const socket = getSocket();
      socket.emit('decline-request', request);
      closePopup();
    }
  };

  if (!request) return null;

  const isCall = request.type === 'call';

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name={isCall ? "call" : "chatbubbles"} size={22} color={COLORS.primary} />
        </View>
        
        <View style={styles.info}>
          <Text style={styles.title}>Incoming {isCall ? 'Call' : 'Chat Request'}</Text>
          <Text style={styles.name}>{request.userName || 'User'}</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.btn, styles.declineBtn]} onPress={handleDecline}>
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.acceptBtn]} onPress={handleAccept}>
            <Ionicons name="checkmark" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 10,
    left: 16,
    right: 16,
    zIndex: 99999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1B26', // matching dark theme
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245,197,24,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(245,197,24,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  title: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  name: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineBtn: {
    backgroundColor: '#E53935',
  },
  acceptBtn: {
    backgroundColor: '#4CAF50',
  },
});
