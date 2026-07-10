import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { astroApi } from '../../services/astroApi';
import PanelHeader from '../../components/common/PanelHeader';
import { colors, COLORS, SHADOW_MD, SHADOW_SM, RADIUS } from '../../constants/theme';

const FILTERS = [
  { id: 'requests', label: 'New' },
  { id: 'active', label: 'Active' },
  { id: 'all', label: 'History' },
];

function statusLabel(session) {
  const s = session.status || (session.isActive ? 'active' : 'ended');
  if (s === 'pending') return 'NEW';
  if (s === 'paused') return 'PAUSED';
  if (s === 'active') return 'ACTIVE';
  if (s === 'ended') return 'ENDED';
  return String(s).toUpperCase();
}

function statusColor(session) {
  const s = session.status || (session.isActive ? 'active' : 'ended');
  if (s === 'pending') return COLORS.primaryDark;
  if (s === 'active') return COLORS.success;
  if (s === 'paused') return COLORS.warning;
  return COLORS.textLight;
}

export default function Chats() {
  const router = useRouter();
  const [chats, setChats] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // Default = full chat history so partner always sees all conversations
  const [filter, setFilter] = useState('all');
  const [acting, setActing] = useState(null);

  const load = useCallback(async () => {
    try {
      const [all, reqs] = await Promise.all([
        astroApi.getChats(),
        astroApi.getPendingRequests(),
      ]);
      setChats(Array.isArray(all) ? all : []);
      setPending(Array.isArray(reqs) ? reqs : []);
    } catch {
      setChats([]);
      setPending([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  const handleAccept = async (id) => {
    setActing(id);
    try {
      await astroApi.acceptChat(id);
      await load();
      router.push(`/chat/${id}`);
    } catch (err) {
      Alert.alert('Failed', err.message || 'Accept nahi ho saka');
    } finally {
      setActing(null);
    }
  };

  const handleReject = (id) => {
    Alert.alert('Decline request?', 'Call prepaid ho to user ko refund mil jayega.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          setActing(id);
          try {
            await astroApi.rejectChat(id);
            await load();
          } catch (err) {
            Alert.alert('Failed', err.message);
          } finally {
            setActing(null);
          }
        },
      },
    ]);
  };

  const activeCount = chats.filter((c) => c.status === 'active').length;
  const filtered =
    filter === 'requests'
      ? pending
      : filter === 'active'
        ? chats.filter((c) => c.status === 'active' || c.status === 'paused')
        : chats;

  return (
    <View style={styles.screen}>
      <PanelHeader
        title="Consultations"
        subtitle={`${pending.length} waiting · ${activeCount} live sessions`}
      />

      <View style={styles.filters}>
        {FILTERS.map((f) => {
          const active = filter === f.id;
          const count =
            f.id === 'requests' ? pending.length : f.id === 'active' ? activeCount : chats.length;
          return (
            <TouchableOpacity
              key={f.id}
              style={[styles.tab, active && styles.tabOn]}
              onPress={() => setFilter(f.id)}
              activeOpacity={0.88}
            >
              <Text style={[styles.tabText, active && styles.tabTextOn]}>
                {f.label}{count > 0 ? ` · ${count}` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 48 }} size="large" color={COLORS.primary} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="moon" size={30} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>
                {filter === 'requests' ? 'No new requests' : 'Nothing here yet'}
              </Text>
              <Text style={styles.emptySub}>
                Online raho — user requests yahan aayengi with full kundli details.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isPending = item.status === 'pending';
            const birth = item.userBirthDetails || {};
            const userName = birth.name || item.user?.name || 'User';
            const isCall = item.type === 'call';
            const lastMsg = item.messages?.[item.messages.length - 1]?.content;
            const birthBits = [
              birth.dateOfBirth && `DOB ${birth.dateOfBirth}`,
              birth.timeOfBirth,
              birth.placeOfBirth,
              birth.gender,
            ].filter(Boolean);

            if (isPending && filter === 'requests') {
              return (
                <View style={styles.requestCard}>
                  <View style={styles.reqTop}>
                    <View style={[styles.typePill, isCall ? styles.pillCall : styles.pillChat]}>
                      <Ionicons name={isCall ? 'call' : 'chatbubble'} size={11} color="#fff" />
                      <Text style={styles.typePillText}>{isCall ? 'CALL' : 'CHAT'}</Text>
                    </View>
                    <Text style={styles.waiting}>Waiting · Accept</Text>
                  </View>

                  <View style={styles.reqBody}>
                    <View style={styles.avatarLg}>
                      <Text style={styles.avatarLgText}>{userName.charAt(0)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>{userName}</Text>
                      {birthBits.length > 0 ? (
                        <View style={styles.kundli}>
                          <Ionicons name="planet" size={13} color={COLORS.primaryDark} />
                          <Text style={styles.kundliText} numberOfLines={2}>
                            {birthBits.join(' · ')}
                          </Text>
                        </View>
                      ) : lastMsg ? (
                        <Text style={styles.preview} numberOfLines={2}>{lastMsg}</Text>
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.decline}
                      onPress={() => handleReject(item._id)}
                      disabled={acting === item._id}
                    >
                      <Ionicons name="close" size={16} color={COLORS.error} />
                      <Text style={styles.declineText}>Decline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.accept}
                      onPress={() => handleAccept(item._id)}
                      disabled={acting === item._id}
                    >
                      {acting === item._id ? (
                        <ActivityIndicator color={COLORS.bannerDark} size="small" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle" size={18} color={COLORS.bannerDark} />
                          <Text style={styles.acceptText}>Accept & Start</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }

            const sc = statusColor(item);
            return (
              <TouchableOpacity
                style={styles.row}
                onPress={() => router.push(`/chat/${item._id}`)}
                activeOpacity={0.88}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{userName.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.rowTop}>
                    <Text style={styles.name}>{userName}</Text>
                    <View style={[styles.status, { backgroundColor: `${sc}18` }]}>
                      <Text style={[styles.statusText, { color: sc }]}>{statusLabel(item)}</Text>
                    </View>
                  </View>
                  <Text style={styles.meta}>
                    {isCall ? '📞 Call' : '💬 Chat'}
                    {birth.dateOfBirth ? ` · ${birth.dateOfBirth}` : ''}
                  </Text>
                  {!!lastMsg && <Text style={styles.preview} numberOfLines={1}>{lastMsg}</Text>}
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.border} />
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  filters: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  tab: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 14,
    backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border,
  },
  tabOn: { backgroundColor: COLORS.bannerDark, borderColor: COLORS.bannerDark },
  tabText: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  tabTextOn: { color: COLORS.primary, fontWeight: '800' },
  list: { paddingHorizontal: 16, paddingBottom: 110 },

  requestCard: {
    backgroundColor: '#fff', borderRadius: 22, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.borderGold, ...SHADOW_MD,
  },
  reqTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  typePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
  },
  pillCall: { backgroundColor: COLORS.success },
  pillChat: { backgroundColor: COLORS.link },
  typePillText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  waiting: { fontSize: 11, fontWeight: '800', color: COLORS.primaryDark },
  reqBody: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  avatarLg: {
    width: 54, height: 54, borderRadius: 18, backgroundColor: COLORS.bannerDark,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLgText: { fontSize: 22, fontWeight: '900', color: COLORS.primary },
  name: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  kundli: {
    flexDirection: 'row', gap: 6, marginTop: 6, backgroundColor: COLORS.primaryLight,
    borderRadius: 12, padding: 8, alignItems: 'flex-start',
  },
  kundliText: { flex: 1, fontSize: 11, color: COLORS.text, fontWeight: '600', lineHeight: 15 },
  actions: { flexDirection: 'row', gap: 10 },
  decline: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14,
    backgroundColor: COLORS.errorLight, borderWidth: 1, borderColor: 'rgba(220,38,38,0.2)',
  },
  declineText: { color: COLORS.error, fontWeight: '800', fontSize: 13 },
  accept: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 12,
  },
  acceptText: { color: COLORS.bannerDark, fontWeight: '900', fontSize: 14 },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 18, padding: 13, marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOW_SM,
  },
  avatar: {
    width: 46, height: 46, borderRadius: 16, backgroundColor: COLORS.violetSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 17, fontWeight: '900', color: COLORS.violet },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  status: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 9, fontWeight: '900' },
  meta: { fontSize: 11, color: colors.textMuted, marginTop: 2, fontWeight: '600' },
  preview: { fontSize: 12, color: colors.textMuted, marginTop: 3 },

  empty: { alignItems: 'center', padding: 40 },
  emptyIcon: {
    width: 78, height: 78, borderRadius: 28, backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    borderWidth: 1, borderColor: COLORS.borderGold,
  },
  emptyTitle: { fontSize: 17, fontWeight: '900', color: COLORS.text },
  emptySub: {
    fontSize: 13, color: colors.textMuted, marginTop: 8, textAlign: 'center', lineHeight: 19, paddingHorizontal: 10,
  },
});
