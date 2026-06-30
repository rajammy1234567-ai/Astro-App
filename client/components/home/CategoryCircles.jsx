import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { CATEGORIES } from '../../constants/mockData';
import { COLORS } from '../../constants/colors';
import CategoryIcon from '../common/CategoryIcon';

export default function CategoryCircles() {
  const router = useRouter();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
    >
      {CATEGORIES.map((cat) => (
        <TouchableOpacity
          key={cat.id}
          style={styles.item}
          onPress={() => router.push(cat.route)}
          activeOpacity={0.7}
        >
          <View style={styles.circle}>
            <CategoryIcon id={cat.id} size={26} />
          </View>
          <Text style={styles.label}>{cat.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  item: {
    alignItems: 'center',
    width: 72,
    marginRight: 4,
  },
  circle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 13,
  },
});