import { useEffect, useState } from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';
import Screen from '../../components/common/Screen';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import Button from '../../components/common/Button';
import RemoteImage from '../../components/common/RemoteImage';
import { poojaApi } from '../../services/poojaApi';
import { COLORS } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatters';

const HERO =
  'https://images.unsplash.com/photo-1564414029828-fac63c12d0b8?w=1000&h=500&fit=crop';

export default function PoojaScreen() {
  const [services, setServices] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    poojaApi
      .getAll()
      .then((data) => {
        setServices(Array.isArray(data) ? data : []);
        setError('');
      })
      .catch((err) => {
        setServices([]);
        setError(err.message || 'Could not load pooja list. Please check your connection.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = services.filter((s) => {
    if (filter === 'pooja') return (s.serviceType || 'pooja') === 'pooja';
    if (filter === 'remedy') return s.serviceType === 'remedy';
    return true;
  });

  const handleBook = async (item) => {
    if (!item?._id || String(item._id).length < 12) {
      Alert.alert('Unavailable', 'This service cannot be booked right now. Please refresh the list.');
      return;
    }
    const astroName = item.astrologer?.name;
    Alert.alert(
      `Book ${item.serviceType === 'remedy' ? 'Remedy' : 'Pooja'}?`,
      `${item.name}\n${formatCurrency(item.price)}${
        astroName ? `\nBy: ${astroName}` : ''
      }\n\nPayment wallet se cut hoga aur platform (admin) ke paas securely hold hoga.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setBookingId(item._id);
            try {
              const res = await poojaApi.book(item._id);
              Alert.alert(
                'Booked!',
                `${item.name} booked.\nBalance: ${formatCurrency(res.balance)}\n\nPayment admin hold mein hai.`
              );
            } catch (err) {
              Alert.alert(
                'Booking Failed',
                err.message || 'Could not book. Please recharge wallet.'
              );
            } finally {
              setBookingId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <Header title="Pooja & Remedies" subtitle="By verified astrologers" />
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {error || 'No pooja / remedy services available'}
            </Text>
          }
          ListHeaderComponent={
            <View>
              <ImageBackground source={{ uri: HERO }} style={styles.hero} imageStyle={styles.heroImg}>
                <View style={styles.heroShade} />
                <Ionicons name="flame" size={28} color={COLORS.primary} />
                <Text style={styles.heroTitle}>Sacred Pooja & Remedies</Text>
                <Text style={styles.heroSub}>
                  Performed / guided by verified astrologers. Payment is secured with the platform.
                </Text>
              </ImageBackground>

              <View style={styles.filters}>
                {[
                  { id: 'all', label: 'All' },
                  { id: 'pooja', label: 'Pooja' },
                  { id: 'remedy', label: 'Remedies' },
                ].map((f) => (
                  <TouchableOpacity
                    key={f.id}
                    style={[styles.chip, filter === f.id && styles.chipOn]}
                    onPress={() => setFilter(f.id)}
                  >
                    <Text style={[styles.chipText, filter === f.id && styles.chipTextOn]}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          }
          renderItem={({ item }) => {
            const isRemedy = item.serviceType === 'remedy';
            return (
              <View style={styles.card}>
                <View style={[styles.iconWrap, isRemedy && styles.remedyIcon]}>
                  {item.astrologer?.image ? (
                    <RemoteImage
                      uri={item.astrologer.image}
                      type="astrologer"
                      style={styles.astroImg}
                      fallbackIcon="person"
                      iconSize={22}
                    />
                  ) : (
                    <Ionicons
                      name={item.icon || (isRemedy ? 'leaf-outline' : 'flame-outline')}
                      size={24}
                      color={isRemedy ? COLORS.success : COLORS.warning}
                    />
                  )}
                </View>
                <View style={styles.info}>
                  <View style={styles.typeRow}>
                    <Text style={[styles.typeTag, isRemedy && styles.remedyTag]}>
                      {isRemedy ? 'REMEDY' : 'POOJA'}
                    </Text>
                  </View>
                  <Text style={styles.name}>{item.name}</Text>
                  {item.astrologer?.name ? (
                    <Text style={styles.astroName}>by {item.astrologer.name}</Text>
                  ) : (
                    <Text style={styles.astroName}>Platform service</Text>
                  )}
                  <View style={styles.durationRow}>
                    <Ionicons name="time-outline" size={13} color={COLORS.textLight} />
                    <Text style={styles.duration}>{item.duration}</Text>
                  </View>
                  <Text style={styles.price}>{formatCurrency(item.price)}</Text>
                </View>
                <Button
                  title="Book"
                  size="sm"
                  loading={bookingId === item._id}
                  onPress={() => handleBook(item)}
                />
              </View>
            );
          }}
          ListFooterComponent={
            <View style={styles.note}>
              {[
                { icon: 'shield-checkmark', text: 'Payment held securely by platform (admin)' },
                { icon: 'person', text: 'Astrologers provide the pooja / remedy' },
                { icon: 'checkmark-circle', text: 'Prasad / guidance as per service' },
              ].map((row) => (
                <View key={row.text} style={styles.noteRow}>
                  <Ionicons name={row.icon} size={16} color={COLORS.success} />
                  <Text style={styles.noteText}>{row.text}</Text>
                </View>
              ))}
            </View>
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 14, paddingBottom: 40 },
  empty: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginTop: 24,
    paddingHorizontal: 20,
  },
  hero: {
    borderRadius: 18,
    overflow: 'hidden',
    padding: 18,
    minHeight: 140,
    justifyContent: 'flex-end',
    marginBottom: 14,
  },
  heroImg: { borderRadius: 18 },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18,6,36,0.62)',
    borderRadius: 18,
  },
  heroTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 8 },
  heroSub: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 12,
    marginTop: 6,
    lineHeight: 17,
    fontWeight: '600',
  },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  chipTextOn: { color: COLORS.bannerDark },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 10,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FFF3C4',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  remedyIcon: { backgroundColor: '#E8F5E9' },
  astroImg: { width: 52, height: 52 },
  info: { flex: 1 },
  typeRow: { marginBottom: 2 },
  typeTag: {
    alignSelf: 'flex-start',
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.warning,
    backgroundColor: '#FFF3C4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  remedyTag: { color: COLORS.success, backgroundColor: '#E8F5E9' },
  name: { fontSize: 14, fontWeight: '800', color: COLORS.text, marginTop: 2 },
  astroName: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2, fontWeight: '600' },
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  duration: { fontSize: 11, color: COLORS.textLight },
  price: { fontSize: 15, fontWeight: '800', color: COLORS.bannerDark, marginTop: 4 },
  note: {
    marginTop: 12,
    backgroundColor: COLORS.successLight,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  noteText: { fontSize: 12, color: COLORS.text, fontWeight: '600', flex: 1 },
});
