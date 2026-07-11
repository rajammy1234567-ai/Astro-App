import { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Screen from '../../components/common/Screen';
import Header from '../../components/common/Header';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { SHADOW_MD } from '../../constants/theme';
import { panchangForDate } from '../../utils/vedic';
import { kundliApi } from '../../services/kundliApi';

export default function PanchangScreen() {
  const [offset, setOffset] = useState(0);
  const [live, setLive] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const date = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d;
  }, [offset]);

  const local = useMemo(() => panchangForDate(date), [date]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await kundliApi.panchang({
          date: date.toISOString(),
          placeOfBirth: 'New Delhi',
          hour: 12,
          min: 0,
        });
        if (!cancelled) setLive(data);
      } catch (err) {
        if (!cancelled) {
          setLive(null);
          setError(err.message || 'Live panchang unavailable');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [date]);

  const p = live || local;

  const rows = [
    { icon: 'calendar-outline', label: 'Tithi', value: p.tithi },
    { icon: 'moon-outline', label: 'Paksha', value: p.paksha || '—' },
    {
      icon: 'star-outline',
      label: 'Nakshatra',
      value: p.nakshatraLord ? `${p.nakshatra} (${p.nakshatraLord})` : p.nakshatra,
    },
    { icon: 'sparkles-outline', label: 'Yoga', value: p.yoga },
    { icon: 'time-outline', label: 'Karana', value: p.karana },
    { icon: 'sunny-outline', label: 'Sunrise', value: p.sunrise },
    { icon: 'partly-sunny-outline', label: 'Sunset', value: p.sunset },
    { icon: 'warning-outline', label: 'Rahu Kaal', value: p.rahuKaal || '—' },
    { icon: 'checkmark-circle-outline', label: 'Abhijit Muhurat', value: p.abhijit || '—' },
  ];

  if (p.moonrise) rows.push({ icon: 'moon', label: 'Moonrise', value: p.moonrise });
  if (p.gulika) rows.push({ icon: 'alert-circle-outline', label: 'Gulika', value: p.gulika });

  return (
    <Screen edges={['left', 'right', 'bottom']} style={styles.screen}>
      <Header title="Panchang" subtitle="Tithi · Nakshatra · Muhurat" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>{p.vaarHindi || p.vaar || local.vaarHindi}</Text>
          <Text style={styles.heroSub}>{p.displayDate || local.displayDate}</Text>
          {live?.source === 'astrologyapi' && (
            <Text style={styles.liveTag}>✓ Live AstrologyAPI · {live.place || 'New Delhi'}</Text>
          )}
          {loading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={COLORS.primaryDark} />
              <Text style={styles.loadingText}>Updating live panchang…</Text>
            </View>
          )}
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
              <Text style={styles.value}>{r.value || '—'}</Text>
            </View>
          </View>
        ))}

        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.primaryDark} />
          <Text style={styles.noteText}>
            {error
              ? `${error} — showing local estimate.`
              : p.note || local.note}
          </Text>
        </View>
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
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.primary + '55',
    ...SHADOW_MD,
  },
  heroTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  heroSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, fontWeight: '600' },
  liveTag: { marginTop: 8, fontSize: 11, fontWeight: '800', color: COLORS.success },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  loadingText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  navText: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  todayBtn: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  todayText: { fontSize: 12, fontWeight: '800', color: COLORS.primaryDark },
  row: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 11, fontWeight: '800', color: COLORS.textLight, textTransform: 'uppercase' },
  value: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginTop: 2 },
  note: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight + '88',
  },
  noteText: { flex: 1, fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
});
