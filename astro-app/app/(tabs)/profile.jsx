import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import PanelHeader from '../../components/common/PanelHeader';
import { colors, COLORS, SHADOW_SM, RADIUS } from '../../constants/theme';

function SettingRow({ icon, label, sub, value, onValueChange }) {
  return (
    <View style={styles.settingRow}>
      <View style={[styles.settingIcon, { backgroundColor: value ? COLORS.successLight : COLORS.soft }]}>
        <Ionicons name={icon} size={16} color={value ? COLORS.success : colors.textMuted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.settingLabel}>{label}</Text>
        {!!sub && <Text style={styles.settingSub}>{sub}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: COLORS.success, false: '#D5D0E0' }}
        thumbColor="#fff"
      />
    </View>
  );
}

function InfoRow({ icon, label, value, color }) {
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: `${color || COLORS.primary}20` }]}>
        <Ionicons name={icon} size={15} color={color || COLORS.primary} />
      </View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function Profile() {
  const { astrologer, logout, setOnline, updateProfile } = useAuth();
  const router = useRouter();
  const isOnline = !!astrologer?.isOnline;

  const handleLogout = () => {
    Alert.alert('Logout', 'Partner panel se logout?', [
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

  const toggleChat = async (v) => {
    try { await updateProfile({ chatEnabled: v }); }
    catch (e) { Alert.alert('Error', e.message); }
  };
  const toggleCall = async (v) => {
    try { await updateProfile({ callEnabled: v }); }
    catch (e) { Alert.alert('Error', e.message); }
  };
  const toggleOnline = async (v) => {
    try { await setOnline(v); }
    catch (e) { Alert.alert('Error', e.message); }
  };

  return (
    <View style={styles.screen}>
      <PanelHeader title="My Profile" subtitle="Public listing & availability" />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{astrologer?.name?.charAt(0) || 'A'}</Text>
            </View>
            <View style={[styles.status, isOnline ? styles.on : styles.off]} />
          </View>
          <Text style={styles.name}>{astrologer?.name || 'Astrologer'}</Text>
          <Text style={styles.spec}>{astrologer?.specialty || 'Astrology Expert'}</Text>
          <Text style={styles.id}>Panel · {astrologer?.phone || '—'}</Text>

          <View style={styles.badges}>
            <View style={styles.badge}>
              <Ionicons name="star" size={12} color={COLORS.star} />
              <Text style={styles.badgeText}>{astrologer?.rating ?? '—'}</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="cash-outline" size={12} color={COLORS.success} />
              <Text style={styles.badgeText}>₹{astrologer?.pricePerMin || 0}/min</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="briefcase-outline" size={12} color="#A78BFA" />
              <Text style={styles.badgeText}>{astrologer?.experience || 0} yrs</Text>
            </View>
          </View>

          {!!astrologer?.languages?.length && (
            <Text style={styles.langs}>{astrologer.languages.join(' · ')}</Text>
          )}
        </View>

        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickPrimary} onPress={() => router.push('/profile/edit')}>
            <Ionicons name="create-outline" size={18} color={COLORS.bannerDark} />
            <Text style={styles.quickPrimaryText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickSecondary} onPress={() => router.push('/profile/reviews')}>
            <Ionicons name="star-outline" size={18} color={COLORS.primary} />
            <Text style={styles.quickSecondaryText}>Reviews</Text>
          </TouchableOpacity>
        </View>

        {!!astrologer?.bio && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>About</Text>
            <Text style={styles.bio}>{astrologer.bio}</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Professional</Text>
          <InfoRow icon="star" label="Rating" value={`${astrologer?.rating ?? '—'} / 5`} color={COLORS.star} />
          <InfoRow icon="cash-outline" label="Per minute" value={`₹${astrologer?.pricePerMin ?? 0}`} color={COLORS.success} />
          <InfoRow icon="briefcase-outline" label="Experience" value={`${astrologer?.experience ?? 0} years`} color={COLORS.violet} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Availability</Text>
          <SettingRow
            icon="radio-button-on"
            label="Online status"
            sub={isOnline ? 'Receiving requests' : 'Currently offline'}
            value={isOnline}
            onValueChange={toggleOnline}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="chatbubbles"
            label="Accept chats"
            sub="Text consultations"
            value={astrologer?.chatEnabled !== false}
            onValueChange={toggleChat}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="call"
            label="Accept calls"
            sub="Voice consultations"
            value={astrologer?.callEnabled !== false}
            onValueChange={toggleCall}
          />
        </View>

        <TouchableOpacity style={styles.logout} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>AstroTalk Partner · Professional Panel</Text>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  body: { padding: 16 },

  hero: {
    backgroundColor: COLORS.bannerDark, borderRadius: 26, padding: 22,
    alignItems: 'center', marginBottom: 14, overflow: 'hidden',
  },
  avatarRing: { position: 'relative', marginBottom: 12 },
  avatar: {
    width: 82, height: 82, borderRadius: 28, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.15)',
  },
  avatarText: { fontSize: 34, fontWeight: '900', color: COLORS.bannerDark },
  status: {
    position: 'absolute', bottom: 2, right: 2, width: 16, height: 16, borderRadius: 8,
    borderWidth: 2, borderColor: COLORS.bannerDark,
  },
  on: { backgroundColor: COLORS.success },
  off: { backgroundColor: colors.textMuted },
  name: { fontSize: 22, fontWeight: '900', color: '#fff' },
  spec: { fontSize: 13, color: COLORS.primary, fontWeight: '700', marginTop: 4 },
  id: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 4 },
  badges: { flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap', justifyContent: 'center' },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  langs: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 10 },

  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  quickPrimary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 14,
  },
  quickPrimaryText: { fontWeight: '900', fontSize: 13, color: COLORS.bannerDark },
  quickSecondary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: COLORS.bannerDark, borderRadius: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: 'rgba(245,197,24,0.3)',
  },
  quickSecondaryText: { fontWeight: '900', fontSize: 13, color: COLORS.primary },

  card: {
    backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOW_SM,
  },
  cardTitle: {
    fontSize: 11, fontWeight: '800', color: COLORS.textLight,
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10,
  },
  bio: { fontSize: 13, color: COLORS.text, lineHeight: 20 },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  infoIcon: { width: 32, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { flex: 1, fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  infoValue: { fontSize: 13, fontWeight: '900', color: COLORS.text },

  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  settingIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  settingSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: COLORS.borderLight, marginVertical: 4 },

  logout: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.error, borderRadius: 16, paddingVertical: 15, marginBottom: 12,
  },
  logoutText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  version: { textAlign: 'center', color: colors.textMuted, fontSize: 11, fontWeight: '600' },
});
