import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Switch, ScrollView, ActivityIndicator,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { astroApi } from '../../services/astroApi';
import PanelHeader from '../../components/common/PanelHeader';
import { colors, COLORS } from '../../constants/theme';

export default function CallsScreen() {
  const { astrologer, updateProfile, setOnline } = useAuth();
  const router = useRouter();
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toggling, setToggling] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await astroApi.getChats();
      setActiveSessions(Array.isArray(data) ? data.filter((c) => c.isActive) : []);
    } catch {
      setActiveSessions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

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

  const callEnabled = !!astrologer?.callEnabled;
  const isOnline = !!astrologer?.isOnline;

  return (
    <View style={styles.safe}>
      <PanelHeader
        title="Calls"
        subtitle="Voice consultations"
        right={
          <View style={styles.onlineChip}>
            <View style={[styles.onlineDot, { backgroundColor: isOnline ? COLORS.success : 'rgba(255,255,255,0.4)' }]} />
            <Text style={[styles.onlineText, { color: isOnline ? COLORS.success : 'rgba(255,255,255,0.7)' }]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        }
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Rate Card */}
        <View style={styles.rateCard}>
          <View style={styles.rateLeft}>
            <View style={styles.rateIconWrap}>
              <Ionicons name="cash-outline" size={22} color={COLORS.success} />
            </View>
            <View>
              <Text style={styles.rateLabel}>Your Call Rate</Text>
              <Text style={styles.rateHint}>Per minute billing</Text>
            </View>
          </View>
          <Text style={styles.rateVal}>₹{astrologer?.pricePerMin || 0}<Text style={styles.rateUnit}>/min</Text></Text>
        </View>

        {/* Call Toggle */}
        <View style={[styles.toggleCard, callEnabled && styles.toggleCardActive]}>
          <View style={styles.toggleLeft}>
            <View style={[styles.toggleIconWrap, callEnabled ? styles.toggleIconActive : {}]}>
              <Ionicons name={callEnabled ? 'call' : 'call-outline'} size={22} color={callEnabled ? '#fff' : colors.textMuted} />
            </View>
            <View>
              <Text style={styles.toggleTitle}>Accept Call Requests</Text>
              <Text style={styles.toggleSub}>
                {callEnabled ? 'Users aapko call kar sakte hain' : 'Calls abhi disabled hain'}
              </Text>
            </View>
          </View>
          <Switch
            value={callEnabled}
            onValueChange={toggleCall}
            disabled={toggling}
            trackColor={{ true: COLORS.success, false: colors.border }}
            thumbColor={callEnabled ? '#fff' : '#f0f0f0'}
          />
        </View>

        {/* Go Online prompt */}
        {!isOnline && (
          <TouchableOpacity style={styles.goOnlineBtn} onPress={goOnline}>
            <Ionicons name="radio-outline" size={20} color="#fff" />
            <Text style={styles.goOnlineText}>Go Online to Receive Calls</Text>
          </TouchableOpacity>
        )}

        {/* Edit Rate Hint */}
        <TouchableOpacity style={styles.editRateHint} onPress={() => router.push('/profile/edit')}>
          <Ionicons name="create-outline" size={15} color={COLORS.primary} />
          <Text style={styles.editRateText}>Update your rate from Profile → Edit Profile</Text>
          <Ionicons name="chevron-forward" size={15} color={COLORS.primary} />
        </TouchableOpacity>

        {/* Active Sessions */}
        <Text style={styles.sectionTitle}>Active Sessions</Text>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : activeSessions.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="call-outline" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>No active sessions</Text>
            <Text style={styles.emptySub}>Online raho aur calls enable karo to receive users</Text>
          </View>
        ) : (
          activeSessions.map((c) => (
            <TouchableOpacity
              key={c._id}
              style={styles.sessionCard}
              onPress={() => router.push(`/chat/${c._id}`)}
            >
              <View style={styles.sessionAvatar}>
                <Text style={styles.sessionAvatarText}>{c.user?.name?.charAt(0) || 'U'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sessionName}>{c.user?.name || 'User'}</Text>
                <Text style={styles.sessionPhone}>{c.user?.phone || 'Consultation'}</Text>
              </View>
              <View style={styles.liveChip}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 90 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  onlineChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
  onlineText: { fontSize: 11, fontWeight: '700' },

  rateCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.successLight, borderRadius: 16, padding: 16, marginBottom: 14,
    borderWidth: 1.5, borderColor: COLORS.success,
  },
  rateLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rateIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(46,175,93,0.15)', justifyContent: 'center', alignItems: 'center',
  },
  rateLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
  rateHint: { fontSize: 11, color: COLORS.success, marginTop: 2 },
  rateVal: { fontSize: 28, fontWeight: '900', color: COLORS.success },
  rateUnit: { fontSize: 14, fontWeight: '600' },

  toggleCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1.5, borderColor: colors.border,
  },
  toggleCardActive: { borderColor: COLORS.success, backgroundColor: 'rgba(46,175,93,0.04)' },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  toggleIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center',
  },
  toggleIconActive: { backgroundColor: COLORS.success },
  toggleTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  toggleSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },

  goOnlineBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 14, marginBottom: 12,
  },
  goOnlineText: { color: '#1A1A1A', fontWeight: '800', fontSize: 14 },

  editRateHint: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.yellowLight, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, marginBottom: 24,
    borderWidth: 1, borderColor: 'rgba(253,185,19,0.35)',
  },
  editRateText: { flex: 1, fontSize: 12, color: COLORS.primaryDark, fontWeight: '600' },

  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12,
  },

  emptyCard: {
    backgroundColor: colors.card, borderRadius: 16, padding: 32,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  emptyIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: COLORS.yellowLight, justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  emptySub: { fontSize: 12, color: colors.textMuted, marginTop: 6, textAlign: 'center', lineHeight: 18 },

  sessionCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border,
  },
  sessionAvatar: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.yellowLight,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  sessionAvatarText: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  sessionName: { fontSize: 15, fontWeight: '700', color: colors.text },
  sessionPhone: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  liveChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.success, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveText: { color: '#fff', fontSize: 11, fontWeight: '800' },
});