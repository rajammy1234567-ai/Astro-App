import { StyleSheet } from 'react-native';
import { COLORS } from './colors';

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

export const SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 6,
  elevation: 2,
};

export const SHADOW_SM = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 3,
  elevation: 1,
};

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