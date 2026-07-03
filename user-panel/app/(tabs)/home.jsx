import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView as HScroll } from 'react-native';
import AppHeader from '../../components/common/AppHeader';
import SearchBar from '../../components/common/SearchBar';
import CashbackBanner from '../../components/common/CashbackBanner';
import CategoryCircles from '../../components/home/CategoryCircles';
import AstrologerHorizontalCard from '../../components/home/AstrologerHorizontalCard';
import StoreSection from '../../components/home/StoreSection';
import ChatCallButtons from '../../components/home/ChatCallButtons';
import BlogNewsSection from '../../components/home/BlogNewsSection';
import TrustBadges from '../../components/home/TrustBadges';
import DrawerMenu from '../../components/drawer/DrawerMenu';
import { useHomeData } from '../../hooks/useHomeData';
import { COLORS } from '../../constants/colors';

export default function HomeScreen() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { astrologers, blogs, products, news } = useHomeData();

  const filtered = search
    ? astrologers.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))
    : astrologers;
  const featured = filtered.slice(0, 4);

  return (
    <View style={styles.container}>
      <AppHeader showLang onMenuPress={() => setDrawerOpen(true)} />
      <SearchBar value={search} onChangeText={setSearch} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <CategoryCircles />
        <CashbackBanner variant="dark" />

        <View style={styles.astroSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Astrologers</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(tabs)/chat')}>
              <Text style={styles.seeAll}>View All</Text>
            </TouchableOpacity>
          </View>

          <HScroll
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.astroScroll}
          >
            {featured.map((a) => (
              <AstrologerHorizontalCard key={a._id} astrologer={a} />
            ))}
          </HScroll>
        </View>

        <StoreSection products={products} />
        <ChatCallButtons />
        <BlogNewsSection blogs={blogs} news={news} />
        <TrustBadges />
      </ScrollView>

      <DrawerMenu visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  scroll: { paddingBottom: 20 },
  astroSection: {
    marginTop: 6,
    paddingBottom: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  seeAll: { fontSize: 13, fontWeight: '600', color: COLORS.link },
  astroScroll: {
    paddingHorizontal: 14,
    paddingBottom: 6,
    alignItems: 'flex-start',
  },
});