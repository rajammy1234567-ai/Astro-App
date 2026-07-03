import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import RemoteImage from '../common/RemoteImage';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

const CARD_WIDTH = 116;
const PHOTO_SIZE = 88;

export default function AstrologerHorizontalCard({ astrologer }) {
  const router = useRouter();

  const openDetails = () => {
    router.push({ pathname: '/astrologers/details', params: { id: astrologer._id } });
  };

  const openChat = () => {
    router.push({
      pathname: '/astrologers/booking',
      params: { id: astrologer._id, type: 'chat' },
    });
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={openDetails} activeOpacity={0.85} style={styles.body}>
        <View style={styles.photoBlock}>
          {astrologer.badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText} numberOfLines={1}>
                {astrologer.badge.toUpperCase()}
              </Text>
            </View>
          ) : (
            <View style={styles.badgePlaceholder} />
          )}

          <View style={styles.imgWrap}>
            <RemoteImage
              uri={astrologer.image}
              type="astrologer"
              style={styles.image}
              fallbackIcon="person"
              iconSize={32}
            />
            {astrologer.isOnline && <View style={styles.onlineDot} />}
          </View>
        </View>

        <Text style={styles.name} numberOfLines={1}>
          {astrologer.name}
        </Text>

        {astrologer.rating ? (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={10} color={COLORS.star} />
            <Text style={styles.rating}>{astrologer.rating}</Text>
          </View>
        ) : null}

        <Text style={styles.price}>₹{astrologer.pricePerMin}/min</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.chatBtn} onPress={openChat} activeOpacity={0.75}>
        <Text style={styles.chatText}>Chat</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    marginRight: 10,
    alignItems: 'center',
  },
  body: {
    width: '100%',
    alignItems: 'center',
  },
  photoBlock: {
    width: PHOTO_SIZE,
    alignItems: 'center',
    marginBottom: 6,
  },
  badge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    marginBottom: 4,
    maxWidth: PHOTO_SIZE,
    minWidth: PHOTO_SIZE,
    alignItems: 'center',
  },
  badgePlaceholder: {
    height: 18,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.3,
  },
  imgWrap: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: PHOTO_SIZE / 2,
    borderWidth: 2.5,
    borderColor: COLORS.primary,
    overflow: 'hidden',
    backgroundColor: COLORS.borderLight,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: COLORS.online,
    borderWidth: 2,
    borderColor: COLORS.cream,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    width: '100%',
    lineHeight: 16,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  rating: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  price: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
    textAlign: 'center',
  },
  chatBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.success,
    borderRadius: 5,
    paddingHorizontal: 22,
    paddingVertical: 5,
    marginTop: 6,
    minWidth: 76,
    alignItems: 'center',
  },
  chatText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.success,
  },
});