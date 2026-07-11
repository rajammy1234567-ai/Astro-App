import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Alert } from 'react-native';
import Screen from '../../components/common/Screen';
import Header from '../../components/common/Header';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { COLORS } from '../../constants/colors';
import { SHADOW_MD } from '../../constants/theme';
import { matchKundli } from '../../utils/vedic';
import { parseDob } from '../../utils/birthDetails';

export default function KundliMatchScreen() {
  const [boy, setBoy] = useState({ name: '', dateOfBirth: '', timeOfBirth: '10:00 AM' });
  const [girl, setGirl] = useState({ name: '', dateOfBirth: '', timeOfBirth: '10:00 AM' });
  const [result, setResult] = useState(null);

  const runMatch = () => {
    if (!boy.name.trim() || !girl.name.trim()) {
      Alert.alert('Names', 'Please enter names for both partners.');
      return;
    }
    if (!parseDob(boy.dateOfBirth) || !parseDob(girl.dateOfBirth)) {
      Alert.alert('DOB', 'Enter both dates of birth in DD/MM/YYYY format.');
      return;
    }
    const res = matchKundli(boy, girl);
    if (!res.ok) {
      Alert.alert('Error', res.message);
      return;
    }
    setResult(res);
  };

  return (
    <Screen edges={['left', 'right', 'bottom']} style={styles.screen}>
      <Header title="Kundli Matching" subtitle="Ashtakoot gun milan" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Match two kundlis</Text>
          <Text style={styles.heroSub}>
            Moon rashi + nakshatra based 36-point Ashtakoot matching — free & instant.
          </Text>
        </View>

        <Text style={styles.section}>Boy / Groom</Text>
        <View style={styles.form}>
          <Input label="Name" value={boy.name} onChangeText={(v) => setBoy({ ...boy, name: v })} placeholder="Name" />
          <Input label="Date of Birth" value={boy.dateOfBirth} onChangeText={(v) => setBoy({ ...boy, dateOfBirth: v })} placeholder="DD/MM/YYYY" />
          <Input label="Time of Birth" value={boy.timeOfBirth} onChangeText={(v) => setBoy({ ...boy, timeOfBirth: v })} placeholder="HH:MM AM/PM" />
        </View>

        <Text style={styles.section}>Girl / Bride</Text>
        <View style={styles.form}>
          <Input label="Name" value={girl.name} onChangeText={(v) => setGirl({ ...girl, name: v })} placeholder="Name" />
          <Input label="Date of Birth" value={girl.dateOfBirth} onChangeText={(v) => setGirl({ ...girl, dateOfBirth: v })} placeholder="DD/MM/YYYY" />
          <Input label="Time of Birth" value={girl.timeOfBirth} onChangeText={(v) => setGirl({ ...girl, timeOfBirth: v })} placeholder="HH:MM AM/PM" />
        </View>

        <Button title="Match Kundli (36 Gunas)" onPress={runMatch} />

        {result && (
          <>
            <View style={[styles.scoreCard, styles[`level_${result.level}`] || null]}>
              <Text style={styles.scoreBig}>{result.total}/36</Text>
              <Text style={styles.scorePct}>{result.percent}% match</Text>
              <Text style={styles.verdict}>{result.verdict}</Text>
              <Text style={styles.summary}>{result.summary}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Partners</Text>
              <Text style={styles.line}>
                {result.boy.name}: Moon {result.boy.moon.name} · {result.boy.nakshatra.name}
              </Text>
              <Text style={styles.line}>
                {result.girl.name}: Moon {result.girl.moon.name} · {result.girl.nakshatra.name}
              </Text>
              <Text style={[styles.line, { marginTop: 8 }]}>{result.manglikNote}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Ashtakoot breakdown</Text>
              {result.kootas.map((k) => (
                <View key={k.key} style={styles.kootRow}>
                  <Text style={styles.kootLabel}>{k.label}</Text>
                  <Text style={styles.kootScore}>{k.score}/{k.max}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.cream },
  scroll: { padding: 16, paddingBottom: 40 },
  hero: {
    backgroundColor: COLORS.primaryLight, borderRadius: 16, padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: COLORS.primary + '55', ...SHADOW_MD,
  },
  heroTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  heroSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 6, lineHeight: 18 },
  section: { fontSize: 14, fontWeight: '800', color: COLORS.text, marginBottom: 8, marginTop: 6 },
  form: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  scoreCard: {
    marginTop: 16, borderRadius: 16, padding: 18, alignItems: 'center',
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.borderLight,
  },
  level_excellent: { borderColor: COLORS.success, backgroundColor: COLORS.successLight },
  level_good: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  level_average: { borderColor: COLORS.warning, backgroundColor: '#FFF8E8' },
  level_low: { borderColor: COLORS.error, backgroundColor: COLORS.errorLight },
  scoreBig: { fontSize: 36, fontWeight: '900', color: COLORS.text },
  scorePct: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary, marginTop: 4 },
  verdict: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginTop: 8 },
  summary: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 18 },
  card: {
    marginTop: 12, backgroundColor: COLORS.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  cardTitle: {
    fontSize: 11, fontWeight: '800', color: COLORS.textLight, letterSpacing: 0.6,
    textTransform: 'uppercase', marginBottom: 8,
  },
  line: { fontSize: 13, color: COLORS.text, fontWeight: '600', marginTop: 4, lineHeight: 19 },
  kootRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  kootLabel: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  kootScore: { fontSize: 13, fontWeight: '800', color: COLORS.primaryDark },
});
