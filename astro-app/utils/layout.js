import { Platform } from 'react-native';

export const TAB_BAR_BASE = Platform.select({ ios: 52, android: 56, web: 56, default: 56 });
export const ANDROID_NAV_FALLBACK = 48;
export const ANDROID_GESTURE_MIN = 16;

export function tabBarBottomInset(insets) {
  if (Platform.OS === 'web') return 8;
  if (Platform.OS === 'ios') return Math.max(insets.bottom, 8);
  if (insets.bottom > 0) return Math.max(insets.bottom, ANDROID_GESTURE_MIN);
  return ANDROID_NAV_FALLBACK;
}

export function tabBarHeight(insets) {
  return TAB_BAR_BASE + tabBarBottomInset(insets);
}
