import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Dimensions,
} from 'react-native';
import Screen from '../../components/common/Screen';
import { Image } from 'expo-image';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RemedyHeader from '../../components/remedies/RemedyHeader';
import DrawerMenu from '../../components/drawer/DrawerMenu';
import { useScreenInsets } from '../../hooks/useScreenInsets';
import {
  REMEDY_CATEGORIES,
  REMEDY_PROBLEMS,
  REMEDY_SERVICES,
  REMEDY_POOJAS,
  REMEDY_STATS,
  REMEDY_OFFERS,
  REMEDY_TRUST,
} from '../../constants/remedyData';
import { COLORS } from '../../constants/colors';
import { SHADOW, SHADOW_MD } from '../../constants/theme';
import { fetchProducts, addToCart, canAddToCart } from '../../redux/storeSlice';
import { useAuth } from '../../hooks/useAuth';
import { requireAuthForPurchase } from '../../utils/purchaseAuth';
import { formatCurrency } from '../../utils/formatters';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = (SCREEN_W - 44) / 2;

function SectionHeader({ title, subtitle, action, onAction }) {
  return (
    <View style={styles.sectionHead}>
      <View style={styles.sectionHeadLeft}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSub}>{subtitle}</Text> : null}
      </View>
      {action ? (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text style={styles.viewAll}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function CategoryChip({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.catItem} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.catCircle, { backgroundColor: item.bg }]}>
        <Ionicons name={item.icon} size={22} color={item.color} />
      </View>
      <Text style={styles.catLabel}>{item.label}</Text>
    </TouchableOpacity>
  );
}

function ProblemPill({ item, active, onPress }) {
  return (
    <TouchableOpacity
      style={[
        styles.problemPill,
        { backgroundColor: item.bg },
        active && { borderColor: item.color, borderWidth: 1.5 },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Ionicons name={item.icon} size={16} color={item.color} />
      <Text style={[styles.problemText, { color: item.color }]}>{item.label}</Text>
    </TouchableOpacity>
  );
}

function ServiceCard({ item, onPress, wide }) {
  return (
    <TouchableOpacity
      style={[styles.serviceCard, wide && styles.serviceCardWide]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <Image source={{ uri: item.image }} style={styles.serviceImg} contentFit="cover" />
      <View style={styles.serviceOverlay} />
      <View style={[styles.serviceTag, { backgroundColor: item.tagColor }]}>
        <Text style={styles.serviceTagText}>{item.tag}</Text>
      </View>
      <View style={styles.serviceContent}>
        <Text style={styles.serviceTitle}>{item.title}</Text>
        <Text style={styles.serviceSub}>{item.subtitle}</Text>
        <View style={styles.serviceFooter}>
          <Text style={styles.servicePrice}>{item.price}</Text>
          <View style={styles.serviceArrow}>
            <Ionicons name="arrow-forward" size={14} color={COLORS.text} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function ProductCard({ item, onPress, onAddToCart, onBuyNow }) {
  const inStock = item.stock > 0;
  const tag = item.category || item.tag || 'Product';

  return (
    <TouchableOpacity style={styles.productCard} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.productImgWrap}>
        <Image source={{ uri: item.image }} style={styles.productImg} contentFit="cover" />
        <View style={styles.productTag}>
          <Text style={styles.productTagText}>{tag}</Text>
        </View>
        {!inStock ? (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>SOLD OUT</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
      <View style={styles.priceRow}>
        <Text style={styles.price}>{formatCurrency(item.price)}</Text>
        {item.stock > 0 && item.stock <= 5 ? (
          <Text style={styles.lowStock}>{item.stock} left</Text>
        ) : null}
      </View>
      {inStock ? (
        <View style={styles.productActions}>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={(e) => {
              e.stopPropagation?.();
              onAddToCart?.();
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.addBtnText}>Cart</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.buyBtn}
            onPress={(e) => {
              e.stopPropagation?.();
              onBuyNow?.();
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.buyBtnText}>Buy</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.addBtnDisabled} activeOpacity={1}>
          <Text style={styles.addBtnText}>Unavailable</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

function PoojaCard({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.poojaCard} onPress={onPress} activeOpacity={0.9}>
      <ImageBackground source={{ uri: item.image }} style={styles.poojaImg} imageStyle={styles.poojaImgRadius}>
        <View style={styles.poojaBadge}>
          <Text style={styles.poojaBadgeText}>{item.badge}</Text>
        </View>
      </ImageBackground>
      <Text style={styles.poojaTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.poojaLoc}>{item.location}</Text>
      <Text style={styles.poojaPrice}>{item.price}</Text>
    </TouchableOpacity>
  );
}

function OfferBanner({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.offerCard} onPress={onPress} activeOpacity={0.9}>
      <Image source={{ uri: item.image }} style={styles.offerImg} contentFit="cover" />
      <View style={styles.offerContent}>
        <Text style={styles.offerTitle}>{item.title}</Text>
        <Text style={styles.offerSub}>{item.subtitle}</Text>
        <View style={styles.offerRow}>
          <Text style={styles.offerPrice}>{item.price}</Text>
          <View style={styles.offerCta}>
            <Text style={styles.offerCtaText}>{item.cta}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function RemediesScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const safe = useScreenInsets();
  const { products, cart } = useSelector((s) => s.store);
  const { isAuthenticated } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeProblem, setActiveProblem] = useState('love');

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const goStore = () => router.push('/store');

  const handleAddToCart = (product) => {
    if (!requireAuthForPurchase(router, isAuthenticated)) return;
    const check = canAddToCart(cart, product);
    if (!check.ok) {
      Alert.alert('Cannot Add', check.message);
      return;
    }
    dispatch(addToCart(product));
    Alert.alert('Added', `${product.name} cart mein add ho gaya.`, [
      { text: 'OK', style: 'cancel' },
      { text: 'Checkout', onPress: () => router.push('/store/cart') },
    ]);
  };

  const handleBuyNow = (product) => {
    if (!requireAuthForPurchase(router, isAuthenticated)) return;
    router.push({ pathname: '/store/cart', params: { buy: product._id } });
  };

  const popularProducts = products.filter((p) => p.stock > 0).slice(0, 8);

  // Categories from admin-uploaded products only; dummy fallback if store empty
  const shopCategories = (() => {
    const map = new Map();
    (products || []).forEach((p) => {
      const key = String(p.category || '').trim().toLowerCase();
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          label: key.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          icon: 'bag-handle',
          color: COLORS.primaryDark,
          bg: COLORS.primaryLight,
        });
      }
    });
    const fromAdmin = Array.from(map.values());
    return fromAdmin.length ? fromAdmin : REMEDY_CATEGORIES;
  })();

  return (
    <Screen style={styles.screen}>
      <RemedyHeader onMenuPress={() => setDrawerOpen(true)} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: safe.tabBar + 20 }}
      >
        {/* Search strip */}
        <TouchableOpacity style={styles.searchBar} onPress={goStore} activeOpacity={0.85}>
          <Ionicons name="search" size={18} color={COLORS.textLight} />
          <Text style={styles.searchPlaceholder}>Search Rudraksha, Gemstones, Yantra...</Text>
          <View style={styles.filterChip}>
            <Ionicons name="options-outline" size={14} color={COLORS.text} />
          </View>
        </TouchableOpacity>

        {/* Hero — soft gold, no dark blue */}
        <View style={styles.hero}>
          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <Ionicons name="sparkles" size={12} color={COLORS.primaryDark} />
              <Text style={styles.heroBadgeText}>ASTROTALK REMEDIES</Text>
            </View>
            <Text style={styles.heroTitle}>Authentic Spiritual{'\n'}Remedies Delivered</Text>
            <Text style={styles.heroSub}>Energized products · Expert consultations · Online Pooja</Text>
            <TouchableOpacity style={styles.heroBtn} onPress={goStore} activeOpacity={0.85}>
              <Text style={styles.heroBtnText}>Explore Store</Text>
              <Ionicons name="arrow-forward" size={16} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.heroDecor}>
            <Ionicons name="planet" size={64} color="rgba(253,185,19,0.45)" />
          </View>
        </View>

        {/* Categories from admin products */}
        <SectionHeader title="Shop by Category" action="See All" onAction={goStore} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catScroll}
        >
          {shopCategories.map((cat) => (
            <CategoryChip
              key={cat.id}
              item={cat}
              onPress={() => router.push({ pathname: '/store', params: { category: cat.id } })}
            />
          ))}
        </ScrollView>

        {/* Problems */}
        <SectionHeader title="Remedies for Your Problem" subtitle="Tap to explore solutions" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.problemScroll}
        >
          {REMEDY_PROBLEMS.map((p) => (
            <ProblemPill
              key={p.id}
              item={p}
              active={activeProblem === p.id}
              onPress={() => setActiveProblem(p.id)}
            />
          ))}
        </ScrollView>

        <View style={styles.problemHint}>
          <Ionicons name="bulb" size={16} color={COLORS.primary} />
          <Text style={styles.problemHintText}>
            Showing curated remedies for{' '}
            <Text style={styles.problemHintBold}>
              {REMEDY_PROBLEMS.find((p) => p.id === activeProblem)?.label}
            </Text>
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {REMEDY_STATS.map((s, i) => (
            <View key={s.label} style={[styles.statItem, i < REMEDY_STATS.length - 1 && styles.statBorder]}>
              <Text style={styles.statNum}>{s.num}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Services */}
        <SectionHeader title="Expert Services" action="View All" onAction={goStore} />
        <View style={styles.serviceGrid}>
          {REMEDY_SERVICES.slice(0, 2).map((s) => (
            <ServiceCard key={s.id} item={s} onPress={goStore} />
          ))}
        </View>
        <View style={styles.serviceGridBottom}>
          {REMEDY_SERVICES.slice(2).map((s) => (
            <ServiceCard key={s.id} item={s} onPress={goStore} wide />
          ))}
        </View>

        {/* Offers */}
        <SectionHeader title="Special Offers" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.offerScroll}
        >
          {REMEDY_OFFERS.map((o) => (
            <OfferBanner key={o.id} item={o} onPress={goStore} />
          ))}
        </ScrollView>

        {/* Products */}
        <SectionHeader title="Popular Products" subtitle="Handpicked for you" action="Store" onAction={goStore} />
        {popularProducts.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productScroll}
          >
            {popularProducts.map((p) => (
              <ProductCard
                key={p._id}
                item={p}
                onPress={() => router.push(`/store/${p._id}`)}
                onAddToCart={() => handleAddToCart(p)}
                onBuyNow={() => handleBuyNow(p)}
              />
            ))}
          </ScrollView>
        ) : (
          <TouchableOpacity style={styles.emptyProducts} onPress={goStore} activeOpacity={0.85}>
            <Ionicons name="bag-handle-outline" size={22} color={COLORS.textSecondary} />
            <Text style={styles.emptyProductsText}>Store se products browse karo</Text>
          </TouchableOpacity>
        )}

        {/* Pooja */}
        <SectionHeader title="Book a Pooja" action="All Poojas" onAction={() => router.push('/pooja')} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.poojaScroll}
        >
          {REMEDY_POOJAS.map((p) => (
            <PoojaCard key={p.id} item={p} onPress={() => router.push('/pooja')} />
          ))}
        </ScrollView>

        {/* Trust */}
        <View style={styles.trustRow}>
          {REMEDY_TRUST.map((t) => (
            <View key={t.label} style={styles.trustItem}>
              <View style={styles.trustIcon}>
                <Ionicons name={t.icon} size={18} color={COLORS.success} />
              </View>
              <Text style={styles.trustLabel}>{t.label}</Text>
            </View>
          ))}
        </View>

        {/* CTA — cream/gold card */}
        <TouchableOpacity style={styles.bottomCta} onPress={() => router.push('/(tabs)/chat')} activeOpacity={0.9}>
          <View style={styles.bottomCtaIcon}>
            <Ionicons name="chatbubbles" size={20} color={COLORS.text} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bottomCtaTitle}>Need personal guidance?</Text>
            <Text style={styles.bottomCtaSub}>Talk to our remedy expert — first 5 min free</Text>
          </View>
          <View style={styles.bottomCtaBtn}>
            <Ionicons name="arrow-forward" size={18} color={COLORS.text} />
          </View>
        </TouchableOpacity>
      </ScrollView>

      <DrawerMenu visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: COLORS.cream },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOW,
  },
  searchPlaceholder: { flex: 1, fontSize: 13, color: COLORS.textLight },
  filterChip: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.yellowLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    overflow: 'hidden',
    minHeight: 150,
    borderWidth: 1,
    borderColor: COLORS.primary + '55',
    ...SHADOW_MD,
  },
  heroContent: { flex: 1, zIndex: 1, paddingRight: 8 },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  heroBadgeText: { fontSize: 9, fontWeight: '800', color: COLORS.primaryDark, letterSpacing: 0.5 },
  heroTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, lineHeight: 28 },
  heroSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 6, lineHeight: 17, fontWeight: '500' },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    marginTop: 14,
  },
  heroBtnText: { fontSize: 12, fontWeight: '800', color: COLORS.text },
  heroDecor: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    opacity: 0.95,
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginTop: 22,
    marginBottom: 12,
  },
  sectionHeadLeft: { flex: 1 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  sectionSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  viewAll: { fontSize: 13, color: COLORS.primaryDark, fontWeight: '800' },
  catScroll: { paddingHorizontal: 16, gap: 14 },
  catItem: { alignItems: 'center', width: 72 },
  catCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  catLabel: { fontSize: 10, fontWeight: '600', color: COLORS.text, textAlign: 'center' },
  problemScroll: { paddingHorizontal: 16, gap: 8 },
  problemPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  problemText: { fontSize: 12, fontWeight: '700' },
  problemHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: COLORS.yellowLight,
    padding: 10,
    borderRadius: 10,
  },
  problemHintText: { flex: 1, fontSize: 12, color: COLORS.textSecondary },
  problemHintBold: { fontWeight: '800', color: COLORS.text },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOW_MD,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statBorder: { borderRightWidth: 1, borderRightColor: COLORS.borderLight },
  statNum: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  statLabel: { fontSize: 10, color: COLORS.textSecondary, marginTop: 3, fontWeight: '600' },
  serviceGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  serviceGridBottom: {
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 12,
  },
  serviceCard: {
    width: CARD_W,
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: COLORS.border,
  },
  serviceCardWide: { width: '100%', height: 160 },
  serviceImg: { ...StyleSheet.absoluteFillObject },
  serviceOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  serviceTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 2,
  },
  serviceTagText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
  serviceContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    zIndex: 2,
  },
  serviceTitle: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  serviceSub: { color: 'rgba(255,255,255,0.85)', fontSize: 11, marginTop: 2 },
  serviceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  servicePrice: { color: COLORS.primary, fontSize: 13, fontWeight: '800' },
  serviceArrow: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerScroll: { paddingHorizontal: 16, gap: 12 },
  offerCard: {
    width: SCREEN_W * 0.78,
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOW,
  },
  offerImg: { width: 110, height: '100%', minHeight: 110 },
  offerContent: { flex: 1, padding: 12, justifyContent: 'center' },
  offerTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  offerSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4, lineHeight: 15 },
  offerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  offerPrice: { fontSize: 15, fontWeight: '800', color: COLORS.primaryDark },
  offerCta: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: COLORS.primary },
  offerCtaText: { color: COLORS.text, fontSize: 11, fontWeight: '800' },
  productScroll: { paddingHorizontal: 16, gap: 12 },
  productCard: {
    width: 150,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOW,
  },
  productImgWrap: { position: 'relative', marginBottom: 8 },
  productImg: { width: '100%', height: 120, borderRadius: 10, backgroundColor: COLORS.yellowLight },
  productTag: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  productTagText: { fontSize: 8, fontWeight: '800', color: COLORS.text },
  discountBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: COLORS.error,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: { fontSize: 8, fontWeight: '800', color: '#FFF' },
  productName: { fontSize: 12, fontWeight: '700', color: COLORS.text, lineHeight: 16, minHeight: 32 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  ratingText: { fontSize: 11, fontWeight: '700', color: COLORS.text },
  reviewText: { fontSize: 10, color: COLORS.textLight },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  price: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  mrp: { fontSize: 11, color: COLORS.textLight, textDecorationLine: 'line-through' },
  productActions: { flexDirection: 'row', gap: 6, marginTop: 8 },
  addBtn: {
    flex: 1,
    backgroundColor: COLORS.yellowLight,
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  buyBtn: {
    flex: 1,
    backgroundColor: COLORS.success,
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: 'center',
  },
  buyBtnText: { fontSize: 11, fontWeight: '800', color: '#FFF' },
  addBtnDisabled: {
    marginTop: 8,
    backgroundColor: COLORS.borderLight,
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: 'center',
  },
  addBtnText: { fontSize: 11, fontWeight: '800', color: COLORS.text },
  lowStock: { fontSize: 10, color: COLORS.warning, fontWeight: '700' },
  emptyProducts: {
    marginHorizontal: 16,
    padding: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  emptyProductsText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  poojaScroll: { paddingHorizontal: 16, gap: 12 },
  poojaCard: {
    width: 140,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  poojaImg: { width: '100%', height: 100, justifyContent: 'flex-start' },
  poojaImgRadius: { borderTopLeftRadius: 14, borderTopRightRadius: 14 },
  poojaBadge: {
    alignSelf: 'flex-start',
    margin: 8,
    backgroundColor: '#E91E63',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  poojaBadgeText: { color: '#FFF', fontSize: 8, fontWeight: '800' },
  poojaTitle: { fontSize: 12, fontWeight: '800', color: COLORS.text, paddingHorizontal: 10, marginTop: 8 },
  poojaLoc: { fontSize: 10, color: COLORS.textSecondary, paddingHorizontal: 10, marginTop: 2 },
  poojaPrice: { fontSize: 13, fontWeight: '800', color: COLORS.success, padding: 10 },
  trustRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 22,
    backgroundColor: COLORS.successLight,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  trustItem: { flex: 1, alignItems: 'center', gap: 4 },
  trustIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustLabel: { fontSize: 9, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  bottomCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.primary + '66',
    ...SHADOW_MD,
  },
  bottomCtaIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  bottomCtaTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  bottomCtaSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 3, fontWeight: '500' },
  bottomCtaBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});