import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Screen from '../../components/common/Screen';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView as HScroll } from 'react-native';
import AppHeader from '../../components/common/AppHeader';
import SearchBar from '../../components/common/SearchBar';
import CashbackBanner from '../../components/common/CashbackBanner';
import CategoryCircles from '../../components/home/CategoryCircles';
import HomeHeroBanner from '../../components/home/HomeHeroBanner';
import AstrologerHorizontalCard from '../../components/home/AstrologerHorizontalCard';
import StoreSection from '../../components/home/StoreSection';
import ChatCallButtons from '../../components/home/ChatCallButtons';
import BlogNewsSection from '../../components/home/BlogNewsSection';
import TrustBadges from '../../components/home/TrustBadges';
import DrawerMenu from '../../components/drawer/DrawerMenu';
import { useHomeData } from '../../hooks/useHomeData';
import ServerBanner from '../../components/common/ServerBanner';
import { useScreenInsets } from '../../hooks/useScreenInsets';
import { COLORS } from '../../constants/colors';

/** Sticky strip height (~46 btn + 16 pad) above tab bar */
const STICKY_STRIP = 62;

export default function HomeScreen() {
  const router = useRouter();
  const safe = useScreenInsets();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { astrologers, blogs, products, news, connectionError } = useHomeData();

  const filtered = search
    ? astrologers.filter((a) => a.name?.toLowerCase().includes(search.toLowerCase()))
    : astrologers;
  const featured = filtered.slice(0, 4);

  // Tab bar + sticky chat/call strip
  const scrollBottomPad = safe.tabBar + STICKY_STRIP + 16;

  return (
    <Screen>
      <AppHeader showLang onMenuPress={() => setDrawerOpen(true)} />
      <SearchBar value={search} onChangeText={setSearch} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: scrollBottomPad }]}
        keyboardShouldPersistTaps="handled"
      >
        <ServerBanner message={connectionError} />
        <HomeHeroBanner />
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
        <BlogNewsSection blogs={blogs} news={news} />
        <TrustBadges />
      </ScrollView>

      {/* Always-on — sits above tab bar (gesture or button nav) */}
      <ChatCallButtons sticky />

      <DrawerMenu visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {},
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
