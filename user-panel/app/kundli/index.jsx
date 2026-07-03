import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { RASHIS } from '../../constants/rashis';
import { HOROSCOPE } from '../../constants/horoscope';
import { COLORS } from '../../constants/colors';

export default function KundliScreen() {
  const router = useRouter();
  const [step, setStep] = useState('form');
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [tob, setTob] = useState('');
  const [pob, setPob] = useState('');
  const [selectedRashi, setSelectedRashi] = useState(null);
  const [showFull, setShowFull] = useState(false);

  const handleGenerate = () => {
    if (!name.trim()) {
      Alert.alert('Name Required', 'Apna naam enter karo.');
      return;
    }
    setStep('rashi');
    setShowFull(false);
  };

  const horoscope = selectedRashi ? HOROSCOPE[selectedRashi] : null;

  return (
    <View style={styles.container}>
      <Header title="Free Kundli" />

      <ScrollView contentContainerStyle={styles.scroll}>
        {step === 'form' ? (
          <>
            <View style={styles.hero}>
              <Ionicons name="document-text" size={28} color="#FFF" />
              <Text style={styles.heroTitle}>Generate Free Kundli</Text>
              <Text style={styles.heroSub}>Get your complete birth chart instantly</Text>
            </View>

            <View style={styles.form}>
              <Input label="Full Name" value={name} onChangeText={setName} placeholder="Enter your name" />
              <Input label="Date of Birth" value={dob} onChangeText={setDob} placeholder="DD/MM/YYYY" />
              <Input label="Time of Birth" value={tob} onChangeText={setTob} placeholder="HH:MM AM/PM" />
              <Input label="Place of Birth" value={pob} onChangeText={setPob} placeholder="City, State" />
              <Button title="Generate Kundli" onPress={handleGenerate} />
            </View>
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Select Your Rashi</Text>
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
                {name ? <Text style={styles.resultName}>For: {name}</Text> : null}
                <Text style={styles.resultText}>
                  {showFull ? horoscope.full : horoscope.today}
                </Text>
                <Button
                  title={showFull ? 'Chat with Astrologer' : 'View Full Kundli'}
                  onPress={() => {
                    if (showFull) {
                      router.push('/(tabs)/chat');
                    } else {
                      setShowFull(true);
                    }
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  scroll: { padding: 16, paddingBottom: 32 },
  hero: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 20, marginBottom: 20, alignItems: 'center' },
  heroTitle: { color: '#FFF', fontSize: 18, fontWeight: '800', marginTop: 8 },
  heroSub: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 4 },
  form: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.borderLight },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  rashiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  rashiCard: {
    width: '30%', backgroundColor: COLORS.surface, borderRadius: 10,
    padding: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  rashiActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  rashiName: { fontSize: 11, fontWeight: '700', color: COLORS.text, marginTop: 6 },
  rashiHindi: { fontSize: 10, color: COLORS.textSecondary },
  result: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginTop: 20, borderWidth: 1, borderColor: COLORS.borderLight },
  resultTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  resultName: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  resultText: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8, lineHeight: 22 },
  backLink: { marginTop: 12, alignItems: 'center' },
  backLinkText: { color: COLORS.link, fontSize: 13, fontWeight: '600' },
});