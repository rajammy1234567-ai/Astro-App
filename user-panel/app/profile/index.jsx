import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import Screen from '../../components/common/Screen';
import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import RemoteImage from '../../components/common/RemoteImage';
import Header from '../../components/common/Header';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../services/authApi';
import { useDispatch } from 'react-redux';
import { setUser } from '../../redux/authSlice';
import { COLORS } from '../../constants/colors';
import { SHADOW_MD } from '../../constants/theme';
import { formatCurrency, formatPhone } from '../../utils/formatters';
import { ageFromDob } from '../../utils/birthDetails';

const MENU = [
  { label: 'Edit Profile', icon: 'create-outline', route: '/profile/edit', highlight: true },
  { label: 'Birth Details (Kundli)', icon: 'planet-outline', route: '/profile/edit' },
  { label: 'Become an Astrologer', icon: 'star-outline', route: '/become-astrologer' },
  { label: 'Notifications', icon: 'notifications-outline', route: '/notifications' },
  { label: 'My Wallet', icon: 'wallet-outline', route: '/wallet' },
  { label: 'Order History', icon: 'receipt-outline', route: '/orders' },
  { label: 'Wallet Transactions', icon: 'swap-horizontal-outline', route: '/wallet/transactions' },
  { label: 'My Following', icon: 'people-outline', route: '/following' },
  { label: 'Chat History', icon: 'chatbubbles-outline', route: '/sessions?type=chat' },
  { label: 'Call History', icon: 'call-outline', route: '/sessions?type=call' },
  { label: 'Settings', icon: 'settings-outline', route: '/settings' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user: authUser, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!isAuthenticated) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    authApi.getMe()
      .then((me) => {
        setProfile(me);
        dispatch(setUser(me));
      })
      .catch(() => setProfile(authUser))
      .finally(() => setLoading(false));
  }, [isAuthenticated, authUser, dispatch]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const user = profile || authUser;
  const displayName = user?.name || 'User';
  const age = user?.age ?? ageFromDob(user?.dateOfBirth);

  if (!isAuthenticated) {
    return (
      <Screen edges={['left', 'right', 'bottom']} style={styles.screen}>
        <Header title="My Profile" />
        <View style={styles.center}>
          <Ionicons name="person-circle-outline" size={64} color={COLORS.textLight} />
          <Text style={styles.loginTitle}>Login to view profile</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginBtnText}>Login / Sign up</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['left', 'right', 'bottom']} style={styles.screen}>
      <Header
        title="My Profile"
        subtitle="Manage your account"
        rightComponent={
          <TouchableOpacity
            style={styles.headerEdit}
            onPress={() => router.push('/profile/edit')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="create-outline" size={20} color={COLORS.text} />
          </TouchableOpacity>
        }
      />

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.profileCard}>
            <View style={styles.avatarWrap}>
              <RemoteImage
                uri={user?.avatar}
                type="avatar"
                style={styles.avatarImg}
                fallbackIcon="person"
                iconSize={32}
              />
            </View>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.phone}>
              {user?.phone ? formatPhone(user.phone) : user?.email || ''}
            </Text>
            {user?.email && user?.phone ? (
              <Text style={styles.email}>{user.email}</Text>
            ) : null}

            {user?.dateOfBirth ? (
              <Text style={styles.birthLine}>
                🎂 {user.dateOfBirth}
                {age != null ? ` · ${age} yrs` : ''}
                {user.gender ? ` · ${user.gender}` : ''}
                {user.timeOfBirth ? ` · ⏰ ${user.timeOfBirth}` : ''}
                {user.placeOfBirth ? ` · 📍 ${user.placeOfBirth}` : ''}
              </Text>
            ) : (
              <TouchableOpacity onPress={() => router.push('/profile/edit')}>
                <Text style={styles.addBirth}>+ Complete profile (name, DOB, photo…)</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => router.push('/profile/edit')}
              activeOpacity={0.88}
            >
              <Ionicons name="create-outline" size={16} color={COLORS.text} />
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
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
              <Ionicons
                name={user?.isVerified ? 'shield-checkmark' : 'shield-outline'}
                size={22}
                color={COLORS.success}
              />
              <Text style={styles.statLabel}>{user?.isVerified ? 'Verified' : 'Unverified'}</Text>
            </View>
          </View>

          {MENU.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, item.highlight && styles.menuHighlight]}
              onPress={() => item.route && router.push(item.route)}
              activeOpacity={0.85}
            >
              <View style={[styles.menuIcon, item.highlight && styles.menuIconHi]}>
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={item.highlight ? COLORS.primaryDark : COLORS.textSecondary}
                />
              </View>
              <Text style={[styles.menuText, item.highlight && styles.menuTextHi]}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.cream },
  scroll: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loginTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginTop: 12 },
  loginBtn: {
    marginTop: 16, backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 22,
  },
  loginBtnText: { fontWeight: '800', color: COLORS.text },
  headerEdit: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.borderLight, alignItems: 'center', justifyContent: 'center',
  },
  profileCard: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 22,
    alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: COLORS.borderLight,
    ...SHADOW_MD,
  },
  avatarWrap: { marginBottom: 12 },
  avatarImg: {
    width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: COLORS.primary,
  },
  name: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  phone: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4, fontWeight: '600' },
  email: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  birthLine: {
    fontSize: 12, color: COLORS.textSecondary, marginTop: 10, textAlign: 'center', lineHeight: 18,
  },
  addBirth: { fontSize: 13, color: COLORS.primaryDark, fontWeight: '700', marginTop: 10 },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14,
    backgroundColor: COLORS.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 22,
  },
  editBtnText: { fontSize: 13, fontWeight: '800', color: COLORS.text },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: 12,
    padding: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderLight,
  },
  statNum: { fontSize: 15, fontWeight: '800', color: COLORS.primaryDark },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2, fontWeight: '600' },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: 12, padding: 14, marginBottom: 8, gap: 12,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  menuHighlight: {
    borderColor: COLORS.primary + '88', backgroundColor: COLORS.primaryLight,
  },
  menuIcon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.cream,
    alignItems: 'center', justifyContent: 'center',
  },
  menuIconHi: { backgroundColor: COLORS.surface },
  menuText: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.text },
  menuTextHi: { fontWeight: '800' },
});
