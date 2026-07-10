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

function isUsableApiUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const u = url.trim();
  if (!u.startsWith('http://') && !u.startsWith('https://')) return false;
  // Placeholders / local-only values must not ship in APK
  const bad = [
    'localhost',
    '127.0.0.1',
    '10.0.2.2',
    'YOUR_PC_IP',
    'YOUR_DOMAIN',
    'YOUR_RENDER',
    'example.com',
  ];
  return !bad.some((b) => u.includes(b));
}

/**
 * API base URL resolution order:
 * 1) EXPO_PUBLIC_API_URL / app.config extra.apiUrl  (EAS build me bake hota hai → Render)
 * 2) Dev only: Expo Go PC LAN IP :5000
 * 3) Emulator / web fallbacks
 */
export function getApiBaseUrl() {
  const configUrl = Constants.expoConfig?.extra?.apiUrl;
  const envUrl = process.env.EXPO_PUBLIC_API_URL || configUrl;
  const candidate = (envUrl || '').replace(/\/$/, '');

  // Production APK / release: always prefer baked Render (or any real remote) URL
  if (isUsableApiUrl(candidate)) {
    return candidate;
  }

  // Local Expo Go / metro dev only
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    const devHost = getExpoDevHost();
    if (isNative && devHost && devHost !== 'localhost' && devHost !== '127.0.0.1') {
      return `http://${devHost}:5000/api`;
    }
    const packagerHost = process.env.REACT_NATIVE_PACKAGER_HOSTNAME;
    if (packagerHost && packagerHost !== 'localhost' && packagerHost !== '127.0.0.1') {
      return `http://${packagerHost}:5000/api`;
    }
  }

  if (isWeb) return 'http://localhost:5000/api';
  if (isAndroid) return 'http://10.0.2.2:5000/api';
  return 'http://localhost:5000/api';
}
