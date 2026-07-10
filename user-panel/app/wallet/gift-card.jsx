import { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import Screen from '../../components/common/Screen';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { giftCardApi } from '../../services/giftCardApi';
import { fetchWallet } from '../../redux/walletSlice';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../constants/colors';
import { SHADOW } from '../../constants/theme';

export default function GiftCardScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRedeem = async () => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Gift card redeem ke liye pehle login karo.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }
    if (!code.trim()) {
      Alert.alert('Error', 'Please enter a gift card code');
      return;
    }
    setLoading(true);
    try {
      const res = await giftCardApi.redeem(code.trim());
      await dispatch(fetchWallet());
      Alert.alert(
        'Success',
        res.message || 'Gift card redeemed!',
        [{ text: 'View Wallet', onPress: () => router.replace('/wallet') }]
      );
      setCode('');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to redeem gift card');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <Header title="Redeem Gift Card" />

      <View style={styles.content}>
        <View style={styles.hero}>
          <Ionicons name="gift" size={40} color="#FFF" />
          <Text style={styles.heroTitle}>Redeem Your Gift Card</Text>
          <Text style={styles.heroSub}>Enter the code to add balance to your wallet</Text>
        </View>

        <View style={styles.card}>
          <Input
            label="Gift Card Code"
            value={code}
            onChangeText={setCode}
            placeholder="e.g. ASTRO100"
            autoCapitalize="characters"
          />
          <Button title="Redeem Now" onPress={handleRedeem} loading={loading} />
        </View>

        <View style={styles.hint}>
          <Ionicons name="information-circle-outline" size={18} color={COLORS.textSecondary} />
          <Text style={styles.hintText}>
            Try demo codes: ASTRO100, ASTRO500, or WELCOME250
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16 },
  hero: {
    backgroundColor: COLORS.primary, borderRadius: 12, padding: 24,
    alignItems: 'center', marginBottom: 20,
  },
  heroTitle: { color: '#FFF', fontSize: 18, fontWeight: '800', marginTop: 10 },
  heroSub: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 4, textAlign: 'center' },
  card: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, ...SHADOW },
  hint: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 16, paddingHorizontal: 4 },
  hintText: { flex: 1, fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
});