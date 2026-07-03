import { useEffect, useState } from 'react';
import { FlatList, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Screen from '../../components/common/Screen';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import EmptyState from '../../components/common/EmptyState';
import { orderApi } from '../../services/orderApi';
import { COLORS } from '../../constants/colors';
import { SHADOW } from '../../constants/theme';
import { formatCurrency, formatDate } from '../../utils/formatters';

const STATUS_COLORS = {
  pending: COLORS.warning,
  confirmed: COLORS.success,
  shipped: '#1976D2',
  delivered: COLORS.success,
  cancelled: COLORS.error,
};

export default function OrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderApi.getAll()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const getOrderTitle = (order) => {
    if (order.orderType === 'pooja') return order.poojaName || 'Pooja Booking';
    const count = order.products?.length || 0;
    return count ? `Store Order (${count} item${count > 1 ? 's' : ''})` : 'Store Order';
  };

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <Header title="Order History" />

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          contentContainerStyle={orders.length ? styles.list : styles.emptyList}
          ListEmptyComponent={
            <EmptyState
              icon="receipt-outline"
              title="No orders yet"
              subtitle="Book a pooja or shop from the store to see your orders here"
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={[styles.iconWrap, item.orderType === 'pooja' ? styles.poojaBg : styles.storeBg]}>
                <Ionicons
                  name={item.orderType === 'pooja' ? 'flame' : 'bag-handle'}
                  size={20}
                  color={item.orderType === 'pooja' ? COLORS.warning : COLORS.primary}
                />
              </View>
              <View style={styles.info}>
                <Text style={styles.title}>{getOrderTitle(item)}</Text>
                <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[item.status] || COLORS.textLight) + '20' }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] || COLORS.textSecondary }]}>
                    {item.status?.charAt(0).toUpperCase() + item.status?.slice(1)}
                  </Text>
                </View>
              </View>
              <Text style={styles.amount}>{formatCurrency(item.totalAmount)}</Text>
            </View>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 32 },
  emptyList: { flexGrow: 1 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.borderLight,
  },
  iconWrap: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  poojaBg: { backgroundColor: '#FFF8E1' },
  storeBg: { backgroundColor: COLORS.primaryLight },
  info: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  date: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 6 },
  statusText: { fontSize: 11, fontWeight: '700' },
  amount: { fontSize: 15, fontWeight: '800', color: COLORS.text },
});