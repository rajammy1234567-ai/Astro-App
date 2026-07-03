import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { astroApi } from '../../services/astroApi';
import { colors } from '../../constants/theme';

const FILTERS = ['all', 'active'];

export default function Chats() {
  const router = useRouter();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    try {
      const data = await astroApi.getChats();
      setChats(Array.isArray(data) ? data : []);
    } catch {
      setChats([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'active' ? chats.filter((c) => c.isActive) : chats;

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.heading}>Chats</Text>
      <Text style={styles.sub}>{chats.length} total consultations</Text>

      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, filter === f && styles.chipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>
              {f === 'all' ? 'All' : 'Active'}
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.empty}>No chats yet</Text>
              <Text style={styles.emptySub}>Go online on Home tab to receive users</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} onPress={() => router.push(`/chat/${item._id}`)}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.user?.name?.charAt(0) || 'U'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.user?.name || 'User'}</Text>
                <Text style={styles.phone}>{item.user?.phone || ''}</Text>
                <Text style={styles.preview} numberOfLines={1}>
                  {item.messages?.[item.messages.length - 1]?.content || 'Start conversation'}
                </Text>
              </View>
              {item.isActive ? <View style={styles.dot} /> : <Text style={styles.ended}>Ended</Text>}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20 },
  heading: { fontSize: 28, fontWeight: '700', color: colors.text, marginTop: 8 },
  sub: { fontSize: 14, color: colors.textMuted, marginBottom: 12 },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  list: { paddingBottom: 40 },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: colors.primary },
  name: { fontSize: 16, fontWeight: '600', color: colors.text },
  phone: { fontSize: 12, color: colors.textMuted },
  preview: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success },
  ended: { fontSize: 10, color: colors.textMuted },
  emptyBox: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 40 },
  empty: { fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 8 },
  emptySub: { fontSize: 12, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
});