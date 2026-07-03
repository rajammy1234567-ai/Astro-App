import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  TouchableOpacity, RefreshControl, Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import { useAuth } from '../../hooks/useAuth';
import { astrologerApplicationApi } from '../../services/astrologerApplicationApi';
import { COLORS } from '../../constants/colors';

const TYPE_ICONS = {
  application: 'document-text-outline',
  interview: 'videocam-outline',
  selected: 'checkmark-circle-outline',
  rejected: 'close-circle-outline',
  info: 'notifications-outline',
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await astrologerApplicationApi.getNotifications();
      setNotifications(data || []);
    } catch {
      setNotifications([]);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    load().finally(() => setLoading(false));
  }, [isAuthenticated, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handlePress = async (item) => {
    if (!item.read && item._id) {
      try {
        await astrologerApplicationApi.markRead(item._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === item._id ? { ...n, read: true } : n))
        );
      } catch { /* ignore */ }
    }
    if (item.data?.googleMeetLink) {
      Linking.openURL(item.data.googleMeetLink);
    } else if (item.type === 'application' || item.type === 'interview' || item.type === 'selected') {
      router.push('/become-astrologer');
    }
  };

  const markAllRead = async () => {
    try {
      await astrologerApplicationApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch { /* ignore */ }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Header title="Notifications" />
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Login to see notifications</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Notifications" />
      {notifications.some((n) => !n.read) && (
        <TouchableOpacity style={styles.markAll} onPress={markAllRead}>
          <Text style={styles.markAllText}>Mark all as read</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item, i) => item._id || String(i)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={notifications.length ? styles.list : styles.emptyList}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={48} color={COLORS.textLight} />
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, !item.read && styles.cardUnread]}
              onPress={() => handlePress(item)}
              activeOpacity={0.7}
            >
              <View style={styles.cardIcon}>
                <Ionicons
                  name={TYPE_ICONS[item.type] || 'notifications-outline'}
                  size={22}
                  color={COLORS.primary}
                />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardMsg} numberOfLines={4}>{item.message}</Text>
                <Text style={styles.cardTime}>
                  {item.createdAt ? new Date(item.createdAt).toLocaleString('en-IN') : ''}
                </Text>
              </View>
              {!item.read && <View style={styles.dot} />}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  markAll: { alignSelf: 'flex-end', paddingHorizontal: 16, paddingVertical: 8 },
  markAllText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  list: { padding: 16, paddingBottom: 32 },
  emptyList: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { fontSize: 15, color: COLORS.textSecondary, marginTop: 12 },
  card: {
    flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: 10,
    padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.borderLight,
    alignItems: 'flex-start', gap: 12,
  },
  cardUnread: { borderColor: COLORS.primary, backgroundColor: '#FFFBEB' },
  cardIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  cardMsg: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, lineHeight: 18 },
  cardTime: { fontSize: 11, color: COLORS.textLight, marginTop: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginTop: 4 },
});