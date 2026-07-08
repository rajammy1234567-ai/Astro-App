import { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  RefreshControl, Switch, TouchableOpacity, Alert, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { astroApi } from '../../services/astroApi';
import liveApi from '../../services/liveApi';
import { colors, COLORS } from '../../constants/theme';

export default function Dashboard() {
  const { astrologer, setOnline, logout } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [activeLive, setActiveLive] = useState(null);
  const onlinePulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (astrologer?.isOnline) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(onlinePulse, { toValue: 1.3, duration: 800, useNativeDriver: true }),
          Animated.timing(onlinePulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [astrologer?.isOnline, onlinePulse]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Logout karna chahte ho?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
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
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  const stats = data?.stats;
  const isOnline = !!astrologer?.isOnline;

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      {/* Gradient Header */}
      <View style={styles.heroHeader}>
        <View style={styles.heroLeft}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{astrologer?.name?.charAt(0) || 'A'}</Text>
            {isOnline && (
              <Animated.View style={[styles.onlineDot, { transform: [{ scale: onlinePulse }] }]} />
            )}
          </View>
          <View>
            <Text style={styles.heroGreeting}>Namaste 🙏</Text>
            <Text style={styles.heroName}>{astrologer?.name}</Text>
            <Text style={styles.heroSpec}>{astrologer?.specialty}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Online Toggle Card */}
        <View style={[styles.onlineCard, isOnline && styles.onlineCardActive]}>
          <View style={styles.onlineLeft}>
            <View style={[styles.statusBadge, isOnline && styles.statusBadgeActive]}>
              <View style={[styles.statusDot, isOnline ? styles.statusDotOnline : styles.statusDotOffline]} />
              <Text style={[styles.statusLabel, isOnline && styles.statusLabelActive]}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
            <Text style={styles.onlineSub}>
              {isOnline ? 'Users aapko consult kar sakte hain' : 'Toggle karein to receive requests'}
            </Text>
          </View>
          <Switch
            value={isOnline}
            onValueChange={handleToggle}
            disabled={toggling}
            trackColor={{ true: COLORS.success, false: colors.border }}
            thumbColor={isOnline ? '#fff' : '#f0f0f0'}
          />
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard icon="star" iconColor={COLORS.star} label="Rating" value={`${stats?.rating ?? astrologer?.rating ?? '—'}`} />
          <StatCard icon="cash-outline" iconColor={COLORS.success} label="Earnings" value={`₹${(stats?.earnings ?? 0).toLocaleString('en-IN')}`} highlight />
          <StatCard icon="chatbubbles-outline" iconColor={COLORS.link} label="Total Chats" value={`${stats?.totalChats ?? 0}`} />
          <StatCard icon="call-outline" iconColor={COLORS.primary} label="Per Minute" value={`₹${stats?.pricePerMin ?? astrologer?.pricePerMin ?? 0}`} />
          <StatCard icon="flash-outline" iconColor={COLORS.warning} label="Active" value={`${stats?.activeChats ?? 0}`} />
          <StatCard icon="bag-outline" iconColor={COLORS.textSecondary} label="Orders" value={`${stats?.totalOrders ?? 0}`} />
        </View>

        {/* Live Session Banner */}
        {activeLive ? (
          <TouchableOpacity style={styles.liveBanner} onPress={() => router.push('/live')}>
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveTag}>LIVE</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.liveBannerTitle}>{activeLive.title}</Text>
              <Text style={styles.liveBannerSub}>👁 {activeLive.viewerCount || 0} viewers</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.goLiveCard} onPress={() => router.push('/live')}>
            <View style={styles.goLiveLeft}>
              <View style={styles.goLiveIconWrap}>
                <Ionicons name="radio" size={24} color={COLORS.error} />
              </View>
              <View>
                <Text style={styles.goLiveTitle}>Go Live</Text>
                <Text style={styles.goLiveSub}>Users ko live dikhao, real-time interact karo</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          <QuickAction icon="chatbubbles" color={COLORS.link} label="Chats" badge={stats?.activeChats} onPress={() => router.push('/(tabs)/chats')} />
          <QuickAction icon="call" color={COLORS.success} label="Calls" onPress={() => router.push('/(tabs)/calls')} />
          <QuickAction icon="person-circle" color={COLORS.primary} label="Profile" onPress={() => router.push('/(tabs)/profile')} />
          <QuickAction icon="create-outline" color={COLORS.warning} label="Edit" onPress={() => router.push('/profile/edit')} />
        </View>

        {/* Recent Chats */}
        {(data?.recentChats || []).length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recent Consultations</Text>
            {(data.recentChats || []).slice(0, 5).map((chat) => (
              <TouchableOpacity
                key={chat._id}
                style={styles.chatRow}
                onPress={() => router.push(`/chat/${chat._id}`)}
              >
                <View style={styles.chatAvatar}>
                  <Text style={styles.chatAvatarText}>{chat.user?.name?.charAt(0) || 'U'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.chatName}>{chat.user?.name || 'User'}</Text>
                  <Text style={styles.chatMsg} numberOfLines={1}>
                    {chat.messages?.[chat.messages.length - 1]?.content || 'No messages'}
                  </Text>
                </View>
                <View style={styles.chatMeta}>
                  {chat.isActive && <View style={styles.activeDot} />}
                  <Ionicons name="chevron-forward" size={16} color={colors.border} />
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, iconColor, label, value, highlight }) {
  return (
    <View style={[styles.statCard, highlight && styles.statCardHighlight]}>
      <View style={[styles.statIcon, { backgroundColor: `${iconColor}18` }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={[styles.statVal, highlight && { color: COLORS.success }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({ icon, color, label, badge, onPress }) {
  return (
    <TouchableOpacity style={styles.quickCard} onPress={onPress}>
      <View style={[styles.quickIcon, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={24} color={color} />
        {badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg, gap: 12 },
  loadingText: { color: colors.textMuted, fontSize: 13 },

  heroHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: COLORS.bannerDark,
  },
  heroLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  avatarCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  avatarText: { fontSize: 22, fontWeight: '900', color: '#1A1A1A' },
  onlineDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: COLORS.success, borderWidth: 2, borderColor: COLORS.bannerDark,
  },
  heroGreeting: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  heroName: { fontSize: 17, fontWeight: '800', color: '#fff', marginTop: 1 },
  heroSpec: { fontSize: 11, color: COLORS.primary, fontWeight: '600', marginTop: 1 },
  logoutBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },

  content: { padding: 16, paddingBottom: 24 },

  onlineCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1.5, borderColor: colors.border,
  },
  onlineCardActive: { borderColor: COLORS.success, backgroundColor: COLORS.successLight },
  onlineLeft: { flex: 1, paddingRight: 12 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, backgroundColor: colors.border, marginBottom: 6,
  },
  statusBadgeActive: { backgroundColor: 'rgba(46,175,93,0.15)' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusDotOnline: { backgroundColor: COLORS.success },
  statusDotOffline: { backgroundColor: colors.textMuted },
  statusLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  statusLabelActive: { color: COLORS.success },
  onlineSub: { fontSize: 12, color: colors.textMuted, lineHeight: 17 },

  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16,
  },
  statCard: {
    width: '31%', backgroundColor: colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  statCardHighlight: { borderColor: COLORS.success, backgroundColor: COLORS.successLight },
  statIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statVal: { fontSize: 17, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 10, color: colors.textMuted, marginTop: 4, textAlign: 'center', fontWeight: '600' },

  liveBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#DC2626', borderRadius: 16, padding: 16, marginBottom: 16,
  },
  livePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  liveTag: { color: '#fff', fontWeight: '900', fontSize: 11 },
  liveBannerTitle: { fontSize: 15, fontWeight: '800', color: '#fff' },
  liveBannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  goLiveCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1.5, borderColor: colors.errorLight,
  },
  goLiveLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  goLiveIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.errorLight, justifyContent: 'center', alignItems: 'center',
  },
  goLiveTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  goLiveSub: { fontSize: 12, color: colors.textMuted, marginTop: 2, lineHeight: 17 },

  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },

  quickGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  quickCard: {
    flex: 1, backgroundColor: colors.card, borderRadius: 14, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border, gap: 8,
  },
  quickIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  quickLabel: { fontSize: 11, fontWeight: '700', color: colors.text },
  badge: {
    position: 'absolute', top: -2, right: -2,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: COLORS.error, justifyContent: 'center', alignItems: 'center',
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  chatRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border,
  },
  chatAvatar: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.yellowLight,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  chatAvatarText: { fontSize: 17, fontWeight: '700', color: COLORS.primary },
  chatName: { fontSize: 14, fontWeight: '700', color: colors.text },
  chatMsg: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  chatMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success },
});