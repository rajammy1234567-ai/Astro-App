import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Screen from '../../components/common/Screen';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { COLORS } from '../../constants/colors';
import { SHADOW_MD } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { ageFromDob, parseDob } from '../../utils/birthDetails';
import { generateKundli } from '../../utils/vedic';

export default function KundliScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState('form');
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [tob, setTob] = useState('');
  const [pob, setPob] = useState('');
  const [gender, setGender] = useState('');
  const [kundli, setKundli] = useState(null);

  useEffect(() => {
    if (!user) return;
    if (user.name) setName(user.name);
    if (user.dateOfBirth) setDob(user.dateOfBirth);
    if (user.timeOfBirth) setTob(user.timeOfBirth);
    if (user.placeOfBirth) setPob(user.placeOfBirth);
    if (user.gender) setGender(user.gender);
  }, [user]);

  // Deep link from free services
  useEffect(() => {
    if (params.auto === '1' && user?.dateOfBirth) {
      // wait for prefill then auto-generate
      const t = setTimeout(() => {
        tryGenerate(true);
      }, 200);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [params.auto, user]);

  const age = ageFromDob(dob);

  const tryGenerate = (silent) => {
    if (!name.trim()) {
      if (!silent) Alert.alert('Name Required', 'Please enter your name.');
      return;
    }
    if (!parseDob(dob)) {
      if (!silent) Alert.alert('DOB Required', 'Enter date of birth in DD/MM/YYYY format.');
      return;
    }
    if (!tob.trim()) {
      if (!silent) Alert.alert('Time Required', 'Enter time of birth (e.g. 10:30 AM) — required for Lagna.');
      return;
    }
    if (!pob.trim()) {
      if (!silent) Alert.alert('Place Required', 'Please enter place of birth.');
      return;
    }

    const report = generateKundli({
      name: name.trim(),
      dateOfBirth: dob.trim(),
      timeOfBirth: tob.trim(),
      placeOfBirth: pob.trim(),
      gender: gender || user?.gender || '',
    });
    setKundli(report);
    setStep('result');
  };

  return (
    <Screen edges={['left', 'right', 'bottom']} style={styles.screen}>
      <Header title="Free Kundli" subtitle="Birth chart from your details" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {step === 'form' ? (
          <>
            <View style={styles.hero}>
              <View style={styles.badge}>
                <Ionicons name="planet" size={14} color={COLORS.primaryDark} />
                <Text style={styles.badgeText}>FREE · ACTUAL BIRTH CHART</Text>
              </View>
              <Text style={styles.heroTitle}>Generate your Kundli</Text>
              <Text style={styles.heroSub}>
                From DOB, time and place we calculate Sun, Moon, Lagna, Nakshatra, planets and Manglik status.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.matchCta}
              onPress={() => router.push('/kundli/match')}
              activeOpacity={0.88}
            >
              <Ionicons name="heart" size={18} color={COLORS.error} />
              <View style={{ flex: 1 }}>
                <Text style={styles.matchTitle}>Kundli Matching</Text>
                <Text style={styles.matchSub}>Boy + Girl gun milan (36 points)</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
            </TouchableOpacity>

            {isAuthenticated && user?.dateOfBirth ? (
              <View style={styles.profileChip}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                <Text style={styles.profileChipText}>
                  Auto-filled from profile: {user.name}
                  {age != null ? ` · ${age} yrs` : ''} · {user.dateOfBirth}
                </Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.profileChip} onPress={() => router.push('/profile/edit')}>
                <Ionicons name="alert-circle-outline" size={20} color={COLORS.warning} />
                <Text style={styles.profileChipText}>
                  Save birth details in your profile for auto-fill next time
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.form}>
              <Input label="Full Name" value={name} onChangeText={setName} placeholder="Enter your name" />
              <Input label="Date of Birth" value={dob} onChangeText={setDob} placeholder="DD/MM/YYYY" />
              {age != null && <Text style={styles.ageLine}>Age: {age} years</Text>}
              <Input label="Time of Birth" value={tob} onChangeText={setTob} placeholder="HH:MM AM/PM" />
              <Input label="Place of Birth" value={pob} onChangeText={setPob} placeholder="City, State" />
              <Button title="Generate Actual Kundli" onPress={() => tryGenerate(false)} />
            </View>
          </>
        ) : kundli ? (
          <>
            <View style={styles.userBanner}>
              <Text style={styles.userBannerName}>{kundli.name}</Text>
              <Text style={styles.userBannerMeta}>
                {kundli.dateOfBirth} · {kundli.timeOfBirth}
              </Text>
              <Text style={styles.userBannerMeta}>{kundli.placeOfBirth}</Text>
            </View>

            <View style={styles.pillRow}>
              <Pill label="Sun" value={`${kundli.sunRashi.name} (${kundli.sunRashi.hindi})`} />
              <Pill label="Moon" value={`${kundli.moonRashi.name} (${kundli.moonRashi.hindi})`} />
              <Pill label="Lagna" value={`${kundli.lagna.name} (${kundli.lagna.hindi})`} />
              <Pill
                label="Nakshatra"
                value={`${kundli.nakshatra.name} · Pada ${kundli.nakshatra.pada}`}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Chart summary</Text>
              <Text style={styles.bodyText}>{kundli.summary}</Text>
            </View>

            <View style={[styles.card, kundli.manglik.isManglik && styles.cardWarn]}>
              <Text style={styles.cardTitle}>Manglik status</Text>
              <Text style={styles.bodyText}>{kundli.manglik.note}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Planetary positions</Text>
              {kundli.chart.map((p) => (
                <View key={p.planet} style={styles.planetRow}>
                  <Text style={styles.planetName}>{p.planet}</Text>
                  <Text style={styles.planetMeta}>H{p.house} · {p.rashi} ({p.rashiHindi})</Text>
                </View>
              ))}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>12 Bhavas (houses)</Text>
              {kundli.houses.map((h) => (
                <View key={h.house} style={styles.houseRow}>
                  <Text style={styles.houseNum}>{h.house}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.houseMean}>{h.meaning}</Text>
                    <Text style={styles.housePlanets}>
                      {h.planets.length ? h.planets.join(', ') : '—'} · {h.rashi}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Lucky tips</Text>
              <Text style={styles.bodyText}>Number: {kundli.lucky.number}</Text>
              <Text style={styles.bodyText}>Color: {kundli.lucky.color}</Text>
              <Text style={styles.bodyText}>Day: {kundli.lucky.day}</Text>
            </View>

            <Button title="Match with partner" onPress={() => router.push('/kundli/match')} />
            <Button
              title="Chat with Astrologer"
              variant="outline"
              onPress={() => router.push('/(tabs)/chat')}
              style={{ marginTop: 10 }}
            />
            <TouchableOpacity style={styles.backLink} onPress={() => setStep('form')}>
              <Text style={styles.backLinkText}>← Edit birth details</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function Pill({ label, value }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={styles.pillValue}>{value}</Text>
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
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: COLORS.surface, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: COLORS.primary, marginBottom: 10,
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: COLORS.primaryDark },
  heroTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  heroSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 6, lineHeight: 18 },
  matchCta: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.surface,
    borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.borderLight,
  },
  matchTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  matchSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  profileChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12,
    padding: 12, borderRadius: 12, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.borderLight,
  },
  profileChipText: { flex: 1, fontSize: 12, fontWeight: '600', color: COLORS.text, lineHeight: 17 },
  form: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  ageLine: { fontSize: 13, fontWeight: '700', color: COLORS.success, marginBottom: 10, marginTop: -4 },
  userBanner: {
    backgroundColor: COLORS.primaryLight, borderRadius: 14, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.primary + '55',
  },
  userBannerName: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  userBannerMeta: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4, fontWeight: '500' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  pill: {
    width: '48%', backgroundColor: COLORS.surface, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  pillLabel: { fontSize: 10, fontWeight: '800', color: COLORS.primaryDark, textTransform: 'uppercase' },
  pillValue: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginTop: 4 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  cardWarn: { borderColor: COLORS.warning, backgroundColor: '#FFF8E8' },
  cardTitle: {
    fontSize: 12, fontWeight: '800', color: COLORS.textLight, letterSpacing: 0.6,
    textTransform: 'uppercase', marginBottom: 8,
  },
  bodyText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20, fontWeight: '500' },
  planetRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  planetName: { fontSize: 13, fontWeight: '800', color: COLORS.text },
  planetMeta: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  houseRow: { flexDirection: 'row', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  houseNum: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primaryLight,
    textAlign: 'center', lineHeight: 28, fontWeight: '800', color: COLORS.text, overflow: 'hidden',
  },
  houseMean: { fontSize: 12, fontWeight: '700', color: COLORS.text },
  housePlanets: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  backLink: { marginTop: 14, alignItems: 'center' },
  backLinkText: { color: COLORS.primaryDark, fontWeight: '700' },
});
