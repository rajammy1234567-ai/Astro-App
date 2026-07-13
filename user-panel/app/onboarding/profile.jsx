import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../services/authApi';
import { setUser } from '../../redux/authSlice';
import {
  ageFromDob,
  parseDob,
  validateProfile,
  GENDER_OPTIONS,
  hasCompleteProfile,
} from '../../utils/birthDetails';
import { COLORS } from '../../constants/colors';
import BirthDatePicker from '../../components/common/BirthDatePicker';
import BirthTimePicker from '../../components/common/BirthTimePicker';
import PlacePicker from '../../components/common/PlacePicker';

const { width: W } = Dimensions.get('window');

const STEPS = [
  {
    key: 'welcome',
    icon: 'sparkles',
    title: 'Welcome 🙏',
    subtitle: 'A few details for your kundli',
    hint: 'Complete these 5 simple steps so the astrologer can give an accurate reading.',
  },
  {
    key: 'name',
    icon: 'person',
    title: 'Your Name',
    subtitle: 'As written on your birth certificate',
    field: 'name',
  },
  {
    key: 'gender',
    icon: 'male-female',
    title: 'Gender / Sex',
    subtitle: 'Required for kundli calculation',
    field: 'gender',
  },
  {
    key: 'dob',
    icon: 'calendar',
    title: 'Date of Birth',
    subtitle: 'Age is calculated automatically',
    field: 'dob',
  },
  {
    key: 'tob',
    icon: 'time',
    title: 'Time of Birth',
    subtitle: 'An approximate time is fine',
    field: 'tob',
  },
  {
    key: 'pob',
    icon: 'location',
    title: 'Place of Birth',
    subtitle: 'City, State or Country',
    field: 'pob',
  },
  {
    key: 'review',
    icon: 'checkmark-circle',
    title: 'Confirm Details',
    subtitle: 'If everything looks correct, tap Save',
    field: 'review',
  },
];

export default function OnboardingProfileScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, isAuthenticated, initialized } = useAuth();

  const [boot, setBoot] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);

  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [timeOfBirth, setTimeOfBirth] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [gender, setGender] = useState('');

  const slideX = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const age = useMemo(() => ageFromDob(dateOfBirth), [dateOfBirth]);
  const current = STEPS[step];
  const progress = step / (STEPS.length - 1);

  useEffect(() => {
    if (!initialized) return;
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
      return;
    }
    if (hasCompleteProfile(user)) {
      router.replace('/(tabs)/home');
      return;
    }

    authApi
      .getMe()
      .then((me) => {
        dispatch(setUser(me));
        if (hasCompleteProfile(me)) {
          router.replace('/(tabs)/home');
          return;
        }
        setName(me.name && me.name !== 'User' ? me.name : '');
        setDateOfBirth(me.dateOfBirth || '');
        setTimeOfBirth(me.timeOfBirth || '');
        setPlaceOfBirth(me.placeOfBirth || '');
        setGender(me.gender || '');
      })
      .catch(() => {
        if (user) {
          setName(user.name && user.name !== 'User' ? user.name : '');
          setDateOfBirth(user.dateOfBirth || '');
          setTimeOfBirth(user.timeOfBirth || '');
          setPlaceOfBirth(user.placeOfBirth || '');
          setGender(user.gender || '');
        }
      })
      .finally(() => setBoot(false));
  }, [initialized, isAuthenticated]);

  const animateTo = (nextStep, dir = 1) => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(slideX, {
        toValue: dir > 0 ? -40 : 40,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep(nextStep);
      slideX.setValue(dir > 0 ? 40 : -40);
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(slideX, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    });
  };

  const validateCurrent = () => {
    const key = current.field;
    if (key === 'welcome' || key === 'review') return true;

    if (key === 'name') {
      if (name.trim().length < 2) {
        Alert.alert('Name', 'Please enter your full name (min 2 characters)');
        return false;
      }
      return true;
    }
    if (key === 'gender') {
      if (!['male', 'female', 'other'].includes(gender)) {
        Alert.alert('Gender', 'Please select your gender / sex');
        return false;
      }
      return true;
    }
    if (key === 'dob') {
      if (!parseDob(dateOfBirth)) {
        Alert.alert('Date of Birth', 'Format: DD/MM/YYYY\nExample: 15/08/1995');
        return false;
      }
      if (age != null && age < 13) {
        Alert.alert('Age', 'Minimum age must be 13 years');
        return false;
      }
      return true;
    }
    if (key === 'tob') {
      if (timeOfBirth.trim().length < 3) {
        Alert.alert('Time of Birth', 'Example: 10:30 AM');
        return false;
      }
      return true;
    }
    if (key === 'pob') {
      if (placeOfBirth.trim().length < 2) {
        Alert.alert('Place of Birth', 'Please enter city / state');
        return false;
      }
      return true;
    }
    return true;
  };

  const goNext = () => {
    if (!validateCurrent()) return;
    if (step < STEPS.length - 1) animateTo(step + 1, 1);
  };

  const goBack = () => {
    if (step > 0) animateTo(step - 1, -1);
  };

  const handleSave = async () => {
    const check = validateProfile({
      name,
      dateOfBirth,
      timeOfBirth,
      placeOfBirth,
      gender,
    });
    if (!check.ok) {
      Alert.alert('Incomplete', check.message);
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
        'Kundli Profile Ready ✨',
        `Welcome ${check.profile.name}!\nAge: ${check.age} years\n\nYou can now take professional consultations.`,
        [{ text: 'Enter App', onPress: () => router.replace('/(tabs)/home') }]
      );
    } catch (err) {
      Alert.alert('Save failed', err.message || 'Please try again');
    } finally {
      setSaving(false);
    }
  };

  if (!initialized || boot) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.bootText}>Preparing your kundli profile…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Cosmic top background */}
      <View style={styles.cosmos}>
        <View style={styles.star1} />
        <View style={styles.star2} />
        <View style={styles.star3} />
        <SafeAreaView edges={['top']} style={styles.topSafe}>
          <View style={styles.topBar}>
            <View style={styles.brandRow}>
              <Ionicons name="planet" size={18} color={COLORS.primary} />
              <Text style={styles.brand}>AstroTalk</Text>
            </View>
            <Text style={styles.stepCount}>
              {step + 1}/{STEPS.length}
            </Text>
          </View>

          {/* Progress */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.max(8, progress * 100)}%` }]} />
          </View>
          <View style={styles.dots}>
            {STEPS.map((s, i) => (
              <View
                key={s.key}
                style={[
                  styles.dot,
                  i === step && styles.dotActive,
                  i < step && styles.dotDone,
                ]}
              />
            ))}
          </View>
        </SafeAreaView>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.slideCard,
              { opacity: fade, transform: [{ translateX: slideX }] },
            ]}
          >
            <View style={styles.iconRing}>
              <View style={styles.iconCircle}>
                <Ionicons name={current.icon} size={32} color={COLORS.bannerDark} />
              </View>
            </View>

            <Text style={styles.title}>{current.title}</Text>
            <Text style={styles.subtitle}>{current.subtitle}</Text>

            {/* STEP CONTENT */}
            {current.field === 'welcome' && (
              <View style={styles.welcomeBox}>
                <View style={styles.featureRow}>
                  <Ionicons name="star" size={16} color={COLORS.primary} />
                  <Text style={styles.featureText}>Professional kundli-ready profile</Text>
                </View>
                <View style={styles.featureRow}>
                  <Ionicons name="chatbubbles" size={16} color={COLORS.primary} />
                  <Text style={styles.featureText}>Details auto-share with astrologer</Text>
                </View>
                <View style={styles.featureRow}>
                  <Ionicons name="shield-checkmark" size={16} color={COLORS.primary} />
                  <Text style={styles.featureText}>Private & only for consultation</Text>
                </View>
                <Text style={styles.welcomeHint}>{current.hint}</Text>
              </View>
            )}

            {current.field === 'name' && (
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Priya Sharma"
                  placeholderTextColor={COLORS.textLight}
                  autoFocus
                  autoCapitalize="words"
                />
              </View>
            )}

            {current.field === 'gender' && (
              <View style={styles.genderGrid}>
                {GENDER_OPTIONS.map((g) => {
                  const active = gender === g.id;
                  const icon =
                    g.id === 'male' ? 'male' : g.id === 'female' ? 'female' : 'ellipse-outline';
                  return (
                    <TouchableOpacity
                      key={g.id}
                      style={[styles.genderCard, active && styles.genderCardActive]}
                      onPress={() => setGender(g.id)}
                      activeOpacity={0.85}
                    >
                      <View style={[styles.genderIcon, active && styles.genderIconActive]}>
                        <Ionicons
                          name={icon}
                          size={26}
                          color={active ? COLORS.bannerDark : COLORS.primary}
                        />
                      </View>
                      <Text style={[styles.genderLabel, active && styles.genderLabelActive]}>
                        {g.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {current.field === 'dob' && (
              <View style={styles.fieldWrap}>
                <BirthDatePicker
                  label="Date of Birth"
                  value={dateOfBirth}
                  onChange={setDateOfBirth}
                />
                <View style={styles.ageCard}>
                  <Ionicons name="hourglass-outline" size={20} color={COLORS.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ageTitle}>Your Age</Text>
                    <Text style={styles.ageValue}>
                      {age != null
                        ? `${age} years old`
                        : 'Auto-calculated when you pick DOB'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {current.field === 'tob' && (
              <View style={styles.fieldWrap}>
                <BirthTimePicker
                  label="Time of Birth"
                  value={timeOfBirth}
                  onChange={setTimeOfBirth}
                />
                <Text style={styles.tip}>
                  💡 Exact time best hai; nahi pata ho to approximate time choose karo.
                </Text>
              </View>
            )}

            {current.field === 'pob' && (
              <View style={styles.fieldWrap}>
                <PlacePicker
                  label="Place of Birth"
                  value={placeOfBirth}
                  onChange={setPlaceOfBirth}
                />
              </View>
            )}

            {current.field === 'review' && (
              <View style={styles.reviewCard}>
                <Text style={styles.reviewHeading}>Your Kundli Basics</Text>
                <ReviewRow icon="person" label="Name" value={name} />
                <ReviewRow
                  icon="male-female"
                  label="Sex"
                  value={
                    GENDER_OPTIONS.find((g) => g.id === gender)?.label || '—'
                  }
                />
                <ReviewRow
                  icon="calendar"
                  label="DOB"
                  value={dateOfBirth + (age != null ? `  ·  ${age} yrs` : '')}
                />
                <ReviewRow icon="time" label="Birth Time" value={timeOfBirth} />
                <ReviewRow icon="location" label="Birth Place" value={placeOfBirth} />
                <View style={styles.reviewNote}>
                  <Ionicons name="chatbubble-ellipses" size={14} color={COLORS.link} />
                  <Text style={styles.reviewNoteText}>
                    These details are sent automatically as the first message to the astrologer on chat/call.
                  </Text>
                </View>
              </View>
            )}
          </Animated.View>
        </ScrollView>

        {/* Bottom actions */}
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <View style={styles.btnRow}>
            {step > 0 ? (
              <TouchableOpacity style={styles.backBtn} onPress={goBack}>
                <Ionicons name="arrow-back" size={20} color={COLORS.text} />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 90 }} />
            )}

            {current.field === 'review' ? (
              <TouchableOpacity
                style={[styles.nextBtn, saving && { opacity: 0.7 }]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.9}
              >
                {saving ? (
                  <ActivityIndicator color={COLORS.bannerDark} />
                ) : (
                  <>
                    <Text style={styles.nextText}>Save & Start</Text>
                    <Ionicons name="arrow-forward" size={18} color={COLORS.bannerDark} />
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.nextBtn} onPress={goNext} activeOpacity={0.9}>
                <Text style={styles.nextText}>
                  {current.field === 'welcome' ? 'Begin' : 'Continue'}
                </Text>
                <Ionicons name="arrow-forward" size={18} color={COLORS.bannerDark} />
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

function ReviewRow({ icon, label, value }) {
  return (
    <View style={styles.reviewRow}>
      <View style={styles.reviewIcon}>
        <Ionicons name={icon} size={16} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.reviewLabel}>{label}</Text>
        <Text style={styles.reviewValue}>{value || '—'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.cream },
  flex: { flex: 1 },
  boot: {
    flex: 1,
    backgroundColor: COLORS.bannerDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bootText: { color: 'rgba(255,255,255,0.8)', marginTop: 12, fontSize: 13 },

  cosmos: {
    backgroundColor: COLORS.bannerDark,
    paddingBottom: 18,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  star1: {
    position: 'absolute', top: 24, right: 30, width: 6, height: 6,
    borderRadius: 3, backgroundColor: COLORS.primary, opacity: 0.9,
  },
  star2: {
    position: 'absolute', top: 50, left: 40, width: 4, height: 4,
    borderRadius: 2, backgroundColor: '#FFF', opacity: 0.5,
  },
  star3: {
    position: 'absolute', top: 70, right: 80, width: 3, height: 3,
    borderRadius: 2, backgroundColor: '#FFF', opacity: 0.4,
  },
  topSafe: { paddingHorizontal: 20 },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 8, marginBottom: 14,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brand: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  stepCount: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
  progressTrack: {
    height: 5, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 4, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
  dots: { flexDirection: 'row', gap: 6, marginTop: 12, justifyContent: 'center' },
  dot: {
    width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotActive: { width: 18, backgroundColor: COLORS.primary },
  dotDone: { backgroundColor: 'rgba(253,185,19,0.7)' },

  scroll: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16, flexGrow: 1 },
  slideCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    minHeight: 340,
    shadowColor: '#1E1033',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  iconRing: { alignItems: 'center', marginBottom: 14 },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 2, borderColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  title: {
    fontSize: 24, fontWeight: '800', color: COLORS.text, textAlign: 'center',
  },
  subtitle: {
    fontSize: 14, color: COLORS.textSecondary, textAlign: 'center',
    marginTop: 6, marginBottom: 20, lineHeight: 20,
  },

  welcomeBox: { gap: 12 },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.primaryLight, padding: 12, borderRadius: 12,
  },
  featureText: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.text },
  welcomeHint: {
    fontSize: 12, color: COLORS.textSecondary, lineHeight: 18, textAlign: 'center', marginTop: 6,
  },

  fieldWrap: { marginTop: 4 },
  fieldLabel: {
    fontSize: 12, fontWeight: '700', color: COLORS.textSecondary,
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 17,
    color: COLORS.text, backgroundColor: COLORS.cream, fontWeight: '600',
  },
  tip: { fontSize: 12, color: COLORS.textSecondary, marginTop: 12, lineHeight: 18 },

  ageCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginTop: 14, backgroundColor: COLORS.bannerDark,
    borderRadius: 14, padding: 14,
  },
  ageTitle: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  ageValue: { fontSize: 16, color: COLORS.primary, fontWeight: '800', marginTop: 2 },

  genderGrid: { gap: 10 },
  genderCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 14,
    padding: 14, backgroundColor: COLORS.cream,
  },
  genderCardActive: {
    borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight,
  },
  genderIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  genderIconActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  genderLabel: { fontSize: 16, fontWeight: '700', color: COLORS.textSecondary },
  genderLabelActive: { color: COLORS.text },

  reviewCard: { gap: 4 },
  reviewHeading: {
    fontSize: 13, fontWeight: '800', color: COLORS.textSecondary,
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  reviewRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  reviewIcon: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  reviewLabel: { fontSize: 11, color: COLORS.textLight, fontWeight: '600' },
  reviewValue: { fontSize: 15, color: COLORS.text, fontWeight: '700', marginTop: 1 },
  reviewNote: {
    flexDirection: 'row', gap: 8, marginTop: 12,
    backgroundColor: '#E3F2FD', padding: 12, borderRadius: 12, alignItems: 'flex-start',
  },
  reviewNoteText: { flex: 1, fontSize: 12, color: COLORS.textSecondary, lineHeight: 17 },

  footer: {
    paddingHorizontal: 20, paddingTop: 8,
    borderTopWidth: 1, borderTopColor: COLORS.borderLight, backgroundColor: COLORS.surface,
  },
  btnRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingBottom: 8, gap: 12,
  },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 14, paddingHorizontal: 8,
  },
  backText: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  nextBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: COLORS.primary, borderRadius: 14,
    paddingVertical: 16, maxWidth: W * 0.58,
  },
  nextText: { fontSize: 16, fontWeight: '800', color: COLORS.bannerDark },
});
