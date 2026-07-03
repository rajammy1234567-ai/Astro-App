import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import RemoteImage from '../common/RemoteImage';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

function Stars() {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons key={i} name="star" size={12} color={COLORS.star} />
      ))}
    </View>
  );
}

function formatOrders(n) {
  if (!n) return '0 orders';
  if (n >= 1000) return `${Math.floor(n / 1000)}k+ orders`;
  return `${n}+ orders`;
}

export default function AstrologerListCard({ astrologer, mode = 'chat' }) {
  const router = useRouter();
  const isCall = mode === 'call';
  const hasWait = astrologer.waitTime;
  const btnLabel = isCall ? 'Call' : 'Chat';

  const openDetails = () => {
    router.push({ pathname: '/astrologers/details', params: { id: astrologer._id } });
  };

  const openBooking = () => {
    router.push({
      pathname: '/astrologers/booking',
      params: { id: astrologer._id, type: mode },
    });
  };

  return (
    <View>
      <View style={styles.card}>
        <TouchableOpacity onPress={openDetails} activeOpacity={0.85}>
          <RemoteImage uri={astrologer.image} type="astrologer" style={styles.avatar} fallbackIcon="person" iconSize={28} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.info} onPress={openDetails} activeOpacity={0.85}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{astrologer.name}</Text>
            {astrologer.isOnline && (
              <View style={styles.onlineBadge}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Online</Text>
              </View>
            )}
          </View>
          <Text style={styles.line}>{astrologer.specialty}</Text>
          <Text style={styles.line}>{astrologer.languages?.join(', ')}</Text>
          <Text style={styles.exp}>Exp- {astrologer.experience} Years</Text>
          <View style={styles.ratingRow}>
            <Stars />
            {astrologer.isNew ? (
              <Text style={styles.newTag}>NEW!</Text>
            ) : (
              <Text style={styles.orders}>{formatOrders(astrologer.orders)}</Text>
            )}
          </View>
          <Text style={styles.price}>₹ {astrologer.pricePerMin}/min</Text>
          {astrologer.pricingPackages?.length > 1 && (
            <Text style={styles.packages}>
              {astrologer.pricingPackages.slice(1, 3).map((p) => `${p.minutes}m ₹${p.price}`).join(' · ')}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.right}>
          {astrologer.isVerified && (
            <View style={styles.verified}>
              <Ionicons name="checkmark" size={12} color="#FFF" />
            </View>
          )}
          <TouchableOpacity
            style={[styles.actionBtn, hasWait && isCall && styles.actionBtnBusy]}
            onPress={openBooking}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionText, hasWait && isCall && styles.actionTextBusy]}>
              {btnLabel}
            </Text>
          </TouchableOpacity>
          {hasWait && isCall && (
            <Text style={styles.waitText}>wait ~ {astrologer.waitTime}</Text>
          )}
        </View>
      </View>

      {astrologer.specialOffer && (
        <View style={styles.offerRow}>
          <Ionicons name="time-outline" size={12} color={COLORS.textLight} />
          <Text style={styles.offerText}>Special offer for new users</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: 14,
    marginBottom: 4,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.border,
    marginRight: 10,
  },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  name: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.success },
  onlineText: { fontSize: 10, fontWeight: '700', color: COLORS.success },
  packages: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2 },
  line: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  exp: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  stars: { flexDirection: 'row' },
  orders: { fontSize: 11, color: COLORS.textLight },
  newTag: { fontSize: 11, color: COLORS.error, fontWeight: '700' },
  price: { fontSize: 13, fontWeight: '700', color: COLORS.error, marginTop: 3 },
  strike: { color: COLORS.textLight, textDecorationLine: 'line-through', fontWeight: '400' },
  right: { alignItems: 'flex-end', justifyContent: 'center', minWidth: 64 },
  verified: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.success,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: COLORS.surface,
  },
  actionBtnBusy: { borderColor: COLORS.error },
  actionText: { fontSize: 13, fontWeight: '700', color: COLORS.success },
  actionTextBusy: { color: COLORS.error },
  waitText: { fontSize: 10, color: COLORS.error, marginTop: 3 },
  offerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginHorizontal: 14,
    marginBottom: 8,
    paddingLeft: 82,
  },
  offerText: { fontSize: 11, color: COLORS.textLight },
});