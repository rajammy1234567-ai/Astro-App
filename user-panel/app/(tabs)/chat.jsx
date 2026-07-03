import { FlatList, StyleSheet, Text } from 'react-native';
import Screen from '../../components/common/Screen';
import { useMemo, useState } from 'react';
import AppHeader from '../../components/common/AppHeader';
import SearchBar from '../../components/common/SearchBar';
import CashbackBanner from '../../components/common/CashbackBanner';
import FilterChips from '../../components/common/FilterChips';
import AstrologerListCard from '../../components/home/AstrologerListCard';
import DrawerMenu from '../../components/drawer/DrawerMenu';
import { useAstrologers } from '../../hooks/useHomeData';
import { COLORS } from '../../constants/colors';

export default function ChatTabScreen() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { astrologers } = useAstrologers('chat');

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
});