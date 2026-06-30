import { useEffect, useState } from 'react';
import { FlatList, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import EmptyState from '../../components/common/EmptyState';
import { walletApi } from '../../services/walletApi';
import { COLORS } from '../../constants/colors';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    walletApi.getTransactions()
      .then(setTransactions)
      .catch(() => setTransactions([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.container}>
      <Header title="Wallet Transactions" />

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item._id}
          contentContainerStyle={transactions.length ? styles.list : styles.emptyList}
          ListEmptyComponent={
            <EmptyState
              icon="wallet-outline"
              title="No transactions yet"
              subtitle="Recharge your wallet or book a consultation to see transactions"
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={[styles.iconWrap, item.type === 'credit' ? styles.creditBg : styles.debitBg]}>
                <Ionicons
                  name={item.type === 'credit' ? 'arrow-down' : 'arrow-up'}
                  size={20}
                  color={item.type === 'credit' ? COLORS.success : COLORS.error}
                />
              </View>
              <View style={styles.info}>
                <Text style={styles.desc}>{item.description}</Text>
                <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
              </View>
              <Text style={[styles.amount, item.type === 'credit' ? styles.credit : styles.debit]}>
                {item.type === 'credit' ? '+' : '-'}{formatCurrency(item.amount)}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  list: { padding: 16, paddingBottom: 32 },
  emptyList: { flexGrow: 1 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.borderLight,
  },
  iconWrap: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  creditBg: { backgroundColor: COLORS.successLight },
  debitBg: { backgroundColor: COLORS.errorLight },
  info: { flex: 1 },
  desc: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  date: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  amount: { fontSize: 16, fontWeight: '700' },
  credit: { color: COLORS.success },
  debit: { color: COLORS.error },
});