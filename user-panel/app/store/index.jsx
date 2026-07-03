import { FlatList, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import Screen from '../../components/common/Screen';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import RemoteImage from '../../components/common/RemoteImage';
import EmptyState from '../../components/common/EmptyState';
import { fetchProducts, addToCart, canAddToCart, selectCartCount } from '../../redux/storeSlice';
import { useAuth } from '../../hooks/useAuth';
import { requireAuthForPurchase } from '../../utils/purchaseAuth';
import { COLORS } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatters';

const CATEGORIES = ['All', 'jewelry', 'rudraksha', 'gemstones', 'consultation', 'yantra', 'pooja-items'];

export default function StoreScreen() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { products, cart, loading, error } = useSelector((s) => s.store);
  const cartCount = useSelector(selectCartCount);
  const { isAuthenticated } = useAuth();
  const [category, setCategory] = useState('All');

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchProducts());
    }, [dispatch])
  );

  const filtered = category === 'All'
    ? products
    : products.filter((p) => p.category?.toLowerCase() === category.toLowerCase());

  const handleAddToCart = (item) => {
    if (item.stock === 0) {
      Alert.alert('Out of Stock', 'This product is currently unavailable.');
      return;
    }
    if (!requireAuthForPurchase(router, isAuthenticated)) return;

    const check = canAddToCart(cart, item);
    if (!check.ok) {
      Alert.alert('Cannot Add', check.message);
      return;
    }

    dispatch(addToCart(item));
    Alert.alert('Added', `${item.name} cart mein add ho gaya.`, [
      { text: 'OK', style: 'cancel' },
      { text: 'Checkout', onPress: () => router.push('/store/cart') },
    ]);
  };

  const handleBuyNow = (item) => {
    if (item.stock === 0) {
      Alert.alert('Out of Stock', 'This product is currently unavailable.');
      return;
    }
    if (!requireAuthForPurchase(router, isAuthenticated)) return;
    router.push({ pathname: '/store/cart', params: { buy: item._id } });
  };

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <Header
        title="Astro Store"
        showBack={false}
        rightComponent={
          <TouchableOpacity style={styles.cartIcon} onPress={() => router.push('/store/cart')}>
            <Ionicons name="cart" size={22} color={COLORS.text} />
            {cartCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        }
      />

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : error && !products.length ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="Store unavailable"
          subtitle="Could not load products. Check your connection and try again."
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[styles.list, !filtered.length && styles.emptyList]}
          ListEmptyComponent={
            <EmptyState
              icon="bag-outline"
              title="No products yet"
              subtitle="Admin will add products soon. Check back later!"
            />
          }
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
                      {cat === 'All' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => router.push(`/store/${item._id}`)}
            >
              <RemoteImage uri={item.image} type="product" style={styles.image} fallbackIcon="diamond-outline" />
              <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.price}>{formatCurrency(item.price)}</Text>
                {item.stock > 0 ? (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.cartBtn}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        handleAddToCart(item);
                      }}
                    >
                      <Ionicons name="cart" size={14} color="#FFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.buyBtn}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        handleBuyNow(item);
                      }}
                    >
                      <Text style={styles.buyBtnText}>Buy</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={styles.outStock}>Sold out</Text>
                )}
              </View>
              {item.stock <= 5 && item.stock > 0 && (
                <Text style={styles.lowStock}>Only {item.stock} left</Text>
              )}
              {item.stock === 0 && <Text style={styles.outStock}>Out of stock</Text>}
            </TouchableOpacity>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 12, paddingBottom: 32 },
  emptyList: { flexGrow: 1 },
  cartIcon: { padding: 4, position: 'relative' },
  badge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: COLORS.error, borderRadius: 8,
    minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center',
  },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
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
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cartBtn: { backgroundColor: COLORS.primary, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  buyBtn: { backgroundColor: COLORS.success, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6 },
  buyBtnText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  lowStock: { fontSize: 10, color: COLORS.warning, marginTop: 4, fontWeight: '600' },
  outStock: { fontSize: 10, color: COLORS.error, marginTop: 4, fontWeight: '600' },
});