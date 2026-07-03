import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import Screen from '../../components/common/Screen';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import { fetchWallet } from '../../redux/walletSlice';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import Button from '../../components/common/Button';
import RemoteImage from '../../components/common/RemoteImage';
import { sessionApi } from '../../services/sessionApi';
import { astrologerApi } from '../../services/astrologerApi';
import { ASTROLOGERS } from '../../constants/mockData';
import { COLORS } from '../../constants/colors';
import { SHADOW } from '../../constants/theme';

export default function BookingScreen() {
  const { id, type = 'chat' } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const balance = useSelector((s) => s.wallet.balance);
  const [astro, setAstro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const isCall = type === 'call';
  const callMinCost = (astro?.pricePerMin || 20) * 1;

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
      Alert.alert('Login Required', 'Consultation ke liye pehle login ya account banao.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Create Account', onPress: () => router.push('/(auth)/login?mode=signup') },
        { text: 'Login', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }

    if (isCall && balance < callMinCost) {
      Alert.alert(
        'Payment Required',
        `Call ke liye pehle kam se kam 1 minute (₹${callMinCost}) pay karna hoga.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Money', onPress: () => router.push('/wallet/add-money') },
        ]
      );
      return;
    }

    setBooking(true);
    try {
      const res = await sessionApi.book({
        astrologerId: astro._id,
        type: isCall ? 'call' : 'chat',
        minutes: 1,
      });
      const sessionId = res.session?._id;
      if (sessionId) {
        router.replace(`/chat/${sessionId}`);
      } else {
        Alert.alert('Request Sent', res.message || 'Astrologer accept karenge tab start hoga.');
        router.back();
      }
    } catch (err) {
      Alert.alert('Failed', err.message || 'Request nahi bhej paaye.');
    } finally {
      setBooking(false);
    }
  };

  if (loading || !astro) {
    return (
      <Screen edges={['left', 'right', 'bottom']} backgroundColor={COLORS.background} style={styles.center}>
        <Header title="Confirm Booking" />
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  return (
    <Screen edges={['left', 'right', 'bottom']} backgroundColor={COLORS.background}>
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
            <Text style={styles.label}>Your Balance</Text>
            <Text style={[styles.value, isCall && balance < callMinCost && { color: COLORS.error }]}>
              ₹{balance || 0}
            </Text>
          </View>

          {!isCall ? (
            <View style={styles.freeBox}>
              <Ionicons name="gift" size={20} color={COLORS.success} />
              <Text style={styles.freeText}>Pehla 1 minute chat FREE!</Text>
            </View>
          ) : (
            <View style={styles.payBox}>
              <Ionicons name="wallet" size={20} color={COLORS.warning} />
              <Text style={styles.payText}>
                Call ke liye pehle ₹{callMinCost} (1 min) pay hoga
              </Text>
            </View>
          )}

          <View style={styles.flowBox}>
            <Text style={styles.flowTitle}>Kaise kaam karega?</Text>
            <Text style={styles.flowStep}>1. Request bhejo → Astrologer accept karega</Text>
            <Text style={styles.flowStep}>
              2. {isCall ? 'Call connect hogi' : 'Chat start — 1 min free'}
            </Text>
            <Text style={styles.flowStep}>3. Time khatam → paise dekar continue karo</Text>
          </View>
        </View>

        <Button
          title={isCall ? `Pay ₹${callMinCost} & Send Call Request` : 'Send Chat Request'}
          variant={isCall ? 'primary' : 'success'}
          onPress={handleStart}
          loading={booking}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  payBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFF8E1', padding: 12, borderRadius: 10,
    marginTop: 16, width: '100%', justifyContent: 'center',
  },
  payText: { color: COLORS.text, fontSize: 13, fontWeight: '700', flex: 1 },
  flowBox: {
    marginTop: 16,
    width: '100%',
    backgroundColor: COLORS.cream,
    borderRadius: 10,
    padding: 12,
  },
  flowTitle: { fontSize: 13, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  flowStep: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18, marginBottom: 2 },
});