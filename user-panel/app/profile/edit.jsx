import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import Screen from '../../components/common/Screen';
import Header from '../../components/common/Header';
import Button from '../../components/common/Button';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../services/authApi';
import { setUser } from '../../redux/authSlice';
import { COLORS } from '../../constants/colors';
import { SHADOW } from '../../constants/theme';
import { ageFromDob, validateProfile, GENDER_OPTIONS } from '../../utils/birthDetails';

export default function EditProfileScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [timeOfBirth, setTimeOfBirth] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const age = ageFromDob(dateOfBirth);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    authApi.getMe()
      .then((me) => {
        setName(me.name || '');
        setDateOfBirth(me.dateOfBirth || '');
        setTimeOfBirth(me.timeOfBirth || '');
        setPlaceOfBirth(me.placeOfBirth || '');
        setGender(me.gender || '');
        dispatch(setUser(me));
      })
      .catch(() => {
        if (user) {
          setName(user.name || '');
          setDateOfBirth(user.dateOfBirth || '');
          setTimeOfBirth(user.timeOfBirth || '');
          setPlaceOfBirth(user.placeOfBirth || '');
          setGender(user.gender || '');
        }
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, user, dispatch]);

  const handleSave = async () => {
    const check = validateProfile({ name, dateOfBirth, timeOfBirth, placeOfBirth, gender });
    if (!check.ok) {
      Alert.alert('Required', check.message);
      return;
    }

    setSaving(true);
    try {
      const updated = await authApi.updateProfile({
        name: check.profile.name,
        dateOfBirth: check.profile.dateOfBirth,
        timeOfBirth: check.profile.timeOfBirth,
        placeOfBirth: check.profile.placeOfBirth,
        gender: check.profile.gender,
      });
      dispatch(setUser({ ...updated, age: check.age }));
      Alert.alert(
        'Saved',
        `Details save ho gaye. Age: ${check.age} years. Consultation me auto share honge.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <Header title="Edit Profile" />
        <View style={styles.center}>
          <Text style={styles.muted}>Login required</Text>
          <Button title="Login" onPress={() => router.push('/(auth)/login')} style={{ marginTop: 16 }} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['left', 'right', 'bottom']} keyboard>
      <Header title="Birth Details / Profile" />
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Ionicons name="planet" size={28} color="#FFF" />
            <Text style={styles.heroTitle}>Kundli Birth Details</Text>
            <Text style={styles.heroSub}>
              Astrologer consultation se pehle ye save rakho — chat me auto share hoga
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your full name"
              placeholderTextColor={COLORS.textLight}
            />

            <Text style={styles.label}>Date of Birth (DD/MM/YYYY) *</Text>
            <TextInput
              style={styles.input}
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              placeholder="15/08/1995"
              placeholderTextColor={COLORS.textLight}
            />
            <Text style={styles.ageLine}>
              Age: {age != null ? `${age} years (auto from DOB)` : '— DOB daalo'}
            </Text>

            <Text style={styles.label}>Time of Birth *</Text>
            <TextInput
              style={styles.input}
              value={timeOfBirth}
              onChangeText={setTimeOfBirth}
              placeholder="10:30 AM"
              placeholderTextColor={COLORS.textLight}
            />

            <Text style={styles.label}>Place of Birth</Text>
            <TextInput
              style={styles.input}
              value={placeOfBirth}
              onChangeText={setPlaceOfBirth}
              placeholder="City, State"
              placeholderTextColor={COLORS.textLight}
            />

            <Text style={styles.label}>Gender / Sex *</Text>
            <View style={styles.genderRow}>
              {GENDER_OPTIONS.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  style={[styles.chip, gender === g.id && styles.chipActive]}
                  onPress={() => setGender(g.id)}
                >
                  <Text style={[styles.chipText, gender === g.id && styles.chipTextActive]}>
                    {g.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Button title="Save Details" onPress={handleSave} loading={saving} />
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  muted: { color: COLORS.textSecondary },
  hero: {
    backgroundColor: COLORS.primary, borderRadius: 14, padding: 18,
    alignItems: 'center', marginBottom: 16,
  },
  heroTitle: { color: '#FFF', fontSize: 17, fontWeight: '800', marginTop: 8 },
  heroSub: {
    color: 'rgba(255,255,255,0.92)', fontSize: 12, marginTop: 6, textAlign: 'center', lineHeight: 18,
  },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW,
  },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6, marginTop: 4 },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: COLORS.text, marginBottom: 12, backgroundColor: COLORS.cream,
  },
  genderRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.text, fontWeight: '800' },
  ageLine: {
    fontSize: 13, fontWeight: '700', color: COLORS.primary, marginTop: -6, marginBottom: 12,
  },
});
