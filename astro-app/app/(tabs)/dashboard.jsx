import { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  RefreshControl, Switch, TouchableOpacity, Alert, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { astroApi } from '../../services/astroApi';
import PanelHeader from '../../components/common/PanelHeader';
import { colors, COLORS, SHADOW_MD, SHADOW_SM, RADIUS } from '../../constants/theme';

export default function Dashboard() {
  const { astrologer, setOnline, logout } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toggling, setToggling] = useState(false);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!astrologer?.isOnline) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.2, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [astrologer?.isOnline, pulse]);

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
      const res = await astroApi.getDashboard();
      setData(res);
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
      <View style={styles.boot}>
        <View style={styles.bootCard}>
          <Ionicons name="planet" size={36} color={COLORS.primary} />
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 14 }} />
          <Text style={styles.bootText}>Opening partner workspace…</Text>
        </View>
      </View>
    );
  }

  const stats = data?.stats;
  const isOnline = !!astrologer?.isOnline;
  const earnings = (stats?.earnings ?? 0).toLocaleString('en-IN');

  return (
    <View style={styles.screen}>
      <PanelHeader
        title={`Namaste, ${astrologer?.name?.split(' ')[0] || 'Partner'}`}
        subtitle={astrologer?.specialty || 'Professional astrology panel'}
        large
        right={
          <TouchableOpacity style={styles.headerBtn} onPress={handleLogout} activeOpacity={0.85}>
            <Ionicons name="log-out-outline" size={18} color="#fff" />
          </TouchableOpacity>
        }
      >
        {/* Identity row inside header */}
        <View style={styles.identity}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>{astrologer?.name?.charAt(0) || 'A'}</Text>
            </View>
            {isOnline && (
              <Animated.View style={[styles.liveDot, { transform: [{ scale: pulse }] }]} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.idName}>{astrologer?.name || 'Astrologer'}</Text>
            <Text style={styles.idMeta}>
              ⭐ {stats?.rating ?? astrologer?.rating ?? '—'}
              {'  ·  '}
              {astrologer?.experience || 0} yrs exp
            </Text>
          </View>
          <View style={styles.rateChip}>
            <Text style={styles.rateChipTop}>RATE</Text>
            <Text style={styles.rateChipVal}>₹{astrologer?.pricePerMin || 0}</Text>
            <Text style={styles.rateChipBot}>/ min</Text>
          </View>
        </View>
      </PanelHeader>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Online control */}
        <View style={[styles.onlineCard, isOnline && styles.onlineCardOn]}>
          <View style={styles.onlineLeft}>
            <View style={[styles.statusPill, isOnline ? styles.statusOn : styles.statusOff]}>
              <View style={[styles.dot, { backgroundColor: isOnline ? COLORS.success : colors.textLight }]} />
              <Text style={[styles.statusTxt, isOnline && { color: COLORS.success }]}>
                {isOnline ? 'Online now' : 'Offline'}
              </Text>
            </View>
            <Text style={styles.onlineHint}>
              {isOnline
                ? 'Users aapko chat & call request bhej sakte hain'
                : 'Toggle on karke consultations receive karein'}
            </Text>
          </View>
          <Switch
            value={isOnline}
            onValueChange={handleToggle}
            disabled={toggling}
            trackColor={{ true: COLORS.success, false: '#D5D0E0' }}
            thumbColor="#fff"
          />
        </View>

        {/* Earnings highlight */}
        <View style={styles.earnCard}>
          <View>
            <Text style={styles.earnLabel}>Total Earnings</Text>
            <Text style={styles.earnVal}>₹{earnings}</Text>
            <Text style={styles.earnSub}>
              {stats?.activeChats || 0} active · {stats?.totalChats || 0} total chats
            </Text>
          </View>
          <View style={styles.earnIcon}>
            <Ionicons name="wallet" size={26} color={COLORS.bannerDark} />
          </View>
        </View>

        {/* Stats */}
        <Text style={styles.section}>Overview</Text>
        <View style={styles.statsRow}>
          <MiniStat icon="star" color={COLORS.star} label="Rating" value={`${stats?.rating ?? astrologer?.rating ?? '—'}`} />
          <MiniStat icon="flash" color={COLORS.warning} label="Active" value={`${stats?.activeChats ?? 0}`} />
          <MiniStat icon="chatbubbles" color={COLORS.link} label="Chats" value={`${stats?.totalChats ?? 0}`} />
          <MiniStat icon="briefcase" color={COLORS.violet} label="Orders" value={`${stats?.totalOrders ?? 0}`} />
        </View>

        {/* Workspace */}
        <Text style={styles.section}>Workspace</Text>
        <View style={styles.grid}>
          <ActionTile
            icon="chatbubbles"
            color={COLORS.link}
            title="Chats"
            sub="Requests & replies"
            badge={stats?.activeChats}
            onPress={() => router.push('/(tabs)/chats')}
          />
          <ActionTile
            icon="call"
            color={COLORS.success}
            title="Calls"
            sub="Voice sessions"
            onPress={() => router.push('/(tabs)/calls')}
          />
          <ActionTile
            icon="person"
            color={COLORS.violet}
            title="Profile"
            sub="Public listing"
            onPress={() => router.push('/(tabs)/profile')}
          />
          <ActionTile
            icon="create"
            color={COLORS.warning}
            title="Edit"
            sub="Rates & bio"
            onPress={() => router.push('/profile/edit')}
          />
        </View>

        {/* Recent */}
        {(data?.recentChats || []).length > 0 && (
          <>
            <Text style={styles.section}>Recent consultations</Text>
            {(data.recentChats || []).slice(0, 5).map((chat) => {
              const birth = chat.userBirthDetails || {};
              const name = birth.name || chat.user?.name || 'User';
              return (
                <TouchableOpacity
                  key={chat._id}
                  style={styles.recentRow}
                  onPress={() => router.push(`/chat/${chat._id}`)}
                  activeOpacity={0.88}
                >
                  <View style={styles.recentAvatar}>
                    <Text style={styles.recentAvatarText}>{name.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recentName}>{name}</Text>
                    <Text style={styles.recentMsg} numberOfLines={1}>
                      {chat.messages?.[chat.messages.length - 1]?.content || 'No messages yet'}
                    </Text>
                  </View>
                  {chat.isActive ? (
                    <View style={styles.activeChip}>
                      <Text style={styles.activeChipText}>LIVE</Text>
                    </View>
                  ) : (
                    <Ionicons name="chevron-forward" size={16} color={colors.border} />
                  )}
                </TouchableOpacity>
              );
            })}
          </>
        )}

        <View style={styles.tip}>
          <Ionicons name="sparkles" size={16} color={COLORS.primary} />
          <Text style={styles.tipText}>
            Online + Chat/Call ON rakho. User ki DOB / TOB / place request me auto milti hai.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function MiniStat({ icon, color, label, value }) {
  return (
    <View style={styles.miniStat}>
      <View style={[styles.miniIcon, { backgroundColor: `${color}22` }]}>
        <Ionicons name={icon} size={14} color={color} />
      </View>
      <Text style={styles.miniVal}>{value}</Text>
      <Text style={styles.miniLabel}>{label}</Text>
    </View>
  );
}

function ActionTile({ icon, color, title, sub, badge, onPress }) {
  return (
    <TouchableOpacity style={styles.tile} onPress={onPress} activeOpacity={0.9}>
      <View style={[styles.tileIcon, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={22} color={color} />
        {badge > 0 && (
          <View style={styles.tileBadge}>
            <Text style={styles.tileBadgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.tileTitle}>{title}</Text>
      <Text style={styles.tileSub}>{sub}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  boot: {
    flex: 1, backgroundColor: COLORS.bannerDark, alignItems: 'center', justifyContent: 'center',
  },
  bootCard: {
    alignItems: 'center', padding: 32, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(245,197,24,0.2)',
  },
  bootText: { color: 'rgba(255,255,255,0.7)', marginTop: 12, fontWeight: '600' },

  headerBtn: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  identity: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 18, padding: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 52, height: 52, borderRadius: 18, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { fontSize: 22, fontWeight: '900', color: COLORS.bannerDark },
  liveDot: {
    position: 'absolute', bottom: -1, right: -1, width: 14, height: 14, borderRadius: 7,
    backgroundColor: COLORS.success, borderWidth: 2, borderColor: COLORS.bannerDark,
  },
  idName: { color: '#fff', fontSize: 16, fontWeight: '800' },
  idMeta: { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 3, fontWeight: '500' },
  rateChip: {
    backgroundColor: COLORS.primary, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center',
  },
  rateChipTop: { fontSize: 8, fontWeight: '800', color: COLORS.bannerDark, letterSpacing: 0.8 },
  rateChipVal: { fontSize: 15, fontWeight: '900', color: COLORS.bannerDark },
  rateChipBot: { fontSize: 9, fontWeight: '700', color: 'rgba(18,8,31,0.65)' },

  body: { padding: 16 },

  onlineCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOW_SM,
  },
  onlineCardOn: {
    borderColor: 'rgba(22,163,74,0.35)', backgroundColor: '#F3FCF6',
  },
  onlineLeft: { flex: 1, paddingRight: 10 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginBottom: 6,
    backgroundColor: COLORS.soft,
  },
  statusOn: { backgroundColor: 'rgba(22,163,74,0.12)' },
  statusOff: { backgroundColor: COLORS.soft },
  statusTxt: { fontSize: 12, fontWeight: '800', color: colors.textMuted },
  dot: { width: 8, height: 8, borderRadius: 4 },
  onlineHint: { fontSize: 12, color: colors.textMuted, lineHeight: 17 },

  earnCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.bannerDark, borderRadius: RADIUS.xl, padding: 18, marginBottom: 18,
    ...SHADOW_MD,
  },
  earnLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: '700', letterSpacing: 0.4 },
  earnVal: { color: COLORS.primary, fontSize: 30, fontWeight: '900', marginTop: 4, letterSpacing: -0.5 },
  earnSub: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4, fontWeight: '500' },
  earnIcon: {
    width: 54, height: 54, borderRadius: 18, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },

  section: {
    fontSize: 11, fontWeight: '800', color: COLORS.textLight,
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10,
  },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  miniStat: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 6,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, ...SHADOW_SM,
  },
  miniIcon: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  miniVal: { fontSize: 15, fontWeight: '900', color: COLORS.text },
  miniLabel: { fontSize: 10, color: colors.textMuted, marginTop: 2, fontWeight: '600' },

  liveOn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#B91C1C', borderRadius: RADIUS.lg, padding: 16, marginBottom: 18,
  },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12,
  },
  livePulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  liveBadgeText: { color: '#fff', fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  liveTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
  liveSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },

  liveOff: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 14, marginBottom: 18,
    borderWidth: 1, borderColor: COLORS.errorLight, ...SHADOW_SM,
  },
  liveOffIcon: {
    width: 48, height: 48, borderRadius: 16, backgroundColor: COLORS.errorLight,
    alignItems: 'center', justifyContent: 'center',
  },
  liveOffTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  liveOffSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  startPill: {
    backgroundColor: COLORS.error, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
  },
  startPillText: { color: '#fff', fontWeight: '800', fontSize: 12 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  tile: {
    width: '48%', backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 14,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOW_SM,
  },
  tileIcon: {
    width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    marginBottom: 10, position: 'relative',
  },
  tileBadge: {
    position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: COLORS.error, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  tileBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  tileTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  tileSub: { fontSize: 11, color: colors.textMuted, marginTop: 2, fontWeight: '500' },

  recentRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 16, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  recentAvatar: {
    width: 42, height: 42, borderRadius: 14, backgroundColor: COLORS.violetSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  recentAvatarText: { fontSize: 16, fontWeight: '800', color: COLORS.violet },
  recentName: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  recentMsg: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  activeChip: {
    backgroundColor: COLORS.successLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  activeChipText: { color: COLORS.success, fontSize: 10, fontWeight: '900' },

  tip: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: COLORS.primaryLight, borderRadius: 16, padding: 14, marginTop: 8,
    borderWidth: 1, borderColor: COLORS.borderGold,
  },
  tipText: { flex: 1, fontSize: 12, color: COLORS.text, lineHeight: 18, fontWeight: '500' },
});
