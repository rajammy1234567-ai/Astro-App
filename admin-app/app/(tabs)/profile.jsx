import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../constants/theme';

export default function Profile() {
  const { admin, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.heading}>Profile</Text>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{admin?.name?.charAt(0) || 'A'}</Text>
        </View>
        <Text style={styles.name}>{admin?.name}</Text>
        <Text style={styles.email}>{admin?.email}</Text>
        <Text style={styles.role}>{admin?.role || 'admin'}</Text>
      </View>

      <TouchableOpacity style={styles.linkBtn} onPress={() => router.push('/notifications')}>
        <Text style={styles.linkText}>Notifications</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.version}>AstroTalk Admin v1.0.0</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg, padding: 20 },
  heading: { fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: 20 },
  card: {
    backgroundColor: colors.card, borderRadius: 16, padding: 24, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#0f172a' },
  name: { fontSize: 20, fontWeight: '700', color: colors.text },
  email: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  role: { fontSize: 12, color: colors.primary, marginTop: 8, textTransform: 'uppercase' },
  linkBtn: {
    marginTop: 16, backgroundColor: colors.card, borderRadius: 10, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  linkText: { color: colors.text, fontWeight: '700', fontSize: 15 },
  logoutBtn: {
    marginTop: 12, backgroundColor: colors.danger, borderRadius: 10,
    padding: 16, alignItems: 'center',
  },
  logoutText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  version: { textAlign: 'center', color: colors.textMuted, fontSize: 12, marginTop: 24 },
});