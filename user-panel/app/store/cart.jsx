import { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert,
  ActivityIndicator, Modal, ScrollView,
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
import { SHADOW_MD } from '../../constants/theme';
import { formatCurrency } from '../../utils/formatters';

const PAY_METHODS = [
  {
    id: 'wallet',
    label: 'Wallet',
    sub: 'AstroTalk balance se',
    icon: 'wallet-outline',
  },
  {
    id: 'upi',
    label: 'UPI',
    sub: 'Any UPI app',
    icon: 'phone-portrait-outline',
  },
  {
    id: 'gpay',
    label: 'GPay',
    sub: 'Google Pay',
    icon: 'logo-google',
  },
  {
    id: 'card',
    label: 'Card',
    sub: 'Debit / Credit',
    icon: 'card-outline',
  },
];

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
  const [payMethod, setPayMethod] = useState('upi');
  const [paySheet, setPaySheet] = useState(false);
  const [paying, setPaying] = useState(false);

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

  const walletOk = balance >= total;
  const selectedMeta = PAY_METHODS.find((m) => m.id === payMethod) || PAY_METHODS[0];

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

  const placeOrderPayload = (paymentId) => ({
    products: items.map((item) => ({
      product: item._id,
      quantity: item.quantity || 1,
    })),
    shippingAddress: address.trim(),
    paymentMethod: payMethod,
    paymentId: paymentId || undefined,
  });

  const finishSuccess = async (res) => {
    if (!isBuyNow) dispatch(clearCart());
    dispatch(fetchWallet());
    setPaySheet(false);
    const method =
      res.paymentMethod === 'wallet'
        ? 'Wallet'
        : res.paymentMethod === 'gpay'
          ? 'GPay'
          : res.paymentMethod === 'upi'
            ? 'UPI'
            : res.paymentMethod === 'card'
              ? 'Card'
              : 'Online';
    Alert.alert(
      'Order Placed!',
      `${res.message || 'Order confirmed'}\nPaid via ${method}${
        res.balance != null && payMethod === 'wallet'
          ? `\nWallet left: ${formatCurrency(res.balance)}`
          : ''
      }`,
      [{ text: 'View Orders', onPress: () => router.replace('/orders') }]
    );
  };

  const handlePlaceOrder = async () => {
    if (!requireAuthForPurchase(router, isAuthenticated)) return;

    if (!address.trim()) {
      Alert.alert('Address Required', 'Please enter your shipping address.');
      return;
    }

    if (payMethod === 'wallet') {
      if (!walletOk) {
        Alert.alert(
          'Low Wallet Balance',
          `Wallet me ${formatCurrency(balance)} hai, order ${formatCurrency(total)} ka hai.\n\nUPI / GPay / Card se bhi pay kar sakte ho — wallet zaroori nahi.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Pay with UPI', onPress: () => setPayMethod('upi') },
            { text: 'Recharge', onPress: () => router.push('/wallet/add-money') },
          ]
        );
        return;
      }
      setPlacing(true);
      try {
        const res = await orderApi.create(placeOrderPayload(`wallet_${Date.now()}`));
        await finishSuccess(res);
      } catch (err) {
        Alert.alert('Order Failed', err.message || 'Could not place order.');
      } finally {
        setPlacing(false);
      }
      return;
    }

    // UPI / GPay / Card → dummy payment sheet
    setPaySheet(true);
  };

  const completeOnlinePayment = async () => {
    setPaying(true);
    try {
      // Dummy gateway delay (real GPay/UPI later)
      await new Promise((r) => setTimeout(r, 900));
      const paymentId = `pay_${payMethod}_${Date.now()}`;
      const res = await orderApi.create(placeOrderPayload(paymentId));
      await finishSuccess(res);
    } catch (err) {
      Alert.alert('Payment Failed', err.message || 'Payment complete nahi hua.');
    } finally {
      setPaying(false);
    }
  };

  if (!initialized || buyLoading) {
    return (
      <Screen edges={['left', 'right', 'bottom']} style={styles.screen}>
        <Header title={buy ? 'Buy Now' : 'My Cart'} />
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  if (!isAuthenticated) {
    return (
      <Screen edges={['left', 'right', 'bottom']} style={styles.screen}>
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
    <Screen edges={['left', 'right', 'bottom']} style={styles.screen}>
      <Header title={isBuyNow ? 'Buy Now' : 'My Cart'} subtitle="Pay by wallet, UPI or GPay" />

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
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.checkoutInner}
            >
              <Text style={styles.label}>Shipping Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Full address with pincode"
                placeholderTextColor={COLORS.textLight}
                value={address}
                onChangeText={setAddress}
                multiline
              />

              <Text style={[styles.label, { marginTop: 12 }]}>Payment method</Text>
              <Text style={styles.payHint}>
                Store ke liye wallet zaroori nahi — UPI / GPay / Card se bhi order kar sakte ho.
              </Text>
              <View style={styles.payGrid}>
                {PAY_METHODS.map((m) => {
                  const active = payMethod === m.id;
                  const walletDisabled = m.id === 'wallet' && !walletOk;
                  return (
                    <TouchableOpacity
                      key={m.id}
                      style={[
                        styles.payCard,
                        active && styles.payCardActive,
                        walletDisabled && styles.payCardWarn,
                      ]}
                      onPress={() => setPayMethod(m.id)}
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name={m.icon}
                        size={18}
                        color={active ? COLORS.primaryDark : COLORS.textSecondary}
                      />
                      <Text style={[styles.payLabel, active && styles.payLabelActive]}>{m.label}</Text>
                      <Text style={styles.paySub} numberOfLines={1}>{m.sub}</Text>
                      {m.id === 'wallet' && (
                        <Text style={[styles.payBal, !walletOk && styles.payBalLow]}>
                          {formatCurrency(balance)}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
              </View>
              <Text style={styles.balance}>
                Paying with: {selectedMeta.label}
                {payMethod === 'wallet' ? ` · Wallet ${formatCurrency(balance)}` : ' · Online (demo)'}
              </Text>
              <Button
                title={
                  payMethod === 'wallet'
                    ? `Pay from Wallet · ${formatCurrency(total)}`
                    : `Pay with ${selectedMeta.label} · ${formatCurrency(total)}`
                }
                onPress={handlePlaceOrder}
                loading={placing}
              />
            </ScrollView>
          </View>
        </>
      )}

      {/* Dummy UPI / GPay / Card sheet */}
      <Modal visible={paySheet} transparent animationType="slide" onRequestClose={() => !paying && setPaySheet(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHero}>
              <View style={styles.sheetBadge}>
                <Ionicons name={selectedMeta.icon} size={14} color={COLORS.primaryDark} />
                <Text style={styles.sheetBadgeText}>{selectedMeta.label.toUpperCase()} · DEMO</Text>
              </View>
              <Text style={styles.sheetTitle}>Complete Payment</Text>
              <Text style={styles.sheetSub}>AstroTalk Store order</Text>
            </View>

            <View style={styles.amountBox}>
              <Text style={styles.amountLabel}>Amount to pay</Text>
              <Text style={styles.amountVal}>{formatCurrency(total)}</Text>
            </View>

            <Text style={styles.demoNote}>
              Abhi dummy payment hai — success pe order place ho jayega. Real GPay/UPI keys baad me laga lena.
            </Text>

            <TouchableOpacity
              style={[styles.payBtn, paying && { opacity: 0.7 }]}
              onPress={completeOnlinePayment}
              disabled={paying}
              activeOpacity={0.88}
            >
              {paying ? (
                <ActivityIndicator color={COLORS.text} />
              ) : (
                <>
                  <Text style={styles.payBtnText}>
                    Pay {formatCurrency(total)} via {selectedMeta.label}
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color={COLORS.text} />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => !paying && setPaySheet(false)}
              disabled={paying}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.cream },
  list: { padding: 16, paddingBottom: 360 },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 12, marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  thumb: { width: 64, height: 64, borderRadius: 8 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  itemPrice: { fontSize: 15, fontWeight: '800', color: COLORS.primaryDark, marginTop: 4 },
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
    maxHeight: '58%',
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    ...SHADOW_MD,
  },
  checkoutInner: { padding: 16, paddingBottom: 28 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.cream, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border,
    padding: 12, fontSize: 14, color: COLORS.text, minHeight: 56, textAlignVertical: 'top',
  },
  payHint: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 10,
    lineHeight: 16,
    fontWeight: '500',
  },
  payGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  payCard: {
    width: '48%',
    backgroundColor: COLORS.cream,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
  },
  payCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  payCardWarn: {
    opacity: 0.85,
  },
  payLabel: { fontSize: 13, fontWeight: '800', color: COLORS.text, marginTop: 6 },
  payLabelActive: { color: COLORS.text },
  paySub: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2 },
  payBal: { fontSize: 11, fontWeight: '700', color: COLORS.success, marginTop: 4 },
  payBalLow: { color: COLORS.error },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, marginBottom: 4 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  totalValue: { fontSize: 18, fontWeight: '800', color: COLORS.primaryDark },
  balance: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 12, fontWeight: '500' },

  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.cream,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 18,
    paddingBottom: 28,
    paddingTop: 10,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    marginBottom: 12,
  },
  sheetHero: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.primary + '55',
  },
  sheetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  sheetBadgeText: { fontSize: 10, fontWeight: '800', color: COLORS.primaryDark },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  sheetSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  amountBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  amountLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  amountVal: { fontSize: 28, fontWeight: '800', color: COLORS.text, marginTop: 4 },
  demoNote: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
    marginBottom: 14,
    fontWeight: '500',
  },
  payBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  payBtnText: { color: COLORS.text, fontSize: 15, fontWeight: '800' },
  cancelBtn: { alignItems: 'center', paddingVertical: 10 },
  cancelText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
});
