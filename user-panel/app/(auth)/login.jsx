import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Screen from '../../components/common/Screen';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import AppLogo from '../../components/common/AppLogo';
import { COLORS } from '../../constants/colors';
import { SHADOW_LG } from '../../constants/theme';
import { hasCompleteProfile } from '../../utils/birthDetails';

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function LoginScreen() {
  const { mode } = useLocalSearchParams();
  const [authMode, setAuthMode] = useState(mode === 'signup' ? 'signup' : 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const router = useRouter();
  const { register, login, authLoading, error, clearError } = useAuth();

  useEffect(() => {
    clearError();
  }, [authMode, clearError]);

  const normalizedEmail = email.trim().toLowerCase();
  const emailValid = isValidEmail(normalizedEmail);
  const nameValid = authMode === 'login' || name.trim().length >= 2;
  const passwordValid = password.length >= 6;
  const canContinue = emailValid && nameValid && passwordValid;

  const handleSubmit = async () => {
    if (!canContinue || authLoading) return;
    clearError();

    if (authMode === 'signup' && name.trim().length < 2) {
      Alert.alert('Name required', 'Please enter your full name (min 2 characters)');
      return;
    }
    if (!emailValid) {
      Alert.alert('Invalid email', 'Please enter a valid email address (e.g. you@gmail.com)');
      return;
    }
    if (!passwordValid) {
      Alert.alert('Weak password', 'Password must be at least 6 characters');
      return;
    }

    const payload = {
      email: normalizedEmail,
      password,
      ...(authMode === 'signup' ? { name: name.trim() } : {}),
    };

    try {
      const result =
        authMode === 'signup'
          ? await register(payload)
          : await login(payload);

      if (result.meta.requestStatus === 'fulfilled') {
        const u = result.payload?.user;
        const goNext = () => {
          // Required details first (name, sex, DOB, TOB, place) — age auto from DOB
          if (!hasCompleteProfile(u)) {
            router.replace('/onboarding/profile');
          } else {
            router.replace('/(tabs)/home');
          }
        };

        if (authMode === 'signup') {
          Alert.alert(
            'Welcome to Astrotalk!',
            result.payload?.isNewUser
              ? 'Account created! ₹100 welcome bonus has been added to your wallet. Please add your birth details next.'
              : 'Account ready. Please complete your profile details.',
            [{ text: 'Continue', onPress: goNext }]
          );
        } else {
          goNext();
        }
        return;
      }

      // rejected — show exact server/network message
      const msg =
        result.payload?.message ||
        result.error?.message ||
        (authMode === 'signup' ? 'Could not create account' : 'Login failed');
      Alert.alert(authMode === 'signup' ? 'Signup Failed' : 'Login Failed', msg);
    } catch (err) {
      Alert.alert('Error', err?.message || 'Something went wrong. Please try again.');
    }
  };

  const inputBorder = (field) => ({
    borderColor: focusedField === field ? COLORS.primary : COLORS.border,
    borderWidth: focusedField === field ? 1.5 : 1,
  });

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']} keyboard>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.skip} onPress={() => router.replace('/(tabs)/home')}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        <View style={styles.hero}>
          <AppLogo size={80} />
          <Text style={styles.brand}>Astrotalk</Text>
          <Text style={styles.tagline}>India's best astrology app</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.authModeRow}>
            <TouchableOpacity
              style={[styles.authModeBtn, authMode === 'login' && styles.authModeActive]}
              onPress={() => setAuthMode('login')}
            >
              <Text style={[styles.authModeText, authMode === 'login' && styles.authModeTextActive]}>
                Login
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.authModeBtn, authMode === 'signup' && styles.authModeActive]}
              onPress={() => setAuthMode('signup')}
            >
              <Text style={[styles.authModeText, authMode === 'signup' && styles.authModeTextActive]}>
                Create Account
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.cardTitle}>
            {authMode === 'signup' ? 'Create your account' : 'Welcome back'}
          </Text>

          {authMode === 'signup' && (
            <>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={[styles.input, inputBorder('name')]}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={COLORS.textLight}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
              />
            </>
          )}

          <Text style={styles.label}>Email Address</Text>
          <View style={[styles.fieldRow, inputBorder('email')]}>
            <Ionicons name="mail-outline" size={18} color={COLORS.textSecondary} />
            <TextInput
              style={styles.fieldInput}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={COLORS.textLight}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={[styles.fieldRow, inputBorder('password')]}>
            <Ionicons name="lock-closed-outline" size={18} color={COLORS.textSecondary} />
            <TextInput
              style={styles.fieldInput}
              value={password}
              onChangeText={setPassword}
              placeholder="Min 6 characters"
              placeholderTextColor={COLORS.textLight}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
            />
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>
            {password.length > 0 && password.length < 6
              ? `${6 - password.length} more character${6 - password.length === 1 ? '' : 's'} needed`
              : authMode === 'signup'
                ? 'Create an account with email and password'
                : 'Log in with your email and password'}
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={COLORS.error} />
              <Text style={styles.error}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.continueBtn, canContinue && !authLoading && styles.continueActive]}
            onPress={handleSubmit}
            disabled={!canContinue || authLoading}
            activeOpacity={0.85}
          >
            {authLoading ? (
              <View style={styles.btnRow}>
                <ActivityIndicator size="small" color={COLORS.text} />
                <Text style={[styles.continueText, styles.continueTextActive]}>
                  {authMode === 'signup' ? 'Creating Account...' : 'Logging in...'}
                </Text>
              </View>
            ) : (
              <Text style={[styles.continueText, canContinue && styles.continueTextActive]}>
                {authMode === 'signup' ? 'CREATE ACCOUNT' : 'LOGIN'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
          style={styles.switchMode}
        >
          <Text style={styles.switchModeText}>
            {authMode === 'login'
              ? 'New user? Create Account'
              : 'Already have account? Login'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.terms}>
          By continuing, you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Use</Text> &{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  skip: {
    alignSelf: 'flex-end',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  skipText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  hero: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 28,
  },
  brand: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 12,
  },
  tagline: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOW_LG,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 18,
  },
  authModeRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.borderLight,
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  authModeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  authModeActive: { backgroundColor: COLORS.surface },
  authModeText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  authModeTextActive: { color: COLORS.text, fontWeight: '700' },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 14,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
    backgroundColor: COLORS.surface,
    marginBottom: 14,
  },
  fieldInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    padding: 0,
    minHeight: 24,
  },
  hint: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: -6,
    marginBottom: 4,
    minHeight: 16,
  },
  switchMode: { alignItems: 'center', marginTop: 16, marginBottom: 8 },
  switchModeText: { fontSize: 14, color: COLORS.link, fontWeight: '600' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.errorLight,
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  error: {
    flex: 1,
    color: COLORS.error,
    fontSize: 13,
    lineHeight: 18,
  },
  continueBtn: {
    backgroundColor: COLORS.continueDisabled,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  continueActive: {
    backgroundColor: COLORS.yellow,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  continueText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.continueText,
    letterSpacing: 0.5,
  },
  continueTextActive: {
    color: COLORS.text,
  },
  terms: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 24,
    paddingHorizontal: 8,
  },
  termsLink: {
    textDecorationLine: 'underline',
    color: COLORS.text,
    fontWeight: '600',
  },
});
