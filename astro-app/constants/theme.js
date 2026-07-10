import { StyleSheet } from 'react-native';
import { COLORS, colors } from './colors';
import { shadowStyle } from '../utils/shadow';

export { COLORS, colors };

export const RADIUS = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 999,
};

export const SPACING = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  screen: 16,
};

export const SHADOW_SM = shadowStyle({
  offsetY: 2,
  blur: 8,
  opacity: 0.06,
  color: COLORS.bannerDark,
  elevation: 2,
});

export const SHADOW_MD = shadowStyle({
  offsetY: 6,
  blur: 16,
  opacity: 0.1,
  color: COLORS.bannerDark,
  elevation: 4,
});

export const SHADOW_LG = shadowStyle({
  offsetY: 10,
  blur: 24,
  opacity: 0.14,
  color: COLORS.bannerDark,
  elevation: 6,
});

export const panelStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW_SM,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textLight,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 4,
  },
});
