import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { colors, COLORS } from '../../constants/theme';

export default function Profile() {
  const { astrologer, logout, setOnline, updateProfile } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const toggleChat = async (v) => {
    try { await updateProfile({ chatEnabled: v }); } catch (e) { Alert.alert('Error', e.message); }
  };

  const toggleCall = async (v) => {
    try { await updateProfile({ callEnabled: v }); } catch (e) { Alert.alert('Error', e.message); }
  };

  const toggleOnline = async (v) => {
    try { await setOnline(v); } catch (e) { Alert.alert('Error', e.message); }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.heading}>Profile</Text>

      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{astrologer?.name?.charAt(0) || 'A'}</Text>
        </View>
        <Text style={styles.name}>{astrologer?.name}</Text>
        <Text style={styles.specialty}>{astrologer?.specialty}</Text>
        <Text style={styles.phone}>Panel ID: {astrologer?.phone}</Text>
        {!!astrologer?.bio && <Text style={styles.bio}>{astrologer.bio}</Text>}
        <View style={styles.badgeRow}>
          <Text style={styles.badge}>⭐ {astrologer?.rating}</Text>
          <Text style={styles.badge}>₹{astrologer?.pricePerMin}/min</Text>
          <Text style={styles.badge}>{astrologer?.experience || 0} yrs exp</Text>
        </View>
        {!!astrologer?.languages?.length && (
          <Text style={styles.langs}>{astrologer.languages.join(' · ')}</Text>
        )}
      </View>

      <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/profile/edit')}>
        <Text style={styles.editText}>✏️ Edit Profile & Photos</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.reviewsBtn} onPress={() => router.push('/profile/reviews')}>
        <Text style={styles.reviewsText}>⭐ Manage Reviews</Text>
      </TouchableOpacity>

      <View style={styles.settingsCard}>
        <Text style={styles.settingsTitle}>Availability</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Online Status</Text>
          <Switch value={!!astrologer?.isOnline} onValueChange={toggleOnline} trackColor={{ true: colors.success }} />
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Accept Chats</Text>
          <Switch value={astrologer?.chatEnabled !== false} onValueChange={toggleChat} trackColor={{ true: colors.success }} />
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Accept Calls</Text>
          <Switch value={astrologer?.callEnabled !== false} onValueChange={toggleCall} trackColor={{ true: colors.success }} />
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
      <Text style={styles.version}>AstroTalk Partner v1.0.0</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg, padding: 20 },
  heading: { fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: 16 },
  card: {
    backgroundColor: colors.card, borderRadius: 16, padding: 24, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 36, fontWeight: '700', color: colors.primary },
  name: { fontSize: 22, fontWeight: '700', color: colors.text },
  specialty: { fontSize: 14, color: colors.primary, marginTop: 4 },
  phone: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  bio: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 12, lineHeight: 20 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' },
  badge: { backgroundColor: colors.primaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, fontSize: 13, color: colors.primary, overflow: 'hidden' },
  langs: { fontSize: 12, color: colors.textMuted, marginTop: 10 },
  editBtn: {
    marginTop: 16, backgroundColor: colors.primary, borderRadius: 10,
    padding: 14, alignItems: 'center',
  },
  editText: { color: colors.text, fontWeight: '800', fontSize: 15 },
  reviewsBtn: {
    marginTop: 10, backgroundColor: colors.primaryLight, borderRadius: 10,
    padding: 14, alignItems: 'center',
  },
  reviewsText: { color: COLORS.primaryDark, fontWeight: '700', fontSize: 15 },
  settingsCard: {
    marginTop: 16, backgroundColor: colors.card, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  settingsTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 12 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  settingLabel: { fontSize: 14, color: colors.text },
  logoutBtn: { marginTop: 20, backgroundColor: colors.danger, borderRadius: 10, padding: 16, alignItems: 'center' },
  logoutText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  version: { textAlign: 'center', color: colors.textMuted, fontSize: 12, marginTop: 24 },
});