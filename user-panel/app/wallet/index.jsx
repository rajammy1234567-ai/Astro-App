import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Screen from '../../components/common/Screen';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import { COLORS } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatters';
import { fetchWallet } from '../../redux/walletSlice';

export default function WalletScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const balance = useSelector((s) => s.wallet.balance);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) dispatch(fetchWallet());
  }, [dispatch, isAuthenticated]);

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <Header title="Wallet" light />
      <View style={styles.balanceCard}>
        <Text style={styles.label}>Available Balance</Text>
        <Text style={styles.balance}>{formatCurrency(balance)}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/wallet/add-money')}>
          <Ionicons name="add-circle" size={18} color={COLORS.text} />
          <Text style={styles.addText}>Add Cash</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.row} onPress={() => router.push('/wallet/transactions')}>
        <Ionicons name="receipt-outline" size={22} color={COLORS.textSecondary} />
        <Text style={styles.rowText}>Wallet Transactions</Text>
        <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.row} onPress={() => router.push('/wallet/gift-card')}>
        <Ionicons name="gift-outline" size={22} color={COLORS.textSecondary} />
        <Text style={styles.rowText}>Redeem Gift Card</Text>
        <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  balanceCard: {
    backgroundColor: COLORS.yellow, margin: 14, borderRadius: 12, padding: 24, alignItems: 'center',
  },
  label: { fontSize: 14, color: COLORS.textSecondary },
  balance: { fontSize: 36, fontWeight: '800', color: COLORS.text, marginTop: 4 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16,
    backgroundColor: COLORS.surface, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20,
  },
  addText: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.surface, marginHorizontal: 14, marginBottom: 10, padding: 16, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  rowText: { flex: 1, fontSize: 15, fontWeight: '500', color: COLORS.text },
});