import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

const SERVICES = [
  {
    id: 'kundli',
    title: 'Free Kundli',
    sub: 'Birth chart & planets',
    route: '/kundli',
    icon: 'planet',
    image: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=700&h=500&fit=crop',
  },
  {
    id: 'match',
    title: 'Match Making',
    sub: '36-point gun milan',
    route: '/kundli/match',
    icon: 'heart',
    image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=700&h=500&fit=crop',
  },
  {
    id: 'horoscope',
    title: 'Horoscope',
    sub: 'Daily star guide',
    route: '/horoscope',
    icon: 'sunny',
    image: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=700&h=500&fit=crop',
  },
  {
    id: 'pooja',
    title: 'Book Pooja',
    sub: 'Sacred rituals',
    route: '/pooja',
    icon: 'flame',
    image: 'https://images.unsplash.com/photo-1564414029828-fac63c12d0b8?w=700&h=500&fit=crop',
  },
];

export default function ServicesShowcase() {
  const router = useRouter();

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>Popular Services</Text>
        <Text style={styles.hint}>Handpicked for you</Text>
      </View>

      <View style={styles.grid}>
        {SERVICES.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => router.push(s.route)}
          >
            <ImageBackground source={{ uri: s.image }} style={styles.bg} imageStyle={styles.bgImg}>
              <View style={styles.shade} />
              <View style={styles.iconPill}>
                <Ionicons name={s.icon} size={14} color={COLORS.bannerDark} />
              </View>
              <Text style={styles.cardTitle}>{s.title}</Text>
              <Text style={styles.cardSub}>{s.sub}</Text>
            </ImageBackground>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 10, marginBottom: 4 },
  header: {
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  title: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  hint: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  grid: {
    paddingHorizontal: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  card: {
    width: '48.5%',
    height: 118,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#1E1033',
        shadowOpacity: 0.12,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 3 },
    }),
  },
  bg: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 12,
  },
  bgImg: { borderRadius: 16 },
  shade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16, 6, 32, 0.48)',
    borderRadius: 16,
  },
  iconPill: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  cardSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
