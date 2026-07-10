import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { astroApi } from '../services/astroApi';
import { colors, COLORS } from '../constants/theme';

export default function AstroNotifications() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [all, pending] = await Promise.all([
        astroApi.getChats(),
        astroApi.getPendingRequests(),
      ]);
      const notes = [];
      (pending || []).forEach((s) => {
        const name = s.userBirthDetails?.name || s.user?.name || 'User';
        notes.push({
          id: `p-${s._id}`,
          title: s.type === 'call' ? 'New call request' : 'New chat request',
          message: `${name} waiting for accept`,
          route: `/chat/${s._id}`,
          tone: 'new',
        });
      });
      (all || [])
        .filter((s) => s.status === 'active' || s.status === 'paused')
        .forEach((s) => {
          const name = s.userBirthDetails?.name || s.user?.name || 'User';
          notes.push({
            id: `a-${s._id}`,
            title: s.status === 'paused' ? 'Session paused' : 'Active session',
            message: `${name} · ${s.type === 'call' ? 'Call' : 'Chat'}`,
            route: `/chat/${s._id}`,
            tone: s.status,
          });
        });
      setItems(notes);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.heading}>Notifications</Text>
      </View>
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>No alerts. New chat/call requests yahan aayenge.</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => router.push(item.route)} activeOpacity={0.85}>
              <View style={[styles.dot, item.tone === 'new' && styles.dotNew]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.msg}>{item.message}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 10 },
  back: { padding: 4 },
  heading: { fontSize: 20, fontWeight: '800', color: colors.text },
  list: { padding: 16, paddingBottom: 40 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success || '#2EAF5D' },
  dotNew: { backgroundColor: COLORS.primary },
  title: { fontSize: 14, fontWeight: '800', color: colors.text },
  msg: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40, paddingHorizontal: 24 },
});
