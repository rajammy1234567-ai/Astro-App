import { useEffect, useState } from 'react';
import { FlatList, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Screen from '../../components/common/Screen';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import { freeServiceApi } from '../../services/freeServiceApi';
import { COLORS } from '../../constants/colors';
import { SHADOW_MD } from '../../constants/theme';

const FALLBACK = [
  {
    _id: '1',
    title: 'Free Kundli',
    description: 'Actual birth chart — Sun, Moon, Lagna, planets',
    icon: 'planet-outline',
    route: '/kundli',
  },
  {
    _id: '2',
    title: 'Kundli Matching',
    description: 'Ashtakoot gun milan (36 points)',
    icon: 'heart-outline',
    route: '/kundli/match',
  },
  {
    _id: '3',
    title: 'Daily Horoscope',
    description: "Today's rashi predictions",
    icon: 'sunny-outline',
    route: '/horoscope',
  },
  {
    _id: '4',
    title: 'Panchang',
    description: 'Tithi, nakshatra, rahu kaal, muhurat',
    icon: 'calendar-outline',
    route: '/panchang',
  },
  {
    _id: '5',
    title: 'Numerology',
    description: 'Life path & name numbers',
    icon: 'calculator-outline',
    route: '/numerology',
  },
  {
    _id: '6',
    title: 'Astrology Blog',
    description: 'Free articles',
    icon: 'newspaper-outline',
    route: '/blog',
  },
];

/** Map old seed routes that pointed everything to /kundli */
function resolveRoute(item) {
  const title = String(item.title || '').toLowerCase();
  if (item.route && !item.route.includes('kundli') && item.route !== '/kundli') {
    return item.route;
  }
  if (title.includes('match')) return '/kundli/match';
  if (title.includes('horoscope')) return '/horoscope';
  if (title.includes('panchang')) return '/panchang';
  if (title.includes('numero')) return '/numerology';
  if (title.includes('blog')) return '/blog';
  if (title.includes('chat')) return '/(tabs)/chat';
  if (title.includes('kundli')) return '/kundli';
  return item.route || '/kundli';
}

export default function FreeServicesScreen() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    freeServiceApi.getAll()
      .then((list) => {
        if (Array.isArray(list) && list.length) {
          // Ensure matching + all tools present even if DB has old list
          const titles = list.map((s) => String(s.title || '').toLowerCase());
          const merged = [...list];
          FALLBACK.forEach((f) => {
            const key = f.title.toLowerCase();
            if (!titles.some((t) => t.includes(key.split(' ')[0]) || t === key)) {
              merged.push(f);
            }
          });
          setServices(merged);
        } else {
          setServices(FALLBACK);
        }
      })
      .catch(() => setServices(FALLBACK))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Screen edges={['left', 'right', 'bottom']} style={styles.screen}>
      <Header title="Free Services" subtitle="Kundli · Horoscope · Panchang · Numerology" />

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => item._id || item.title}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.hero}>
              <View style={styles.badge}>
                <Ionicons name="sparkles" size={12} color={COLORS.primaryDark} />
                <Text style={styles.badgeText}>100% FREE TOOLS</Text>
              </View>
              <Text style={styles.heroTitle}>Explore free astrology tools</Text>
              <Text style={styles.heroSub}>
                Actual calculations from your birth details — kundli match, daily rashi, panchang & numbers.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const route = resolveRoute(item);
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(route)}
                activeOpacity={0.85}
              >
                <View style={styles.iconWrap}>
                  <Ionicons name={item.icon || 'gift-outline'} size={22} color={COLORS.primaryDark} />
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
            );
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.cream },
  list: { padding: 16, paddingBottom: 32 },
  hero: {
    backgroundColor: COLORS.primaryLight, borderRadius: 16, padding: 18,
    marginBottom: 16, borderWidth: 1, borderColor: COLORS.primary + '55', ...SHADOW_MD,
  },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: COLORS.surface, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: COLORS.primary, marginBottom: 10,
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: COLORS.primaryDark },
  heroTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  heroSub: { color: COLORS.textSecondary, fontSize: 12, marginTop: 6, lineHeight: 18 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.borderLight, gap: 12,
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  info: { flex: 1 },
  title: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  desc: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, lineHeight: 17 },
  freeBadge: { backgroundColor: COLORS.successLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  freeText: { fontSize: 10, fontWeight: '800', color: COLORS.success },
});
