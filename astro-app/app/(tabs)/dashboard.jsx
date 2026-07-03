import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  RefreshControl, Switch, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { astroApi } from '../../services/astroApi';
import liveApi from '../../services/liveApi';
import PartnerHeader from '../../components/common/PartnerHeader';
import { colors } from '../../constants/theme';

export default function Dashboard() {
  const { astrologer, setOnline } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [activeLive, setActiveLive] = useState(null);

  const load = async () => {
    try {
      const [res, live] = await Promise.all([
        astroApi.getDashboard(),
        liveApi.getMyLive().catch(() => null),
      ]);
      setData(res);
      setActiveLive(live);
    } catch {
      setData(null);
      setActiveLive(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (value) => {
    setToggling(true);
    try {
      await setOnline(value);
      await load();
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const stats = data?.stats;

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <PartnerHeader />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
      >
        <Text style={styles.greeting}>Namaste, {astrologer?.name} 🙏</Text>
        <Text style={styles.sub}>Manage your consultations</Text>

        <View style={styles.onlineCard}>
          <View>
            <Text style={styles.onlineLabel}>{astrologer?.isOnline ? '🟢 Online' : '⚫ Offline'}</Text>
            <Text style={styles.onlineSub}>Toggle to receive chat & call requests</Text>
          </View>
          <Switch value={!!astrologer?.isOnline} onValueChange={handleToggle} disabled={toggling} trackColor={{ true: colors.success }} />
        </View>

        <View style={styles.grid}>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>⭐ {stats?.rating ?? astrologer?.rating}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{stats?.totalOrders ?? 0}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>₹{stats?.pricePerMin ?? astrologer?.pricePerMin}</Text>
            <Text style={styles.statLabel}>Per Minute</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{stats?.activeChats ?? 0}</Text>
            <Text style={styles.statLabel}>Active Chats</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{stats?.totalChats ?? 0}</Text>
            <Text style={styles.statLabel}>Total Chats</Text>
          </View>
          <View style={[styles.statCard, styles.earnCard]}>
            <Text style={styles.statVal}>₹{(stats?.earnings ?? 0).toLocaleString('en-IN')}</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
        </View>

        {activeLive ? (
          <TouchableOpacity style={styles.liveActiveBtn} onPress={() => router.push('/live')}>
            <Text style={styles.goLiveIcon}>🔴</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.liveActiveTitle}>You are LIVE!</Text>
              <Text style={styles.goLiveSub}>{activeLive.title} · 👁 {activeLive.viewerCount || 0} viewers</Text>
            </View>
            <Text style={styles.liveActiveCta}>Open</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.goLiveBtn} onPress={() => router.push('/live')}>
            <Text style={styles.goLiveIcon}>🔴</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.goLiveTitle}>Go Live</Text>
              <Text style={styles.goLiveSub}>Users ko live dikhao, comments ka jawab do</Text>
            </View>
            <Text style={styles.goLiveArrow}>›</Text>
          </TouchableOpacity>
        )}

        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(tabs)/chats')}>
            <Text style={styles.quickIcon}>💬</Text>
            <Text style={styles.quickText}>Chats</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(tabs)/calls')}>
            <Text style={styles.quickIcon}>📞</Text>
            <Text style={styles.quickText}>Calls</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/profile/edit')}>
            <Text style={styles.quickIcon}>✏️</Text>
            <Text style={styles.quickText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Recent Chats</Text>
        {(data?.recentChats || []).length === 0 ? (
          <Text style={styles.empty}>No chats yet — go online to receive users</Text>
        ) : (
          (data?.recentChats || []).slice(0, 5).map((chat) => (
            <TouchableOpacity key={chat._id} style={styles.chatRow} onPress={() => router.push(`/chat/${chat._id}`)}>
              <View style={styles.chatAvatar}>
                <Text style={styles.chatAvatarText}>{chat.user?.name?.charAt(0) || 'U'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.chatName}>{chat.user?.name || 'User'}</Text>
                <Text style={styles.chatMsg} numberOfLines={1}>
                  {chat.messages?.[chat.messages.length - 1]?.content || 'No messages'}
                </Text>
              </View>
              {chat.isActive && <View style={styles.activeDot} />}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  greeting: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 4 },
  sub: { fontSize: 14, color: colors.textMuted, marginBottom: 20 },
  onlineCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.primaryLight, borderRadius: 14, padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: colors.primary,
  },
  onlineLabel: { fontSize: 16, fontWeight: '700', color: colors.primary },
  onlineSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: {
    width: '31%', backgroundColor: colors.card, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  earnCard: { borderColor: colors.success, backgroundColor: '#f0fdf4' },
  statVal: { fontSize: 16, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 10, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  liveActiveBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#E53935',
    borderRadius: 14, padding: 16, marginBottom: 16,
  },
  liveActiveTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  liveActiveCta: { color: '#fff', fontWeight: '800', fontSize: 15 },
  goLiveBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFEBEE',
    borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1.5, borderColor: '#E53935',
  },
  goLiveIcon: { fontSize: 28, marginRight: 12 },
  goLiveTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  goLiveSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  goLiveArrow: { fontSize: 28, color: colors.danger, fontWeight: '300' },
  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  quickBtn: {
    flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  quickIcon: { fontSize: 24 },
  quickText: { fontSize: 12, fontWeight: '600', color: colors.text, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 },
  empty: { color: colors.textMuted, textAlign: 'center', padding: 20 },
  chatRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border,
  },
  chatAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  chatAvatarText: { fontSize: 18, fontWeight: '700', color: colors.primary },
  chatName: { fontSize: 15, fontWeight: '600', color: colors.text },
  chatMsg: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  activeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success },
});