import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Screen from '../../components/common/Screen';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import BirthDatePicker from '../../components/common/BirthDatePicker';
import BirthTimePicker from '../../components/common/BirthTimePicker';
import PlacePicker from '../../components/common/PlacePicker';
import { COLORS } from '../../constants/colors';
import { SHADOW_MD } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { ageFromDob, parseDob } from '../../utils/birthDetails';
import { generateKundli as localGenerateKundli } from '../../utils/vedic';
import { kundliApi } from '../../services/kundliApi';

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
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('overview'); // overview | dasha | dosha | reading
  const [liveApi, setLiveApi] = useState(true);

  useEffect(() => {
    if (!user) return;
    if (user.name) setName(user.name);
    if (user.dateOfBirth) setDob(user.dateOfBirth);
    if (user.timeOfBirth) setTob(user.timeOfBirth);
    if (user.placeOfBirth) setPob(user.placeOfBirth);
    if (user.gender) setGender(user.gender);
  }, [user]);

  useEffect(() => {
    kundliApi
      .status()
      .then((s) => setLiveApi(Boolean(s?.configured)))
      .catch(() => setLiveApi(false));
  }, []);

  useEffect(() => {
    if (params.auto === '1' && user?.dateOfBirth) {
      const t = setTimeout(() => {
        tryGenerate(true);
      }, 250);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [params.auto, user]);

  const age = ageFromDob(dob);

  const tryGenerate = async (silent) => {
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

    setLoading(true);
    const payload = {
      name: name.trim(),
      dateOfBirth: dob.trim(),
      timeOfBirth: tob.trim(),
      placeOfBirth: pob.trim(),
      gender: gender || user?.gender || '',
    };

    try {
      let report;
      try {
        report = await kundliApi.generate(payload);
      } catch (apiErr) {
        // Offline / quota fallback to local calculator
        report = localGenerateKundli(payload);
        report.source = report.source || 'local';
        report.summary =
          (report.summary || '') +
          (apiErr?.message
            ? `\n\n(Note: Live API unavailable — ${apiErr.message}. Showing algorithmic kundli.)`
            : '\n\n(Note: Live API unavailable. Showing algorithmic kundli.)');
      }
      setKundli(report);
      setStep('result');
      setTab('overview');
    } catch (err) {
      if (!silent) Alert.alert('Error', err.message || 'Could not generate kundli');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen edges={['left', 'right', 'bottom']} style={styles.screen}>
      <Header title="Free Kundli" subtitle="Janam Kundli · Live Vedic API" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {step === 'form' ? (
          <>
            <View style={styles.hero}>
              <View style={styles.badge}>
                <Ionicons name="planet" size={14} color={COLORS.primaryDark} />
                <Text style={styles.badgeText}>
                  {liveApi ? 'LIVE API · JANAM KUNDLI' : 'FREE · BIRTH CHART'}
                </Text>
              </View>
              <Text style={styles.heroTitle}>Generate your Kundli</Text>
              <Text style={styles.heroSub}>
                Lagna, Moon Rashi, Nakshatra, planets, Vimshottari Dasha, Manglik / Kaal Sarp /
                Sade Sati, and AI-style reading from birth details.
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
              <BirthDatePicker value={dob} onChange={setDob} />
              {age != null ? <Text style={styles.ageLine}>Age: {age} years (auto)</Text> : null}
              <BirthTimePicker value={tob} onChange={setTob} />
              <PlacePicker value={pob} onChange={setPob} />
              <Button
                title={loading ? 'Generating…' : 'Generate Actual Kundli'}
                onPress={() => tryGenerate(false)}
                disabled={loading}
              />
              {loading && (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={COLORS.primary} />
                  <Text style={styles.loadingText}>Calculating planets, dasha & doshas…</Text>
                </View>
              )}
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
              {kundli.source === 'astrologyapi' && (
                <View style={styles.livePill}>
                  <Text style={styles.livePillText}>✓ Live AstrologyAPI</Text>
                </View>
              )}
            </View>

            <View style={styles.pillRow}>
              <Pill
                label="Sun"
                value={`${kundli.sunRashi?.name || '—'}${kundli.sunRashi?.hindi ? ` (${kundli.sunRashi.hindi})` : ''}`}
              />
              <Pill
                label="Moon"
                value={`${kundli.moonRashi?.name || '—'}${kundli.moonRashi?.hindi ? ` (${kundli.moonRashi.hindi})` : ''}`}
              />
              <Pill
                label="Lagna"
                value={`${kundli.lagna?.name || '—'}${kundli.lagna?.hindi ? ` (${kundli.lagna.hindi})` : ''}`}
              />
              <Pill
                label="Nakshatra"
                value={`${kundli.nakshatra?.name || '—'}${kundli.nakshatra?.pada ? ` · Pada ${kundli.nakshatra.pada}` : ''}`}
              />
            </View>

            <View style={styles.tabRow}>
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'dasha', label: 'Dasha' },
                { id: 'dosha', label: 'Dosha' },
                { id: 'reading', label: 'AI Reading' },
              ].map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.tabBtn, tab === t.id && styles.tabBtnActive]}
                  onPress={() => setTab(t.id)}
                >
                  <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {tab === 'overview' && (
              <>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Chart summary</Text>
                  <Text style={styles.bodyText}>{kundli.summary}</Text>
                </View>

                <View style={[styles.card, kundli.manglik?.isManglik && styles.cardWarn]}>
                  <Text style={styles.cardTitle}>Manglik status</Text>
                  <Text style={styles.bodyText}>{kundli.manglik?.note}</Text>
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Planetary positions</Text>
                  {(kundli.chart || []).map((p) => (
                    <View key={p.planet} style={styles.planetRow}>
                      <Text style={styles.planetName}>
                        {p.planet}
                        {p.isRetro ? ' (R)' : ''}
                      </Text>
                      <Text style={styles.planetMeta}>
                        H{p.house} · {p.rashi}
                        {p.rashiHindi ? ` (${p.rashiHindi})` : ''}
                        {p.nakshatra ? ` · ${p.nakshatra}` : ''}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>12 Bhavas (houses)</Text>
                  {(kundli.houses || []).map((h) => (
                    <View key={h.house} style={styles.houseRow}>
                      <Text style={styles.houseNum}>{h.house}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.houseMean}>{h.meaning}</Text>
                        <Text style={styles.housePlanets}>
                          {(h.planets || []).length ? h.planets.join(', ') : '—'} · {h.rashi}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                {kundli.lucky && (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Lucky tips</Text>
                    <Text style={styles.bodyText}>Number: {kundli.lucky.number}</Text>
                    <Text style={styles.bodyText}>Color: {kundli.lucky.color}</Text>
                    <Text style={styles.bodyText}>Day: {kundli.lucky.day}</Text>
                  </View>
                )}
              </>
            )}

            {tab === 'dasha' && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Vimshottari Dasha</Text>
                {kundli.dasha?.current?.maha ? (
                  <>
                    <Text style={styles.dashaLine}>
                      Maha: {kundli.dasha.current.maha.planet} ({kundli.dasha.current.maha.start} →{' '}
                      {kundli.dasha.current.maha.end})
                    </Text>
                    {kundli.dasha.current.antar && (
                      <Text style={styles.dashaLine}>
                        Antar: {kundli.dasha.current.antar.planet} (
                        {kundli.dasha.current.antar.start} → {kundli.dasha.current.antar.end})
                      </Text>
                    )}
                    {kundli.dasha.current.pratyantar && (
                      <Text style={styles.dashaLine}>
                        Pratyantar: {kundli.dasha.current.pratyantar.planet} (
                        {kundli.dasha.current.pratyantar.start} → {kundli.dasha.current.pratyantar.end})
                      </Text>
                    )}
                  </>
                ) : (
                  <Text style={styles.bodyText}>Dasha data not available for this chart source.</Text>
                )}
                {(kundli.dasha?.major || []).length > 0 && (
                  <>
                    <Text style={[styles.cardTitle, { marginTop: 14 }]}>Maha Dasha timeline</Text>
                    {kundli.dasha.major.slice(0, 9).map((d) => (
                      <View key={`${d.planet}-${d.start}`} style={styles.planetRow}>
                        <Text style={styles.planetName}>{d.planet}</Text>
                        <Text style={styles.planetMeta}>
                          {d.start} → {d.end}
                        </Text>
                      </View>
                    ))}
                  </>
                )}
              </View>
            )}

            {tab === 'dosha' && (
              <>
                <View style={[styles.card, kundli.doshas?.manglik?.isManglik && styles.cardWarn]}>
                  <Text style={styles.cardTitle}>Manglik (Mangal Dosha)</Text>
                  <Text style={styles.bodyText}>
                    {kundli.doshas?.manglik?.note || kundli.manglik?.note || '—'}
                  </Text>
                </View>
                <View style={[styles.card, kundli.doshas?.kaalSarp?.present && styles.cardWarn]}>
                  <Text style={styles.cardTitle}>Kaal Sarp Dosha</Text>
                  <Text style={styles.bodyText}>
                    {kundli.doshas?.kaalSarp?.note ||
                      (kundli.doshas?.kaalSarp?.present ? 'Present' : 'Not present / not available')}
                  </Text>
                </View>
                <View style={[styles.card, kundli.doshas?.sadeSati?.active && styles.cardWarn]}>
                  <Text style={styles.cardTitle}>Sade Sati</Text>
                  <Text style={styles.bodyText}>
                    {kundli.doshas?.sadeSati?.note || 'Status not available'}
                  </Text>
                </View>
              </>
            )}

            {tab === 'reading' && (
              <>
                <View style={styles.card}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>AI READING · TESTING</Text>
                  </View>
                  <Text style={[styles.cardTitle, { marginTop: 8 }]}>Lagna reading</Text>
                  <Text style={styles.bodyText}>
                    {kundli.readings?.ascendant ||
                      'Open full AI reading after generating with live API, or chat with an astrologer for personalised guidance.'}
                  </Text>
                </View>
                {kundli.readings?.moon ? (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Moon rashi reading</Text>
                    <Text style={styles.bodyText}>{kundli.readings.moon}</Text>
                  </View>
                ) : null}
                <Button
                  title="Chat with Astrologer for full reading"
                  variant="outline"
                  onPress={() => router.push('/(tabs)/chat')}
                />
              </>
            )}

            <Button title="Match with partner" onPress={() => router.push('/kundli/match')} style={{ marginTop: 8 }} />
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
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '55',
    ...SHADOW_MD,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginBottom: 10,
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: COLORS.primaryDark },
  heroTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  heroSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 6, lineHeight: 18 },
  matchCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  matchTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  matchSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  profileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  profileChipText: { flex: 1, fontSize: 12, fontWeight: '600', color: COLORS.text, lineHeight: 17 },
  form: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  ageLine: { fontSize: 13, fontWeight: '700', color: COLORS.success, marginBottom: 10, marginTop: -4 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  loadingText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  userBanner: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '55',
  },
  userBannerName: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  userBannerMeta: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4, fontWeight: '500' },
  livePill: {
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: COLORS.success + '22',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  livePillText: { fontSize: 11, fontWeight: '800', color: COLORS.success },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  pill: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  pillLabel: { fontSize: 10, fontWeight: '800', color: COLORS.primaryDark, textTransform: 'uppercase' },
  pillValue: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginTop: 4 },
  tabRow: { flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  tabBtnActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  tabText: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.primaryDark },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  cardWarn: { borderColor: COLORS.warning, backgroundColor: '#FFF8E8' },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textLight,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  bodyText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20, fontWeight: '500' },
  dashaLine: { fontSize: 13, color: COLORS.text, fontWeight: '600', marginTop: 6, lineHeight: 19 },
  planetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    gap: 8,
  },
  planetName: { fontSize: 13, fontWeight: '800', color: COLORS.text, flexShrink: 0 },
  planetMeta: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600', flex: 1, textAlign: 'right' },
  houseRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  houseNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '800',
    color: COLORS.text,
    overflow: 'hidden',
  },
  houseMean: { fontSize: 12, fontWeight: '700', color: COLORS.text },
  housePlanets: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  backLink: { marginTop: 14, alignItems: 'center' },
  backLinkText: { color: COLORS.primaryDark, fontWeight: '700' },
});
