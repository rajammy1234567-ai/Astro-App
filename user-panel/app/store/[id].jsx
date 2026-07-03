import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import RemoteImage from '../../components/common/RemoteImage';
import Button from '../../components/common/Button';
import { storeApi } from '../../services/storeApi';
import { addToCart } from '../../redux/storeSlice';
import { COLORS } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatters';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
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
    dispatch(addToCart(product));
    Alert.alert('Added to Cart', `${product.name} added to your cart.`, [
      { text: 'Continue Shopping', style: 'cancel' },
      { text: 'View Cart', onPress: () => router.push('/store/cart') },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Product" />
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.container}>
        <Header title="Product" />
        <Text style={styles.notFound}>Product not found or no longer available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title={product.name} />
      <ScrollView contentContainerStyle={styles.content}>
        <RemoteImage uri={product.image} type="product" style={styles.image} fallbackIcon="diamond-outline" />
        <View style={styles.info}>
          <Text style={styles.category}>{product.category?.toUpperCase()}</Text>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>{formatCurrency(product.price)}</Text>
          {product.stock > 0 ? (
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
          title={product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          onPress={handleAddToCart}
          disabled={product.stock === 0}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
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
    padding: 16, paddingBottom: 24, backgroundColor: COLORS.surface,
    borderTopWidth: 1, borderTopColor: COLORS.borderLight,
  },
  notFound: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 40, padding: 20 },
});