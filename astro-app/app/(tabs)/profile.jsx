import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, Switch, ScrollView,
  Modal, TextInput, ActivityIndicator,
} from 'react-native';
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
  const { astrologer, logout, deleteAccount, setOnline, updateProfile } = useAuth();
  const router = useRouter();
  const isOnline = !!astrologer?.isOnline;
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

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

  const openDeleteAccount = () => {
    setDeletePassword('');
    setDeleteConfirm('');
    setDeleteOpen(true);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm.trim().toUpperCase() !== 'DELETE') {
      Alert.alert('Confirm', 'Account delete karne ke liye niche DELETE type karo.');
      return;
    }
    if (!deletePassword.trim()) {
      Alert.alert('Password', 'Apna login password enter karo.');
      return;
    }

    Alert.alert(
      'Delete permanently?',
      'Yeh action undo nahi hoga. Public listing, login aur open sessions band ho jayenge.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteAccount(deletePassword.trim());
              setDeleteOpen(false);
              Alert.alert('Deleted', 'Aapka astrologer account delete ho chuka hai.', [
                { text: 'OK', onPress: () => router.replace('/(auth)/login') },
              ]);
            } catch (e) {
              Alert.alert('Failed', e.message || 'Account delete nahi ho paya.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
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

        <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/notifications')}>
          <Ionicons name="notifications-outline" size={20} color={COLORS.text} />
          <Text style={styles.notifText}>Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logout} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={openDeleteAccount} activeOpacity={0.85}>
          <Ionicons name="trash-outline" size={20} color={COLORS.error} />
          <Text style={styles.deleteBtnText}>Delete Account</Text>
        </TouchableOpacity>
        <Text style={styles.deleteHint}>
          Permanent. Public listing aur login band ho jayega. Password required.
        </Text>

        <Text style={styles.version}>AstroTalk Partner · Professional Panel</Text>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Delete account sheet */}
      <Modal
        visible={deleteOpen}
        transparent
        animationType="slide"
        onRequestClose={() => !deleting && setDeleteOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.dangerIconWrap}>
              <Ionicons name="warning" size={28} color={COLORS.error} />
            </View>
            <Text style={styles.modalTitle}>Delete account?</Text>
            <Text style={styles.modalSub}>
              Profile listing, login access aur open chat/call sessions permanently band ho jayenge.
              History user side pe reh sakti hai.
            </Text>

            <Text style={styles.fieldLabel}>Login password</Text>
            <TextInput
              style={styles.input}
              value={deletePassword}
              onChangeText={setDeletePassword}
              placeholder="Enter password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              autoCapitalize="none"
              editable={!deleting}
            />

            <Text style={styles.fieldLabel}>Type DELETE to confirm</Text>
            <TextInput
              style={styles.input}
              value={deleteConfirm}
              onChangeText={setDeleteConfirm}
              placeholder="DELETE"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              editable={!deleting}
            />

            <TouchableOpacity
              style={[styles.modalDelete, deleting && { opacity: 0.7 }]}
              onPress={handleDeleteAccount}
              disabled={deleting}
              activeOpacity={0.85}
            >
              {deleting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="trash" size={18} color="#fff" />
                  <Text style={styles.modalDeleteText}>Delete my account</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => !deleting && setDeleteOpen(false)}
              disabled={deleting}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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

  notifBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 16, paddingVertical: 15, marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  notifText: { color: COLORS.text, fontWeight: '900', fontSize: 15 },
  logout: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.error, borderRadius: 16, paddingVertical: 15, marginBottom: 10,
  },
  logoutText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 16, paddingVertical: 15, marginBottom: 8,
    borderWidth: 1.5, borderColor: COLORS.error,
  },
  deleteBtnText: { color: COLORS.error, fontWeight: '900', fontSize: 15 },
  deleteHint: {
    textAlign: 'center', color: colors.textMuted, fontSize: 11,
    lineHeight: 16, marginBottom: 14, paddingHorizontal: 12,
  },
  version: { textAlign: 'center', color: colors.textMuted, fontSize: 11, fontWeight: '600' },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22,
    paddingHorizontal: 20, paddingBottom: 28, paddingTop: 10,
  },
  modalHandle: {
    alignSelf: 'center', width: 40, height: 4, borderRadius: 2,
    backgroundColor: COLORS.border, marginBottom: 14,
  },
  dangerIconWrap: {
    width: 56, height: 56, borderRadius: 28, alignSelf: 'center',
    backgroundColor: `${COLORS.error}15`, alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20, fontWeight: '900', color: COLORS.text, textAlign: 'center', marginBottom: 8,
  },
  modalSub: {
    fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19, marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 12, fontWeight: '800', color: COLORS.text, marginBottom: 6, marginTop: 4,
  },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 15, color: COLORS.text, marginBottom: 12,
    backgroundColor: COLORS.background || '#F8F6FC',
  },
  modalDelete: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.error, borderRadius: 16, paddingVertical: 15, marginTop: 6,
  },
  modalDeleteText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  modalCancel: { alignItems: 'center', paddingVertical: 14 },
  modalCancelText: { color: colors.textMuted, fontWeight: '700', fontSize: 14 },
});
