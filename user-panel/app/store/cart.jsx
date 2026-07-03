import { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import Screen from '../../components/common/Screen';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import RemoteImage from '../../components/common/RemoteImage';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import {
  updateCartQty, removeFromCart, clearCart,
} from '../../redux/storeSlice';
import { orderApi } from '../../services/orderApi';
import { storeApi } from '../../services/storeApi';
import { fetchWallet } from '../../redux/walletSlice';
import { useAuth } from '../../hooks/useAuth';
import { requireAuthForPurchase } from '../../utils/purchaseAuth';
import { COLORS } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatters';

export default function CartScreen() {
  const router = useRouter();
  const { buy } = useLocalSearchParams();
  const dispatch = useDispatch();
  const { cart } = useSelector((s) => s.store);
  const { balance } = useSelector((s) => s.wallet);
  const { isAuthenticated, initialized } = useAuth();
  const [address, setAddress] = useState('');
  const [placing, setPlacing] = useState(false);
  const [buyNowItem, setBuyNowItem] = useState(null);
  const [buyLoading, setBuyLoading] = useState(!!buy);

  const isBuyNow = !!buy && !!buyNowItem;
  const items = isBuyNow ? [buyNowItem] : cart;

  useEffect(() => {
    if (!initialized || !isAuthenticated) return;
    dispatch(fetchWallet());
  }, [dispatch, initialized, isAuthenticated]);

  useEffect(() => {
    if (!buy) {
      setBuyNowItem(null);
      setBuyLoading(false);
      return;
    }

    setBuyLoading(true);
    storeApi.getById(buy)
      .then((product) => {
        if (!product || product.stock <= 0) {
          Alert.alert('Unavailable', 'This product is out of stock.', [
            { text: 'OK', onPress: () => router.replace('/store') },
          ]);
          return;
        }
        setBuyNowItem({ ...product, quantity: 1 });
      })
      .catch(() => {
        Alert.alert('Error', 'Product load nahi ho paya.', [
          { text: 'OK', onPress: () => router.replace('/store') },
        ]);
      })
      .finally(() => setBuyLoading(false));
  }, [buy, router]);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0),
    [items]
  );

  const handleQtyChange = (item, delta) => {
    const nextQty = (item.quantity || 1) + delta;
    if (isBuyNow) {
      const maxStock = item.stock ?? 1;
      const clamped = Math.max(1, Math.min(nextQty, maxStock));
      setBuyNowItem({ ...item, quantity: clamped });
      return;
    }
    dispatch(updateCartQty({ id: item._id, quantity: nextQty }));
  };

  const handleRemove = (item) => {
    if (isBuyNow) {
      router.replace('/store');
      return;
    }
    dispatch(removeFromCart(item._id));
  };

  const handlePlaceOrder = async () => {
    if (!requireAuthForPurchase(router, isAuthenticated)) return;

    if (!address.trim()) {
      Alert.alert('Address Required', 'Please enter your shipping address.');
      return;
    }
    if (balance < total) {
      Alert.alert(
        'Low Balance',
        `You need ${formatCurrency(total)} but have ${formatCurrency(balance)}. Please recharge wallet.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Recharge', onPress: () => router.push('/wallet') },
        ]
      );
      return;
    }

    setPlacing(true);
    try {
      const res = await orderApi.create({
        products: items.map((item) => ({
          product: item._id,
          quantity: item.quantity || 1,
        })),
        shippingAddress: address.trim(),
      });
      if (!isBuyNow) dispatch(clearCart());
      dispatch(fetchWallet());
      Alert.alert(
        'Order Placed!',
        `Your order is confirmed. Remaining balance: ${formatCurrency(res.balance)}`,
        [{ text: 'View Orders', onPress: () => router.replace('/orders') }]
      );
    } catch (err) {
      Alert.alert('Order Failed', err.message || 'Could not place order.');
    } finally {
      setPlacing(false);
    }
  };

  if (!initialized || buyLoading) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <Header title={buy ? 'Buy Now' : 'My Cart'} />
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  if (!isAuthenticated) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <Header title={buy ? 'Buy Now' : 'My Cart'} />
        <EmptyState
          icon="lock-closed-outline"
          title="Login Required"
          subtitle="Product buy karne ke liye pehle login ya account banao"
          actionLabel="Login"
          onAction={() => router.push('/(auth)/login')}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <Header title={isBuyNow ? 'Buy Now' : 'My Cart'} />

      {items.length === 0 ? (
        <EmptyState
          icon="cart-outline"
          title="Cart is empty"
          subtitle="Browse the store and add products to your cart"
          actionLabel="Visit Store"
          onAction={() => router.push('/store')}
        />
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={styles.item}>
                <RemoteImage uri={item.image} type="product" style={styles.thumb} fallbackIcon="diamond-outline" />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
                  <View style={styles.qtyRow}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => handleQtyChange(item, -1)}
                    >
                      <Ionicons name="remove" size={16} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.qty}>{item.quantity || 1}</Text>
                    <TouchableOpacity
                      style={[
                        styles.qtyBtn,
                        (item.quantity || 1) >= (item.stock ?? 999) && styles.qtyBtnDisabled,
                      ]}
                      onPress={() => handleQtyChange(item, 1)}
                      disabled={(item.quantity || 1) >= (item.stock ?? 999)}
                    >
                      <Ionicons name="add" size={16} color={COLORS.text} />
                    </TouchableOpacity>
                    {item.stock > 0 && (
                      <Text style={styles.stockHint}>{item.stock} available</Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity onPress={() => handleRemove(item)}>
                  <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            )}
          />

          <View style={styles.checkout}>
            <Text style={styles.label}>Shipping Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Full address with pincode"
              placeholderTextColor={COLORS.textLight}
              value={address}
              onChangeText={setAddress}
              multiline
            />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
            </View>
            <Text style={styles.balance}>Wallet balance: {formatCurrency(balance)}</Text>
            <Button
              title={`Place Order · ${formatCurrency(total)}`}
              onPress={handlePlaceOrder}
              loading={placing}
            />
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 280 },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.surface, borderRadius: 10, padding: 12, marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  thumb: { width: 64, height: 64, borderRadius: 8 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  itemPrice: { fontSize: 15, fontWeight: '800', color: COLORS.primary, marginTop: 4 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' },
  qtyBtn: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.cream,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  qtyBtnDisabled: { opacity: 0.4 },
  qty: { fontSize: 14, fontWeight: '700', minWidth: 20, textAlign: 'center' },
  stockHint: { fontSize: 11, color: COLORS.textSecondary },
  checkout: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.surface, padding: 16, paddingBottom: 24,
    borderTopWidth: 1, borderTopColor: COLORS.borderLight,
  },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.cream, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border,
    padding: 12, fontSize: 14, color: COLORS.text, minHeight: 60, textAlignVertical: 'top',
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, marginBottom: 4 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  totalValue: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  balance: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 12 },
});