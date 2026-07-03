import { View, FlatList, StyleSheet } from 'react-native';
import { useMemo, useState } from 'react';
import AppHeader from '../../components/common/AppHeader';
import SearchBar from '../../components/common/SearchBar';
import CashbackBanner from '../../components/common/CashbackBanner';
import FilterChips from '../../components/common/FilterChips';
import AstrologerListCard from '../../components/home/AstrologerListCard';
import DrawerMenu from '../../components/drawer/DrawerMenu';
import { useAstrologers } from '../../hooks/useHomeData';
import { COLORS } from '../../constants/colors';

export default function CallTabScreen() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { astrologers } = useAstrologers('call');

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
    <View style={styles.container}>
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
        renderItem={({ item }) => <AstrologerListCard astrologer={item} mode="call" />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />

      <DrawerMenu visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  list: { paddingBottom: 16 },
});