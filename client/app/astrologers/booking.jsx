import { View, Text, StyleSheet, Image } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import Button from '../../components/common/Button';
import { ASTROLOGERS } from '../../constants/mockData';
import { COLORS } from '../../constants/colors';
import { SHADOW } from '../../constants/theme';

export default function BookingScreen() {
  const { id, type = 'chat' } = useLocalSearchParams();
  const astro = ASTROLOGERS.find((a) => a._id === id) || ASTROLOGERS[0];
  const isCall = type === 'call';

  return (
    <View style={styles.container}>
      <Header title="Confirm Booking" />

      <View style={styles.content}>
        <View style={styles.card}>
          <Image source={{ uri: astro.image }} style={styles.avatar} />
          <Text style={styles.name}>{astro.name}</Text>
          <Text style={styles.type}>
            {isCall ? '📞 Voice Call' : '💬 Chat'} Consultation
          </Text>

          <View style={styles.row}>
            <Text style={styles.label}>Rate</Text>
            <Text style={styles.value}>₹{astro.pricePerMin}/min</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Min. Balance Required</Text>
            <Text style={styles.value}>₹{astro.pricePerMin * 5}</Text>
          </View>

          {!isCall && (
            <View style={styles.freeBox}>
              <Ionicons name="gift" size={20} color={COLORS.success} />
              <Text style={styles.freeText}>First 5 minutes FREE!</Text>
            </View>
          )}
        </View>

        <Button title={isCall ? 'Start Call' : 'Start Chat'} variant={isCall ? 'primary' : 'success'} />
        <Text style={styles.note}>
          Minimum 5 minutes charge applies. Balance will be deducted per minute.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 24,
    alignItems: 'center', marginBottom: 24, ...SHADOW,
  },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 12 },
  name: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  type: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4, marginBottom: 20 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', width: '100%',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  label: { color: COLORS.textSecondary, fontSize: 14 },
  value: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  freeBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.successLight, padding: 12, borderRadius: 10,
    marginTop: 16, width: '100%', justifyContent: 'center',
  },
  freeText: { color: COLORS.success, fontSize: 14, fontWeight: '700' },
  note: { color: COLORS.textLight, fontSize: 12, textAlign: 'center', marginTop: 16, lineHeight: 18 },
});