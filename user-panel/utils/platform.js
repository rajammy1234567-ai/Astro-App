import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const isWeb = Platform.OS === 'web';
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isNative = isIOS || isAndroid;

export const MOBILE_MAX_WIDTH = 430;

/** Live backend on Render (default for all panels). */
export const RENDER_API_URL = 'https://astro-app-ru1d.onrender.com/api';

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
 * Priority:
 *  1) Explicit https EXPO_PUBLIC_API_URL / app.config extra (Render)
 *  2) Explicit non-local http LAN URL (only if FORCE_REMOTE is off)
 *  3) Dev local heuristics (localhost / Expo host / emulator)
 *  4) RENDER_API_URL fallback
 *
 * Force cloud always: EXPO_PUBLIC_FORCE_REMOTE=1
 */
export function getApiBaseUrl() {
  const configUrl = Constants.expoConfig?.extra?.apiUrl;
  const envUrl = process.env.EXPO_PUBLIC_API_URL || configUrl;
  const candidate = (envUrl || '').replace(/\/$/, '');
  const dev = typeof __DEV__ !== 'undefined' && __DEV__;
  const forceRemote =
    process.env.EXPO_PUBLIC_FORCE_REMOTE === '1' ||
    process.env.EXPO_PUBLIC_FORCE_REMOTE === 'true';

  // Configured HTTPS (Render etc.) always wins
  if (candidate.startsWith('https://') && !isPlaceholderUrl(candidate)) {
    return candidate;
  }

  if (forceRemote) {
    if (isHttpUrl(candidate) && !isPlaceholderUrl(candidate) && !isLocalOnlyUrl(candidate)) {
      return candidate;
    }
    return RENDER_API_URL;
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

  if (dev) {
    if (isWeb) return 'http://localhost:5000/api';

    const devHost = getExpoDevHost();
    if (isNative && devHost && !isLocalOnlyUrl(`http://${devHost}`)) {
      return `http://${devHost}:5000/api`;
    }

    const packagerHost = process.env.REACT_NATIVE_PACKAGER_HOSTNAME;
    if (packagerHost && !isLocalOnlyUrl(`http://${packagerHost}`)) {
      return `http://${packagerHost}:5000/api`;
    }

    if (isAndroid) return 'http://10.0.2.2:5000/api';
    return 'http://localhost:5000/api';
  }

  // Production fallback
  return RENDER_API_URL;
}
