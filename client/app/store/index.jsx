import { FlatList, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import RemoteImage from '../../components/common/RemoteImage';
import { fetchProducts } from '../../redux/storeSlice';
import { PRODUCTS } from '../../constants/mockData';
import { COLORS } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatters';

const CATEGORIES = ['All', 'jewelry', 'rudraksha', 'gemstones', 'consultation'];

export default function StoreScreen() {
  const dispatch = useDispatch();
  const { products: apiProducts, loading } = useSelector((s) => s.store);
  const [category, setCategory] = useState('All');

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const products = apiProducts.length ? apiProducts : PRODUCTS;
  const filtered = category === 'All'
    ? products
    : products.filter((p) => p.category?.toLowerCase() === category.toLowerCase());

  return (
    <View style={styles.container}>
      <Header title="Astro Store" />

      {loading && !products.length ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <>
              <View style={styles.hero}>
                <Ionicons name="bag-handle" size={28} color="#FFF" />
                <Text style={styles.heroTitle}>Authentic Products</Text>
                <Text style={styles.heroSub}>Rudraksha, Gemstones, Yantras & more</Text>
              </View>
              <View style={styles.categories}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catChip, category === cat && styles.catActive]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.catText, category === cat && styles.catTextActive]}>
                      {cat === 'All' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} activeOpacity={0.85}>
              <RemoteImage uri={item.image} type="product" style={styles.image} fallbackIcon="diamond-outline" />
              <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.price}>{formatCurrency(item.price)}</Text>
                <TouchableOpacity style={styles.cartBtn}>
                  <Ionicons name="cart" size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  list: { padding: 12, paddingBottom: 32 },
  hero: { backgroundColor: '#06B6D4', borderRadius: 12, padding: 16, marginBottom: 12, marginHorizontal: 4, alignItems: 'center' },
  heroTitle: { color: '#FFF', fontSize: 18, fontWeight: '800', marginTop: 6 },
  heroSub: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 4 },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12, paddingHorizontal: 4 },
  catChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  catActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  catTextActive: { color: '#FFF' },
  row: { justifyContent: 'space-between', paddingHorizontal: 4 },
  card: { width: '48%', backgroundColor: COLORS.surface, borderRadius: 12, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: COLORS.borderLight },
  image: { width: '100%', height: 130, borderRadius: 8 },
  name: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginTop: 8, lineHeight: 18 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  price: { fontSize: 15, fontWeight: '800', color: COLORS.primary },
  cartBtn: { backgroundColor: COLORS.primary, width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
});