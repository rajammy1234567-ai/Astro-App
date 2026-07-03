import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CATEGORY_ICONS } from '../../constants/icons';
import { COLORS } from '../../constants/colors';

export default function CategoryIcon({ id, size = 24 }) {
  const name = CATEGORY_ICONS[id] || 'star-four-points-outline';
  return (
    <View style={styles.wrap}>
      <MaterialCommunityIcons name={name} size={size} color={COLORS.text} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});