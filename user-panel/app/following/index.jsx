import { useEffect, useState, useCallback } from 'react';
import { FlatList, View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import RemoteImage from '../../components/common/RemoteImage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import { followingApi } from '../../services/followingApi';
import { COLORS } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatters';

export default function FollowingScreen() {
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const load = useCallback(() => {
    setLoading(true);
    followingApi.getAll()
      .then(setFollowing)
      .catch(() => setFollowing([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUnfollow = async (id) => {
    try {
      await followingApi.toggle(id);
      setFollowing((prev) => prev.filter((a) => a._id !== id));
    } catch (_) {}
  };

  return (
    <View style={styles.container}>
      <Header title="My Following" />

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={following}
          keyExtractor={(item) => item._id}
          contentContainerStyle={following.length ? styles.list : styles.emptyList}
          ListEmptyComponent={
            <View>
              <EmptyState
                icon="people-outline"
                title="Not following anyone yet"
                subtitle="Follow astrologers from their profile to see them here"
              />
              <Button title="Browse Astrologers" onPress={() => router.push('/(tabs)/chat')} style={styles.browseBtn} />
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/astrologers/details?id=${item._id}`)}
              activeOpacity={0.8}
            >
              <RemoteImage uri={item.image} type="astrologer" style={styles.avatar} fallbackIcon="person" />
              <View style={styles.info}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{item.name}</Text>
                  {item.isOnline && <View style={styles.onlineDot} />}
                </View>
                <Text style={styles.specialty}>{item.specialty}</Text>
                <View style={styles.metaRow}>
                  <Ionicons name="star" size={12} color={COLORS.star} />
                  <Text style={styles.meta}>{item.rating}</Text>
                  <Text style={styles.metaSep}>·</Text>
                  <Text style={styles.meta}>{formatCurrency(item.pricePerMin)}/min</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.unfollowBtn} onPress={() => handleUnfollow(item._id)}>
                <Ionicons name="heart-dislike-outline" size={20} color={COLORS.error} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  list: { padding: 16, paddingBottom: 32 },
  emptyList: { flexGrow: 1, padding: 16 },
  browseBtn: { marginTop: 8 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: COLORS.borderLight,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, marginRight: 12, backgroundColor: COLORS.border },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.online },
  specialty: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  meta: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  metaSep: { color: COLORS.textLight },
  unfollowBtn: { padding: 8 },
});