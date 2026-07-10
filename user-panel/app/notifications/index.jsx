import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import Screen from '../../components/common/Screen';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import EmptyState from '../../components/common/EmptyState';
import { useAuth } from '../../hooks/useAuth';
import { sessionApi } from '../../services/sessionApi';
import { astrologerApplicationApi } from '../../services/astrologerApplicationApi';
import { COLORS } from '../../constants/colors';
import { safeOpenUrl } from '../../utils/openUrl';

export default function NotificationsScreen() {
  const router = useRouter();
  const { isAuthenticated, initialized, sessionLoading } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const items = [];

    // Session-based notifications (ongoing / pending / paused)
    try {
      const sessions = await sessionApi.getMy();
      (Array.isArray(sessions) ? sessions : []).slice(0, 30).forEach((s) => {
        const name = s.astrologer?.name || 'Astrologer';
        const isCall = s.type === 'call';
        if (s.status === 'pending') {
          items.push({
            _id: `s-pending-${s._id}`,
            type: 'session',
            title: isCall ? 'Call request waiting' : 'Chat request waiting',
            message: `${name} se ${isCall ? 'call' : 'chat'} accept hone ka wait.`,
            createdAt: s.updatedAt || s.createdAt,
            route: isCall ? `/call/${s._id}` : `/chat/${s._id}`,
            read: false,
          });
        } else if (s.status === 'active') {
          items.push({
            _id: `s-active-${s._id}`,
            type: 'session',
            title: isCall ? 'Call active' : 'Chat active',
            message: `${name} ke saath session chal raha hai. Resume karo.`,
            createdAt: s.updatedAt || s.createdAt,
            route: isCall ? `/call/${s._id}` : `/chat/${s._id}`,
            read: true,
          });
        } else if (s.status === 'paused') {
          items.push({
            _id: `s-paused-${s._id}`,
            type: 'session',
            title: 'Session paused',
            message: `${name} — time khatam. Recharge karke continue karo.`,
            createdAt: s.updatedAt || s.createdAt,
            route: `/chat/${s._id}`,
            read: false,
          });
        }
      });
    } catch { /* ignore */ }

    // Application notifications (become astrologer flow)
    try {
      const appNotes = await astrologerApplicationApi.getNotifications();
      (appNotes || []).forEach((n) => {
        items.push({
          ...n,
          type: n.type || 'application',
        });
      });
    } catch { /* ignore */ }

    items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    setNotifications(items);
  }, []);

  useEffect(() => {
    if (!initialized || sessionLoading) return;
    if (!isAuthenticated) {
      setLoading(false);
      setNotifications([]);
      return;
    }
    load().finally(() => setLoading(false));
  }, [isAuthenticated, initialized, sessionLoading, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handlePress = async (item) => {
    if (item.route) {
      router.push(item.route);
      return;
    }
    if (item.data?.googleMeetLink) {
      safeOpenUrl(item.data.googleMeetLink, 'Google Meet link');
      return;
    }
    if (item.type === 'application' || item.type === 'interview' || item.type === 'selected') {
      router.push('/become-astrologer');
    }
  };

  if (!initialized || sessionLoading || loading) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <Header title="Notifications" />
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  if (!isAuthenticated) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <Header title="Notifications" />
        <EmptyState
          icon="lock-closed-outline"
          title="Login required"
          subtitle="Notifications dekhne ke liye login karo."
          actionLabel="Login"
          onAction={() => router.push('/(auth)/login')}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <Header title="Notifications" />
      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item._id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-outline"
            title="No notifications"
            subtitle="Chat/call updates yahan dikhenge."
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, !item.read && styles.unread]}
            onPress={() => handlePress(item)}
            activeOpacity={0.85}
          >
            <View style={styles.iconWrap}>
              <Ionicons
                name={item.type === 'session' ? 'chatbubble-ellipses-outline' : 'notifications-outline'}
                size={20}
                color={COLORS.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.msg}>{item.message}</Text>
              {item.createdAt ? (
                <Text style={styles.time}>
                  {new Date(item.createdAt).toLocaleString('en-IN', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </Text>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
          </TouchableOpacity>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 40, flexGrow: 1 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  unread: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  iconWrap: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.bannerDark,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  msg: { fontSize: 12, color: COLORS.textSecondary, marginTop: 3, lineHeight: 17 },
  time: { fontSize: 11, color: COLORS.textLight, marginTop: 6 },
});
