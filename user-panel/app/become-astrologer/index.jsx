import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, Alert,
} from 'react-native';
import Screen from '../../components/common/Screen';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { astrologerApplicationApi } from '../../services/astrologerApplicationApi';
import { COLORS } from '../../constants/colors';
import { safeOpenUrl } from '../../utils/openUrl';

const STATUS_CONFIG = {
  pending: { label: 'Under Review', color: '#F59E0B', icon: 'time-outline' },
  interview_scheduled: { label: 'Interview Scheduled', color: '#3B82F6', icon: 'videocam-outline' },
  selected: { label: 'Selected!', color: '#10B981', icon: 'checkmark-circle-outline' },
  rejected: { label: 'Not Approved', color: '#EF4444', icon: 'close-circle-outline' },
};

export default function BecomeAstrologerScreen() {
  const router = useRouter();
  const { user, isAuthenticated, initialized, sessionLoading } = useAuth();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '', phone: '', email: '', specialty: '', experience: '', bio: '', languages: '',
  });

  useEffect(() => {
    if (!initialized || sessionLoading) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    astrologerApplicationApi.getMy()
      .then(setApplication)
      .catch(() => setApplication(null))
      .finally(() => setLoading(false));
  }, [isAuthenticated, initialized, sessionLoading]);

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        name: f.name || user.name || '',
        phone: f.phone || user.phone || '',
        email: f.email || user.email || '',
      }));
    }
  }, [user]);

  const canApply = !application || application.status === 'rejected';

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.specialty.trim()) {
      Alert.alert('Required', 'Please fill name, phone and specialty');
      return;
    }
    setSubmitting(true);
    try {
      const result = await astrologerApplicationApi.apply({
        ...form,
        experience: Number(form.experience) || 0,
        languages: form.languages.split(',').map((l) => l.trim()).filter(Boolean),
      });
      setApplication(result);
      Alert.alert('Success', 'Application submitted! Admin will review it soon.');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (!initialized || sessionLoading || loading) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <Header title="Become an Astrologer" />
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  if (!isAuthenticated) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <Header title="Become an Astrologer" />
        <View style={styles.center}>
          <Ionicons name="person-circle-outline" size={64} color={COLORS.textLight} />
          <Text style={styles.loginTitle}>Login Required</Text>
          <Text style={styles.loginSub}>Please login or create account to apply as an astrologer</Text>
          <Button title="Login" onPress={() => router.push('/(auth)/login')} style={{ marginTop: 20, width: '80%' }} />
          <Button
            title="Create Account"
            variant="outline"
            onPress={() => router.push('/(auth)/login?mode=signup')}
            style={{ marginTop: 12, width: '80%' }}
          />
        </View>
      </Screen>
    );
  }

  const status = application ? STATUS_CONFIG[application.status] : null;

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <Header title="Become an Astrologer" />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Text style={styles.heroIcon}>🔮</Text>
          <Text style={styles.heroTitle}>Join as Astrologer</Text>
          <Text style={styles.heroSub}>
            Apply now, attend interview via Google Meet, and get your astrologer panel access.
          </Text>
        </View>

        {application && status && (
          <View style={[styles.statusCard, { borderColor: status.color }]}>
            <View style={styles.statusHeader}>
              <Ionicons name={status.icon} size={24} color={status.color} />
              <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
            </View>

            {application.status === 'interview_scheduled' && application.interview && (
              <View style={styles.interviewBox}>
                <Text style={styles.interviewTitle}>Interview Details</Text>
                <DetailRow icon="calendar-outline" label="Date" value={`${application.interview.date} (${application.interview.day})`} />
                <DetailRow icon="time-outline" label="Time" value={application.interview.time} />
                {application.interview.notes && (
                  <DetailRow icon="document-text-outline" label="Note" value={application.interview.notes} />
                )}
                <TouchableOpacity
                  style={styles.meetBtn}
                  onPress={() => safeOpenUrl(application.interview.googleMeetLink, 'Google Meet link')}
                >
                  <Ionicons name="videocam" size={20} color="#FFF" />
                  <Text style={styles.meetBtnText}>Join Google Meet</Text>
                </TouchableOpacity>
              </View>
            )}

            {application.status === 'selected' && application.panelCredentials && (
              <View style={styles.credsBox}>
                <Text style={styles.credsTitle}>🎉 Astrologer Panel Login</Text>
                <Text style={styles.credsSub}>Use these in AstroTalk Partner app</Text>
                <View style={styles.credRow}>
                  <Text style={styles.credLabel}>Login ID (Phone)</Text>
                  <Text style={styles.credValue}>{application.panelCredentials.loginId}</Text>
                </View>
                <View style={styles.credRow}>
                  <Text style={styles.credLabel}>Password</Text>
                  <Text style={styles.credValue}>{application.panelCredentials.password}</Text>
                </View>
                <TouchableOpacity
                  style={styles.panelLinkBtn}
                  onPress={() => safeOpenUrl('astro-app://login', 'astrologer panel')}
                >
                  <Ionicons name="open-outline" size={18} color="#FFF" />
                  <Text style={styles.panelLinkText}>Open Astrologer Panel</Text>
                </TouchableOpacity>
                <Text style={styles.publishNote}>
                  Admin will add your profile details. Once published, you will appear on the user app.
                </Text>
              </View>
            )}

            {application.status === 'rejected' && application.rejectedReason && (
              <Text style={styles.rejectReason}>Reason: {application.rejectedReason}</Text>
            )}

            {application.status === 'pending' && (
              <Text style={styles.pendingText}>Your application is being reviewed by admin.</Text>
            )}
          </View>
        )}

        {canApply && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              {application?.status === 'rejected' ? 'Re-apply' : 'Application Form'}
            </Text>
            <Input label="Full Name *" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} placeholder="Your name" />
            <Input label="Phone Number *" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} placeholder="10-digit phone" keyboardType="phone-pad" maxLength={10} />
            <Input label="Email" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} placeholder="your@email.com" keyboardType="email-address" />
            <Input label="Specialty *" value={form.specialty} onChangeText={(v) => setForm({ ...form, specialty: v })} placeholder="Vedic, Tarot, Numerology..." />
            <Input label="Experience (years)" value={form.experience} onChangeText={(v) => setForm({ ...form, experience: v })} placeholder="5" keyboardType="numeric" />
            <Input label="Languages" value={form.languages} onChangeText={(v) => setForm({ ...form, languages: v })} placeholder="Hindi, English" />
            <Input label="About You" value={form.bio} onChangeText={(v) => setForm({ ...form, bio: v })} placeholder="Brief about your astrology experience..." />
            <Button title="Submit Application" onPress={handleSubmit} loading={submitting} />
          </View>
        )}

        <TouchableOpacity style={styles.notifLink} onPress={() => router.push('/notifications')}>
          <Ionicons name="notifications-outline" size={20} color={COLORS.primary} />
          <Text style={styles.notifLinkText}>View Notifications</Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={18} color={COLORS.textSecondary} />
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loginTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginTop: 16 },
  loginSub: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8, textAlign: 'center' },
  hero: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 20,
    alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: COLORS.borderLight,
  },
  heroIcon: { fontSize: 40, marginBottom: 8 },
  heroTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  heroSub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  statusCard: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 16,
    marginBottom: 16, borderWidth: 2,
  },
  statusHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  statusLabel: { fontSize: 16, fontWeight: '700' },
  interviewBox: { backgroundColor: '#EFF6FF', borderRadius: 10, padding: 14 },
  interviewTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 10 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  detailLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  detailValue: { fontSize: 13, color: COLORS.text, flex: 1 },
  meetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#4285F4', borderRadius: 8, padding: 12, marginTop: 12,
  },
  meetBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  credsBox: { backgroundColor: '#ECFDF5', borderRadius: 10, padding: 14 },
  credsTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  credsSub: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 12 },
  credRow: { marginBottom: 8 },
  credLabel: { fontSize: 12, color: COLORS.textSecondary },
  credValue: { fontSize: 18, fontWeight: '800', color: COLORS.text, letterSpacing: 1 },
  panelLinkBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primary, borderRadius: 8, padding: 12, marginTop: 14,
  },
  panelLinkText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  publishNote: { fontSize: 12, color: COLORS.textSecondary, marginTop: 10, textAlign: 'center', lineHeight: 18 },
  rejectReason: { fontSize: 13, color: COLORS.error, marginTop: 4 },
  pendingText: { fontSize: 13, color: COLORS.textSecondary },
  formCard: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  formTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  notifLink: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.surface, borderRadius: 10, padding: 16, marginTop: 16,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  notifLinkText: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.text },
});