import { View, Text, StyleSheet, ScrollView, ImageBackground, Dimensions } from 'react-native';
import { COLORS } from '../../constants/colors';

const { width: W } = Dimensions.get('window');
const CARD_W = W - 28;

const BANNERS = [
  {
    id: '1',
    title: 'Talk to Verified Astrologers',
    sub: 'Chat · Call · Instant guidance',
    image: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=900&h=500&fit=crop',
  },
  {
    id: '2',
    title: 'Free Kundli & Daily Horoscope',
    sub: 'Your stars, your path',
    image: 'https://images.unsplash.com/photo-1502134529125-ada3a4e19fbb?w=900&h=500&fit=crop',
  },
  {
    id: '3',
    title: 'Spiritual Remedies & Store',
    sub: 'Rudraksha · Gemstones · Pooja',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f83?w=900&h=500&fit=crop',
  },
];

export default function HomeHeroBanner() {
  return (
    <ScrollView
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={CARD_W + 10}
      contentContainerStyle={styles.scroll}
    >
      {BANNERS.map((b) => (
        <ImageBackground
          key={b.id}
          source={{ uri: b.image }}
          style={styles.card}
          imageStyle={styles.img}
        >
          <View style={styles.overlay} />
          <Text style={styles.badge}>AstroTalk</Text>
          <Text style={styles.title}>{b.title}</Text>
          <Text style={styles.sub}>{b.sub}</Text>
        </ImageBackground>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 14, gap: 10, paddingTop: 8, paddingBottom: 4 },
  card: {
    width: CARD_W,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 16,
  },
  img: { borderRadius: 16 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20,8,40,0.55)',
    borderRadius: 16,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    color: COLORS.text,
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  title: { color: '#fff', fontSize: 18, fontWeight: '800', lineHeight: 24 },
  sub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4, fontWeight: '600' },
});
