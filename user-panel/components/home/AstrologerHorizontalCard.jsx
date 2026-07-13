import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import RemoteImage from '../common/RemoteImage';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

const CARD_WIDTH = 148;

export default function AstrologerHorizontalCard({ astrologer }) {
  const router = useRouter();

  const openDetails = () => {
    router.push({ pathname: '/astrologers/details', params: { id: astrologer._id } });
  };

  const openChat = () => {
    const chatOk = astrologer.chatOnline ?? astrologer.isOnline;
    if (!chatOk) {
      Alert.alert(
        'Chat Offline',
        `${astrologer.name || 'Astrologer'} ne Chat Online band rakha hai.`
      );
      return;
    }
    router.push({
      pathname: '/astrologers/booking',
      params: { id: astrologer._id, type: 'chat' },
    });
  };

  const specialty = (astrologer.specialty || 'Vedic').split(',')[0].trim();

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={openDetails} activeOpacity={0.88} style={styles.body}>
        <View style={styles.photoWrap}>
          <RemoteImage
            uri={astrologer.image}
            type="astrologer"
            style={styles.image}
            fallbackIcon="person"
            iconSize={36}
          />
          <View style={[styles.statusDot, astrologer.isOnline ? styles.online : styles.offline]} />
          {astrologer.badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText} numberOfLines={1}>
                {String(astrologer.badge).toUpperCase()}
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.name} numberOfLines={1}>
          {astrologer.name}
        </Text>
        <Text style={styles.specialty} numberOfLines={1}>
          {specialty}
        </Text>

        <View style={styles.metaRow}>
          {astrologer.rating ? (
            <View style={styles.ratingPill}>
              <Ionicons name="star" size={10} color={COLORS.star} />
              <Text style={styles.rating}>{Number(astrologer.rating).toFixed(1)}</Text>
            </View>
          ) : null}
          {astrologer.experience ? (
            <Text style={styles.exp}>{astrologer.experience}+ yrs</Text>
          ) : null}
        </View>

        <Text style={styles.price}>
          ₹{astrologer.pricePerMin}
          <Text style={styles.perMin}>/min</Text>
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.chatBtn, !astrologer.isOnline && styles.chatBtnOff]}
        onPress={openChat}
        activeOpacity={0.8}
      >
        <Ionicons
          name="chatbubble-ellipses"
          size={13}
          color={astrologer.isOnline ? '#fff' : COLORS.textLight}
        />
        <Text style={[styles.chatText, !astrologer.isOnline && styles.chatTextOff]}>
          {astrologer.isOnline ? 'Chat' : 'Offline'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    marginRight: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#1E1033',
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 3 },
    }),
  },
  body: {
    width: '100%',
    alignItems: 'center',
  },
  photoWrap: {
    width: 92,
    height: 92,
    borderRadius: 46,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: COLORS.primary,
    overflow: 'hidden',
    backgroundColor: COLORS.primaryLight,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  statusDot: {
    position: 'absolute',
    bottom: 4,
    right: 6,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
  },
  online: { backgroundColor: COLORS.online },
  offline: { backgroundColor: COLORS.offline },
  badge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(30,16,51,0.75)',
    paddingVertical: 2,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.4,
  },
  name: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    width: '100%',
  },
  specialty: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  rating: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
  },
  exp: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  price: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.bannerDark,
    marginTop: 6,
  },
  perMin: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  chatBtn: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: COLORS.success,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 18,
    minWidth: 100,
  },
  chatBtnOff: { backgroundColor: COLORS.borderLight },
  chatText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
  },
  chatTextOff: { color: COLORS.textLight },
});
