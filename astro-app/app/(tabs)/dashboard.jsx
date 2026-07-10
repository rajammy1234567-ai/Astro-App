import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  RefreshControl, Switch, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { astroApi } from '../../services/astroApi';
import liveApi from '../../services/liveApi';
import PartnerHeader from '../../components/common/PartnerHeader';
import { colors, COLORS } from '../../constants/theme';

export default function Dashboard() {
  const { astrologer, setOnline, logout } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [activeLive, setActiveLive] = useState(null);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

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
        <View style={styles.topRow}>
          <View>
            <Text style={styles.greeting}>Namaste, {astrologer?.name} 🙏</Text>
            <Text style={styles.sub}>Ready to help users with astrology consultations?</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.onlineCard}>
          <View style={styles.onlineText}>
            <Text style={styles.onlineLabel}>{astrologer?.isOnline ? '🟢 Online' : '⚫ Offline'}</Text>
            <Text style={styles.onlineSub}>Toggle to receive chat & call requests and stay available for users.</Text>
          </View>
          <Switch value={!!astrologer?.isOnline} onValueChange={handleToggle} disabled={toggling} trackColor={{ true: colors.success, false: colors.border }} thumbColor={astrologer?.isOnline ? colors.primary : colors.background} />
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
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, gap: 12 },
  greeting: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 4 },
  sub: { fontSize: 14, color: colors.textMuted, maxWidth: '65%' },
  onlineCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.primaryLight, borderRadius: 16, padding: 18, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(253, 185, 19, 0.25)',
  },
  onlineText: { flex: 1, paddingRight: 12 },
  onlineLabel: { fontSize: 16, fontWeight: '700', color: colors.primaryDark },
  onlineSub: { fontSize: 12, color: colors.textMuted, marginTop: 4, lineHeight: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginBottom: 20 },
  statCard: {
    width: '48%', backgroundColor: colors.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', marginBottom: 10,
  },
  earnCard: { borderColor: colors.success, backgroundColor: colors.successLight },
  statVal: { fontSize: 18, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 6, textAlign: 'center' },
  liveActiveBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.danger,
    borderRadius: 16, padding: 16, marginBottom: 16, gap: 12,
  },
  liveActiveTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  liveActiveCta: { color: '#fff', fontWeight: '700', fontSize: 15 },
  goLiveBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.errorLight,
    borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.danger, gap: 12,
  },
  goLiveIcon: { fontSize: 28 },
  goLiveTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  goLiveSub: { fontSize: 12, color: colors.textMuted, marginTop: 2, lineHeight: 18 },
  goLiveArrow: { fontSize: 28, color: colors.danger, fontWeight: '700' },
  logoutBtn: { backgroundColor: COLORS.text, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 18, alignSelf: 'flex-start' },
  logoutText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  quickBtn: {
    flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  quickIcon: { fontSize: 24 },
  quickText: { fontSize: 12, fontWeight: '700', color: colors.text, marginTop: 8 },
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