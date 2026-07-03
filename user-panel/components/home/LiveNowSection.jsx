import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import liveApi from '../../services/liveApi';
import { getSocket } from '../../utils/socket';
import { COLORS } from '../../constants/colors';

export default function LiveNowSection() {
  const router = useRouter();
  const [lives, setLives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await liveApi.getActiveLives();
      setLives(Array.isArray(data) ? data : []);
      setError('');
    } catch (e) {
      setLives([]);
      setError(e.message || 'Live load failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const socket = getSocket();
    const refresh = () => load();
    socket.on('live-list-updated', refresh);
    socket.on('live-started', refresh);
    const poll = setInterval(load, 12000);
    return () => {
      socket.off('live-list-updated', refresh);
      socket.off('live-started', refresh);
      clearInterval(poll);
    };
  }, [load]);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.liveTag}>
          <View style={styles.dot} />
          <Text style={styles.liveTagText}>LIVE NOW</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/live')}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 12 }} />
      ) : lives.length === 0 ? (
        <TouchableOpacity style={styles.emptyCard} onPress={() => router.push('/live')}>
          <Text style={styles.emptyText}>
            {error ? '⚠️ Server connect karo — live list load nahi hui' : '📺 Abhi koi astrologer live nahi — yahan dikhega jab live aayenge'}
          </Text>
        </TouchableOpacity>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {lives.map((item) => {
            const a = item.astrologer;
            return (
              <TouchableOpacity
                key={item._id}
                style={styles.card}
                onPress={() => router.push(`/live/${item._id}`)}
              >
                <View style={styles.avatar}>
                  <Text style={styles.initial}>{a?.name?.charAt(0) || 'A'}</Text>
                  <View style={styles.liveDot} />
                </View>
                <Text style={styles.name} numberOfLines={1}>{a?.name}</Text>
                <Text style={styles.viewers}>👁 {item.viewerCount || 0}</Text>
                <View style={styles.watchPill}>
                  <Text style={styles.watchText}>Watch Live</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 12, marginBottom: 4 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, marginBottom: 10,
  },
  liveTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFEBEE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E53935' },
  liveTagText: { fontSize: 12, fontWeight: '800', color: '#C62828' },
  seeAll: { fontSize: 13, color: COLORS.link, fontWeight: '600' },
  emptyCard: {
    marginHorizontal: 16, backgroundColor: COLORS.surface, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  emptyText: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
  scroll: { paddingHorizontal: 16, gap: 10 },
  card: {
    width: 130, backgroundColor: COLORS.surface, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center',
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8, position: 'relative',
  },
  liveDot: {
    position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#E53935', borderWidth: 2, borderColor: COLORS.surface,
  },
  initial: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  name: { fontSize: 13, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  viewers: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4 },
  watchPill: {
    marginTop: 8, backgroundColor: COLORS.primaryLight, paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 12,
  },
  watchText: { fontSize: 10, fontWeight: '700', color: COLORS.primaryDark },
});