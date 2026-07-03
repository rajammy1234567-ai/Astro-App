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

export function getApiBaseUrl() {
  const devHost = getExpoDevHost();

  // Expo Go on phone: ALWAYS use PC IP from Expo (WiFi IP change par bhi sahi rahega)
  if (isNative && devHost && devHost !== 'localhost' && devHost !== '127.0.0.1') {
    return `http://${devHost}:5000/api`;
  }

  const configUrl = Constants.expoConfig?.extra?.apiUrl;
  const envUrl = process.env.EXPO_PUBLIC_API_URL || configUrl;

  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl.replace(/\/$/, '');
  }

  if (isWeb) return 'http://localhost:5000/api';
  if (isAndroid) return 'http://10.0.2.2:5000/api';
  return 'http://localhost:5000/api';
}