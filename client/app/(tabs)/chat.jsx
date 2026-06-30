import { View, FlatList, StyleSheet } from 'react-native';
import { useState } from 'react';
import AppHeader from '../../components/common/AppHeader';
import CashbackBanner from '../../components/common/CashbackBanner';
import FilterChips from '../../components/common/FilterChips';
import AstrologerListCard from '../../components/home/AstrologerListCard';
import DrawerMenu from '../../components/drawer/DrawerMenu';
import { useAstrologers } from '../../hooks/useHomeData';
import { COLORS } from '../../constants/colors';

export default function ChatTabScreen() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const { astrologers } = useAstrologers('chat');

  const filtered = astrologers.filter((a) => {
    if (filter === 'new') return a.isNew;
    if (filter === 'love') return a.specialty?.toLowerCase().includes('tarot');
    return a.chatEnabled;
  });

  return (
    <View style={styles.container}>
      <AppHeader showSearch showChat onMenuPress={() => setDrawerOpen(true)} />
      <CashbackBanner variant="light" />
      <FilterChips active={filter} onSelect={setFilter} />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <AstrologerListCard astrologer={item} mode="chat" />}
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