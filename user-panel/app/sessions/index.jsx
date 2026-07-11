import { useCallback, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import Screen from '../../components/common/Screen';
import Header from '../../components/common/Header';
import EmptyState from '../../components/common/EmptyState';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { sessionApi } from '../../services/sessionApi';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../constants/colors';
import { SHADOW, SHADOW_MD } from '../../constants/theme';
import { formatDuration } from '../../utils/formatters';

function statusMeta(status) {
  if (status === 'active') return { label: 'Active', color: COLORS.success, bg: COLORS.successLight };
  if (status === 'pending') return { label: 'Waiting', color: COLORS.primaryDark, bg: COLORS.primaryLight };
  if (status === 'paused') return { label: 'Paused', color: COLORS.warning, bg: '#FFF8E1' };
  if (status === 'rejected') return { label: 'Declined', color: COLORS.error, bg: COLORS.errorLight };
  if (status === 'ended') return { label: 'Ended', color: COLORS.textSecondary, bg: COLORS.borderLight };
  return { label: status || 'Unknown', color: COLORS.textSecondary, bg: COLORS.borderLight };
}

function isOpenStatus(status) {
  return ['pending', 'active', 'paused', 'accepted'].includes(status);
}

export default function SessionsHistoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const rawType = String(params.type || 'all').toLowerCase();
  const historyType = rawType === 'chat' || rawType === 'call' ? rawType : 'all';

  const { isAuthenticated, initialized } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const title =
    historyType === 'chat'
      ? 'Chat History'
      : historyType === 'call'
        ? 'Call History'
        : 'Chat & Call History';

  const subtitle =
    historyType === 'chat'
      ? 'All conversations in one place'
      : historyType === 'call'
        ? 'Duration summary of your calls'
        : 'Your consultations timeline';

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setSessions([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const data = await sessionApi.getMy(historyType === 'all' ? undefined : historyType);
      setSessions(Array.isArray(data) ? data : []);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, historyType]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const openSession = (item) => {
    const isCall = item.type === 'call';

    if (isCall && !isOpenStatus(item.status)) {
      const dur = formatDuration(item.durationSeconds || item.billing?.durationSeconds || 0);
      Alert.alert(
        'Call Summary',
        `Your call with ${item.astrologer?.name || 'Astrologer'} lasted ${dur}.\n\nStatus: ${statusMeta(item.status).label}`,
        [{ text: 'OK' }]
      );
      return;
    }

    if (isCall) {
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

  const emptyCopy = useMemo(() => {
    if (historyType === 'chat') {
      return {
        icon: 'chatbubbles-outline',
        title: 'No chat history',
        subtitle: 'When you chat with someone, your full history will appear here.',
        actionLabel: 'Start Chat',
        route: '/(tabs)/chat',
      };
    }
    if (historyType === 'call') {
      return {
        icon: 'call-outline',
        title: 'No call history',
        subtitle: 'When you make a call, history with duration will appear here.',
        actionLabel: 'Start Call',
        route: '/(tabs)/call',
      };
    }
    return {
      icon: 'chatbubbles-outline',
      title: 'No sessions yet',
      subtitle: 'When you chat or call, your history will appear here.',
      actionLabel: 'Find Astrologers',
      route: '/(tabs)/chat',
    };
  }, [historyType]);

  const tip =
    historyType === 'call'
      ? {
        icon: 'time-outline',
        text: 'Ended calls show duration only — how long the call lasted.',
      }
      : historyType === 'chat'
        ? {
          icon: 'sparkles-outline',
          text: 'Tap a card to open messages. Ongoing chats can also be resumed.',
        }
        : {
          icon: 'bulb-outline',
          text: 'Tap Active/Waiting to resume a session.',
        };

  const shell = (children) => (
    <Screen edges={['left', 'right', 'bottom']} style={styles.screen}>
      <Header title={title} subtitle={subtitle} />
      {children}
    </Screen>
  );

  if (!initialized || loading) {
    return shell(<ActivityIndicator color={COLORS.primary} style={{ marginTop: 48 }} />);
  }

  if (!isAuthenticated) {
    return shell(
      <EmptyState
        icon="lock-closed-outline"
        title="Login Required"
        subtitle="Please log in to view your history."
        actionLabel="Login"
        onAction={() => router.push('/(auth)/login')}
      />
    );
  }

  return shell(
    <>
      {/* Soft gold hero — no dark blue */}
      <View style={styles.hero}>
        <View style={styles.heroBadge}>
          <Ionicons
            name={historyType === 'call' ? 'call' : 'chatbubbles'}
            size={12}
            color={COLORS.primaryDark}
          />
          <Text style={styles.heroBadgeText}>
            {historyType === 'call' ? 'CALL LOG' : historyType === 'chat' ? 'CHAT LOG' : 'SESSION LOG'}
          </Text>
        </View>
        <Text style={styles.heroTitle}>
          {historyType === 'call'
            ? 'Your voice calls'
            : historyType === 'chat'
              ? 'Your conversations'
              : 'Your consultations'}
        </Text>
        <Text style={styles.heroSub}>
          {sessions.length} {sessions.length === 1 ? 'entry' : 'entries'} · pull to refresh
        </Text>
        <View style={styles.heroDecor}>
          <Ionicons
            name={historyType === 'call' ? 'time' : 'planet'}
            size={52}
            color="rgba(253,185,19,0.45)"
          />
        </View>
      </View>

      <View style={styles.tipBox}>
        <Ionicons name={tip.icon} size={16} color={COLORS.primary} />
        <Text style={styles.tipText}>{tip.text}</Text>
      </View>

      <FlatList
        data={sessions}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon={emptyCopy.icon}
            title={emptyCopy.title}
            subtitle={emptyCopy.subtitle}
            actionLabel={emptyCopy.actionLabel}
            onAction={() => router.push(emptyCopy.route)}
          />
        }
        renderItem={({ item }) => {
          const meta = statusMeta(item.status);
          const a = item.astrologer;
          const isCall = item.type === 'call';
          const durationLabel = formatDuration(
            item.durationSeconds || item.billing?.durationSeconds || 0
          );
          const open = isOpenStatus(item.status);
          const when = item.updatedAt || item.createdAt
            ? new Date(item.updatedAt || item.createdAt).toLocaleString('en-IN', {
              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
            })
            : '';

          return (
            <TouchableOpacity style={styles.card} onPress={() => openSession(item)} activeOpacity={0.88}>
              <View style={[styles.iconWrap, isCall ? styles.callIcon : styles.chatIcon]}>
                <Ionicons name={isCall ? 'call' : 'chatbubble'} size={18} color={isCall ? COLORS.text : '#FFF'} />
              </View>
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{a?.name || 'Astrologer'}</Text>
                {isCall ? (
                  <>
                    <Text style={styles.sub}>
                      Voice Call · {open ? meta.label : 'Completed'}
                    </Text>
                    <View style={styles.durationPill}>
                      <Ionicons name="time-outline" size={13} color={COLORS.primaryDark} />
                      <Text style={styles.durationText}>Duration: {durationLabel}</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.sub} numberOfLines={1}>
                      Chat · {a?.specialty || 'Consultation'}
                    </Text>
                    <Text style={styles.time}>
                      {when}{open ? ' · Resume' : ' · View messages'}
                    </Text>
                  </>
                )}
                {isCall && when ? <Text style={styles.time}>{when}</Text> : null}
              </View>
              <View style={styles.rightCol}>
                <View style={[styles.badge, { backgroundColor: meta.bg }]}>
                  <Text style={[styles.badgeText, { color: meta.color }]}>
                    {isCall && !open ? durationLabel : meta.label}
                  </Text>
                </View>
                <Ionicons
                  name={open ? 'chevron-forward' : isCall ? 'information-circle-outline' : 'chatbubble-ellipses-outline'}
                  size={16}
                  color={COLORS.textLight}
                  style={{ marginTop: 8 }}
                />
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: COLORS.cream, flex: 1 },
  hero: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    padding: 18,
    overflow: 'hidden',
    minHeight: 110,
    borderWidth: 1,
    borderColor: COLORS.primary + '55',
    ...SHADOW_MD,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  heroBadgeText: { fontSize: 9, fontWeight: '800', color: COLORS.primaryDark, letterSpacing: 0.5 },
  heroTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, lineHeight: 24 },
  heroSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 6, fontWeight: '500' },
  heroDecor: { position: 'absolute', right: 4, bottom: -4, opacity: 0.95 },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: COLORS.yellowLight,
    padding: 12,
    borderRadius: 12,
  },
  tipText: { flex: 1, fontSize: 12, color: COLORS.textSecondary, lineHeight: 17, fontWeight: '600' },
  list: { padding: 16, paddingBottom: 40, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 12,
    ...SHADOW_MD,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatIcon: { backgroundColor: COLORS.success },
  callIcon: {
    backgroundColor: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.primaryDark,
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  sub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 3, fontWeight: '500' },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 6,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary + '66',
  },
  durationText: { fontSize: 12, fontWeight: '800', color: COLORS.text },
  time: { fontSize: 11, color: COLORS.textLight, marginTop: 4, fontWeight: '500' },
  rightCol: { alignItems: 'flex-end' },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    maxWidth: 100,
  },
  badgeText: { fontSize: 10, fontWeight: '800', textAlign: 'center' },
});
