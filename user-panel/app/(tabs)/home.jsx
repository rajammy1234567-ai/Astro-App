import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Screen from '../../components/common/Screen';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView as HScroll } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../../components/common/AppHeader';
import SearchBar from '../../components/common/SearchBar';
import CashbackBanner from '../../components/common/CashbackBanner';
import CategoryCircles from '../../components/home/CategoryCircles';
import HomeHeroBanner from '../../components/home/HomeHeroBanner';
import ServicesShowcase from '../../components/home/ServicesShowcase';
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

/** Sticky strip height (~52 btn + 16 pad) above tab bar */
const STICKY_STRIP = 70;

export default function HomeScreen() {
  const router = useRouter();
  const safe = useScreenInsets();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { astrologers, blogs, products, news, connectionError, loading, refresh } = useHomeData();
  const [refreshing, setRefreshing] = useState(false);

  const filtered = search
    ? astrologers.filter((a) => a.name?.toLowerCase().includes(search.toLowerCase()))
    : astrologers;
  const featured = filtered.slice(0, 8);
  const onlineCount = astrologers.filter((a) => a.isOnline).length;

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      refresh();
    } finally {
      setTimeout(() => setRefreshing(false), 700);
    }
  };

  const scrollBottomPad = safe.tabBar + STICKY_STRIP + 16;

  return (
    <Screen>
      <AppHeader showLang onMenuPress={() => setDrawerOpen(true)} />
      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Search astrologers, kundli, remedies…"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: scrollBottomPad }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primaryDark}
            colors={[COLORS.primaryDark]}
          />
        }
      >
        <ServerBanner message={connectionError} />
        <HomeHeroBanner />
        <CategoryCircles />
        <CashbackBanner variant="dark" />
        <ServicesShowcase />

        <View style={styles.astroSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Our Astrologers</Text>
              <Text style={styles.sectionSub}>
                {onlineCount > 0
                  ? `${onlineCount} online now · verified experts`
                  : 'Verified experts ready to guide you'}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/(tabs)/chat')}
              style={styles.seeAllBtn}
            >
              <Text style={styles.seeAll}>View All</Text>
              <Ionicons name="chevron-forward" size={14} color={COLORS.link} />
            </TouchableOpacity>
          </View>

          {loading && !featured.length ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={COLORS.primaryDark} />
              <Text style={styles.loadingText}>Loading astrologers…</Text>
            </View>
          ) : featured.length ? (
            <HScroll
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.astroScroll}
            >
              {featured.map((a) => (
                <AstrologerHorizontalCard key={a._id} astrologer={a} />
              ))}
            </HScroll>
          ) : (
            <TouchableOpacity
              style={styles.emptyAstro}
              onPress={() => router.push('/(tabs)/chat')}
              activeOpacity={0.85}
            >
              <Ionicons name="sparkles" size={28} color={COLORS.primaryDark} />
              <Text style={styles.emptyTitle}>
                {search ? 'No match for your search' : 'Astrologers loading soon'}
              </Text>
              <Text style={styles.emptySub}>Pull to refresh or browse chat list</Text>
            </TouchableOpacity>
          )}
        </View>

        <StoreSection products={products} />
        <BlogNewsSection blogs={blogs} news={news} />
        <TrustBadges />

        <View style={styles.footerNote}>
          <Ionicons name="moon" size={14} color={COLORS.primaryDark} />
          <Text style={styles.footerText}>Guided by stars · Powered by trust</Text>
        </View>
      </ScrollView>

      <ChatCallButtons sticky />

      <DrawerMenu visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {},
  astroSection: {
    marginTop: 8,
    paddingBottom: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  sectionSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAll: { fontSize: 13, fontWeight: '700', color: COLORS.link },
  astroScroll: {
    paddingHorizontal: 14,
    paddingBottom: 8,
    alignItems: 'flex-start',
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 10,
  },
  loadingText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  emptyAstro: {
    marginHorizontal: 14,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(253,185,19,0.35)',
  },
  emptyTitle: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  emptySub: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    marginBottom: 8,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
