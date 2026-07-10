import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const isAndroid = Platform.OS === 'android';
export const isIOS = Platform.OS === 'ios';
export const isNative = isAndroid || isIOS;

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

export function getApiBaseUrl() {
  const configUrl = Constants.expoConfig?.extra?.apiUrl;
  const envUrl = process.env.EXPO_PUBLIC_API_URL || configUrl;
  const candidate = (envUrl || '').replace(/\/$/, '');

  if (isUsableApiUrl(candidate)) {
    return candidate;
  }

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    const devHost = getExpoDevHost();
    if (isNative && devHost && devHost !== 'localhost' && devHost !== '127.0.0.1') {
      return `http://${devHost}:5000/api`;
    }
  }

  if (isAndroid) return 'http://10.0.2.2:5000/api';
  return 'http://localhost:5000/api';
}
