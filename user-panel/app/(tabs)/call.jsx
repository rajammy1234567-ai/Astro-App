import { FlatList, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import Screen from '../../components/common/Screen';
import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../../components/common/AppHeader';
import SearchBar from '../../components/common/SearchBar';
import CashbackBanner from '../../components/common/CashbackBanner';
import FilterChips from '../../components/common/FilterChips';
import AstrologerListCard from '../../components/home/AstrologerListCard';
import DrawerMenu from '../../components/drawer/DrawerMenu';
import { useAstrologers } from '../../hooks/useHomeData';
import { useAuth } from '../../hooks/useAuth';
import { sessionApi } from '../../services/sessionApi';
import { useScreenInsets } from '../../hooks/useScreenInsets';
import { COLORS } from '../../constants/colors';
import { formatDuration } from '../../utils/formatters';

export default function CallTabScreen() {
  const router = useRouter();
  const safe = useScreenInsets();
  const { isAuthenticated } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeSessions, setActiveSessions] = useState([]);
  const [loadingActive, setLoadingActive] = useState(false);
  const { astrologers } = useAstrologers('call');

  const loadActive = useCallback(async () => {
    if (!isAuthenticated) {
      setActiveSessions([]);
      return;
    }
    setLoadingActive(true);
    try {
      const data = await sessionApi.getMy('call');
      const open = (Array.isArray(data) ? data : []).filter((s) =>
        ['pending', 'active', 'paused', 'accepted'].includes(s.status)
      );
      setActiveSessions(open);
    } catch {
      setActiveSessions([]);
    } finally {
      setLoadingActive(false);
    }
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      loadActive();
    }, [loadActive])
  );

  const openSession = (item) => {
    router.push({
      pathname: `/call/${item._id}`,
      params: { type: 'voice', astroName: item.astrologer?.name || 'Astrologer' },
    });
  };

  const filtered = useMemo(() => astrologers.filter((a) => {
    if (filter === 'new') return a.isNew;
    if (!a.callEnabled) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return a.name?.toLowerCase().includes(q) || a.specialty?.toLowerCase().includes(q);
    }
    return true;
  }), [astrologers, filter, search]);

  return (
    <Screen>
      <AppHeader
        showSearch
        showCallHistory
        onMenuPress={() => setDrawerOpen(true)}
        onSearchPress={() => setSearchOpen((v) => !v)}
      />
      {searchOpen && (
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search astrologers..." />
      )}
      <CashbackBanner variant="light" />

      {isAuthenticated && (
        <View style={styles.activeWrap}>
          <View style={styles.activeHeader}>
            <Text style={styles.activeTitle}>Ongoing calls</Text>
            <TouchableOpacity onPress={() => router.push({ pathname: '/sessions', params: { type: 'call' } })}>
              <Text style={styles.seeAll}>Call history</Text>
            </TouchableOpacity>
          </View>
          {loadingActive ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 8 }} />
          ) : activeSessions.length === 0 ? (
            <Text style={styles.activeEmpty}>
              No open calls. Start a call below. History shows duration only.
            </Text>
          ) : (
            activeSessions.map((s) => {
              const label = s.status === 'pending' ? 'Waiting' : s.status === 'paused' ? 'Paused' : 'Active';
              const dur = formatDuration(s.durationSeconds || s.billing?.durationSeconds || 0);
              return (
                <TouchableOpacity key={s._id} style={styles.activeCard} onPress={() => openSession(s)} activeOpacity={0.85}>
                  <View style={[styles.activeIcon, styles.callBg]}>
                    <Ionicons name="call" size={16} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activeName}>{s.astrologer?.name || 'Astrologer'}</Text>
                    <Text style={styles.activeSub}>Voice call · {label} · {dur}</Text>
                  </View>
                  <Text style={styles.resume}>Resume ›</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      )}

      <FilterChips active={filter} onSelect={setFilter} />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <AstrologerListCard astrologer={item} mode="call" />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingBottom: safe.tabBar + 24 }]}
        ListEmptyComponent={
          <Text style={styles.empty}>No astrologers are online. Please check again shortly.</Text>
        }
      />

      <DrawerMenu visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 16, flexGrow: 1 },
  empty: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 40, paddingHorizontal: 24 },
  activeWrap: {
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 6,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: COLORS.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary + '44',
  },
  activeTitle: { fontSize: 13, fontWeight: '800', color: COLORS.text },
  seeAll: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.text,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    overflow: 'hidden',
  },
  activeEmpty: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  activeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  activeIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callBg: { backgroundColor: COLORS.primary },
  activeName: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  activeSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2, fontWeight: '500' },
  resume: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.text,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.primary + '66',
  },
});
