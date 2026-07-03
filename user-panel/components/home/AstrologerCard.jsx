import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { SHADOW } from '../../constants/theme';

function formatOrders(n) {
  if (!n) return '0';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function AstrologerCard({ astrologer, showActions = true, mode = 'both' }) {
  const router = useRouter();

  const goDetails = () =>
    router.push({ pathname: '/astrologers/details', params: { id: astrologer._id } });

  const goBooking = (bookingType) =>
    router.push({
      pathname: '/astrologers/booking',
      params: { id: astrologer._id, type: bookingType },
    });

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.main} onPress={goDetails} activeOpacity={0.85}>
        <View style={styles.left}>
          <View style={[styles.avatarWrap, astrologer.isOnline && styles.avatarOnline]}>
            <Image
              source={{ uri: astrologer.image || 'https://i.pravatar.cc/150' }}
              style={styles.avatar}
            />
            {astrologer.isOnline && <View style={styles.onlineDot} />}
          </View>
        </View>

        <View style={styles.center}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{astrologer.name}</Text>
            {astrologer.isVerified && (
              <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
            )}
          </View>
          <Text style={styles.specialty} numberOfLines={1}>{astrologer.specialty}</Text>
          <Text style={styles.meta} numberOfLines={1}>
            {astrologer.languages?.join(', ')} • {astrologer.experience} Yrs • {formatOrders(astrologer.orders)} orders
          </Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color={COLORS.star} />
            <Text style={styles.rating}>{astrologer.rating || '4.5'}</Text>
            <Text style={styles.price}>
              {astrologer.originalPrice && (
                <Text style={styles.strike}>₹{astrologer.originalPrice} </Text>
              )}
              ₹{astrologer.pricePerMin}/min
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {showActions && (
        <View style={styles.actions}>
          {(mode === 'both' || mode === 'chat') && astrologer.chatEnabled && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.chatBtn]}
              onPress={() => goBooking('chat')}
            >
              <Ionicons name="chatbubble" size={14} color="#FFF" />
              <Text style={styles.actionText}>Chat</Text>
            </TouchableOpacity>
          )}
          {(mode === 'both' || mode === 'call') && astrologer.callEnabled && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.callBtn]}
              onPress={() => goBooking('call')}
            >
              <Ionicons name="call" size={14} color="#FFF" />
              <Text style={styles.actionText}>Call</Text>
            </TouchableOpacity>
          )}
          {!astrologer.isOnline && (
            <Text style={styles.offlineText}>Offline</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    alignItems: 'center',
    ...SHADOW,
  },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  left: { marginRight: 10 },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 2,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  avatarOnline: { borderColor: COLORS.online },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    backgroundColor: COLORS.border,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.online,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  center: { flex: 1, marginRight: 6 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 1,
  },
  specialty: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  meta: { color: COLORS.textLight, fontSize: 11, marginTop: 3 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 3 },
  rating: { color: COLORS.text, fontSize: 12, fontWeight: '600', marginRight: 8 },
  price: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },
  strike: { color: COLORS.textLight, textDecorationLine: 'line-through', fontWeight: '400' },
  actions: { alignItems: 'center', gap: 6 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    minWidth: 62,
    justifyContent: 'center',
  },
  chatBtn: { backgroundColor: COLORS.chatBtn },
  callBtn: { backgroundColor: COLORS.callBtn },
  actionText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  offlineText: { color: COLORS.offline, fontSize: 10, fontWeight: '600' },
});