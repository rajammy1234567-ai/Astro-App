import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const isAndroid = Platform.OS === 'android';
export const isIOS = Platform.OS === 'ios';
export const isNative = isAndroid || isIOS;
export const isWeb = Platform.OS === 'web';

function getExpoDevHost() {
  const hostUri =
    Constants.expoConfig?.hostUri
    ?? Constants.expoGoConfig?.debuggerHost
    ?? Constants.manifest2?.extra?.expoGo?.debuggerHost;
  if (!hostUri) return null;
  return hostUri.split(':')[0];
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
 * API base URL
 * DEV: prefer Expo LAN host (fast) over sleeping Render HTTPS.
 * PROD: use https EXPO_PUBLIC_API_URL.
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

  if (!dev && candidate.startsWith('https://') && !isPlaceholderUrl(candidate)) {
    return candidate;
  }

  if (dev && !forceRemote) {
    if (isWeb) return 'http://localhost:5000/api';

    const devHost = getExpoDevHost();
    if (isNative && devHost && !isLocalOnlyUrl(`http://${devHost}`)) {
      return `http://${devHost}:5000/api`;
    }

    const packagerHost = process.env.REACT_NATIVE_PACKAGER_HOSTNAME;
    if (packagerHost && !isLocalOnlyUrl(`http://${packagerHost}`)) {
      return `http://${packagerHost}:5000/api`;
    }

    if (
      candidate.startsWith('http://') &&
      !isPlaceholderUrl(candidate) &&
      !isLocalOnlyUrl(candidate)
    ) {
      return candidate;
    }

    if (isAndroid) return 'http://10.0.2.2:5000/api';

    if (candidate.startsWith('https://') && !isPlaceholderUrl(candidate)) {
      return candidate;
    }

    return 'http://localhost:5000/api';
  }

  if (candidate.startsWith('https://') && !isPlaceholderUrl(candidate)) {
    return candidate;
  }
  if (
    (candidate.startsWith('http://') || candidate.startsWith('https://')) &&
    !isPlaceholderUrl(candidate) &&
    !isLocalOnlyUrl(candidate)
  ) {
    return candidate;
  }

  if (isAndroid) return 'http://10.0.2.2:5000/api';
  return 'http://localhost:5000/api';
}
