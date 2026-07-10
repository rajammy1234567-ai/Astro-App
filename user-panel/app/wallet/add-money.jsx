import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import Screen from '../../components/common/Screen';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { WALLET_AMOUNTS } from '../../constants/mockData';
import { COLORS } from '../../constants/colors';
import { SHADOW } from '../../constants/theme';
import { formatCurrency } from '../../utils/formatters';
import { walletApi } from '../../services/walletApi';
import { fetchWallet } from '../../redux/walletSlice';

export default function AddMoneyScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const numAmount = Number(amount) || 0;

  const handlePay = async () => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Wallet recharge ke liye pehle login ya account banao.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Create Account', onPress: () => router.push('/(auth)/login?mode=signup') },
        { text: 'Login', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }
    if (numAmount < 1) {
      Alert.alert('Invalid Amount', 'Kam se kam ₹1 enter karo.');
      return;
    }

    setLoading(true);
    try {
      const res = await walletApi.addMoney(numAmount);
      // Razorpay configured: server returns orderId but does not credit yet
      if (res?.orderId && !res?.devMode && res?.balance == null) {
        Alert.alert(
          'Payment Gateway',
          'Razorpay order ban gaya, lekin app mein checkout abhi wired nahi hai. Dev mode ke liye server/.env se RAZORPAY_KEY_ID hatao — tab seedha wallet credit hoga.',
          [{ text: 'OK' }]
        );
        return;
      }
      await dispatch(fetchWallet());
      Alert.alert(
        'Success',
        res.message || `₹${numAmount} wallet mein add ho gaya!`,
        [{ text: 'View Wallet', onPress: () => router.replace('/wallet') }]
      );
    } catch (err) {
      Alert.alert('Payment Failed', err.message || 'Could not add money. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen edges={['left', 'right', 'bottom']} backgroundColor={COLORS.background}>
      <Header title="Add Money" />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.secureRow}>
          <Ionicons name="shield-checkmark" size={18} color={COLORS.success} />
          <Text style={styles.secureText}>100% Safe & Secure Payments via Razorpay</Text>
        </View>

        <Text style={styles.label}>Select Amount</Text>
        <View style={styles.grid}>
          {WALLET_AMOUNTS.map((val) => (
            <TouchableOpacity
              key={val}
              style={[styles.amountCard, amount === String(val) && styles.amountActive]}
              onPress={() => setAmount(String(val))}
            >
              <Text style={[styles.amountText, amount === String(val) && styles.amountTextActive]}>
                {formatCurrency(val)}
              </Text>
              {val >= 500 && (
                <Text style={styles.bonus}>+20% bonus</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label="Or enter custom amount"
          value={amount}
          onChangeText={setAmount}
          placeholder="Enter amount"
          keyboardType="numeric"
          prefix="₹"
        />

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount</Text>
            <Text style={styles.summaryVal}>{formatCurrency(numAmount)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>GST (18%)</Text>
            <Text style={styles.summaryVal}>{formatCurrency(numAmount * 0.18)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={styles.totalVal}>
              {formatCurrency(numAmount * 1.18)}
            </Text>
          </View>
        </View>

        <Button title="Proceed to Pay" onPress={handlePay} loading={loading} disabled={numAmount < 1} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  secureRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  secureText: { color: COLORS.success, fontSize: 13, fontWeight: '500' },
  label: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  amountCard: {
    width: '30%', backgroundColor: COLORS.surface, borderRadius: 10,
    paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border,
    ...SHADOW,
  },
  amountActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' },
  amountText: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  amountTextActive: { color: COLORS.primary },
  bonus: { fontSize: 10, color: COLORS.success, fontWeight: '600', marginTop: 2 },
  summary: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 20, ...SHADOW,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  summaryLabel: { color: COLORS.textSecondary, fontSize: 14 },
  summaryVal: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  totalRow: { borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: 6, paddingTop: 10 },
  totalLabel: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  totalVal: { color: COLORS.primary, fontSize: 18, fontWeight: '800' },
});