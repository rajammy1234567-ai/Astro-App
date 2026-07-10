import { ScrollView, Text, StyleSheet, View } from 'react-native';
import Screen from '../../components/common/Screen';
import Header from '../../components/common/Header';
import { COLORS } from '../../constants/colors';

const SECTIONS = [
  {
    title: '1. Introduction',
    body: 'AstroTalk (“we”, “our”, “app”) provides astrology consultation, chat/call sessions, store and related spiritual services. By using the app you agree to this Privacy Policy.',
  },
  {
    title: '2. Information We Collect',
    body: 'We may collect: name, phone/email, date/time/place of birth, gender, wallet and order data, chat/call session logs, device info, and content you upload (photos/videos in chat). Birth details are used only for consultations and kundli features.',
  },
  {
    title: '3. How We Use Data',
    body: 'Data is used to create your account, show horoscope/kundli, match you with astrologers, process payments/wallet, improve the app, prevent fraud, and send important service messages. We do not sell your personal data.',
  },
  {
    title: '4. Sharing',
    body: 'Relevant profile and kundli details are shared with the astrologer you book. Payment partners, hosting (e.g. cloud servers), and legal authorities may receive data when required by law or to run the service.',
  },
  {
    title: '5. Storage & Security',
    body: 'We use reasonable technical and organisational measures to protect data. No method of transmission over the internet is 100% secure. You are responsible for keeping login OTPs private.',
  },
  {
    title: '6. Your Choices',
    body: 'You can update profile/birth details in the app, end chat/call sessions, and request account deletion by contacting support. After logout, local session tokens are cleared from the device.',
  },
  {
    title: '7. Children',
    body: 'AstroTalk is not directed at children under 13. If you believe a child has provided data, contact us to remove it.',
  },
  {
    title: '8. Changes & Contact',
    body: 'We may update this policy; continued use means acceptance of changes. For privacy questions contact support from the app or email the team listed in About Us.',
  },
];

export default function PrivacyPolicyScreen() {
  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <Header title="Privacy Policy" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>AstroTalk Privacy Policy</Text>
          <Text style={styles.heroSub}>Last updated: 2026</Text>
        </View>
        {SECTIONS.map((s) => (
          <View key={s.title} style={styles.card}>
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.body}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  hero: {
    backgroundColor: COLORS.bannerDark, borderRadius: 14, padding: 18, marginBottom: 14,
  },
  heroTitle: { color: COLORS.primary, fontSize: 18, fontWeight: '800' },
  heroSub: { color: 'rgba(255,255,255,0.7)', marginTop: 6, fontSize: 12 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  title: { fontSize: 14, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  body: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
});
