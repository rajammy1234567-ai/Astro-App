import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

export default function AppLogo({ size = 80 }) {
  const iconSize = Math.round(size * 0.48);
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Ionicons name="sunny" size={iconSize} color={COLORS.text} />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: COLORS.logoYellow,
    justifyContent: 'center',
    alignItems: 'center',
  },
});