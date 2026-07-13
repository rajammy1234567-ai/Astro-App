import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

const { width: W } = Dimensions.get('window');
const CARD_W = W - 28;
const CARD_H = 188;

const BANNERS = [
  {
    id: '1',
    title: 'Talk to Verified\nAstrologers',
    sub: 'Chat · Call · Instant guidance',
    cta: 'Start Chat',
    route: '/(tabs)/chat',
    image:
      'https://images.unsplash.com/photo-1532693322450-2cb5c511067d?w=1100&h=600&fit=crop',
  },
  {
    id: '2',
    title: 'Free Kundli &\nDaily Horoscope',
    sub: 'Your stars. Your path. Your future.',
    cta: 'Get Kundli',
    route: '/kundli',
    image:
      'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1100&h=600&fit=crop',
  },
  {
    id: '3',
    title: 'Sacred Remedies\n& Gemstones',
    sub: 'Rudraksha · Pooja · Blessed items',
    cta: 'Explore Store',
    route: '/store',
    image:
      'https://images.unsplash.com/photo-1502134529125-ada3a4e19fbb?w=1100&h=600&fit=crop',
  },
  {
    id: '4',
    title: 'Kundli Matching\n& Life Guidance',
    sub: 'Love · Career · Marriage · Family',
    cta: 'Match Now',
    route: '/kundli/match',
    image:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f83?w=1100&h=600&fit=crop',
  },
];

export default function HomeHeroBanner() {
  const router = useRouter();
  const scrollRef = useRef(null);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const next = (indexRef.current + 1) % BANNERS.length;
      indexRef.current = next;
      setIndex(next);
      scrollRef.current?.scrollTo({ x: next * (CARD_W + 10), animated: true });
    }, 4200);
    return () => clearInterval(timer);
  }, []);

  const onScrollEnd = (e) => {
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.round(x / (CARD_W + 10));
    indexRef.current = i;
    setIndex(i);
  };

  return (
    <View style={styles.wrap}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={CARD_W + 10}
        snapToAlignment="start"
        contentContainerStyle={styles.scroll}
        onMomentumScrollEnd={onScrollEnd}
      >
        {BANNERS.map((b) => (
          <TouchableOpacity
            key={b.id}
            activeOpacity={0.95}
            onPress={() => router.push(b.route)}
          >
            <ImageBackground
              source={{ uri: b.image }}
              style={styles.card}
              imageStyle={styles.img}
            >
              <View style={styles.overlay} />
              <View style={styles.glow} />
              <View style={styles.topRow}>
                <View style={styles.badge}>
                  <Ionicons name="sparkles" size={11} color={COLORS.bannerDark} />
                  <Text style={styles.badgeText}>AstroTalk</Text>
                </View>
                <View style={styles.verified}>
                  <Ionicons name="shield-checkmark" size={11} color="#fff" />
                  <Text style={styles.verifiedText}>Trusted</Text>
                </View>
              </View>
              <Text style={styles.title}>{b.title}</Text>
              <Text style={styles.sub}>{b.sub}</Text>
              <View style={styles.cta}>
                <Text style={styles.ctaText}>{b.cta}</Text>
                <Ionicons name="arrow-forward" size={14} color={COLORS.bannerDark} />
              </View>
            </ImageBackground>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {BANNERS.map((b, i) => (
          <View key={b.id} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 4 },
  scroll: { paddingHorizontal: 14, gap: 10, paddingTop: 6, paddingBottom: 8 },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#1E1033',
        shadowOpacity: 0.25,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 6 },
    }),
  },
  img: { borderRadius: 20 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18, 6, 36, 0.58)',
    borderRadius: 20,
  },
  glow: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(253, 185, 19, 0.18)',
  },
  topRow: {
    position: 'absolute',
    top: 14,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.bannerDark,
    letterSpacing: 0.2,
  },
  verified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  verifiedText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
    letterSpacing: 0.2,
  },
  sub: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 13,
    marginTop: 6,
    fontWeight: '600',
  },
  cta: {
    marginTop: 12,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.bannerDark,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 2,
    marginBottom: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    width: 18,
    backgroundColor: COLORS.primary,
  },
});
