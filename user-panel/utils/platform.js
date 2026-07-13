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
 * DEV (Expo):
 *  1) Web → always http://localhost:5000/api
 *  2) Phone/emulator → Expo packager host IP :5000 (auto, not stale .env)
 *  3) EXPO_PUBLIC_API_URL only as last LAN fallback
 *
 * PROD / release:
 *  Prefer https EXPO_PUBLIC_API_URL (Render etc.)
 */
export function getApiBaseUrl() {
  const configUrl = Constants.expoConfig?.extra?.apiUrl;
  const envUrl = process.env.EXPO_PUBLIC_API_URL || configUrl;
  const candidate = (envUrl || '').replace(/\/$/, '');
  const dev = typeof __DEV__ !== 'undefined' && __DEV__;

  // Production HTTPS always wins (Render / custom domain)
  if (!dev && candidate.startsWith('https://') && !isPlaceholderUrl(candidate)) {
    return candidate;
  }
  if (candidate.startsWith('https://') && !isPlaceholderUrl(candidate)) {
    return candidate;
  }

  if (dev) {
    // Browser on same PC as server
    if (isWeb) return 'http://localhost:5000/api';

    // Expo Go / device — use the same machine Expo is running on
    const devHost = getExpoDevHost();
    if (isNative && devHost && !isLocalOnlyUrl(`http://${devHost}`)) {
      return `http://${devHost}:5000/api`;
    }

    const packagerHost = process.env.REACT_NATIVE_PACKAGER_HOSTNAME;
    if (packagerHost && !isLocalOnlyUrl(`http://${packagerHost}`)) {
      return `http://${packagerHost}:5000/api`;
    }

    // Explicit env LAN IP (may be stale — used only if auto-detect failed)
    if (
      isHttpUrl(candidate) &&
      !isPlaceholderUrl(candidate) &&
      !isLocalOnlyUrl(candidate)
    ) {
      return candidate;
    }

    // Android emulator → host machine
    if (isAndroid) return 'http://10.0.2.2:5000/api';
    return 'http://localhost:5000/api';
  }

  // Release build without https — still try env if set
  if (isHttpUrl(candidate) && !isPlaceholderUrl(candidate) && !isLocalOnlyUrl(candidate)) {
    return candidate;
  }

  if (isWeb) return 'http://localhost:5000/api';
  if (isAndroid) return 'http://10.0.2.2:5000/api';
  return 'http://localhost:5000/api';
}
