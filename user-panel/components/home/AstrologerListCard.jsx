import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import RemoteImage from '../common/RemoteImage';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

function Stars() {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons key={i} name="star" size={11} color={COLORS.star} />
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
    // Strict: chat list only when chatOnline, call list only when callOnline
    const ok = isCall ? astrologer.callOnline === true : astrologer.chatOnline === true;
    if (!ok) {
      Alert.alert(
        isCall ? 'Call Offline' : 'Chat Offline',
        `${astrologer.name || 'Astrologer'} ne ${isCall ? 'Call' : 'Chat'} Online band rakha hai. Jab woh yeh mode ON kare tab request bhejo.`
      );
      return;
    }
    router.push({
      pathname: '/astrologers/booking',
      params: { id: astrologer._id, type: mode },
    });
  };

  const modeOnline = isCall
    ? astrologer.callOnline === true
    : astrologer.chatOnline === true;

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <TouchableOpacity onPress={openDetails} activeOpacity={0.85}>
          <View style={styles.avatarRing}>
            <RemoteImage
              uri={astrologer.image}
              type="astrologer"
              style={styles.avatar}
              fallbackIcon="person"
              iconSize={28}
            />
            <View
              style={[
                styles.statusDot,
                { backgroundColor: modeOnline ? COLORS.online : COLORS.offline },
              ]}
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.info} onPress={openDetails} activeOpacity={0.85}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {astrologer.name}
            </Text>
            {modeOnline ? (
              <View style={styles.onlineBadge}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>{isCall ? 'Call ON' : 'Chat ON'}</Text>
              </View>
            ) : (
              <View style={styles.offlineBadge}>
                <Text style={styles.offlineText}>Offline</Text>
              </View>
            )}
          </View>
          <Text style={styles.line} numberOfLines={1}>
            {astrologer.specialty || 'Vedic'}
          </Text>
          <Text style={styles.line} numberOfLines={1}>
            {astrologer.languages?.join(', ') || 'Hindi, English'}
          </Text>
          <Text style={styles.exp}>Exp · {astrologer.experience || 5} Years</Text>
          <View style={styles.ratingRow}>
            <Stars />
            <Text style={styles.orders}>{formatOrders(astrologer.orders)}</Text>
          </View>
          {astrologer.badge ? (
            <View style={styles.badgeChip}>
              <Text style={styles.badgeChipText}>{astrologer.badge}</Text>
            </View>
          ) : null}
        </TouchableOpacity>

        <View style={styles.right}>
          <Text style={styles.price}>
            ₹{astrologer.pricePerMin}
            <Text style={styles.perMin}>/min</Text>
          </Text>
          {hasWait ? <Text style={styles.wait}>Wait {astrologer.waitTime}</Text> : null}
          <TouchableOpacity
            style={[
              styles.actionBtn,
              isCall ? styles.callBtn : styles.chatBtn,
              !modeOnline && styles.actionDisabled,
            ]}
            onPress={openBooking}
            activeOpacity={0.85}
          >
            <Ionicons
              name={isCall ? 'call' : 'chatbubble-ellipses'}
              size={13}
              color={!modeOnline ? COLORS.textLight : isCall ? COLORS.bannerDark : '#fff'}
            />
            <Text
              style={[
                styles.actionText,
                isCall && styles.callText,
                !modeOnline && styles.actionDisabledText,
              ]}
            >
              {modeOnline ? btnLabel : 'Offline'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 14, marginBottom: 10 },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...Platform.select({
      ios: {
        shadowColor: '#1E1033',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 2 },
    }),
  },
  avatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2.5,
    borderColor: COLORS.primary,
    overflow: 'hidden',
    position: 'relative',
  },
  avatar: { width: '100%', height: '100%' },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  info: { flex: 1, marginLeft: 12, marginRight: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  name: { fontSize: 15, fontWeight: '800', color: COLORS.text, flexShrink: 1 },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.online },
  onlineText: { fontSize: 9, fontWeight: '800', color: COLORS.success },
  offlineBadge: {
    backgroundColor: COLORS.borderLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  offlineText: { fontSize: 9, fontWeight: '700', color: COLORS.textLight },
  line: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1, fontWeight: '500' },
  exp: { fontSize: 11, color: COLORS.textLight, marginTop: 3, fontWeight: '600' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  stars: { flexDirection: 'row', gap: 1 },
  orders: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
  badgeChip: {
    alignSelf: 'flex-start',
    marginTop: 6,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeChipText: { fontSize: 10, fontWeight: '800', color: COLORS.primaryDark },
  right: { alignItems: 'flex-end', justifyContent: 'center', minWidth: 78 },
  price: { fontSize: 15, fontWeight: '800', color: COLORS.bannerDark },
  perMin: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
  wait: { fontSize: 10, color: COLORS.warning, fontWeight: '700', marginTop: 2 },
  actionBtn: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chatBtn: { backgroundColor: COLORS.success },
  callBtn: { backgroundColor: COLORS.primary },
  actionDisabled: { backgroundColor: COLORS.borderLight },
  actionText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  callText: { color: COLORS.bannerDark },
  actionDisabledText: { color: COLORS.textLight },
});
