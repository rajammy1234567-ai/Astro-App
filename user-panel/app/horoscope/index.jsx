import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Screen from '../../components/common/Screen';
import Header from '../../components/common/Header';
import { COLORS } from '../../constants/colors';
import { SHADOW_MD } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { RASHI_LIST, dailyHoroscope, sunRashiFromDob } from '../../utils/vedic';
import { Ionicons } from '@expo/vector-icons';

export default function HoroscopeScreen() {
  const { user } = useAuth();
  const auto = useMemo(() => sunRashiFromDob(user?.dateOfBirth)?.name || 'Aries', [user?.dateOfBirth]);
  const [rashi, setRashi] = useState(auto);

  useEffect(() => {
    if (auto) setRashi(auto);
  }, [auto]);

  const today = new Date();
  const report = dailyHoroscope(rashi, today);
  const rashiMeta = RASHI_LIST.find((r) => r.name === rashi);

  return (
    <Screen edges={['left', 'right', 'bottom']} style={styles.screen}>
      <Header title="Daily Horoscope" subtitle="Based on your rashi" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>{report.rashi} · {report.hindi}</Text>
          <Text style={styles.heroSub}>
            {today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
          <View style={styles.scoreRow}>
            <Text style={styles.score}>{report.score}%</Text>
            <Text style={styles.mood}>{report.mood} day</Text>
          </View>
          {user?.dateOfBirth ? (
            <Text style={styles.fromProfile}>Rashi from your DOB ({user.dateOfBirth})</Text>
          ) : (
            <Text style={styles.fromProfile}>Select rashi below — auto-set from profile DOB when available</Text>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rashiScroll}>
          {RASHI_LIST.map((r) => {
            const active = r.name === rashi;
            return (
              <TouchableOpacity
                key={r.name}
                style={[styles.rashiChip, active && styles.rashiActive]}
                onPress={() => setRashi(r.name)}
              >
                <Text style={[styles.rashiName, active && styles.rashiNameActive]}>{r.name}</Text>
                <Text style={styles.rashiHi}>{r.hindi}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Card icon="briefcase-outline" title="Career" text={report.career} />
        <Card icon="heart-outline" title="Love" text={report.love} />
        <Card icon="cash-outline" title="Money" text={report.money} />
        <Card icon="fitness-outline" title="Health" text={report.health} />

        <View style={styles.luckyCard}>
          <Text style={styles.cardTitle}>Lucky today</Text>
          <Text style={styles.luckyLine}>Number: {report.luckyNumber}</Text>
          <Text style={styles.luckyLine}>Color: {report.luckyColor}</Text>
          <Text style={styles.luckyLine}>Lord: {rashiMeta?.lord}</Text>
          <Text style={styles.tip}>{report.tip}</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

function Card({ icon, title, text }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Ionicons name={icon} size={16} color={COLORS.primaryDark} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <Text style={styles.cardText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.cream },
  scroll: { padding: 16, paddingBottom: 40 },
  hero: {
    backgroundColor: COLORS.primaryLight, borderRadius: 16, padding: 18, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.primary + '55', ...SHADOW_MD,
  },
  heroTitle: { fontSize: 22, fontWeight: '900', color: COLORS.text },
  heroSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 12 },
  score: { fontSize: 32, fontWeight: '900', color: COLORS.primaryDark },
  mood: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  fromProfile: { fontSize: 11, color: COLORS.textSecondary, marginTop: 10, fontWeight: '500' },
  rashiScroll: { gap: 8, paddingBottom: 12 },
  rashiChip: {
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.borderLight, minWidth: 84, alignItems: 'center',
  },
  rashiActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  rashiName: { fontSize: 12, fontWeight: '800', color: COLORS.text },
  rashiNameActive: { color: COLORS.text },
  rashiHi: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  cardTitle: { fontSize: 13, fontWeight: '800', color: COLORS.text, textTransform: 'uppercase', letterSpacing: 0.4 },
  cardText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  luckyCard: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, marginTop: 4,
    borderWidth: 1, borderColor: COLORS.primary + '55',
  },
  luckyLine: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginTop: 4 },
  tip: { fontSize: 12, color: COLORS.textSecondary, marginTop: 10, lineHeight: 18 },
});
