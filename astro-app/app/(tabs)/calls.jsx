import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Switch, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { astroApi } from '../../services/astroApi';
import { colors, COLORS } from '../../constants/theme';

export default function CallsScreen() {
  const { astrologer, updateProfile, setOnline } = useAuth();
  const router = useRouter();
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toggling, setToggling] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await astroApi.getChats();
      const list = Array.isArray(data) ? data : [];
      setCalls(list.filter((c) => c.type === 'call' && ['pending', 'active', 'paused'].includes(c.status)));
    } catch {
      setCalls([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  const toggleCall = async (value) => {
    setToggling(true);
    try {
      await updateProfile({ callEnabled: value });
    } finally {
      setToggling(false);
    }
  };

  const goOnline = async () => {
    await setOnline(true);
    await updateProfile({ callEnabled: true });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
      >
        <Text style={styles.heading}>Calls</Text>
        <Text style={styles.sub}>Voice call consultations</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Accept Call Requests</Text>
              <Text style={styles.cardSub}>Users can call when you are online</Text>
            </View>
            <Switch
              value={!!astrologer?.callEnabled}
              onValueChange={toggleCall}
              disabled={toggling}
              trackColor={{ true: colors.success }}
            />
          </View>
          {!astrologer?.isOnline && (
            <TouchableOpacity style={styles.onlineBtn} onPress={goOnline}>
              <Text style={styles.onlineBtnText}>Go Online to Receive Calls</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.rateCard}>
          <Text style={styles.rateLabel}>Your Call Rate</Text>
          <Text style={styles.rateVal}>₹{astrologer?.pricePerMin || 0}/min</Text>
          <Text style={styles.rateHint}>Update from Profile → Edit Profile</Text>
        </View>

        <Text style={styles.sectionTitle}>Call Sessions</Text>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
        ) : calls.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📞</Text>
            <Text style={styles.emptyText}>No active call sessions</Text>
            <Text style={styles.emptySub}>Go online & enable calls to receive users</Text>
          </View>
        ) : (
          calls.map((c) => (
            <TouchableOpacity
              key={c._id}
              style={styles.sessionRow}
              onPress={() => router.push(`/chat/${c._id}`)}
              activeOpacity={0.85}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{c.user?.name?.charAt(0) || 'U'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sessionName}>{c.user?.name || 'User'}</Text>
                <Text style={styles.sessionPhone}>
                  {c.status === 'pending' ? 'Waiting for you' : c.user?.phone || 'Voice call'}
                </Text>
              </View>
              <View style={[styles.liveBadge, c.status === 'pending' && styles.pendingBadge]}>
                <Text style={styles.liveText}>{c.status === 'pending' ? 'NEW' : 'LIVE'}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 28, fontWeight: '700', color: colors.text },
  sub: { fontSize: 14, color: colors.textMuted, marginBottom: 20 },
  card: {
    backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  cardSub: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  onlineBtn: { marginTop: 14, backgroundColor: colors.primary, borderRadius: 10, padding: 12, alignItems: 'center' },
  onlineBtnText: { color: COLORS.text, fontWeight: '700' },
  rateCard: {
    backgroundColor: colors.primaryLight, borderRadius: 14, padding: 16, marginBottom: 20,
    alignItems: 'center', borderWidth: 1, borderColor: colors.primary,
  },
  rateLabel: { fontSize: 13, color: colors.textMuted },
  rateVal: { fontSize: 28, fontWeight: '800', color: colors.primary, marginTop: 4 },
  rateHint: { fontSize: 11, color: colors.textMuted, marginTop: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 },
  sessionRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: colors.primary },
  sessionName: { fontSize: 15, fontWeight: '600', color: colors.text },
  sessionPhone: { fontSize: 12, color: colors.textMuted },
  liveBadge: { backgroundColor: colors.success, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  pendingBadge: { backgroundColor: colors.primary },
  liveText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  emptyBox: { alignItems: 'center', padding: 32, backgroundColor: colors.card, borderRadius: 12 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 15, fontWeight: '600', color: colors.text, marginTop: 8 },
  emptySub: { fontSize: 12, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
});