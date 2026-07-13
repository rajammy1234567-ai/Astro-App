import { useEffect, useState, useCallback } from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import Screen from '../../components/common/Screen';
import RemoteImage from '../../components/common/RemoteImage';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import { followingApi } from '../../services/followingApi';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatters';
import { useScreenInsets } from '../../hooks/useScreenInsets';

export default function FollowingScreen() {
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const safe = useScreenInsets();
  const { isAuthenticated } = useAuth();

  const load = useCallback(() => {
    if (!isAuthenticated) {
      setFollowing([]);
      setLoading(false);
      return Promise.resolve();
    }
    setLoading(true);
    return followingApi
      .getAll()
      .then((data) => setFollowing(Array.isArray(data) ? data : []))
      .catch(() => setFollowing([]))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleUnfollow = (item) => {
    Alert.alert('Unfollow', `Unfollow ${item.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unfollow',
        style: 'destructive',
        onPress: async () => {
          try {
            await followingApi.toggle(item._id);
            setFollowing((prev) => prev.filter((a) => a._id !== item._id));
          } catch (err) {
            Alert.alert('Failed', err.message || 'Could not unfollow');
          }
        },
      },
    ]);
  };

  if (!isAuthenticated) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <Header title="My Following" />
        <View style={styles.center}>
          <EmptyState
            icon="heart-outline"
            title="Login to see following"
            subtitle="Follow astrologers and find them here anytime"
          />
          <Button title="Login" onPress={() => router.push('/(auth)/login')} style={{ marginTop: 12 }} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <Header title="My Following" subtitle={`${following.length} astrologer${following.length === 1 ? '' : 's'}`} />

      {loading && !refreshing ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={following}
          keyExtractor={(item) => item._id}
          contentContainerStyle={
            following.length
              ? [styles.list, { paddingBottom: safe.tabBar + 24 }]
              : styles.emptyList
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View>
              <EmptyState
                icon="people-outline"
                title="Not following anyone yet"
                subtitle="Open any astrologer profile and tap Follow"
              />
              <Button
                title="Browse Astrologers"
                onPress={() => router.push('/(tabs)/chat')}
                style={styles.browseBtn}
              />
              <Button
                title="Search"
                onPress={() => router.push('/search')}
                style={[styles.browseBtn, { marginTop: 10, backgroundColor: COLORS.bannerDark }]}
              />
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                router.push({ pathname: '/astrologers/details', params: { id: item._id } })
              }
              activeOpacity={0.85}
            >
              <View style={styles.avatarWrap}>
                <RemoteImage
                  uri={item.image}
                  type="astrologer"
                  style={styles.avatar}
                  fallbackIcon="person"
                />
                {item.isOnline || item.chatOnline || item.callOnline ? (
                  <View style={styles.onlineDot} />
                ) : null}
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.specialty} numberOfLines={1}>
                  {item.specialty || 'Vedic'}
                </Text>
                <View style={styles.metaRow}>
                  <Ionicons name="star" size={12} color={COLORS.star} />
                  <Text style={styles.meta}>{item.rating || '—'}</Text>
                  <Text style={styles.metaSep}>·</Text>
                  <Text style={styles.meta}>{formatCurrency(item.pricePerMin)}/min</Text>
                </View>
                <View style={styles.modeRow}>
                  {item.chatOnline || item.isOnline ? (
                    <Text style={styles.modeOn}>Chat</Text>
                  ) : null}
                  {item.callOnline || item.isOnline ? (
                    <Text style={styles.modeOn}>Call</Text>
                  ) : null}
                  {!item.isOnline && !item.chatOnline && !item.callOnline ? (
                    <Text style={styles.modeOff}>Offline</Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.chatMini}
                  onPress={() =>
                    router.push({
                      pathname: '/astrologers/booking',
                      params: { id: item._id, type: 'chat' },
                    })
                  }
                >
                  <Ionicons name="chatbubble" size={14} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.unfollowBtn} onPress={() => handleUnfollow(item)}>
                  <Ionicons name="heart-dislike-outline" size={20} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  emptyList: { flexGrow: 1, padding: 16 },
  center: { flex: 1, padding: 16, justifyContent: 'center' },
  browseBtn: { marginTop: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  avatarWrap: { position: 'relative', marginRight: 12 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.border,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.online,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  specialty: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  meta: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  metaSep: { color: COLORS.textLight },
  modeRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  modeOn: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.success,
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  modeOff: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textLight,
  },
  actions: { alignItems: 'center', gap: 8 },
  chatMini: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unfollowBtn: { padding: 6 },
});
