import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { CATEGORIES } from '../../constants/mockData';
import { COLORS } from '../../constants/colors';
import CategoryIcon from '../common/CategoryIcon';

const TINTS = [
  '#FFF3C4',
  '#F3E8FF',
  '#E0F7FA',
  '#FFE4EC',
  '#E8F5E9',
  '#FFF0E0',
  '#E8EEFF',
];

export default function CategoryCircles() {
  const router = useRouter();

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.heading}>Explore Astrology</Text>
        <Text style={styles.sub}>Free tools & services</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {CATEGORIES.map((cat, i) => (
          <TouchableOpacity
            key={cat.id}
            style={styles.item}
            onPress={() => router.push(cat.route)}
            activeOpacity={0.75}
          >
            <View style={[styles.circle, { backgroundColor: TINTS[i % TINTS.length] }]}>
              <CategoryIcon id={cat.id} size={26} />
            </View>
            <Text style={styles.label} numberOfLines={2}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 4, marginBottom: 2 },
  header: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  heading: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.1,
  },
  sub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  scroll: {
    paddingHorizontal: 14,
    paddingBottom: 8,
    gap: 4,
  },
  item: {
    alignItems: 'center',
    width: 78,
    marginRight: 6,
  },
  circle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    ...Platform.select({
      ios: {
        shadowColor: '#1E1033',
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 2 },
    }),
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 14,
  },
});
