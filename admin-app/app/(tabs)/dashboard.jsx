import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '../../services/api';
import { SECTION_GROUPS } from '../../constants/sections';
import { colors } from '../../constants/theme';

const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await api.get('/dashboard');
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const stats = data?.stats;
  const cards = [
    { label: 'Users', value: stats?.totalUsers ?? 0, color: '#3b82f6' },
    { label: 'Astrologers', value: stats?.totalAstrologers ?? 0, sub: `${stats?.onlineAstrologers ?? 0} online`, color: '#8b5cf6' },
    { label: 'Orders', value: stats?.totalOrders ?? 0, color: '#f59e0b' },
    { label: 'Revenue', value: fmt(stats?.totalRevenue), color: '#22c55e' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
      >
        <Text style={styles.heading}>☀️ Admin Dashboard</Text>
        <Text style={styles.sub}>Web panel jaisi saari features — phone se manage karo</Text>

        <View style={styles.grid}>
          {cards.map((c) => (
            <View key={c.label} style={[styles.card, { borderTopColor: c.color }]}>
              <Text style={styles.cardLabel}>{c.label}</Text>
              <Text style={styles.cardValue}>{c.value}</Text>
              {c.sub && <Text style={styles.cardSub}>{c.sub}</Text>}
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Quick Manage</Text>
        {SECTION_GROUPS.map((group) => (
          <View key={group.title}>
            <Text style={styles.groupLabel}>{group.title}</Text>
            <View style={styles.quickGrid}>
              {group.items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.quickItem}
                  onPress={() => router.push(`/section/${item.id}`)}
                >
                  <Text style={styles.quickIcon}>{item.icon}</Text>
                  <Text style={styles.quickText} numberOfLines={2}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Recent Orders</Text>
        {(data?.recentOrders || []).slice(0, 5).map((o) => (
          <View key={o._id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{o.orderType === 'pooja' ? o.poojaName : 'Store Order'}</Text>
              <Text style={styles.rowSub}>{o.user?.name || 'User'} · {o.status}</Text>
            </View>
            <Text style={styles.rowAmt}>{fmt(o.totalAmount)}</Text>
          </View>
        ))}

        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>New Users</Text>
        {(data?.recentUsers || []).slice(0, 5).map((u) => (
          <View key={u._id} style={styles.row}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{u.name?.charAt(0) || 'U'}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{u.name}</Text>
              <Text style={styles.rowSub}>{u.phone || u.email || '-'}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 26, fontWeight: '700', color: colors.text },
  sub: { fontSize: 13, color: colors.textMuted, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  card: {
    width: '47%', backgroundColor: colors.card, borderRadius: 12, padding: 16,
    borderTopWidth: 3, borderWidth: 1, borderColor: colors.border,
  },
  cardLabel: { fontSize: 12, color: colors.textMuted },
  cardValue: { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: 4 },
  cardSub: { fontSize: 11, color: colors.success, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 10 },
  groupLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', marginBottom: 8, marginTop: 4 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  quickItem: {
    width: '30%', backgroundColor: colors.card, borderRadius: 12, padding: 12,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border, minHeight: 80,
  },
  quickIcon: { fontSize: 24, marginBottom: 6 },
  quickText: { fontSize: 10, fontWeight: '600', color: colors.text, textAlign: 'center' },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border,
  },
  rowTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  rowSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  rowAmt: { fontSize: 14, fontWeight: '700', color: colors.primary },
  avatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: colors.primary },
});