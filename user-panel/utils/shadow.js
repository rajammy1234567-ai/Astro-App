import { Platform } from 'react-native';

/** Cross-platform shadow — web uses boxShadow, native uses shadow* props */
export function shadowStyle({
  offsetY = 2,
  blur = 6,
  opacity = 0.06,
  color = '#000',
  elevation = 2,
} = {}) {
  if (Platform.OS === 'web') {
    const hex = color.startsWith('#') ? color : '#000000';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return {
      boxShadow: `0px ${offsetY}px ${blur}px rgba(${r}, ${g}, ${b}, ${opacity})`,
    };
  }
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: blur,
    elevation,
  };
}