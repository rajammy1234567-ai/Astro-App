import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { RASHIS } from '../../constants/rashis';
import { COLORS } from '../../constants/colors';

export default function KundliScreen() {
  const [step, setStep] = useState('form');
  const [name, setName] = useState('');
  const [selectedRashi, setSelectedRashi] = useState(null);

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
              <Input label="Date of Birth" placeholder="DD/MM/YYYY" />
              <Input label="Time of Birth" placeholder="HH:MM AM/PM" />
              <Input label="Place of Birth" placeholder="City, State" />
              <Button title="Generate Kundli" onPress={() => setStep('rashi')} />
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
                  onPress={() => setSelectedRashi(rashi.name)}
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
            {selectedRashi && (
              <View style={styles.result}>
                <Text style={styles.resultTitle}>Today's Horoscope - {selectedRashi}</Text>
                <Text style={styles.resultText}>
                  Today brings positive energy for career and finances. Avoid conflicts in the
                  evening. Lucky color: Orange. Lucky number: 7.
                </Text>
                <Button title="View Full Kundli" onPress={() => {}} style={{ marginTop: 12 }} />
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
  resultText: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8, lineHeight: 22 },
});