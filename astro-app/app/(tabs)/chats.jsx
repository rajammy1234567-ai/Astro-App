import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { astroApi } from '../../services/astroApi';
import { colors, COLORS } from '../../constants/theme';

const FILTERS = ['requests', 'active', 'all'];

function statusLabel(session) {
  const s = session.status || (session.isActive ? 'active' : 'ended');
  if (s === 'pending') return 'NEW';
  if (s === 'paused') return 'PAUSED';
  if (s === 'active') return 'ACTIVE';
  if (s === 'ended') return 'ENDED';
  return s.toUpperCase();
}

function statusColor(session) {
  const s = session.status || (session.isActive ? 'active' : 'ended');
  if (s === 'pending') return COLORS.primary;
  if (s === 'active') return COLORS.success;
  if (s === 'paused') return COLORS.warning;
  return COLORS.textSecondary;
}

export default function Chats() {
  const router = useRouter();
  const [chats, setChats] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('requests');
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
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
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
    Alert.alert('Request Decline', 'Is request ko reject karein?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject', style: 'destructive',
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

  const filtered = filter === 'requests'
    ? pending
    : filter === 'active'
      ? chats.filter((c) => c.status === 'active' || c.status === 'paused')
      : chats;

  const activeCount = chats.filter((c) => c.status === 'active').length;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Consultations</Text>
          <Text style={styles.sub}>
            <Text style={styles.badge}> {pending.length} </Text>
            {' '}new · {' '}
            <Text style={[styles.badge, activeCount > 0 && styles.badgeActive]}> {activeCount} </Text>
            {' '}active
          </Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.tab, filter === f && styles.tabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.tabText, filter === f && styles.tabTextActive]}>
              {f === 'requests'
                ? `New${pending.length > 0 ? ` (${pending.length})` : ''}`
                : f === 'active' ? 'Active' : 'All'}
            </Text>
          </TouchableOpacity>
        ))}
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
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconWrap}>
                <Ionicons
                  name={filter === 'requests' ? 'notifications-outline' : 'chatbubbles-outline'}
                  size={36}
                  color={COLORS.primary}
                />
              </View>
              <Text style={styles.emptyTitle}>
                {filter === 'requests' ? 'Koi new request nahi' : 'Koi consultation nahi'}
              </Text>
              <Text style={styles.emptySub}>Online raho aur users se requests aayengi</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isPending = item.status === 'pending';
            const userName = item.user?.name || 'User';
            const isCall = item.type === 'call';
            const lastMsg = item.messages?.[item.messages.length - 1]?.content;

            if (isPending && filter === 'requests') {
              return (
                <View style={styles.requestCard}>
                  {/* Type badge */}
                  <View style={[styles.typePill, isCall ? styles.typePillCall : styles.typePillChat]}>
                    <Ionicons name={isCall ? 'call' : 'chatbubble'} size={11} color="#fff" />
                    <Text style={styles.typePillText}>{isCall ? 'Call' : 'Chat'}</Text>
                  </View>

                  <View style={styles.requestTop}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{userName.charAt(0)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.userName}>{userName}</Text>
                      {lastMsg && (
                        <Text style={styles.preview} numberOfLines={1}>"{lastMsg}"</Text>
                      )}
                      <Text style={styles.requestHint}>
                        {isCall ? 'Voice call consultation' : 'Chat consultation · 1 min FREE'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={styles.rejectSmallBtn}
                      onPress={() => handleReject(item._id)}
                      disabled={acting === item._id}
                    >
                      <Ionicons name="close" size={18} color={COLORS.error} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => handleAccept(item._id)}
                      disabled={acting === item._id}
                    >
                      {acting === item._id ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <Ionicons name="checkmark" size={16} color="#fff" />
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
                style={styles.chatRow}
                onPress={() => router.push(`/chat/${item._id}`)}
                activeOpacity={0.75}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{userName.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.chatTopRow}>
                    <Text style={styles.userName}>{userName}</Text>
                    <View style={[styles.statusPill, { backgroundColor: `${sc}18`, borderColor: sc }]}>
                      <Text style={[styles.statusPillText, { color: sc }]}>{statusLabel(item)}</Text>
                    </View>
                  </View>
                  <Text style={styles.typeRow}>
                    {isCall ? '📞' : '💬'} {isCall ? 'Call' : 'Chat'}
                  </Text>
                  {lastMsg && (
                    <Text style={styles.preview} numberOfLines={1}>{lastMsg}</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.border} style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  heading: { fontSize: 26, fontWeight: '800', color: colors.text },
  sub: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  badge: {
    fontWeight: '800', color: COLORS.primary,
    backgroundColor: COLORS.yellowLight,
    borderRadius: 4, overflow: 'hidden', paddingHorizontal: 4,
  },
  badgeActive: { color: COLORS.success, backgroundColor: COLORS.successLight },
  filters: {
    flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 12, gap: 8,
  },
  tab: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card,
  },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  tabTextActive: { color: '#1A1A1A', fontWeight: '800' },
  list: { paddingHorizontal: 16, paddingBottom: 48 },

  // Request Card
  requestCard: {
    backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1.5, borderColor: COLORS.primary,
  },
  typePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 12, marginBottom: 12,
  },
  typePillCall: { backgroundColor: COLORS.success },
  typePillChat: { backgroundColor: COLORS.link },
  typePillText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  requestTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  requestHint: { fontSize: 11, color: colors.textMuted, marginTop: 3 },
  requestActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  rejectSmallBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: COLORS.errorLight, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.error,
  },
  acceptBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.success, borderRadius: 12, paddingVertical: 12, gap: 6,
  },
  acceptText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  // Chat Row
  chatRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.yellowLight,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  chatTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  userName: { fontSize: 15, fontWeight: '700', color: colors.text },
  statusPill: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
    borderWidth: 1,
  },
  statusPillText: { fontSize: 9, fontWeight: '800' },
  typeRow: { fontSize: 11, color: colors.textMuted, marginBottom: 3 },
  preview: { fontSize: 12, color: colors.textMuted },

  emptyBox: { alignItems: 'center', padding: 48 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.yellowLight, justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  emptySub: { fontSize: 13, color: colors.textMuted, marginTop: 6, textAlign: 'center', lineHeight: 19 },
});