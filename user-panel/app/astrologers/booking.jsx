import {
  View, Text, StyleSheet, Alert, ActivityIndicator, ScrollView, TouchableOpacity, TextInput,
} from 'react-native';
import Screen from '../../components/common/Screen';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import { fetchWallet } from '../../redux/walletSlice';
import { setUser } from '../../redux/authSlice';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import Button from '../../components/common/Button';
import RemoteImage from '../../components/common/RemoteImage';
import { sessionApi } from '../../services/sessionApi';
import { astrologerApi } from '../../services/astrologerApi';
import { authApi } from '../../services/authApi';
import { COLORS } from '../../constants/colors';
import { SHADOW } from '../../constants/theme';
import { ageFromDob, validateProfile, GENDER_OPTIONS } from '../../utils/birthDetails';

export default function BookingScreen() {
  const { id, type = 'chat', returnTo } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useAuth();
  const balance = useSelector((s) => s.wallet.balance);
  const [astro, setAstro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [booking, setBooking] = useState(false);

  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [timeOfBirth, setTimeOfBirth] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [gender, setGender] = useState('');

  const isCall = type === 'call';
  const callMinCost = (astro?.pricePerMin || 20) * 1;
  const age = ageFromDob(dateOfBirth);

  useEffect(() => {
    if (isAuthenticated) dispatch(fetchWallet());
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    if (user) {
      setFullName(user.name || '');
      setDateOfBirth(user.dateOfBirth || '');
      setTimeOfBirth(user.timeOfBirth || '');
      setPlaceOfBirth(user.placeOfBirth || '');
      setGender(user.gender || '');
    }
  }, [user]);

  useEffect(() => {
    if (!id) {
      setLoadError('Astrologer id missing');
      setAstro(null);
      setLoading(false);
      return;
    }
    setLoadError('');
    astrologerApi.getById(id)
      .then(setAstro)
      .catch((err) => {
        setAstro(null);
        setLoadError(err.message || 'Could not load astrologer details.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Prefill from /auth/me for latest saved kundli
  useEffect(() => {
    if (!isAuthenticated) return;
    authApi.getMe()
      .then((me) => {
        if (me?.name) setFullName(me.name);
        if (me?.dateOfBirth) setDateOfBirth(me.dateOfBirth);
        if (me?.timeOfBirth) setTimeOfBirth(me.timeOfBirth);
        if (me?.placeOfBirth) setPlaceOfBirth(me.placeOfBirth);
        if (me?.gender) setGender(me.gender);
        dispatch(setUser(me));
      })
      .catch(() => {});
  }, [isAuthenticated, dispatch]);

  const validateBirth = () => {
    const check = validateProfile({
      name: fullName,
      dateOfBirth,
      timeOfBirth,
      placeOfBirth,
      gender,
    });
    return check.ok ? null : check.message;
  };

  const handleStart = async () => {
    if (!astro?._id) {
      Alert.alert('Unavailable', loadError || 'This astrologer is not available.');
      return;
    }
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please log in or create an account for consultation.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Create Account', onPress: () => router.push('/(auth)/login?mode=signup') },
        { text: 'Login', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }

    const chatOk = astro.chatOnline ?? astro.isOnline;
    const callOk = astro.callOnline ?? astro.isOnline;
    if (isCall ? !callOk : !chatOk) {
      Alert.alert(
        isCall ? 'Call Offline' : 'Chat Offline',
        `Yeh astrologer ne ${isCall ? 'Call' : 'Chat'} Online band rakha hai. Sirf jis mode ka toggle ON ho wahi dikhega / book hoga.`
      );
      return;
    }

    const birthError = validateBirth();
    if (birthError) {
      Alert.alert('Birth Details Required', birthError);
      return;
    }

    if (isCall && balance < callMinCost) {
      Alert.alert(
        'Payment Required',
        `For calls, you need to pay for at least 1 minute (₹${callMinCost}) first.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Money', onPress: () => router.push('/wallet/add-money') },
        ]
      );
      return;
    }

    const birthDetails = {
      name: fullName.trim(),
      dateOfBirth: dateOfBirth.trim(),
      timeOfBirth: timeOfBirth.trim(),
      placeOfBirth: placeOfBirth.trim(),
      gender: gender || '',
    };

    setBooking(true);
    try {
      // Save to profile for next time
      try {
        const updated = await authApi.updateProfile(birthDetails);
        dispatch(setUser(updated));
      } catch {
        // continue booking even if profile save fails
      }

      const res = await sessionApi.book({
        astrologerId: astro._id,
        type: isCall ? 'call' : 'chat',
        minutes: 1,
        birthDetails,
      });
      const sessionId = res.session?._id;
      const status = res.session?.status;

      // Always open waiting room — live chat/call only after astrologer accepts
      if (sessionId) {
        Alert.alert(
          'Request Sent',
          status === 'active'
            ? 'Session is live.'
            : `${isCall ? 'Call' : 'Chat'} request bhej diya. Jab ${astro?.name || 'astrologer'} Accept karega tab session start hoga.`,
          [
            {
              text: 'OK',
              onPress: () => {
                if (isCall) {
                  router.replace({
                    pathname: `/call/${sessionId}`,
                    params: {
                      type: 'voice',
                      astroName: astro?.name || 'Astrologer',
                      ...(typeof returnTo === 'string' && returnTo ? { returnTo } : {}),
                    },
                  });
                } else {
                  const chatRoute =
                    typeof returnTo === 'string' && returnTo
                      ? { pathname: `/chat/${sessionId}`, params: { returnTo } }
                      : `/chat/${sessionId}`;
                  router.replace(chatRoute);
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('Request Sent', res.message || 'Wait for astrologer to accept.');
        router.back();
      }
    } catch (err) {
      Alert.alert('Failed', err.message || 'Could not send the request.');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <Screen edges={['left', 'right', 'bottom']} backgroundColor={COLORS.background}>
        <Header title="Confirm Booking" />
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  if (!astro) {
    return (
      <Screen edges={['left', 'right', 'bottom']} backgroundColor={COLORS.background}>
        <Header title="Confirm Booking" />
        <View style={[styles.content, { alignItems: 'center', paddingTop: 40 }]}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.textLight} />
          <Text style={styles.errorText}>{loadError || 'This astrologer is not available'}</Text>
          <Button title="Go Back" onPress={() => router.back()} style={{ marginTop: 20 }} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['left', 'right', 'bottom']} backgroundColor={COLORS.background} keyboard>
      <Header title="Confirm Booking" />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <RemoteImage uri={astro.image} type="astrologer" style={styles.avatar} fallbackIcon="person" iconSize={32} />
          <Text style={styles.name}>{astro.name}</Text>
          <Text style={styles.type}>
            {isCall ? '📞 Voice Call' : '💬 Chat'} Consultation
          </Text>

          <View style={styles.row}>
            <Text style={styles.label}>Rate</Text>
            <Text style={styles.value}>₹{astro.pricePerMin}/min</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Your Balance</Text>
            <Text style={[styles.value, isCall && balance < callMinCost && { color: COLORS.error }]}>
              ₹{balance || 0}
            </Text>
          </View>

          {!isCall ? (
            <View style={styles.freeBox}>
              <Ionicons name="gift" size={20} color={COLORS.success} />
              <Text style={styles.freeText}>First 1 minute of chat is FREE!</Text>
            </View>
          ) : (
            <View style={styles.payBox}>
              <Ionicons name="wallet" size={20} color={COLORS.warning} />
              <Text style={styles.payText}>
                Calls require ₹{callMinCost} (1 min) payment first
              </Text>
            </View>
          )}
        </View>

        {/* Birth / Kundli details — shown first to astrologer */}
        <View style={styles.birthCard}>
          <View style={styles.birthHeader}>
            <Ionicons name="planet-outline" size={22} color={COLORS.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.birthTitle}>Your Birth Details (Kundli)</Text>
              <Text style={styles.birthSub}>
                These details will be sent automatically as the first message to the astrologer
              </Text>
            </View>
          </View>

          <Text style={styles.fieldLabel}>Full Name *</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="As on your certificate"
            placeholderTextColor={COLORS.textLight}
          />

          <Text style={styles.fieldLabel}>Date of Birth * (DD/MM/YYYY)</Text>
          <TextInput
            style={styles.input}
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
            placeholder="15/08/1995"
            placeholderTextColor={COLORS.textLight}
            keyboardType="numbers-and-punctuation"
          />
          <Text style={styles.ageLine}>
            Age: {age != null ? `${age} years (auto)` : '— calculated from DOB'}
          </Text>

          <Text style={styles.fieldLabel}>Time of Birth *</Text>
          <TextInput
            style={styles.input}
            value={timeOfBirth}
            onChangeText={setTimeOfBirth}
            placeholder="10:30 AM"
            placeholderTextColor={COLORS.textLight}
          />

          <Text style={styles.fieldLabel}>Place of Birth *</Text>
          <TextInput
            style={styles.input}
            value={placeOfBirth}
            onChangeText={setPlaceOfBirth}
            placeholder="City, State / Country"
            placeholderTextColor={COLORS.textLight}
          />

          <Text style={styles.fieldLabel}>Gender / Sex *</Text>
          <View style={styles.genderRow}>
            {GENDER_OPTIONS.map((g) => (
              <TouchableOpacity
                key={g.id}
                style={[styles.genderChip, gender === g.id && styles.genderChipActive]}
                onPress={() => setGender(g.id)}
              >
                <Text style={[styles.genderText, gender === g.id && styles.genderTextActive]}>
                  {g.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.hintBox}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.link} />
            <Text style={styles.hintText}>
              Accurate kundli needs the correct birth time and place. These will also be saved to your profile.
            </Text>
          </View>
        </View>

        <View style={styles.flowBox}>
          <Text style={styles.flowTitle}>How it works</Text>
          <Text style={styles.flowStep}>1. Enter birth details → Send request</Text>
          <Text style={styles.flowStep}>2. The astrologer first sees your Name, DOB, TOB and Place</Text>
          <Text style={styles.flowStep}>
            3. {isCall ? 'Call connects after they accept' : 'Chat starts after they accept + 1 min free'}
          </Text>
        </View>

        <Button
          title={isCall ? `Pay ₹${callMinCost} & Send Call Request` : 'Send Chat Request'}
          variant={isCall ? 'primary' : 'success'}
          onPress={handleStart}
          loading={booking}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  errorText: {
    marginTop: 12, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: 24,
  },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 24,
    alignItems: 'center', marginBottom: 16, ...SHADOW,
  },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 12 },
  name: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  type: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4, marginBottom: 20 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', width: '100%',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  label: { color: COLORS.textSecondary, fontSize: 14 },
  value: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  freeBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.successLight, padding: 12, borderRadius: 10,
    marginTop: 16, width: '100%', justifyContent: 'center',
  },
  freeText: { color: COLORS.success, fontSize: 14, fontWeight: '700' },
  payBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFF8E1', padding: 12, borderRadius: 10,
    marginTop: 16, width: '100%', justifyContent: 'center',
  },
  payText: { color: COLORS.text, fontSize: 13, fontWeight: '700', flex: 1 },
  birthCard: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: COLORS.primary + '44', ...SHADOW,
  },
  birthHeader: { flexDirection: 'row', gap: 10, marginBottom: 14, alignItems: 'flex-start' },
  birthTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  birthSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 3, lineHeight: 17 },
  fieldLabel: {
    fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6, marginTop: 4,
  },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: COLORS.text, backgroundColor: COLORS.cream, marginBottom: 10,
  },
  genderRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  genderChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.cream,
  },
  genderChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  genderText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  genderTextActive: { color: COLORS.text, fontWeight: '800' },
  ageLine: {
    fontSize: 13, fontWeight: '700', color: COLORS.primary, marginTop: -4, marginBottom: 10,
  },
  hintBox: {
    flexDirection: 'row', gap: 8, marginTop: 8, backgroundColor: COLORS.primaryLight,
    padding: 10, borderRadius: 8, alignItems: 'flex-start',
  },
  hintText: { flex: 1, fontSize: 12, color: COLORS.textSecondary, lineHeight: 17 },
  flowBox: {
    marginBottom: 16, backgroundColor: COLORS.cream, borderRadius: 10, padding: 12,
  },
  flowTitle: { fontSize: 13, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  flowStep: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18, marginBottom: 2 },
});
