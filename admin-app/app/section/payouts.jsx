import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '../../services/api';
import { colors } from '../../constants/theme';

const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

export default function PayoutsScreen() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('held');
  const [selected, setSelected] = useState(null);
  const [percent, setPercent] = useState('100');
  const [note, setNote] = useState('');
  const [force, setForce] = useState(false);
  const [releasing, setReleasing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/payouts?status=${filter === 'all' ? 'all' : filter}`);
      setData(res);
    } catch (err) {
      setData({ orders: [], totals: [] });
      Alert.alert('Load failed', err.message || 'Could not load payouts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const openRelease = (order) => {
    setSelected(order);
    setPercent('100');
    setNote('');
    const eligible = !order.payoutEligibleAt || new Date() >= new Date(order.payoutEligibleAt);
    setForce(!eligible);
  };

  const doRelease = async () => {
    if (!selected?._id) return;
    setReleasing(true);
    try {
      const res = await api.post(`/payouts/${selected._id}/release`, {
        percent: Number(percent) || 100,
        note,
        force,
      });
      Alert.alert('Released', res.message || 'Payout released to astrologer');
      setSelected(null);
      load();
    } catch (err) {
      Alert.alert('Release failed', err.message || 'Could not release');
    } finally {
      setReleasing(false);
    }
  };

  const orders = data?.orders || [];
  const totals = data?.totals || [];
  const heldTotal = totals.find((t) => t._id === 'held');
  const partialTotal = totals.find((t) => t._id === 'partial');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>💰 Payouts Hold</Text>
        <Text style={styles.sub}>
          Pooja & remedy money stays with admin first. After ~{data?.holdMonths || 3} months,
          release the astrologer&apos;s share (%).
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Held (full)</Text>
          <Text style={styles.statVal}>{fmt(heldTotal?.held || 0)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Pending share</Text>
          <Text style={styles.statVal}>
            {fmt(
              Math.max(
                0,
                (heldTotal?.share || 0) +
                  (partialTotal?.share || 0) -
                  (heldTotal?.released || 0) -
                  (partialTotal?.released || 0)
              )
            )}
          </Text>
        </View>
      </View>

      <View style={styles.filters}>
        {['held', 'partial', 'released', 'all'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, filter === f && styles.chipOn]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.chipText, filter === f && styles.chipTextOn]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
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
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ListEmptyComponent={
            <Text style={styles.empty}>No held pooja/remedy bookings in this filter.</Text>
          }
          renderItem={({ item }) => {
            const remaining = Math.max(
              0,
              (item.astrologerShareAmount || 0) - (item.releasedToAstrologer || 0)
            );
            const eligible =
              !item.payoutEligibleAt || new Date() >= new Date(item.payoutEligibleAt);
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle}>{item.poojaName || 'Service'}</Text>
                  <View
                    style={[
                      styles.badge,
                      item.payoutStatus === 'released' && styles.badgeOk,
                      item.payoutStatus === 'partial' && styles.badgeWarn,
                    ]}
                  >
                    <Text style={styles.badgeText}>{item.payoutStatus}</Text>
                  </View>
                </View>
                <Text style={styles.meta}>
                  {item.orderType?.toUpperCase()} · {item.user?.name || 'User'} ·{' '}
                  {item.astrologer?.name || 'No astrologer'}
                </Text>
                <Text style={styles.meta}>
                  Paid {fmt(item.totalAmount)} · Astro share {item.astrologerSharePercent}% ={' '}
                  {fmt(item.astrologerShareAmount)} · Released {fmt(item.releasedToAstrologer)}
                </Text>
                <Text style={styles.meta}>
                  Eligible:{' '}
                  {item.payoutEligibleAt
                    ? new Date(item.payoutEligibleAt).toLocaleDateString()
                    : '—'}{' '}
                  {eligible ? '✓' : '(waiting)'}
                </Text>
                {remaining > 0 && item.astrologer ? (
                  <TouchableOpacity style={styles.releaseBtn} onPress={() => openRelease(item)}>
                    <Text style={styles.releaseBtnText}>
                      Release to {item.astrologer?.name} · left {fmt(remaining)}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          }}
        />
      )}

      <Modal visible={!!selected} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Release payout</Text>
            <Text style={styles.modalSub}>
              {selected?.poojaName} → {selected?.astrologer?.name}
            </Text>
            <Text style={styles.label}>% of remaining share</Text>
            <TextInput
              style={styles.input}
              value={percent}
              onChangeText={setPercent}
              keyboardType="numeric"
              placeholder="100"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={styles.label}>Note (optional)</Text>
            <TextInput
              style={[styles.input, { height: 70 }]}
              value={note}
              onChangeText={setNote}
              multiline
              placeholder="Monthly release…"
              placeholderTextColor={colors.textMuted}
            />
            {force ? (
              <Text style={styles.warn}>
                ⚠ Not yet past hold date — this will be an early release.
              </Text>
            ) : null}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelected(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.okBtn}
                onPress={doRelease}
                disabled={releasing}
              >
                <Text style={styles.okText}>{releasing ? '…' : 'Release'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  back: { marginBottom: 6 },
  backText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  sub: { fontSize: 12, color: colors.textMuted, marginTop: 6, lineHeight: 17 },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 12 },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  statVal: { fontSize: 18, fontWeight: '800', color: colors.primary, marginTop: 4 },
  filters: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'capitalize' },
  chipTextOn: { color: '#0f172a' },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.text, flex: 1 },
  badge: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeOk: { backgroundColor: '#166534' },
  badgeWarn: { backgroundColor: '#854d0e' },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#fff', textTransform: 'uppercase' },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 4, lineHeight: 17 },
  releaseBtn: {
    marginTop: 12,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  releaseBtnText: { fontSize: 13, fontWeight: '800', color: '#0f172a' },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  modalSub: { fontSize: 13, color: colors.textMuted, marginTop: 4, marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginBottom: 6 },
  input: {
    backgroundColor: colors.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    color: colors.text,
    marginBottom: 12,
  },
  warn: { color: colors.warning, fontSize: 12, fontWeight: '600', marginBottom: 10 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelText: { color: colors.textMuted, fontWeight: '700' },
  okBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  okText: { color: '#0f172a', fontWeight: '800' },
});
