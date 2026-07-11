import { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Alert } from 'react-native';
import Screen from '../../components/common/Screen';
import Header from '../../components/common/Header';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { COLORS } from '../../constants/colors';
import { SHADOW_MD } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { numerologyReport } from '../../utils/vedic';
import { parseDob } from '../../utils/birthDetails';

export default function NumerologyScreen() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [report, setReport] = useState(null);

  useEffect(() => {
    if (!user) return;
    if (user.name) setName(user.name);
    if (user.dateOfBirth) setDob(user.dateOfBirth);
  }, [user]);

  const calculate = () => {
    if (!name.trim()) {
      Alert.alert('Name', 'Enter your full name (as on official documents).');
      return;
    }
    if (!parseDob(dob)) {
      Alert.alert('DOB', 'Enter date of birth in DD/MM/YYYY format.');
      return;
    }
    const res = numerologyReport({ name: name.trim(), dateOfBirth: dob.trim() });
    if (!res) {
      Alert.alert('Error', 'Could not calculate.');
      return;
    }
    setReport(res);
  };

  return (
    <Screen edges={['left', 'right', 'bottom']} style={styles.screen}>
      <Header title="Numerology" subtitle="Life path · Name numbers" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Name & birth numbers</Text>
          <Text style={styles.heroSub}>
            Life Path, Destiny, Soul Urge and Personality numbers are calculated from DOB and name.
          </Text>
        </View>

        <View style={styles.form}>
          <Input label="Full Name" value={name} onChangeText={setName} placeholder="Your full name" />
          <Input label="Date of Birth" value={dob} onChangeText={setDob} placeholder="DD/MM/YYYY" />
          <Button title="Calculate Numerology" onPress={calculate} />
        </View>

        {report && (
          <>
            <View style={styles.bigCard}>
              <Text style={styles.bigLabel}>Life Path</Text>
              <Text style={styles.bigNum}>{report.lifePath}</Text>
              <Text style={styles.bigMean}>{report.lifePathMeaning}</Text>
            </View>

            <NumRow label="Destiny (Expression)" value={report.destiny} mean={report.destinyMeaning} />
            <NumRow label="Soul Urge" value={report.soulUrge} mean="Inner desires & motivation" />
            <NumRow label="Personality" value={report.personality} mean="How others see you" />
            <NumRow label="Birthday number" value={report.birthday} mean="Natural talent day" />

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Lucky for you</Text>
              <Text style={styles.line}>Numbers: {report.luckyNumbers.join(', ')}</Text>
              <Text style={styles.line}>Color: {report.luckyColor}</Text>
              <Text style={styles.tip}>{report.tip}</Text>
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function NumRow({ label, value, mean }) {
  return (
    <View style={styles.card}>
      <View style={styles.rowTop}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
      <Text style={styles.rowMean}>{mean}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.cream },
  scroll: { padding: 16, paddingBottom: 40 },
  hero: {
    backgroundColor: COLORS.primaryLight, borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.primary + '55', ...SHADOW_MD,
  },
  heroTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  heroSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 6, lineHeight: 18 },
  form: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  bigCard: {
    alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 16, padding: 20,
    marginBottom: 12, borderWidth: 1, borderColor: COLORS.primary + '55',
  },
  bigLabel: { fontSize: 12, fontWeight: '800', color: COLORS.primaryDark, letterSpacing: 1 },
  bigNum: { fontSize: 48, fontWeight: '900', color: COLORS.text, marginVertical: 6 },
  bigMean: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 19 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  cardTitle: { fontSize: 12, fontWeight: '800', color: COLORS.textLight, marginBottom: 6, textTransform: 'uppercase' },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  rowValue: { fontSize: 22, fontWeight: '900', color: COLORS.primaryDark },
  rowMean: { fontSize: 12, color: COLORS.textSecondary, marginTop: 6, lineHeight: 17 },
  line: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginTop: 4 },
  tip: { fontSize: 12, color: COLORS.textSecondary, marginTop: 10, lineHeight: 18 },
});
