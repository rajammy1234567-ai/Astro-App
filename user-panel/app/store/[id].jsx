import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import Screen from '../../components/common/Screen';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import Header from '../../components/common/Header';
import RemoteImage from '../../components/common/RemoteImage';
import Button from '../../components/common/Button';
import { storeApi } from '../../services/storeApi';
import { addToCart, canAddToCart } from '../../redux/storeSlice';
import { useAuth } from '../../hooks/useAuth';
import { requireAuthForPurchase } from '../../utils/purchaseAuth';
import { COLORS } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatters';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const { cart } = useSelector((s) => s.store);
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storeApi.getById(id)
      .then(setProduct)
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (!product || product.stock === 0) return;
    if (!requireAuthForPurchase(router, isAuthenticated)) return;

    const check = canAddToCart(cart, product);
    if (!check.ok) {
      Alert.alert('Cannot Add', check.message);
      return;
    }

    dispatch(addToCart(product));
    Alert.alert('Added to Cart', `${product.name} added to your cart.`, [
      { text: 'Continue Shopping', style: 'cancel' },
      { text: 'View Cart', onPress: () => router.push('/store/cart') },
    ]);
  };

  const handleBuyNow = () => {
    if (!product || product.stock === 0) return;
    if (!requireAuthForPurchase(router, isAuthenticated)) return;

    router.push({ pathname: '/store/cart', params: { buy: product._id } });
  };

  if (loading) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <Header title="Product" />
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  if (!product) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <Header title="Product" />
        <Text style={styles.notFound}>Product not found or no longer available.</Text>
      </Screen>
    );
  }

  const inStock = product.stock > 0;

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <Header title={product.name} />
      <ScrollView contentContainerStyle={styles.content}>
        <RemoteImage uri={product.image} type="product" style={styles.image} fallbackIcon="diamond-outline" />
        <View style={styles.info}>
          <Text style={styles.category}>{product.category?.toUpperCase()}</Text>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>{formatCurrency(product.price)}</Text>
          {inStock ? (
            <Text style={styles.stock}>{product.stock} in stock</Text>
          ) : (
            <Text style={styles.outStock}>Out of stock</Text>
          )}
          {!!product.description && (
            <Text style={styles.desc}>{product.description}</Text>
          )}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button
          title={inStock ? 'Add to Cart' : 'Out of Stock'}
          variant="outline"
          onPress={handleAddToCart}
          disabled={!inStock}
          style={styles.footerBtn}
        />
        <Button
          title={inStock ? 'Buy Now' : 'Unavailable'}
          onPress={handleBuyNow}
          disabled={!inStock}
          style={styles.footerBtn}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 100 },
  image: { width: '100%', height: 280, backgroundColor: COLORS.surface },
  info: { padding: 16 },
  category: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 1 },
  name: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginTop: 6 },
  price: { fontSize: 24, fontWeight: '800', color: COLORS.primary, marginTop: 8 },
  stock: { fontSize: 13, color: COLORS.success, marginTop: 6, fontWeight: '600' },
  outStock: { fontSize: 13, color: COLORS.error, marginTop: 6, fontWeight: '600' },
  desc: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22, marginTop: 16 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: 10,
    padding: 16, paddingBottom: 24, backgroundColor: COLORS.surface,
    borderTopWidth: 1, borderTopColor: COLORS.borderLight,
  },
  footerBtn: { flex: 1 },
  notFound: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 40, padding: 20 },
});