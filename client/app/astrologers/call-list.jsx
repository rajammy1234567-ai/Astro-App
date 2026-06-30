import { View, FlatList, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import Header from '../../components/common/Header';
import SearchBar from '../../components/common/SearchBar';
import FilterChips from '../../components/common/FilterChips';
import AstrologerCard from '../../components/home/AstrologerCard';
import { ASTROLOGERS, FILTERS } from '../../constants/mockData';
import { COLORS } from '../../constants/colors';

export default function CallListScreen() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const { list } = useSelector((state) => state.astrologer);

  const astrologers = (list.length ? list : ASTROLOGERS).filter((a) => a.callEnabled);
  const filtered = astrologers.filter((a) => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || a.specialty?.includes(filter);
    return matchSearch && matchFilter;
  });

  return (
    <View style={styles.container}>
      <Header title="Call with Astrologer" />
      <SearchBar value={search} onChangeText={setSearch} />
      <FilterChips filters={FILTERS} active={filter} onSelect={setFilter} />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <AstrologerCard astrologer={item} mode="call" />}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { paddingTop: 8, paddingBottom: 24 },
});