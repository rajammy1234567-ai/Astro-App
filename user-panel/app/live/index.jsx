import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/common/Screen';
import liveApi from '../../services/liveApi';
import { getSocket } from '../../utils/socket';
import { COLORS } from '../../constants/colors';

export default function LiveListScreen() {
  const router = useRouter();
  const [lives, setLives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await liveApi.getActiveLives();
      setLives(Array.isArray(data) ? data : []);
    } catch {
      setLives([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const poll = setInterval(load, 12000);
    return () => clearInterval(poll);
  }, [load]);

  useEffect(() => {
    const socket = getSocket();
    const onUpdate = () => load();
    socket.on('live-list-updated', onUpdate);
    socket.on('live-started', onUpdate);
    return () => {
      socket.off('live-list-updated', onUpdate);
      socket.off('live-started', onUpdate);
    };
  }, [load]);

  return (
    <Screen>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Live Astrologers</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={lives}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📺</Text>
              <Text style={styles.emptyTitle}>Koi live nahi hai abhi</Text>
              <Text style={styles.emptySub}>Jab astrologer live aayega, yahan dikhega</Text>
            </View>
          }
          renderItem={({ item }) => {
            const a = item.astrologer;
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/live/${item._id}`)}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{a?.name?.charAt(0) || 'A'}</Text>
                  <View style={styles.liveDot} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{a?.name}</Text>
                  <Text style={styles.spec}>{a?.specialty}</Text>
                  <Text style={styles.titleText} numberOfLines={1}>{item.title}</Text>
                </View>
                <View style={styles.watchBtn}>
                  <Text style={styles.watchText}>Watch</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  list: { padding: 16, paddingBottom: 32 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginRight: 12, position: 'relative',
  },
  avatarText: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  liveDot: {
    position: 'absolute', bottom: 2, right: 2, width: 12, height: 12,
    borderRadius: 6, backgroundColor: '#E53935', borderWidth: 2, borderColor: COLORS.surface,
  },
  name: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  spec: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  titleText: { fontSize: 11, color: COLORS.textLight, marginTop: 4 },
  watchBtn: {
    backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  watchText: { color: COLORS.text, fontWeight: '800', fontSize: 12 },
  empty: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginTop: 8 },
  emptySub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
});