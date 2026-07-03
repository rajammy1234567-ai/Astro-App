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

export function getApiBaseUrl() {
  const devHost = getExpoDevHost();

  // Expo Go on phone — PC ka current IP (WiFi change par auto)
  if (isNative && devHost && devHost !== 'localhost' && devHost !== '127.0.0.1') {
    return `http://${devHost}:5000/api`;
  }

  const configUrl = Constants.expoConfig?.extra?.apiUrl;
  const envUrl = process.env.EXPO_PUBLIC_API_URL || configUrl;

  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl.replace(/\/$/, '');
  }

  if (isAndroid) return 'http://10.0.2.2:5000/api';
  return 'http://localhost:5000/api';
}