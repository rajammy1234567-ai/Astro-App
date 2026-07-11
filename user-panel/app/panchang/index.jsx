import { useMemo, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Screen from '../../components/common/Screen';
import Header from '../../components/common/Header';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { SHADOW_MD } from '../../constants/theme';
import { panchangForDate } from '../../utils/vedic';

export default function PanchangScreen() {
  const [offset, setOffset] = useState(0);
  const date = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d;
  }, [offset]);
  const p = panchangForDate(date);

  const rows = [
    { icon: 'calendar-outline', label: 'Tithi', value: p.tithi },
    { icon: 'moon-outline', label: 'Paksha', value: p.paksha },
    { icon: 'star-outline', label: 'Nakshatra', value: `${p.nakshatra} (${p.nakshatraLord})` },
    { icon: 'sparkles-outline', label: 'Yoga', value: p.yoga },
    { icon: 'time-outline', label: 'Karana', value: p.karana },
    { icon: 'sunny-outline', label: 'Sunrise', value: p.sunrise },
    { icon: 'partly-sunny-outline', label: 'Sunset', value: p.sunset },
    { icon: 'warning-outline', label: 'Rahu Kaal', value: p.rahuKaal },
    { icon: 'checkmark-circle-outline', label: 'Abhijit Muhurat', value: p.abhijit },
  ];

  return (
    <Screen edges={['left', 'right', 'bottom']} style={styles.screen}>
      <Header title="Panchang" subtitle="Tithi · Nakshatra · Muhurat" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>{p.vaarHindi}</Text>
          <Text style={styles.heroSub}>{p.displayDate}</Text>
          <View style={styles.navRow}>
            <TouchableOpacity style={styles.navBtn} onPress={() => setOffset((o) => o - 1)}>
              <Ionicons name="chevron-back" size={18} color={COLORS.text} />
              <Text style={styles.navText}>Prev</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.todayBtn} onPress={() => setOffset(0)}>
              <Text style={styles.todayText}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navBtn} onPress={() => setOffset((o) => o + 1)}>
              <Text style={styles.navText}>Next</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>

        {rows.map((r) => (
          <View key={r.label} style={styles.row}>
            <View style={styles.iconWrap}>
              <Ionicons name={r.icon} size={18} color={COLORS.primaryDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{r.label}</Text>
              <Text style={styles.value}>{r.value}</Text>
            </View>
          </View>
        ))}

        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.primaryDark} />
          <Text style={styles.noteText}>{p.note}</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.cream },
  scroll: { padding: 16, paddingBottom: 40 },
  hero: {
    backgroundColor: COLORS.primaryLight, borderRadius: 16, padding: 18, marginBottom: 14,
    borderWidth: 1, borderColor: COLORS.primary + '55', ...SHADOW_MD,
  },
  heroTitle: { fontSize: 22, fontWeight: '900', color: COLORS.text },
  heroSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 8 },
  navText: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  todayBtn: {
    backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16,
  },
  todayText: { fontWeight: '800', color: COLORS.text, fontSize: 12 },
  row: {
    flexDirection: 'row', gap: 12, backgroundColor: COLORS.surface, borderRadius: 12,
    padding: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.borderLight,
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  label: { fontSize: 11, fontWeight: '800', color: COLORS.textLight, textTransform: 'uppercase' },
  value: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginTop: 2 },
  note: {
    flexDirection: 'row', gap: 8, marginTop: 10, padding: 12, borderRadius: 12,
    backgroundColor: COLORS.primaryLight, borderWidth: 1, borderColor: COLORS.primary + '44',
  },
  noteText: { flex: 1, fontSize: 12, color: COLORS.textSecondary, lineHeight: 17 },
});
