import { StyleSheet } from 'react-native';
import { COLORS } from './colors';
import { shadowStyle } from '../utils/shadow';

export const RADIUS = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
};

export const SPACING = {
  screen: 14,
  section: 16,
};

export const SHADOW = shadowStyle({ offsetY: 2, blur: 6, opacity: 0.06, elevation: 2 });
export const SHADOW_SM = shadowStyle({ offsetY: 1, blur: 3, opacity: 0.04, elevation: 1 });
export const SHADOW_MD = shadowStyle({ offsetY: 2, blur: 8, opacity: 0.06, elevation: 2 });
export const SHADOW_LG = shadowStyle({ offsetY: 4, blur: 12, opacity: 0.06, elevation: 3 });

export const commonStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.link,
  },
});