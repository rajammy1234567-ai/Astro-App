import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, ActivityIndicator,
} from 'react-native';
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
import { SHADOW, SHADOW_MD } from '../../constants/theme';
import { formatCurrency } from '../../utils/formatters';
import { walletApi } from '../../services/walletApi';
import { fetchWallet } from '../../redux/walletSlice';

/**
 * Dummy Razorpay checkout — UI matches remedies theme.
 * Real Razorpay SDK can replace completeDummyPayment later.
 */
export default function AddMoneyScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [paySheet, setPaySheet] = useState(null);
  const [paying, setPaying] = useState(false);

  const numAmount = Number(amount) || 0;
  const gst = numAmount * 0.18;
  const totalPayable = numAmount * 1.18;

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
      const order = await walletApi.createOrder(numAmount);
      setPaySheet({
        orderId: order.orderId,
        amount: order.amount || numAmount,
        amountPaise: order.amountPaise || Math.round(numAmount * 100),
        keyId: order.keyId || 'rzp_test_dummy',
        dummy: order.dummy !== false,
      });
    } catch (err) {
      Alert.alert('Payment Failed', err.message || 'Order create nahi hua. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const completeDummyPayment = async () => {
    if (!paySheet) return;
    setPaying(true);
    try {
      await new Promise((r) => setTimeout(r, 900));
      const paymentId = `pay_dummy_${Date.now()}`;
      const res = await walletApi.verifyPayment({
        amount: paySheet.amount,
        orderId: paySheet.orderId,
        paymentId,
        dummy: true,
        signature: 'dummy_signature',
      });
      setPaySheet(null);
      await dispatch(fetchWallet());
      Alert.alert(
        'Payment Successful',
        res.message || `₹${paySheet.amount} wallet mein add ho gaya!`,
        [{ text: 'View Wallet', onPress: () => router.replace('/wallet') }]
      );
    } catch (err) {
      Alert.alert('Payment Failed', err.message || 'Verify nahi hua. Try again.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <Screen edges={['left', 'right', 'bottom']} style={styles.screen}>
      <Header title="Add Money" subtitle="Secure wallet recharge" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Soft gold hero — no dark blue */}
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Ionicons name="shield-checkmark" size={12} color={COLORS.primaryDark} />
            <Text style={styles.heroBadgeText}>RAZORPAY · DEMO</Text>
          </View>
          <Text style={styles.heroTitle}>Recharge your{'\n'}AstroTalk wallet</Text>
          <Text style={styles.heroSub}>
            Instant credit · Chat & call ready · Safe payments
          </Text>
          <View style={styles.heroDecor}>
            <Ionicons name="wallet" size={56} color="rgba(253,185,19,0.4)" />
          </View>
        </View>

        <View style={styles.tipBox}>
          <Ionicons name="flash" size={16} color={COLORS.primary} />
          <Text style={styles.tipText}>
            Abhi <Text style={styles.tipBold}>dummy Razorpay</Text> hai — Pay dabate hi balance credit.
            Real keys baad me laga lena.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Select Amount</Text>
        <View style={styles.grid}>
          {WALLET_AMOUNTS.map((val) => {
            const active = amount === String(val);
            return (
              <TouchableOpacity
                key={val}
                style={[styles.amountCard, active && styles.amountActive]}
                onPress={() => setAmount(String(val))}
                activeOpacity={0.88}
              >
                <Text style={[styles.amountText, active && styles.amountTextActive]}>
                  {formatCurrency(val)}
                </Text>
                {val >= 500 && (
                  <View style={styles.bonusPill}>
                    <Text style={styles.bonus}>+20% bonus</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
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
            <Text style={styles.summaryVal}>{formatCurrency(gst)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={styles.totalVal}>{formatCurrency(totalPayable)}</Text>
          </View>
        </View>

        <Button title="Proceed to Pay" onPress={handlePay} loading={loading} disabled={numAmount < 1} />

        <View style={styles.secureRow}>
          <Ionicons name="lock-closed" size={14} color={COLORS.success} />
          <Text style={styles.secureText}>100% Safe & Secure Payments</Text>
        </View>
      </ScrollView>

      {/* Payment sheet — dark + gold remedies palette */}
      <Modal visible={!!paySheet} transparent animationType="slide" onRequestClose={() => !paying && setPaySheet(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHero}>
              <View style={styles.heroBadge}>
                <Ionicons name="sparkles" size={12} color={COLORS.primaryDark} />
                <Text style={styles.heroBadgeText}>RAZORPAY DEMO</Text>
              </View>
              <Text style={styles.sheetHeroTitle}>Complete Payment</Text>
              <Text style={styles.sheetHeroSub}>AstroTalk Wallet Recharge</Text>
            </View>

            <View style={styles.sheetAmountBox}>
              <Text style={styles.sheetAmountLabel}>Amount to pay</Text>
              <Text style={styles.sheetAmount}>{formatCurrency(paySheet?.amount || 0)}</Text>
              <Text style={styles.sheetOrder}>Order: {paySheet?.orderId || '—'}</Text>
            </View>

            <View style={styles.methodRow}>
              <View style={styles.methodIcon}>
                <Ionicons name="card-outline" size={18} color={COLORS.primaryDark} />
              </View>
              <Text style={styles.methodText}>UPI / Card / NetBanking (simulated)</Text>
            </View>

            <TouchableOpacity
              style={[styles.payBtn, paying && styles.payBtnDisabled]}
              onPress={completeDummyPayment}
              disabled={paying}
              activeOpacity={0.88}
            >
              {paying ? (
                <ActivityIndicator color={COLORS.text} />
              ) : (
                <>
                  <Text style={styles.payBtnText}>
                    Pay {formatCurrency(paySheet?.amount || 0)}
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color={COLORS.text} />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => !paying && setPaySheet(null)}
              disabled={paying}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.cream },
  content: { padding: 16, paddingBottom: 36 },

  hero: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    padding: 18,
    overflow: 'hidden',
    minHeight: 130,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '55',
    ...SHADOW_MD,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  heroBadgeText: { fontSize: 9, fontWeight: '800', color: COLORS.primaryDark, letterSpacing: 0.5 },
  heroTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, lineHeight: 28 },
  heroSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 6, lineHeight: 16, fontWeight: '500' },
  heroDecor: { position: 'absolute', right: -4, bottom: -6 },

  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: COLORS.yellowLight,
    padding: 12,
    borderRadius: 12,
    marginBottom: 18,
  },
  tipText: { flex: 1, fontSize: 12, color: COLORS.textSecondary, lineHeight: 17, fontWeight: '500' },
  tipBold: { fontWeight: '800', color: COLORS.text },

  sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  amountCard: {
    width: '30%',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    ...SHADOW,
  },
  amountActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  amountText: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  amountTextActive: { color: COLORS.primaryDark },
  bonusPill: {
    marginTop: 4,
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  bonus: { fontSize: 9, color: COLORS.success, fontWeight: '800' },

  summary: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOW_MD,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  summaryLabel: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '500' },
  summaryVal: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  totalRow: { borderTopWidth: 1, borderTopColor: COLORS.borderLight, marginTop: 6, paddingTop: 12 },
  totalLabel: { color: COLORS.text, fontSize: 16, fontWeight: '800' },
  totalVal: { color: COLORS.primaryDark, fontSize: 18, fontWeight: '800' },

  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
  },
  secureText: { color: COLORS.success, fontSize: 12, fontWeight: '600' },

  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.cream,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 18,
    paddingBottom: 28,
    paddingTop: 10,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    marginBottom: 12,
  },
  sheetHero: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.primary + '55',
  },
  sheetHeroTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  sheetHeroSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4, fontWeight: '500' },
  sheetAmountBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOW,
  },
  sheetAmountLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  sheetAmount: { fontSize: 28, fontWeight: '800', color: COLORS.text, marginTop: 4 },
  sheetOrder: { fontSize: 11, color: COLORS.textLight, marginTop: 8 },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    marginBottom: 14,
  },
  methodIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodText: { flex: 1, fontSize: 13, color: COLORS.text, fontWeight: '600' },
  payBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  payBtnDisabled: { opacity: 0.7 },
  payBtnText: { color: COLORS.text, fontSize: 15, fontWeight: '800' },
  cancelBtn: { alignItems: 'center', paddingVertical: 10 },
  cancelText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
});
