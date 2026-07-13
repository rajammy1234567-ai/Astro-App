import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import RemoteImage from '../common/RemoteImage';
import { COLORS } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatters';

export default function StoreSection({ products = [] }) {
  const router = useRouter();

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Sacred Store</Text>
          <Text style={styles.sub}>Gemstones · Rudraksha · Remedies</Text>
        </View>
        <TouchableOpacity style={styles.visit} onPress={() => router.push('/store')} activeOpacity={0.8}>
          <Text style={styles.link}>Visit</Text>
          <Ionicons name="chevron-forward" size={14} color={COLORS.link} />
        </TouchableOpacity>
      </View>

      {!products.length ? (
        <TouchableOpacity style={styles.empty} onPress={() => router.push('/store')} activeOpacity={0.85}>
          <Ionicons name="diamond-outline" size={28} color={COLORS.primaryDark} />
          <Text style={styles.emptyTitle}>Explore blessed products</Text>
          <Text style={styles.emptySub}>Rudraksha, gemstones & more</Text>
        </TouchableOpacity>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {products.map((p) => (
            <TouchableOpacity
              key={p._id}
              style={styles.card}
              activeOpacity={0.88}
              onPress={() => router.push(`/store/${p._id}`)}
            >
              <RemoteImage
                uri={p.image}
                type="product"
                style={styles.image}
                fallbackIcon="diamond-outline"
              />
              <Text style={styles.name} numberOfLines={2}>
                {p.name}
              </Text>
              <Text style={styles.price}>{formatCurrency(p.price)}</Text>
              {p.stock > 0 ? (
                <TouchableOpacity
                  style={styles.buyChip}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    router.push({ pathname: '/store/cart', params: { buy: p._id } });
                  }}
                >
                  <Text style={styles.buyChipText}>Buy now</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.oos}>Out of stock</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 12,
  },
  title: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  sub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2, fontWeight: '500' },
  visit: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  link: { fontSize: 13, fontWeight: '700', color: COLORS.link },
  scroll: { paddingHorizontal: 14, gap: 12, paddingBottom: 4 },
  card: {
    width: 132,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...Platform.select({
      ios: {
        shadowColor: '#1E1033',
        shadowOpacity: 0.07,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 2 },
    }),
  },
  image: {
    width: '100%',
    height: 96,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
  },
  name: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
    minHeight: 32,
    lineHeight: 16,
  },
  price: { fontSize: 14, fontWeight: '800', color: COLORS.bannerDark, marginTop: 2 },
  buyChip: {
    marginTop: 8,
    backgroundColor: COLORS.success,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
  },
  buyChipText: { fontSize: 11, fontWeight: '800', color: '#FFF' },
  oos: { marginTop: 8, fontSize: 11, color: COLORS.textLight, fontWeight: '600' },
  empty: {
    marginHorizontal: 14,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(253,185,19,0.35)',
  },
  emptyTitle: { marginTop: 8, fontSize: 14, fontWeight: '800', color: COLORS.text },
  emptySub: { marginTop: 2, fontSize: 12, color: COLORS.textSecondary },
});
