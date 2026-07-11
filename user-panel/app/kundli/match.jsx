import { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Screen from '../../components/common/Screen';
import Header from '../../components/common/Header';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { COLORS } from '../../constants/colors';
import { SHADOW_MD } from '../../constants/theme';
import { matchKundli as localMatch } from '../../utils/vedic';
import { parseDob } from '../../utils/birthDetails';
import { kundliApi } from '../../services/kundliApi';

export default function KundliMatchScreen() {
  const [boy, setBoy] = useState({
    name: '',
    dateOfBirth: '',
    timeOfBirth: '10:00 AM',
    placeOfBirth: 'New Delhi',
  });
  const [girl, setGirl] = useState({
    name: '',
    dateOfBirth: '',
    timeOfBirth: '10:00 AM',
    placeOfBirth: 'New Delhi',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runMatch = async () => {
    if (!boy.name.trim() || !girl.name.trim()) {
      Alert.alert('Names', 'Please enter names for both partners.');
      return;
    }
    if (!parseDob(boy.dateOfBirth) || !parseDob(girl.dateOfBirth)) {
      Alert.alert('DOB', 'Enter both dates of birth in DD/MM/YYYY format.');
      return;
    }

    setLoading(true);
    try {
      let res;
      try {
        res = await kundliApi.match(boy, girl);
      } catch {
        res = localMatch(boy, girl);
        if (res?.ok === false) {
          Alert.alert('Error', res.message);
          return;
        }
        res.source = 'local';
      }
      setResult(res);
    } catch (err) {
      Alert.alert('Error', err.message || 'Match failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen edges={['left', 'right', 'bottom']} style={styles.screen}>
      <Header title="Kundli Matching" subtitle="Ashtakoot gun milan · Live API" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Match two kundlis</Text>
          <Text style={styles.heroSub}>
            36-point Ashtakoot matching with Manglik / Nadi / Bhakoot checks — powered by live Vedic
            API when available.
          </Text>
        </View>

        <Text style={styles.section}>Boy / Groom</Text>
        <View style={styles.form}>
          <Input
            label="Name"
            value={boy.name}
            onChangeText={(v) => setBoy({ ...boy, name: v })}
            placeholder="Name"
          />
          <Input
            label="Date of Birth"
            value={boy.dateOfBirth}
            onChangeText={(v) => setBoy({ ...boy, dateOfBirth: v })}
            placeholder="DD/MM/YYYY"
          />
          <Input
            label="Time of Birth"
            value={boy.timeOfBirth}
            onChangeText={(v) => setBoy({ ...boy, timeOfBirth: v })}
            placeholder="HH:MM AM/PM"
          />
          <Input
            label="Place of Birth"
            value={boy.placeOfBirth}
            onChangeText={(v) => setBoy({ ...boy, placeOfBirth: v })}
            placeholder="City"
          />
        </View>

        <Text style={styles.section}>Girl / Bride</Text>
        <View style={styles.form}>
          <Input
            label="Name"
            value={girl.name}
            onChangeText={(v) => setGirl({ ...girl, name: v })}
            placeholder="Name"
          />
          <Input
            label="Date of Birth"
            value={girl.dateOfBirth}
            onChangeText={(v) => setGirl({ ...girl, dateOfBirth: v })}
            placeholder="DD/MM/YYYY"
          />
          <Input
            label="Time of Birth"
            value={girl.timeOfBirth}
            onChangeText={(v) => setGirl({ ...girl, timeOfBirth: v })}
            placeholder="HH:MM AM/PM"
          />
          <Input
            label="Place of Birth"
            value={girl.placeOfBirth}
            onChangeText={(v) => setGirl({ ...girl, placeOfBirth: v })}
            placeholder="City"
          />
        </View>

        <Button
          title={loading ? 'Matching…' : 'Match Kundli (36 Gunas)'}
          onPress={runMatch}
          disabled={loading}
        />
        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.loadingText}>Running Ashtakoot + dosha checks…</Text>
          </View>
        )}

        {result && (
          <>
            <View style={[styles.scoreCard, styles[`level_${result.level}`] || null]}>
              <Text style={styles.scoreBig}>
                {result.total}/{result.maxScore || 36}
              </Text>
              <Text style={styles.scorePct}>{result.percent}% match</Text>
              <Text style={styles.verdict}>{result.verdict}</Text>
              <Text style={styles.summary}>{result.summary}</Text>
              {result.source === 'astrologyapi' && (
                <Text style={styles.liveTag}>✓ Live AstrologyAPI</Text>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Partners</Text>
              <Text style={styles.line}>
                {result.boy?.name}: Moon {result.boy?.moon?.name || '—'} ·{' '}
                {result.boy?.nakshatra?.name || '—'}
              </Text>
              <Text style={styles.line}>
                {result.girl?.name}: Moon {result.girl?.moon?.name || '—'} ·{' '}
                {result.girl?.nakshatra?.name || '—'}
              </Text>
              {!!result.manglikNote && (
                <Text style={[styles.line, { marginTop: 8 }]}>{result.manglikNote}</Text>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Ashtakoot breakdown</Text>
              {(result.kootas || []).map((k) => (
                <View key={k.key || k.label} style={styles.kootRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.kootLabel}>{k.label}</Text>
                    {(k.male || k.female) && (
                      <Text style={styles.kootSub}>
                        {k.male || '—'} / {k.female || '—'}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.kootScore}>
                    {k.score}/{k.max}
                  </Text>
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
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.primary + '55',
    ...SHADOW_MD,
  },
  heroTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  heroSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 6, lineHeight: 18 },
  section: { fontSize: 14, fontWeight: '800', color: COLORS.text, marginBottom: 8, marginTop: 6 },
  form: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  loadingText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  scoreCard: {
    marginTop: 16,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  level_excellent: { borderColor: COLORS.success, backgroundColor: COLORS.successLight },
  level_good: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  level_average: { borderColor: COLORS.warning, backgroundColor: '#FFF8E8' },
  level_low: { borderColor: COLORS.error, backgroundColor: COLORS.errorLight },
  scoreBig: { fontSize: 36, fontWeight: '900', color: COLORS.text },
  scorePct: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary, marginTop: 4 },
  verdict: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginTop: 8 },
  summary: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  liveTag: { marginTop: 10, fontSize: 11, fontWeight: '800', color: COLORS.success },
  card: {
    marginTop: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textLight,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  line: { fontSize: 13, color: COLORS.text, fontWeight: '600', marginTop: 4, lineHeight: 19 },
  kootRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    gap: 8,
  },
  kootLabel: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  kootSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  kootScore: { fontSize: 13, fontWeight: '800', color: COLORS.primaryDark },
});
