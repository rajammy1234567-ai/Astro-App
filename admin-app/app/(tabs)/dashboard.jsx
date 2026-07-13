import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
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

  useEffect(() => {
    load();
  }, []);

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
    {
      label: 'Astrologers',
      value: stats?.totalAstrologers ?? 0,
      sub: `${stats?.onlineAstrologers ?? 0} online`,
      color: '#8b5cf6',
    },
    { label: 'Orders', value: stats?.totalOrders ?? 0, color: '#f59e0b' },
    { label: 'Revenue', value: fmt(stats?.totalRevenue), color: '#22c55e' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={styles.heading}>Admin Control</Text>
        <Text style={styles.sub}>Users · Sales · Time · Astrologer details — sab yahan</Text>

        <TouchableOpacity
          style={styles.analyticsBanner}
          onPress={() => router.push('/section/analytics')}
          activeOpacity={0.9}
        >
          <Text style={styles.analyticsTitle}>📊 Full Analytics</Text>
          <Text style={styles.analyticsSub}>
            Har astrologer ki earning, session time, online time, users baat, sales — open karo
          </Text>
          <Text style={styles.analyticsCta}>Open details →</Text>
        </TouchableOpacity>

        <View style={styles.grid}>
          {cards.map((c) => (
            <View key={c.label} style={[styles.card, { borderTopColor: c.color }]}>
              <Text style={styles.cardLabel}>{c.label}</Text>
              <Text style={styles.cardValue}>{c.value}</Text>
              {c.sub ? <Text style={styles.cardSub}>{c.sub}</Text> : null}
            </View>
          ))}
        </View>

        {/* Money flow — pooja/remedy escrow */}
        <TouchableOpacity
          style={styles.escrowCard}
          activeOpacity={0.9}
          onPress={() => router.push('/section/payouts')}
        >
          <Text style={styles.escrowTitle}>💰 Pooja & Remedy Hold</Text>
          <Text style={styles.escrowNote}>
            Full payment goes to admin first. Release astrologer % after a few months.
          </Text>
          <View style={styles.escrowRow}>
            <View style={styles.escrowItem}>
              <Text style={styles.escrowLabel}>Held with admin</Text>
              <Text style={styles.escrowVal}>{fmt(stats?.serviceHeldAmount)}</Text>
            </View>
            <View style={styles.escrowItem}>
              <Text style={styles.escrowLabel}>Pending to astro</Text>
              <Text style={[styles.escrowVal, { color: colors.warning }]}>
                {fmt(stats?.servicePendingRelease)}
              </Text>
            </View>
            <View style={styles.escrowItem}>
              <Text style={styles.escrowLabel}>Released</Text>
              <Text style={[styles.escrowVal, { color: colors.success }]}>
                {fmt(stats?.serviceReleasedToAstro)}
              </Text>
            </View>
          </View>
          <Text style={styles.escrowCta}>Open Payouts →</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Quick Manage</Text>
        {SECTION_GROUPS.map((group) => (
          <View key={group.title}>
            <Text style={styles.groupLabel}>{group.title}</Text>
            <View style={styles.quickGrid}>
              {group.items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.quickItem}
                  onPress={() =>
                    router.push(
                      item.mode === 'payouts' ? '/section/payouts' : `/section/${item.id}`
                    )
                  }
                >
                  <Text style={styles.quickIcon}>{item.icon}</Text>
                  <Text style={styles.quickText} numberOfLines={2}>
                    {item.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Recent Orders</Text>
        {(data?.recentOrders || []).slice(0, 5).map((o) => (
          <View key={o._id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>
                {o.orderType === 'pooja' || o.orderType === 'remedy'
                  ? o.poojaName || o.orderType
                  : 'Store Order'}
              </Text>
              <Text style={styles.rowSub}>
                {o.user?.name || 'User'} · {o.status}
                {o.fundsHeldByAdmin ? ` · ${o.payoutStatus || 'held'}` : ''}
              </Text>
            </View>
            <Text style={styles.rowAmt}>{fmt(o.totalAmount)}</Text>
          </View>
        ))}

        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>New Users</Text>
        {(data?.recentUsers || []).slice(0, 5).map((u) => (
          <View key={u._id} style={styles.row}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{u.name?.charAt(0) || 'U'}</Text>
            </View>
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
  heading: { fontSize: 26, fontWeight: '800', color: colors.text },
  sub: { fontSize: 13, color: colors.textMuted, marginBottom: 16, marginTop: 4 },
  analyticsBanner: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(253,185,19,0.4)',
  },
  analyticsTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  analyticsSub: { fontSize: 12, color: colors.textMuted, marginTop: 6, lineHeight: 17 },
  analyticsCta: { marginTop: 10, fontSize: 13, fontWeight: '800', color: colors.primary, textAlign: 'right' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  card: {
    width: '47%',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderTopWidth: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  cardValue: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 4 },
  cardSub: { fontSize: 11, color: colors.success, marginTop: 2 },
  escrowCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(253,185,19,0.35)',
    marginBottom: 18,
  },
  escrowTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  escrowNote: { fontSize: 12, color: colors.textMuted, marginTop: 6, lineHeight: 17 },
  escrowRow: { flexDirection: 'row', marginTop: 14, gap: 8 },
  escrowItem: { flex: 1 },
  escrowLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },
  escrowVal: { fontSize: 14, fontWeight: '800', color: colors.primary, marginTop: 3 },
  escrowCta: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'right',
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 10 },
  groupLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
  },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  quickItem: {
    width: '30%',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 80,
  },
  quickIcon: { fontSize: 24, marginBottom: 6 },
  quickText: { fontSize: 10, fontWeight: '600', color: colors.text, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  rowSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  rowAmt: { fontSize: 14, fontWeight: '800', color: colors.primary },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: colors.primary },
});
