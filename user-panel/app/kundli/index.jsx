import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Screen from '../../components/common/Screen';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { RASHIS } from '../../constants/rashis';
import { HOROSCOPE } from '../../constants/horoscope';
import { COLORS } from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';
import { ageFromDob } from '../../utils/birthDetails';
import { rashiFromDob } from '../../utils/zodiac';

export default function KundliScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState('form');
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [tob, setTob] = useState('');
  const [pob, setPob] = useState('');
  const [selectedRashi, setSelectedRashi] = useState(null);
  const [showFull, setShowFull] = useState(false);

  // Prefill from signup/profile birth details
  useEffect(() => {
    if (!user) return;
    if (user.name) setName(user.name);
    if (user.dateOfBirth) setDob(user.dateOfBirth);
    if (user.timeOfBirth) setTob(user.timeOfBirth);
    if (user.placeOfBirth) setPob(user.placeOfBirth);
    const auto = rashiFromDob(user.dateOfBirth);
    if (auto) setSelectedRashi(auto);
  }, [user]);

  const age = ageFromDob(dob);

  const handleGenerate = () => {
    if (!name.trim()) {
      Alert.alert('Name Required', 'Apna naam enter karo (ya profile me fill karo).');
      return;
    }
    if (!dob.trim()) {
      Alert.alert('DOB Required', 'Date of Birth chahiye (DD/MM/YYYY).');
      return;
    }
    const auto = rashiFromDob(dob);
    if (auto) setSelectedRashi(auto);
    setStep('rashi');
    setShowFull(false);
  };

  const horoscope = selectedRashi ? HOROSCOPE[selectedRashi] : null;

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <Header title="Free Kundli & Daily Horoscope" />

      <ScrollView contentContainerStyle={styles.scroll}>
        {step === 'form' ? (
          <>
            <View style={styles.hero}>
              <Ionicons name="planet" size={32} color={COLORS.primary} />
              <Text style={styles.heroTitle}>Free Kundli</Text>
              <Text style={styles.heroSub}>
                Profile me jo birth details fill kiye the, wahi yahan aate hain
              </Text>
            </View>

            {isAuthenticated && user?.name ? (
              <View style={styles.profileChip}>
                <Ionicons name="person-circle" size={20} color={COLORS.primary} />
                <Text style={styles.profileChipText}>
                  {user.name}
                  {age != null ? ` · Age ${age}` : ''}
                  {user.dateOfBirth ? ` · ${user.dateOfBirth}` : ''}
                </Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.profileChip} onPress={() => router.push('/profile/edit')}>
                <Ionicons name="alert-circle-outline" size={20} color={COLORS.warning} />
                <Text style={styles.profileChipText}>
                  Profile me birth details add karo — auto fill hoga
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.form}>
              <Input label="Full Name" value={name} onChangeText={setName} placeholder="Enter your name" />
              <Input label="Date of Birth" value={dob} onChangeText={setDob} placeholder="DD/MM/YYYY" />
              {age != null && (
                <Text style={styles.ageLine}>Calculated Age: {age} years</Text>
              )}
              <Input label="Time of Birth" value={tob} onChangeText={setTob} placeholder="HH:MM AM/PM" />
              <Input label="Place of Birth" value={pob} onChangeText={setPob} placeholder="City, State" />
              <Button title="Generate Kundli / Horoscope" onPress={handleGenerate} />
            </View>
          </>
        ) : (
          <>
            <View style={styles.userBanner}>
              <Text style={styles.userBannerName}>{name || 'You'}</Text>
              <Text style={styles.userBannerMeta}>
                {dob || '—'}
                {age != null ? ` · Age ${age}` : ''}
                {tob ? ` · ${tob}` : ''}
              </Text>
              {pob ? <Text style={styles.userBannerMeta}>{pob}</Text> : null}
            </View>

            <Text style={styles.sectionTitle}>Your Rashi (auto from DOB)</Text>
            <View style={styles.rashiGrid}>
              {RASHIS.map((rashi) => (
                <TouchableOpacity
                  key={rashi.name}
                  style={[styles.rashiCard, selectedRashi === rashi.name && styles.rashiActive]}
                  onPress={() => { setSelectedRashi(rashi.name); setShowFull(false); }}
                >
                  <Ionicons
                    name={rashi.icon}
                    size={24}
                    color={selectedRashi === rashi.name ? COLORS.primary : COLORS.textSecondary}
                  />
                  <Text style={styles.rashiName}>{rashi.name}</Text>
                  <Text style={styles.rashiHindi}>{rashi.hindi}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {selectedRashi && horoscope && (
              <View style={styles.result}>
                <Text style={styles.resultTitle}>
                  {showFull ? 'Full Kundli' : "Today's Horoscope"} — {selectedRashi}
                </Text>
                <Text style={styles.resultName}>
                  For: {name}{age != null ? ` (${age} yrs)` : ''}
                </Text>
                <Text style={styles.resultText}>
                  {showFull ? horoscope.full : horoscope.today}
                </Text>
                <Button
                  title={showFull ? 'Chat with Astrologer' : 'View Full Kundli'}
                  onPress={() => {
                    if (showFull) router.push('/(tabs)/chat');
                    else setShowFull(true);
                  }}
                  style={{ marginTop: 12 }}
                />
                {!showFull && (
                  <TouchableOpacity style={styles.backLink} onPress={() => setStep('form')}>
                    <Text style={styles.backLinkText}>← Edit birth details</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 32 },
  hero: {
    backgroundColor: COLORS.bannerDark,
    borderRadius: 16,
    padding: 22,
    marginBottom: 14,
    alignItems: 'center',
  },
  heroTitle: { color: '#FFF', fontSize: 20, fontWeight: '800', marginTop: 10 },
  heroSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 6, textAlign: 'center', lineHeight: 18 },
  profileChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12,
    padding: 12, borderRadius: 12, backgroundColor: COLORS.primaryLight, borderWidth: 1, borderColor: COLORS.primary,
  },
  profileChipText: { flex: 1, fontSize: 12, fontWeight: '600', color: COLORS.text, lineHeight: 17 },
  form: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  ageLine: { fontSize: 13, fontWeight: '700', color: COLORS.success, marginBottom: 10, marginTop: -4 },
  userBanner: {
    backgroundColor: COLORS.bannerDark, borderRadius: 14, padding: 16, marginBottom: 14,
  },
  userBannerName: { color: COLORS.primary, fontSize: 18, fontWeight: '800' },
  userBannerMeta: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  rashiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  rashiCard: {
    width: '30%', backgroundColor: COLORS.surface, borderRadius: 12,
    padding: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  rashiActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  rashiName: { fontSize: 11, fontWeight: '700', color: COLORS.text, marginTop: 6 },
  rashiHindi: { fontSize: 10, color: COLORS.textSecondary },
  result: {
    marginTop: 16, backgroundColor: COLORS.surface, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  resultTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  resultName: { fontSize: 13, fontWeight: '600', color: COLORS.primaryDark, marginTop: 6 },
  resultText: { fontSize: 14, color: COLORS.textSecondary, marginTop: 10, lineHeight: 22 },
  backLink: { marginTop: 14, alignItems: 'center' },
  backLinkText: { color: COLORS.link, fontWeight: '600' },
});
