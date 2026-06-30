import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import RemoteImage from '../../components/common/RemoteImage';
import Header from '../../components/common/Header';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../services/authApi';
import { COLORS } from '../../constants/colors';
import { formatCurrency, formatPhone } from '../../utils/formatters';

const MENU = [
  { label: 'My Wallet', icon: 'wallet-outline', route: '/wallet' },
  { label: 'Order History', icon: 'receipt-outline', route: '/orders' },
  { label: 'Wallet Transactions', icon: 'swap-horizontal-outline', route: '/wallet/transactions' },
  { label: 'My Following', icon: 'people-outline', route: '/following' },
  { label: 'Chat History', icon: 'chatbubbles-outline', route: '/(tabs)/chat' },
  { label: 'Settings', icon: 'settings-outline', route: '/settings' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi.getMe()
      .then(setProfile)
      .catch(() => setProfile(authUser))
      .finally(() => setLoading(false));
  }, [authUser]);

  const user = profile || authUser;
  const displayName = user?.name || 'User';

  return (
    <View style={styles.container}>
      <Header title="My Profile" />

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.profileCard}>
            <RemoteImage uri={user?.avatar} type="avatar" style={styles.avatarImg} fallbackIcon="person" iconSize={32} />
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.phone}>
              {user?.phone ? formatPhone(user.phone) : user?.email || ''}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{user?.orderCount ?? 0}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{formatCurrency(user?.balance ?? 0)}</Text>
              <Text style={styles.statLabel}>Wallet</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name={user?.isVerified ? 'shield-checkmark' : 'shield-outline'} size={22} color={COLORS.success} />
              <Text style={styles.statLabel}>{user?.isVerified ? 'Verified' : 'Unverified'}</Text>
            </View>
          </View>

          {MENU.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.menuItem}
              onPress={() => item.route && router.push(item.route)}
            >
              <Ionicons name={item.icon} size={22} color={COLORS.textSecondary} />
              <Text style={styles.menuText}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  scroll: { padding: 16, paddingBottom: 32 },
  profileCard: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 24,
    alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: COLORS.borderLight,
  },
  avatarImg: { width: 80, height: 80, borderRadius: 40, marginBottom: 12 },
  name: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  phone: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: 10,
    padding: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderLight,
  },
  statNum: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: 10, padding: 16, marginBottom: 8, gap: 14,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  menuText: { flex: 1, fontSize: 15, fontWeight: '500', color: COLORS.text },
});