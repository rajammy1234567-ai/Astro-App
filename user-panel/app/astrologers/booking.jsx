import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWallet } from '../../redux/walletSlice';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import Button from '../../components/common/Button';
import RemoteImage from '../../components/common/RemoteImage';
import { astrologerApi } from '../../services/astrologerApi';
import { ASTROLOGERS } from '../../constants/mockData';
import { COLORS } from '../../constants/colors';
import { SHADOW } from '../../constants/theme';

export default function BookingScreen() {
  const { id, type = 'chat' } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);
  const balance = useSelector((s) => s.wallet.balance);
  const [astro, setAstro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const isCall = type === 'call';
  const minBalance = (astro?.pricePerMin || 20) * 5;

  useEffect(() => {
    if (isAuthenticated) dispatch(fetchWallet());
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    if (!id) {
      setAstro(ASTROLOGERS[0]);
      setLoading(false);
      return;
    }
    astrologerApi.getById(id)
      .then(setAstro)
      .catch(() => setAstro(ASTROLOGERS.find((a) => a._id === id) || ASTROLOGERS[0]))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStart = async () => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Consultation ke liye pehle login karo.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }
    if (balance < minBalance) {
      Alert.alert(
        'Low Balance',
        `Minimum ₹${minBalance} wallet balance chahiye.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Money', onPress: () => router.push('/wallet/add-money') },
        ]
      );
      return;
    }

    setBooking(true);
    try {
      const res = await astrologerApi.book({
        astrologerId: astro._id,
        type: isCall ? 'call' : 'chat',
        duration: 5,
      });
      Alert.alert(
        isCall ? 'Call Started' : 'Chat Started',
        res.message || `${isCall ? 'Call' : 'Chat'} with ${astro.name} confirmed!`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err) {
      Alert.alert('Booking Failed', err.message || 'Could not start consultation.');
    } finally {
      setBooking(false);
    }
  };

  if (loading || !astro) {
    return (
      <View style={[styles.container, styles.center]}>
        <Header title="Confirm Booking" />
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Confirm Booking" />

      <View style={styles.content}>
        <View style={styles.card}>
          <RemoteImage uri={astro.image} type="astrologer" style={styles.avatar} fallbackIcon="person" iconSize={32} />
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
            <Text style={styles.value}>₹{minBalance}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Your Balance</Text>
            <Text style={[styles.value, balance < minBalance && { color: COLORS.error }]}>
              ₹{balance || 0}
            </Text>
          </View>

          {!isCall && (
            <View style={styles.freeBox}>
              <Ionicons name="gift" size={20} color={COLORS.success} />
              <Text style={styles.freeText}>First 5 minutes FREE!</Text>
            </View>
          )}
        </View>

        <Button
          title={isCall ? 'Start Call' : 'Start Chat'}
          variant={isCall ? 'primary' : 'success'}
          onPress={handleStart}
          loading={booking}
        />
        <Text style={styles.note}>
          Minimum 5 minutes charge applies. Balance will be deducted per minute.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { justifyContent: 'flex-start' },
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