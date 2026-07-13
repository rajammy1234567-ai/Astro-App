import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { astroApi } from '../../services/astroApi';
import PanelHeader from '../../components/common/PanelHeader';
import { COLORS, colors, RADIUS, SHADOW_SM } from '../../constants/theme';

const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

export default function EarningsScreen() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await astroApi.getEarnings();
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.screen}>
      <PanelHeader
        title="Service Earnings"
        subtitle="Pooja & remedies · admin-held first"
        onBack={() => router.back()}
      />

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.body}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={COLORS.primary}
            />
          }
        >
          <View style={styles.note}>
            <Ionicons name="shield-checkmark" size={18} color={COLORS.primary} />
            <Text style={styles.noteText}>
              {data?.note ||
                'User payments for pooja/remedy go to admin first. Your share is released after the hold period.'}
            </Text>
          </View>

          <View style={styles.rowCards}>
            <View style={[styles.bigCard, styles.pendingCard]}>
              <Text style={styles.bigLabel}>Pending (held)</Text>
              <Text style={styles.bigVal}>{fmt(data?.pendingHeld)}</Text>
              <Text style={styles.bigSub}>Admin ke paas · ~{data?.holdMonths || 3} months</Text>
            </View>
            <View style={[styles.bigCard, styles.availCard]}>
              <Text style={styles.bigLabel}>Available</Text>
              <Text style={[styles.bigVal, { color: COLORS.success }]}>
                {fmt(data?.availableBalance)}
              </Text>
              <Text style={styles.bigSub}>Admin ne release kiya</Text>
            </View>
          </View>

          <View style={styles.totalBar}>
            <Text style={styles.totalLabel}>Total released till now</Text>
            <Text style={styles.totalVal}>{fmt(data?.totalReleased)}</Text>
          </View>

          <Text style={styles.section}>Held bookings</Text>
          {(data?.heldOrders || []).length === 0 ? (
            <Text style={styles.empty}>No held pooja/remedy bookings yet.</Text>
          ) : (
            (data.heldOrders || []).map((o) => (
              <View key={o._id} style={styles.orderCard}>
                <Text style={styles.orderName}>{o.poojaName}</Text>
                <Text style={styles.orderMeta}>
                  {(o.orderType || '').toUpperCase()} · Paid {fmt(o.totalAmount)} · Your share{' '}
                  {fmt(o.astrologerShareAmount)}
                </Text>
                <Text style={styles.orderMeta}>
                  Released {fmt(o.releasedToAstrologer)} · Status {o.payoutStatus}
                </Text>
                <Text style={styles.orderMeta}>
                  Eligible:{' '}
                  {o.payoutEligibleAt
                    ? new Date(o.payoutEligibleAt).toLocaleDateString()
                    : '—'}
                </Text>
              </View>
            ))
          )}

          <Text style={styles.section}>Recent payouts</Text>
          {(data?.recentPayouts || []).length === 0 ? (
            <Text style={styles.empty}>No payouts released yet.</Text>
          ) : (
            (data.recentPayouts || []).map((p) => (
              <View key={p._id} style={styles.orderCard}>
                <Text style={styles.orderName}>+ {fmt(p.amount)}</Text>
                <Text style={styles.orderMeta}>
                  {p.order?.poojaName || 'Service'} ·{' '}
                  {new Date(p.createdAt).toLocaleDateString()}
                  {p.earlyRelease ? ' · early' : ''}
                </Text>
              </View>
            ))
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  body: { padding: 16 },
  note: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FFF8E1',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(253,185,19,0.35)',
  },
  noteText: { flex: 1, fontSize: 12, lineHeight: 17, color: COLORS.text, fontWeight: '500' },
  rowCards: { flexDirection: 'row', gap: 10 },
  bigCard: {
    flex: 1,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    ...SHADOW_SM,
  },
  pendingCard: {
    backgroundColor: '#fff',
    borderColor: COLORS.border,
  },
  availCard: {
    backgroundColor: '#F3FCF6',
    borderColor: 'rgba(22,163,74,0.25)',
  },
  bigLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  bigVal: { fontSize: 22, fontWeight: '900', color: COLORS.bannerDark, marginTop: 6 },
  bigSub: { fontSize: 10, color: colors.textLight, marginTop: 4, fontWeight: '600' },
  totalBar: {
    marginTop: 12,
    backgroundColor: COLORS.bannerDark,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { color: 'rgba(255,255,255,0.75)', fontWeight: '600', fontSize: 12 },
  totalVal: { color: COLORS.primary, fontWeight: '900', fontSize: 18 },
  section: {
    marginTop: 20,
    marginBottom: 10,
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  empty: { color: colors.textMuted, fontSize: 13, fontWeight: '500' },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  orderName: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  orderMeta: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
});
