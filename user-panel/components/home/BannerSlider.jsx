import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BANNERS } from '../../constants/mockData';
import { COLORS } from '../../constants/colors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

export default function BannerSlider({ banners = BANNERS }) {
  return (
    <ScrollView
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      decelerationRate="fast"
      snapToInterval={CARD_WIDTH + 12}
    >
      {banners.map((banner) => (
        <TouchableOpacity
          key={banner.id}
          style={[styles.banner, { backgroundColor: banner.bgColor || COLORS.bannerDark, width: CARD_WIDTH }]}
          activeOpacity={0.9}
        >
          <View style={styles.textWrap}>
            <Text style={styles.title}>{banner.title}</Text>
            <Text style={styles.subtitle}>{banner.subtitle}</Text>
          </View>
          <View style={styles.iconWrap}>
            <Ionicons name="gift-outline" size={36} color={COLORS.primary} />
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  banner: {
    height: 110,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginRight: 12,
  },
  textWrap: { flex: 1 },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    marginTop: 4,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(253, 185, 19, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});