import { useCallback, useEffect, useState } from 'react';
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
import { colors } from '../../constants/theme';

const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;
const num = (n) => (n || 0).toLocaleString('en-IN');

export default function AnalyticsScreen() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/analytics');
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

  const openAstro = async (a) => {
    setSelected(a);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await api.get(`/astrologers/${a._id}/details`);
      setDetail(res);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const o = data?.overview || {};
  const cards = [
    { label: 'Total Users', value: num(o.totalUsers), color: '#3b82f6' },
    { label: 'Astrologers', value: num(o.totalAstrologers), color: '#8b5cf6' },
    { label: 'Online now', value: num(o.onlineNow), sub: `Chat ${o.chatOnlineNow || 0} · Call ${o.callOnlineNow || 0}`, color: '#22c55e' },
    { label: 'Total sessions', value: num(o.totalSessions), sub: `Chat ${o.chatSessions || 0} · Call ${o.callSessions || 0}`, color: '#f59e0b' },
    { label: 'Users talked', value: num(o.uniqueUsersInConsultations), color: '#06b6d4' },
    { label: 'Session time', value: o.totalSessionTimeLabel || '0s', color: '#a855f7' },
    { label: 'Consult revenue', value: fmt(o.consultationRevenue), color: '#22c55e' },
    { label: 'Wallet topups', value: fmt(o.walletTopups), color: '#eab308' },
    { label: 'Store sales', value: fmt(o.storeSales), color: '#f97316' },
    { label: 'Pooja/Remedy sales', value: fmt(o.serviceSales), sub: `Held ${fmt(o.serviceHeldByAdmin)}`, color: '#ec4899' },
    { label: 'TOTAL SALES', value: fmt(o.totalPlatformSales), color: colors.primary },
  ];

  if (selected) {
    const s = detail?.stats || selected;
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={detailLoading}
              onRefresh={() => openAstro(selected)}
              tintColor={colors.primary}
            />
          }
        >
          <TouchableOpacity onPress={() => setSelected(null)} style={styles.back}>
            <Text style={styles.backText}>‹ All astrologers</Text>
          </TouchableOpacity>
          <Text style={styles.heading}>{selected.name}</Text>
          <Text style={styles.sub}>
            {selected.phone || '—'} · Chat {s.chatOnline || selected.chatOnline ? 'ON' : 'OFF'} · Call{' '}
            {s.callOnline || selected.callOnline ? 'ON' : 'OFF'}
          </Text>

          {detailLoading && !detail ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
          ) : (
            <>
              <View style={styles.grid}>
                {[
                  { l: 'Consult earnings', v: fmt(s.consultationEarnings || selected.consultationEarnings) },
                  { l: 'Pooja/Remedy sales', v: fmt(s.serviceSales || selected.serviceSales) },
                  { l: 'Total sales', v: fmt(s.totalSales || selected.totalSales) },
                  { l: 'Admin released', v: fmt(s.serviceReleased || s.totalReleased) },
                  { l: 'Pending hold', v: fmt(s.pendingHeld || s.serviceHeldForAdmin) },
                  { l: 'Available bal', v: fmt(s.availableBalance) },
                  { l: 'Unique users', v: num(s.uniqueUsers || selected.uniqueUsers) },
                  { l: 'Total sessions', v: num(s.totalSessions || selected.totalSessions) },
                  { l: 'Chat sessions', v: num(s.chatSessions || selected.chatSessions) },
                  { l: 'Call sessions', v: num(s.callSessions || selected.callSessions) },
                  { l: 'Session time', v: s.totalSessionTimeLabel || selected.totalSessionTimeLabel || '—' },
                  { l: 'Chat time', v: s.chatTimeLabel || '—' },
                  { l: 'Call time', v: s.callTimeLabel || '—' },
                  { l: 'App online time', v: s.onlineTimeLabel || selected.onlineTimeLabel || '—' },
                  { l: 'Active now', v: num(s.activeSessions) },
                  { l: 'Pending req', v: num(s.pendingSessions) },
                ].map((c) => (
                  <View key={c.l} style={styles.miniCard}>
                    <Text style={styles.miniLabel}>{c.l}</Text>
                    <Text style={styles.miniVal}>{c.v}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.section}>Recent sessions</Text>
              {(detail?.sessions || []).slice(0, 20).map((sess) => (
                <View key={sess._id} style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>
                      {(sess.type || 'chat').toUpperCase()} · {sess.user?.name || 'User'}
                    </Text>
                    <Text style={styles.rowSub}>
                      {sess.status} · {sess.durationSeconds != null ? `${sess.durationSeconds}s` : '—'} ·{' '}
                      {fmt(sess.totalCharged || sess.billing?.totalCharged)}
                    </Text>
                  </View>
                </View>
              ))}

              <Text style={styles.section}>Pooja / Remedy bookings</Text>
              {(detail?.serviceOrders || []).length === 0 ? (
                <Text style={styles.empty}>No service bookings</Text>
              ) : (
                (detail.serviceOrders || []).map((ord) => (
                  <View key={ord._id} style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{ord.poojaName || ord.orderType}</Text>
                      <Text style={styles.rowSub}>
                        {ord.user?.name || 'User'} · {ord.payoutStatus} · paid {fmt(ord.totalAmount)}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

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
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>📊 Full Analytics</Text>
        <Text style={styles.sub}>
          Users, sales, session time, astrologer earnings — sab admin ke paas.
        </Text>

        <View style={styles.grid}>
          {cards.map((c) => (
            <View key={c.label} style={[styles.card, { borderTopColor: c.color }]}>
              <Text style={styles.cardLabel}>{c.label}</Text>
              <Text style={styles.cardValue}>{c.value}</Text>
              {c.sub ? <Text style={styles.cardSub}>{c.sub}</Text> : null}
            </View>
          ))}
        </View>

        <Text style={styles.section}>Astrologers (tap for full detail)</Text>
        {(data?.allAstrologers || data?.topAstrologers || []).map((a) => (
          <TouchableOpacity key={a._id} style={styles.row} onPress={() => openAstro(a)} activeOpacity={0.85}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>
                {a.name}{' '}
                {a.isOnline ? '🟢' : '⚪'}
              </Text>
              <Text style={styles.rowSub}>
                Chat {a.chatOnline ? 'ON' : 'off'} · Call {a.callOnline ? 'ON' : 'off'} · Users{' '}
                {a.uniqueUsers || 0} · Time {a.totalSessionTimeLabel || '0s'} · Online{' '}
                {a.onlineTimeLabel || '0s'}
              </Text>
              <Text style={styles.rowSub}>
                Earn {fmt(a.consultationEarnings)} · Services {fmt(a.serviceSales)} · Total{' '}
                {fmt(a.totalSales)}
              </Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.section}>Recent consultations</Text>
        {(data?.recentSessions || []).map((s) => (
          <View key={s._id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>
                {(s.type || 'chat').toUpperCase()} · {s.user?.name || 'User'} →{' '}
                {s.astrologer?.name || 'Astro'}
              </Text>
              <Text style={styles.rowSub}>
                {s.status} · {s.durationSeconds || 0}s · {fmt(s.totalCharged)}
              </Text>
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
  content: { padding: 16, paddingBottom: 48 },
  back: { marginBottom: 8 },
  backText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  heading: { fontSize: 24, fontWeight: '800', color: colors.text },
  sub: { fontSize: 12, color: colors.textMuted, marginTop: 4, marginBottom: 14, lineHeight: 17 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  card: {
    width: '47%',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    borderTopWidth: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  cardValue: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 4 },
  cardSub: { fontSize: 10, color: colors.success, marginTop: 2 },
  miniCard: {
    width: '47%',
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  miniLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },
  miniVal: { fontSize: 14, fontWeight: '800', color: colors.primary, marginTop: 3 },
  section: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginTop: 8,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
  rowSub: { fontSize: 11, color: colors.textMuted, marginTop: 3, lineHeight: 15 },
  chev: { fontSize: 22, color: colors.textMuted, marginLeft: 8 },
  empty: { color: colors.textMuted, fontSize: 13, marginBottom: 12 },
});
