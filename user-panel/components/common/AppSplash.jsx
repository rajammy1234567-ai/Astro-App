import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AppLogo from './AppLogo';
import { COLORS } from '../../constants/colors';

/**
 * Cross-platform branded splash while auth + first data load.
 * Native Expo splash stays under this until hideAsync().
 */
export default function AppSplash({
  message = 'Preparing your stars…',
  showSpinner = true,
}) {
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 7, useNativeDriver: true }),
    ]).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [fade, scale, pulse]);

  return (
    <View style={styles.root} accessibilityLabel="AstroTalk loading">
      <StatusBar style="light" />
      <View style={styles.blob1} />
      <View style={styles.blob2} />
      <View style={styles.starA} />
      <View style={styles.starB} />
      <View style={styles.starC} />

      <Animated.View style={[styles.center, { opacity: fade, transform: [{ scale }] }]}>
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <View style={styles.logoRing}>
            <AppLogo size={96} />
          </View>
        </Animated.View>
        <Text style={styles.brand}>AstroTalk</Text>
        <Text style={styles.tagline}>Guidance · Trust · Clarity</Text>
        {showSpinner ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={COLORS.primary} size="small" />
            <Text style={styles.message}>{message}</Text>
          </View>
        ) : null}
      </Animated.View>

      <Text style={styles.footer}>Secure · Private · Verified</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bannerDark || '#1E1033',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  blob1: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(253,185,19,0.12)',
  },
  blob2: {
    position: 'absolute',
    bottom: -40,
    left: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(139,92,246,0.15)',
  },
  starA: {
    position: 'absolute',
    top: '22%',
    left: '18%',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  starB: {
    position: 'absolute',
    top: '35%',
    right: '22%',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(253,185,19,0.7)',
  },
  starC: {
    position: 'absolute',
    bottom: '28%',
    right: '30%',
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  center: { alignItems: 'center', paddingHorizontal: 32 },
  logoRing: {
    padding: 4,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(253,185,19,0.45)',
    ...Platform.select({
      ios: {
        shadowColor: '#FDB913',
        shadowOpacity: 0.35,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  brand: {
    marginTop: 18,
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
  tagline: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.65)',
  },
  loadingRow: {
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  message: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
  },
  footer: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 28 : 48,
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 0.6,
  },
});
