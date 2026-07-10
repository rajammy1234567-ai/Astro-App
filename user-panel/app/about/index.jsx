import { ScrollView, Text, StyleSheet, View } from 'react-native';
import Screen from '../../components/common/Screen';
import Header from '../../components/common/Header';
import { COLORS } from '../../constants/colors';

const DEVELOPERS = [
  { name: 'Sunaina Sharma', role: 'Developer' },
  { name: 'Diyanshu Chauhan', role: 'Developer' },
];

export default function AboutUsScreen() {
  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <Header title="About Us" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Text style={styles.logo}>AstroTalk</Text>
          <Text style={styles.tagline}>Trusted astrology, chat & remedies</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Our Mission</Text>
          <Text style={styles.body}>
            AstroTalk connects users with verified astrologers for chat and call consultations,
            free kundli & daily horoscope insights, spiritual remedies, and an authentic store —
            all in one simple mobile experience.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>What We Offer</Text>
          <Text style={styles.body}>
            • Instant chat & call with astrologers{'\n'}
            • Free Kundli & Daily Horoscope{'\n'}
            • Pooja booking & remedies{'\n'}
            • Gemstones, Rudraksha & spiritual products{'\n'}
            • Secure wallet & order history
          </Text>
        </View>

        <Text style={styles.section}>Developers</Text>
        {DEVELOPERS.map((d) => (
          <View key={d.name} style={styles.devCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{d.name.charAt(0)}</Text>
            </View>
            <View>
              <Text style={styles.devName}>{d.name}</Text>
              <Text style={styles.devRole}>{d.role}</Text>
            </View>
          </View>
        ))}

        <Text style={styles.footer}>AstroTalk v1.0.0 · Made with care in India</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  hero: {
    backgroundColor: COLORS.bannerDark, borderRadius: 16, padding: 24, marginBottom: 14, alignItems: 'center',
  },
  logo: { color: COLORS.primary, fontSize: 28, fontWeight: '900' },
  tagline: { color: 'rgba(255,255,255,0.8)', marginTop: 8, fontSize: 13, fontWeight: '600' },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  title: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  body: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 21 },
  section: {
    fontSize: 13, fontWeight: '800', color: COLORS.textSecondary,
    marginBottom: 10, marginTop: 6, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  devCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10,
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.bannerDark,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: COLORS.primary, fontWeight: '900', fontSize: 18 },
  devName: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  devRole: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  footer: { textAlign: 'center', color: COLORS.textLight, fontSize: 12, marginTop: 20 },
});
