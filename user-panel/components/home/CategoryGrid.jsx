import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { CATEGORIES } from '../../constants/mockData';
import { COLORS } from '../../constants/colors';

export default function CategoryGrid() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={styles.item}
            onPress={() => router.push(cat.route)}
          >
            <View style={[styles.iconWrap, { backgroundColor: cat.color + '18' }]}>
              <Text style={styles.icon}>{cat.icon}</Text>
            </View>
            <Text style={styles.label}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  scroll: {
    paddingHorizontal: 12,
    gap: 4,
  },
  item: {
    alignItems: 'center',
    width: 76,
    marginHorizontal: 4,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  icon: {
    fontSize: 24,
  },
  label: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});