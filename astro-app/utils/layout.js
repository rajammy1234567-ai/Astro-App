import { Platform } from 'react-native';

export const TAB_BAR_BASE = Platform.select({ ios: 50, android: 56, web: 56, default: 56 });
export const HEADER_HEIGHT = 52;
export const ANDROID_NAV_FALLBACK = 48;

export function topPadding(insets, extra = 0) {
  const base = Platform.OS === 'web' ? 0 : insets.top;
  return base + extra;
}

export function tabBarBottomInset(insets) {
  if (Platform.OS === 'web') return 8;
  if (Platform.OS === 'ios') return insets.bottom;
  return insets.bottom > 0 ? insets.bottom : ANDROID_NAV_FALLBACK;
}

export function bottomPadding(insets, extra = 0) {
  if (Platform.OS === 'web') return extra;
  if (Platform.OS === 'ios') return insets.bottom + extra;
  return tabBarBottomInset(insets) + extra;
}

export function tabBarHeight(insets) {
  return TAB_BAR_BASE + tabBarBottomInset(insets);
}

export function contentPaddingBottom(insets, hasTabBar = false) {
  return hasTabBar ? 0 : bottomPadding(insets, 16);
}