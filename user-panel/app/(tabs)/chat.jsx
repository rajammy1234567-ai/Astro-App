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
import { COLORS } from '../../constants/colors';

export default function ChatTabScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeSessions, setActiveSessions] = useState([]);
  const [loadingActive, setLoadingActive] = useState(false);
  const { astrologers } = useAstrologers('chat');

  const loadActive = useCallback(async () => {
    if (!isAuthenticated) {
      setActiveSessions([]);
      return;
    }
    setLoadingActive(true);
    try {
      const data = await sessionApi.getMy();
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
    if (item.type === 'call') {
      router.push({
        pathname: `/call/${item._id}`,
        params: { type: 'voice', astroName: item.astrologer?.name || 'Astrologer' },
      });
      return;
    }
    router.push(`/chat/${item._id}`);
  };

  const filtered = useMemo(() => astrologers.filter((a) => {
    if (filter === 'new') return a.isNew;
    if (filter === 'love') return a.specialty?.toLowerCase().includes('tarot');
    if (!a.chatEnabled) return false;
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
        showChat
        onMenuPress={() => setDrawerOpen(true)}
        onSearchPress={() => setSearchOpen((v) => !v)}
      />
      {searchOpen && (
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search astrologers..." />
      )}
      <CashbackBanner variant="light" />

      {/* Ongoing chats — re-enter without ending */}
      {isAuthenticated && (
        <View style={styles.activeWrap}>
          <View style={styles.activeHeader}>
            <Text style={styles.activeTitle}>Ongoing chats & calls</Text>
            <TouchableOpacity onPress={() => router.push('/sessions')}>
              <Text style={styles.seeAll}>Sab dekho</Text>
            </TouchableOpacity>
          </View>
          {loadingActive ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 8 }} />
          ) : activeSessions.length === 0 ? (
            <Text style={styles.activeEmpty}>
              Koi open chat nahi. Neeche se naya chat start karo. Agar pehle leave kiya tha to yahan wapas dikhega.
            </Text>
          ) : (
            activeSessions.map((s) => {
              const isCall = s.type === 'call';
              const label = s.status === 'pending' ? 'Waiting' : s.status === 'paused' ? 'Paused' : 'Active';
              return (
                <TouchableOpacity key={s._id} style={styles.activeCard} onPress={() => openSession(s)} activeOpacity={0.85}>
                  <View style={[styles.activeIcon, isCall ? styles.callBg : styles.chatBg]}>
                    <Ionicons name={isCall ? 'call' : 'chatbubble'} size={16} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activeName}>{s.astrologer?.name || 'Astrologer'}</Text>
                    <Text style={styles.activeSub}>{isCall ? 'Voice call' : 'Chat'} · {label}</Text>
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
        renderItem={({ item }) => <AstrologerListCard astrologer={item} mode="chat" />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>Koi astrologer online nahi. Thodi der baad check karo.</Text>
        }
      />

      <DrawerMenu visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 16 },
  empty: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 40, paddingHorizontal: 24 },
  activeWrap: {
    marginHorizontal: 12, marginTop: 8, marginBottom: 4,
    padding: 12, borderRadius: 14, backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.borderLight || COLORS.border,
  },
  activeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  activeTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  seeAll: { fontSize: 12, fontWeight: '700', color: COLORS.primaryDark || COLORS.text },
  activeEmpty: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 17 },
  activeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.borderLight || COLORS.border,
  },
  activeIcon: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },
  chatBg: { backgroundColor: COLORS.success || '#2EAF5D' },
  callBg: { backgroundColor: COLORS.link || '#1976D2' },
  activeName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  activeSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  resume: { fontSize: 12, fontWeight: '800', color: COLORS.primaryDark || COLORS.text },
});
