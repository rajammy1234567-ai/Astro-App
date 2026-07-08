import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors, COLORS } from '../../constants/theme';

function SettingRow({ label, sub, value, onValueChange }) {
  return (
    <View style={styles.settingRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.settingLabel}>{label}</Text>
        {sub && <Text style={styles.settingSub}>{sub}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: COLORS.success, false: colors.border }}
        thumbColor={value ? '#fff' : '#f0f0f0'}
      />
    </View>
  );
}

function InfoRow({ icon, label, value, color }) {
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: `${color || COLORS.primary}18` }]}>
        <Ionicons name={icon} size={16} color={color || COLORS.primary} />
      </View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function Profile() {
  const { astrologer, logout, setOnline, updateProfile } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('Logout', 'Logout karna chahte ho?', [
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

  const isOnline = !!astrologer?.isOnline;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroBg} />
          <View style={styles.heroContent}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{astrologer?.name?.charAt(0) || 'A'}</Text>
              </View>
              <View style={[styles.statusDot, isOnline ? styles.statusOnline : styles.statusOffline]} />
            </View>
            <Text style={styles.name}>{astrologer?.name}</Text>
            <Text style={styles.specialty}>{astrologer?.specialty}</Text>
            <Text style={styles.panelId}>Panel ID: {astrologer?.phone}</Text>

            {/* Badges */}
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Ionicons name="star" size={13} color={COLORS.star} />
                <Text style={styles.badgeText}>{astrologer?.rating ?? '—'}</Text>
              </View>
              <View style={styles.badge}>
                <Ionicons name="cash-outline" size={13} color={COLORS.success} />
                <Text style={styles.badgeText}>₹{astrologer?.pricePerMin}/min</Text>
              </View>
              <View style={styles.badge}>
                <Ionicons name="briefcase-outline" size={13} color={COLORS.link} />
                <Text style={styles.badgeText}>{astrologer?.experience || 0} yrs</Text>
              </View>
            </View>

            {astrologer?.languages?.length > 0 && (
              <Text style={styles.langs}>{astrologer.languages.join(' · ')}</Text>
            )}
          </View>
        </View>

        {/* Quick Buttons */}
        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/profile/edit')}>
            <Ionicons name="create-outline" size={18} color="#1A1A1A" />
            <Text style={styles.quickBtnText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickBtn, styles.quickBtnSecondary]} onPress={() => router.push('/profile/reviews')}>
            <Ionicons name="star-outline" size={18} color={COLORS.primaryDark} />
            <Text style={[styles.quickBtnText, { color: COLORS.primaryDark }]}>Reviews</Text>
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        {!!astrologer?.bio && (
          <View style={styles.bioCard}>
            <Text style={styles.bioLabel}>Bio</Text>
            <Text style={styles.bioText}>{astrologer.bio}</Text>
          </View>
        )}

        {/* Info Stats */}
        <View style={styles.infoCard}>
          <InfoRow icon="star" label="Rating" value={`${astrologer?.rating ?? '—'} / 5`} color={COLORS.star} />
          <InfoRow icon="cash-outline" label="Per Minute" value={`₹${astrologer?.pricePerMin ?? 0}`} color={COLORS.success} />
          <InfoRow icon="briefcase-outline" label="Experience" value={`${astrologer?.experience ?? 0} years`} color={COLORS.link} />
        </View>

        {/* Availability Settings */}
        <View style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>Availability Settings</Text>
          <SettingRow
            label="Online Status"
            sub={isOnline ? 'Users requests bhej sakte hain' : 'Abhi offline ho'}
            value={isOnline}
            onValueChange={toggleOnline}
          />
          <View style={styles.divider} />
          <SettingRow
            label="Accept Chats"
            sub="Text chat consultation enable/disable"
            value={astrologer?.chatEnabled !== false}
            onValueChange={toggleChat}
          />
          <View style={styles.divider} />
          <SettingRow
            label="Accept Calls"
            sub="Voice call consultation enable/disable"
            value={astrologer?.callEnabled !== false}
            onValueChange={toggleCall}
          />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>AstroTalk Partner v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 40 },

  heroCard: {
    backgroundColor: COLORS.bannerDark, overflow: 'hidden', marginBottom: 0,
  },
  heroBg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#2D1B4E', opacity: 0.5,
  },
  heroContent: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24 },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    borderWidth: 4, borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarText: { fontSize: 40, fontWeight: '900', color: '#1A1A1A' },
  statusDot: {
    position: 'absolute', bottom: 4, right: 4,
    width: 22, height: 22, borderRadius: 11, borderWidth: 3, borderColor: COLORS.bannerDark,
  },
  statusOnline: { backgroundColor: COLORS.success },
  statusOffline: { backgroundColor: colors.textMuted },
  name: { fontSize: 24, fontWeight: '900', color: '#fff', textAlign: 'center' },
  specialty: { fontSize: 14, color: COLORS.primary, fontWeight: '700', marginTop: 4 },
  panelId: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 4 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap', justifyContent: 'center' },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  langs: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 10 },

  quickRow: { flexDirection: 'row', gap: 10, padding: 16 },
  quickBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 12,
  },
  quickBtnSecondary: { backgroundColor: COLORS.yellowLight, borderWidth: 1.5, borderColor: COLORS.primary },
  quickBtnText: { fontWeight: '800', fontSize: 14, color: '#1A1A1A' },

  bioCard: {
    backgroundColor: colors.card, marginHorizontal: 16, borderRadius: 14, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: colors.border,
  },
  bioLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', marginBottom: 6 },
  bioText: { fontSize: 14, color: colors.text, lineHeight: 21 },

  infoCard: {
    backgroundColor: colors.card, marginHorizontal: 16, borderRadius: 14, padding: 8,
    marginBottom: 12, borderWidth: 1, borderColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10,
  },
  infoIcon: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  infoLabel: { flex: 1, fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  infoValue: { fontSize: 14, fontWeight: '800', color: colors.text },

  settingsCard: {
    backgroundColor: colors.card, marginHorizontal: 16, borderRadius: 14, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: colors.border,
  },
  settingsTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 14 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  settingLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
  settingSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 10 },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginHorizontal: 16, marginBottom: 12,
    backgroundColor: colors.danger, borderRadius: 14, paddingVertical: 14,
  },
  logoutText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  version: { textAlign: 'center', color: colors.textMuted, fontSize: 11, marginBottom: 8 },
});