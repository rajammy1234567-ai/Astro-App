import { Platform } from 'react-native';

/** Icon row + label height (before system gesture / button inset) */
export const TAB_BAR_BASE = Platform.select({ ios: 52, android: 56, web: 56, default: 56 });
export const HEADER_HEIGHT = 52;

/**
 * Android:
 * - Gesture navigation: insets.bottom is usually ~16–24
 * - 3-button nav: often ~48, or 0 in some Expo Go builds → use fallback
 * iOS: home indicator via insets.bottom
 */
export const ANDROID_NAV_FALLBACK = 48;
export const ANDROID_GESTURE_MIN = 16;

export function topPadding(insets, extra = 0) {
  const base = Platform.OS === 'web' ? 0 : insets.top;
  return base + extra;
}

/** Bottom safe space for tab bar padding (system gestures or buttons) */
export function tabBarBottomInset(insets) {
  if (Platform.OS === 'web') return 8;
  if (Platform.OS === 'ios') {
    // Home indicator phones: use inset; older: small pad
    return Math.max(insets.bottom, 8);
  }
  // Android
  if (insets.bottom > 0) {
    // Gesture bar or nav buttons already reported
    return Math.max(insets.bottom, ANDROID_GESTURE_MIN);
  }
  // Expo Go / some devices report 0 with 3-button nav
  return ANDROID_NAV_FALLBACK;
}

export function bottomPadding(insets, extra = 0) {
  if (Platform.OS === 'web') return extra;
  return tabBarBottomInset(insets) + extra;
}

/** Full tab bar height including system inset */
export function tabBarHeight(insets) {
  return TAB_BAR_BASE + tabBarBottomInset(insets);
}

/**
 * Floating UI above the tab bar (sticky chat/call strip).
 * Sits exactly on top of the tab bar, no double-count of gesture inset.
 */
export function floatingAboveTabBar(insets, extraGap = 0) {
  return tabBarHeight(insets) + extraGap;
}

export function contentPaddingBottom(insets, hasTabBar = false) {
  if (hasTabBar) return tabBarHeight(insets) + 16;
  return bottomPadding(insets, 16);
}
