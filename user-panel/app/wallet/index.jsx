import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Screen from '../../components/common/Screen';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import { COLORS } from '../../constants/colors';
import { SHADOW_MD } from '../../constants/theme';
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
    <Screen edges={['left', 'right', 'bottom']} style={styles.screen}>
      <Header title="Wallet" subtitle="Balance & recharges" />

      <View style={styles.hero}>
        <View style={styles.heroBadge}>
          <Ionicons name="wallet" size={12} color={COLORS.primaryDark} />
          <Text style={styles.heroBadgeText}>AVAILABLE BALANCE</Text>
        </View>
        <Text style={styles.balance}>{formatCurrency(balance)}</Text>
        <Text style={styles.heroSub}>Use for chat, call & store orders</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/wallet/add-money')}
          activeOpacity={0.88}
        >
          <Text style={styles.addText}>Add Cash</Text>
          <Ionicons name="arrow-forward" size={15} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.heroDecor}>
          <Ionicons name="sparkles" size={52} color="rgba(253,185,19,0.4)" />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Quick actions</Text>

      <TouchableOpacity
        style={styles.row}
        onPress={() => router.push('/wallet/transactions')}
        activeOpacity={0.88}
      >
        <View style={[styles.rowIcon, { backgroundColor: COLORS.primaryLight }]}>
          <Ionicons name="receipt-outline" size={20} color={COLORS.primaryDark} />
        </View>
        <View style={styles.rowBody}>
          <Text style={styles.rowText}>Wallet Transactions</Text>
          <Text style={styles.rowSub}>Credits, debits & recharges</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.row}
        onPress={() => router.push('/wallet/gift-card')}
        activeOpacity={0.88}
      >
        <View style={[styles.rowIcon, { backgroundColor: COLORS.successLight }]}>
          <Ionicons name="gift-outline" size={20} color={COLORS.success} />
        </View>
        <View style={styles.rowBody}>
          <Text style={styles.rowText}>Redeem Gift Card</Text>
          <Text style={styles.rowSub}>Enter code to add balance</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.cream },
  hero: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    padding: 20,
    overflow: 'hidden',
    minHeight: 160,
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
  balance: { fontSize: 36, fontWeight: '800', color: COLORS.text, marginTop: 2 },
  heroSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 6, fontWeight: '500' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    marginTop: 16,
  },
  addText: { fontSize: 13, fontWeight: '800', color: COLORS.text },
  heroDecor: { position: 'absolute', right: 4, bottom: 4 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    marginHorizontal: 16,
    marginTop: 22,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOW_MD,
  },
  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1 },
  rowText: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  rowSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2, fontWeight: '500' },
});
