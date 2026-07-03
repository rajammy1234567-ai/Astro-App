import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { astroApi } from '../../services/astroApi';
import { colors, COLORS } from '../../constants/theme';

const FILTERS = ['requests', 'all', 'active'];

function statusLabel(session) {
  const s = session.status || (session.isActive ? 'active' : 'ended');
  if (s === 'pending') return 'PENDING';
  if (s === 'paused') return 'PAUSED';
  if (s === 'active') return 'ACTIVE';
  if (s === 'ended') return 'ENDED';
  return s.toUpperCase();
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
      Alert.alert('Failed', err.message || 'Could not accept');
    } finally {
      setActing(null);
    }
  };

  const handleReject = (id) => {
    Alert.alert('Decline Request', 'Reject this user request?', [
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

  const filtered = filter === 'requests'
    ? pending
    : filter === 'active'
      ? chats.filter((c) => c.status === 'active' || c.status === 'paused')
      : chats;

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.heading}>Consultations</Text>
      <Text style={styles.sub}>
        {pending.length} pending · {chats.filter((c) => c.status === 'active').length} active
      </Text>

      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, filter === f && styles.chipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>
              {f === 'requests' ? `Requests (${pending.length})` : f === 'all' ? 'All' : 'Active'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.primary} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>{filter === 'requests' ? '🔔' : '💬'}</Text>
              <Text style={styles.empty}>
                {filter === 'requests' ? 'No pending requests' : 'No chats yet'}
              </Text>
              <Text style={styles.emptySub}>Go online on Home tab to receive users</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isPending = item.status === 'pending';
            const userName = item.user?.name || 'User';
            const typeLabel = item.type === 'call' ? '📞 Call' : '💬 Chat';

            if (isPending && filter === 'requests') {
              return (
                <View style={[styles.row, styles.pendingRow]}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{userName.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{userName}</Text>
                    <Text style={styles.typeTag}>{typeLabel} request</Text>
                    <Text style={styles.preview} numberOfLines={1}>
                      {item.messages?.[item.messages.length - 1]?.content || 'New request'}
                    </Text>
                  </View>
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => handleAccept(item._id)}
                      disabled={acting === item._id}
                    >
                      {acting === item._id ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.acceptText}>Accept</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item._id)}>
                      <Text style={styles.rejectText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }

            return (
              <TouchableOpacity style={styles.row} onPress={() => router.push(`/chat/${item._id}`)}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{userName.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{userName}</Text>
                  <Text style={styles.typeTag}>{typeLabel}</Text>
                  <Text style={styles.preview} numberOfLines={1}>
                    {item.messages?.[item.messages.length - 1]?.content || 'Start conversation'}
                  </Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{statusLabel(item)}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20 },
  heading: { fontSize: 28, fontWeight: '700', color: colors.text, marginTop: 8 },
  sub: { fontSize: 14, color: colors.textMuted, marginBottom: 12 },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  chipTextActive: { color: COLORS.text, fontWeight: '700' },
  list: { paddingBottom: 40 },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border,
  },
  pendingRow: { borderColor: colors.primary, borderWidth: 1.5 },
  avatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: colors.primary },
  name: { fontSize: 16, fontWeight: '600', color: colors.text },
  typeTag: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  preview: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  actions: { alignItems: 'flex-end', gap: 6 },
  acceptBtn: {
    backgroundColor: colors.success, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 8, minWidth: 72, alignItems: 'center',
  },
  acceptText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  rejectBtn: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: colors.danger,
    alignItems: 'center', justifyContent: 'center',
  },
  rejectText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  statusBadge: {
    backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  statusText: { fontSize: 9, fontWeight: '800', color: colors.primary },
  emptyBox: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 40 },
  empty: { fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 8 },
  emptySub: { fontSize: 12, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
});