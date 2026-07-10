import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { colors } from '../constants/theme';

export default function AdminNotifications() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const dash = await api.get('/dashboard');
      const notes = [];
      const s = dash?.stats || {};
      if (s.totalUsers != null) {
        notes.push({
          id: 'users',
          title: 'Users',
          message: `Total users: ${s.totalUsers}${s.blockedUsers ? ` · Blocked: ${s.blockedUsers}` : ''}`,
          icon: 'people',
        });
      }
      if (s.totalAstrologers != null) {
        notes.push({
          id: 'astros',
          title: 'Astrologers',
          message: `Total: ${s.totalAstrologers}${s.onlineAstrologers != null ? ` · Online: ${s.onlineAstrologers}` : ''}`,
          icon: 'planet',
        });
      }
      if (s.totalOrders != null) {
        notes.push({
          id: 'orders',
          title: 'Orders',
          message: `Total orders: ${s.totalOrders}`,
          icon: 'cart',
        });
      }
      (dash?.recentOrders || []).slice(0, 8).forEach((o, i) => {
        notes.push({
          id: `order-${o._id || i}`,
          title: `Order ${o.status || ''}`.trim(),
          message: `${o.user?.name || 'User'} · ₹${o.totalAmount ?? o.amount ?? '—'}`,
          icon: 'receipt',
          route: '/section/orders',
        });
      });
      (dash?.recentUsers || []).slice(0, 5).forEach((u, i) => {
        notes.push({
          id: `user-${u._id || i}`,
          title: 'New user activity',
          message: `${u.name || u.phone || u.email || 'User'} joined / updated`,
          icon: 'person-add',
          route: '/section/users',
        });
      });
      setItems(notes);
    } catch {
      setItems([{
        id: 'err',
        title: 'Could not load',
        message: 'Dashboard notifications load nahi hue. Server check karo.',
        icon: 'warning',
      }]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.heading}>Notifications</Text>
      </View>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
          }
          ListEmptyComponent={<Text style={styles.empty}>No notifications</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => item.route && router.push(item.route)}
            >
              <View style={styles.icon}>
                <Ionicons name={item.icon || 'notifications'} size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.msg}>{item.message}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 10 },
  back: { padding: 4 },
  heading: { fontSize: 20, fontWeight: '800', color: colors.text },
  list: { padding: 16, paddingBottom: 40 },
  card: {
    flexDirection: 'row', gap: 12, alignItems: 'center',
    backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  icon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryLight || '#FFF8E1',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 14, fontWeight: '800', color: colors.text },
  msg: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
});
