import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import Screen from '../../components/common/Screen';
import Header from '../../components/common/Header';
import EmptyState from '../../components/common/EmptyState';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { sessionApi } from '../../services/sessionApi';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../constants/colors';

function statusMeta(status) {
  if (status === 'active') return { label: 'Active', color: COLORS.success };
  if (status === 'pending') return { label: 'Waiting', color: COLORS.primary };
  if (status === 'paused') return { label: 'Paused', color: COLORS.warning };
  if (status === 'rejected') return { label: 'Declined', color: COLORS.error };
  if (status === 'ended') return { label: 'Ended', color: COLORS.textLight };
  return { label: status || 'Unknown', color: COLORS.textSecondary };
}

export default function SessionsHistoryScreen() {
  const router = useRouter();
  const { isAuthenticated, initialized } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setSessions([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const data = await sessionApi.getMy();
      setSessions(Array.isArray(data) ? data : []);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const openSession = (item) => {
    if (item.type === 'call') {
      router.push({
        pathname: `/call/${item._id}`,
        params: {
          type: 'voice',
          astroName: item.astrologer?.name || 'Astrologer',
        },
      });
      return;
    }
    router.push(`/chat/${item._id}`);
  };

  if (!initialized || loading) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <Header title="Chat & Call History" />
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  if (!isAuthenticated) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <Header title="Chat & Call History" />
        <EmptyState
          icon="lock-closed-outline"
          title="Login Required"
          subtitle="Apni chat/call history dekhne ke liye login karo."
          actionLabel="Login"
          onAction={() => router.push('/(auth)/login')}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <Header title="Chat & Call History" />
      <FlatList
        data={sessions}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="chatbubbles-outline"
            title="No sessions yet"
            subtitle="Jab aap chat ya call karoge, history yahan dikhegi."
            actionLabel="Find Astrologers"
            onAction={() => router.push('/(tabs)/chat')}
          />
        }
        renderItem={({ item }) => {
          const meta = statusMeta(item.status);
          const a = item.astrologer;
          const isCall = item.type === 'call';
          return (
            <TouchableOpacity style={styles.card} onPress={() => openSession(item)} activeOpacity={0.85}>
              <View style={[styles.iconWrap, isCall ? styles.callIcon : styles.chatIcon]}>
                <Ionicons name={isCall ? 'call' : 'chatbubble'} size={18} color="#FFF" />
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{a?.name || 'Astrologer'}</Text>
                <Text style={styles.sub}>
                  {isCall ? 'Voice Call' : 'Chat'} · {a?.specialty || 'Consultation'}
                </Text>
                <Text style={styles.time}>
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })
                    : ''}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: `${meta.color}22` }]}>
                <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 40, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 12,
  },
  iconWrap: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },
  chatIcon: { backgroundColor: COLORS.success },
  callIcon: { backgroundColor: COLORS.primary },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  sub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  time: { fontSize: 11, color: COLORS.textLight, marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
});
