import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const isWeb = Platform.OS === 'web';
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isNative = isIOS || isAndroid;

export const MOBILE_MAX_WIDTH = 430;

function getExpoDevHost() {
  const hostUri =
    Constants.expoConfig?.hostUri
    ?? Constants.expoGoConfig?.debuggerHost
    ?? Constants.manifest2?.extra?.expoGo?.debuggerHost;

  if (!hostUri) return null;
  return hostUri.split(':')[0];
}

function isHttpUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const u = url.trim();
  return u.startsWith('http://') || u.startsWith('https://');
}

function isPlaceholderUrl(url) {
  if (!url) return true;
  const bad = [
    'YOUR_PC_IP',
    'YOUR_DOMAIN',
    'YOUR_RENDER',
    'example.com',
    'YOUR_AGORA',
  ];
  return bad.some((b) => url.includes(b));
}

function isLocalOnlyUrl(url) {
  if (!url) return true;
  return (
    url.includes('localhost') ||
    url.includes('127.0.0.1') ||
    url.includes('10.0.2.2')
  );
}

/**
 * API base URL resolution
 *
 * DEV (Expo Go / metro):
 *  Prefer PC LAN (fast login) over sleeping Render HTTPS.
 *  1) Web → localhost:5000
 *  2) Phone → Expo packager host :5000
 *  3) http EXPO_PUBLIC_API_URL (setup-mobile-env LAN)
 *  4) https Render only as last resort
 *
 * PROD / release APK:
 *  Prefer https EXPO_PUBLIC_API_URL (Render etc.)
 *
 * Force remote in Expo: EXPO_PUBLIC_FORCE_REMOTE=1
 */
export function getApiBaseUrl() {
  const configUrl = Constants.expoConfig?.extra?.apiUrl;
  const envUrl = process.env.EXPO_PUBLIC_API_URL || configUrl;
  const candidate = (envUrl || '').replace(/\/$/, '');
  const dev = typeof __DEV__ !== 'undefined' && __DEV__;
  const forceRemote =
    process.env.EXPO_PUBLIC_FORCE_REMOTE === '1' ||
    process.env.EXPO_PUBLIC_FORCE_REMOTE === 'true';

  // Production / release: HTTPS cloud wins
  if (!dev && candidate.startsWith('https://') && !isPlaceholderUrl(candidate)) {
    return candidate;
  }

  if (dev && !forceRemote) {
    // Browser on same PC as server
    if (isWeb) return 'http://localhost:5000/api';

    // Expo Go / device — same machine as Metro (fast local API)
    const devHost = getExpoDevHost();
    if (isNative && devHost && !isLocalOnlyUrl(`http://${devHost}`)) {
      return `http://${devHost}:5000/api`;
    }

    const packagerHost = process.env.REACT_NATIVE_PACKAGER_HOSTNAME;
    if (packagerHost && !isLocalOnlyUrl(`http://${packagerHost}`)) {
      return `http://${packagerHost}:5000/api`;
    }

    // Explicit LAN from setup-mobile-env (http://192.168.x.x:5000/api)
    if (
      isHttpUrl(candidate) &&
      candidate.startsWith('http://') &&
      !isPlaceholderUrl(candidate) &&
      !isLocalOnlyUrl(candidate)
    ) {
      return candidate;
    }

    // Android emulator → host machine
    if (isAndroid) return 'http://10.0.2.2:5000/api';

    // Only then fall back to remote HTTPS (slow cold start)
    if (candidate.startsWith('https://') && !isPlaceholderUrl(candidate)) {
      return candidate;
    }

    return 'http://localhost:5000/api';
  }

  // forceRemote or production-like path
  if (candidate.startsWith('https://') && !isPlaceholderUrl(candidate)) {
    return candidate;
  }
  if (isHttpUrl(candidate) && !isPlaceholderUrl(candidate) && !isLocalOnlyUrl(candidate)) {
    return candidate;
  }

  if (isWeb) return 'http://localhost:5000/api';
  if (isAndroid) return 'http://10.0.2.2:5000/api';
  return 'http://localhost:5000/api';
}
