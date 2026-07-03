import { useEffect, useState } from 'react';
import { FlatList, View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import Screen from '../../components/common/Screen';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import Button from '../../components/common/Button';
import { poojaApi } from '../../services/poojaApi';
import { POOJA_SERVICES } from '../../constants/mockData';
import { COLORS } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatters';

export default function PoojaScreen() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState(null);

  useEffect(() => {
    poojaApi.getAll()
      .then(setServices)
      .catch(() => setServices(POOJA_SERVICES))
      .finally(() => setLoading(false));
  }, []);

  const handleBook = async (item) => {
    setBookingId(item._id);
    try {
      const res = await poojaApi.book(item._id);
      Alert.alert('Booked!', `${item.name} booked successfully. Remaining balance: ${formatCurrency(res.balance)}`);
    } catch (err) {
      Alert.alert('Booking Failed', err.message || 'Could not book pooja. Please recharge wallet.');
    } finally {
      setBookingId(null);
    }
  };

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <Header title="Book Online Pooja" />
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.hero}>
              <Ionicons name="flame" size={28} color="#FFF" />
              <Text style={styles.heroTitle}>Online Pooja Services</Text>
              <Text style={styles.heroSub}>
                Performed by verified pandits at sacred temples. Live streaming available.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.iconWrap}>
                <Ionicons name={item.icon || 'flame-outline'} size={24} color={COLORS.warning} />
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
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
          )}
          ListFooterComponent={
            <View style={styles.note}>
              {[
                { icon: 'checkmark-circle', text: 'Prasad delivered to your home' },
                { icon: 'videocam', text: 'Live video of pooja performed' },
                { icon: 'document-text', text: 'Certificate of completion' },
              ].map((item) => (
                <View key={item.text} style={styles.noteRow}>
                  <Ionicons name={item.icon} size={16} color={COLORS.success} />
                  <Text style={styles.noteText}>{item.text}</Text>
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
  list: { padding: 16, paddingBottom: 32 },
  hero: { backgroundColor: COLORS.warning, borderRadius: 12, padding: 20, marginBottom: 16, alignItems: 'center' },
  heroTitle: { color: '#FFF', fontSize: 18, fontWeight: '800', marginTop: 8 },
  heroSub: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 6, lineHeight: 20, textAlign: 'center' },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.borderLight,
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF8E1',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  duration: { fontSize: 12, color: COLORS.textSecondary },
  price: { fontSize: 16, fontWeight: '800', color: COLORS.primary, marginTop: 4 },
  note: { backgroundColor: COLORS.successLight, borderRadius: 10, padding: 16, marginTop: 8 },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  noteText: { color: COLORS.success, fontSize: 13, fontWeight: '500' },
});