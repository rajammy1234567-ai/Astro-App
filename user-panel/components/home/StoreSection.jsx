import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import RemoteImage from '../common/RemoteImage';
import { COLORS } from '../../constants/colors';

export default function StoreSection({ products = [] }) {
  const router = useRouter();

  if (!products.length) return null;

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>Astrotalk Store</Text>
        <TouchableOpacity onPress={() => router.push('/store')}>
          <Text style={styles.link}>Visit Store</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {products.map((p) => (
          <TouchableOpacity
            key={p._id}
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => router.push(`/store/${p._id}`)}
          >
            <RemoteImage uri={p.image} type="product" style={styles.image} fallbackIcon="diamond-outline" />
            <Text style={styles.name} numberOfLines={2}>{p.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginTop: 16,
    marginBottom: 10,
  },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  link: { fontSize: 13, fontWeight: '600', color: COLORS.link },
  scroll: { paddingHorizontal: 14, gap: 10 },
  card: {
    width: 90,
    alignItems: 'center',
    backgroundColor: COLORS.yellowLight,
    borderRadius: 8,
    padding: 8,
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  name: { fontSize: 11, fontWeight: '600', color: COLORS.text, marginTop: 6, textAlign: 'center' },
});