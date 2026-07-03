import { useEffect, useState } from 'react';
import { FlatList, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Screen from '../../components/common/Screen';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import { freeServiceApi } from '../../services/freeServiceApi';
import { COLORS } from '../../constants/colors';

const FALLBACK = [
  { _id: '1', title: 'Free Kundli', description: 'Generate your birth chart', icon: 'planet-outline', route: '/kundli' },
  { _id: '2', title: 'Daily Horoscope', description: "Today's predictions", icon: 'sunny-outline', route: '/kundli' },
  { _id: '3', title: 'Astrology Blog', description: 'Free articles', icon: 'newspaper-outline', route: '/blog' },
];

export default function FreeServicesScreen() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    freeServiceApi.getAll()
      .then(setServices)
      .catch(() => setServices(FALLBACK))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <Header title="Free Services" />

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.hero}>
              <Ionicons name="sparkles" size={28} color="#FFF" />
              <Text style={styles.heroTitle}>100% Free for You</Text>
              <Text style={styles.heroSub}>Explore astrology tools at no cost</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => item.route && router.push(item.route)}
              activeOpacity={0.8}
            >
              <View style={styles.iconWrap}>
                <Ionicons name={item.icon || 'gift-outline'} size={24} color={COLORS.primary} />
              </View>
              <View style={styles.info}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.desc}>{item.description}</Text>
              </View>
              <View style={styles.freeBadge}>
                <Text style={styles.freeText}>FREE</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
            </TouchableOpacity>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 32 },
  hero: {
    backgroundColor: COLORS.success, borderRadius: 12, padding: 18,
    alignItems: 'center', marginBottom: 16,
  },
  heroTitle: { color: '#FFF', fontSize: 17, fontWeight: '800', marginTop: 6 },
  heroSub: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 4 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.borderLight, gap: 12,
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  info: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  desc: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  freeBadge: { backgroundColor: COLORS.successLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  freeText: { fontSize: 10, fontWeight: '800', color: COLORS.success },
});