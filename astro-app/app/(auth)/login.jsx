import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { getApiBaseUrl } from '../../utils/platform';
import AppLogo from '../../components/common/AppLogo';
import { colors, COLORS } from '../../constants/theme';
import { shadowStyle } from '../../utils/shadow';

export default function Login() {
  const [phone, setPhone] = useState('9876543210');
  const [password, setPassword] = useState('astro123');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    try {
      await login(phone.trim(), password);
      router.replace('/(tabs)/dashboard');
    } catch (err) {
      Alert.alert('Login Failed', err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <AppLogo size={90} />
            <Text style={styles.brand}>AstroTalk</Text>
            <Text style={styles.tagline}>Partner Panel</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Astrologer Login</Text>
            </View>
            <Text style={styles.subtitle}>Manage your availability, chats, calls and earnings.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome Back</Text>
            <Text style={styles.cardSub}>Sign in with credentials sent after selection or interview.</Text>

            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="9876543210"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Enter password"
              placeholderTextColor={colors.textMuted}
            />

            <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={COLORS.text} />
              ) : (
                <Text style={styles.btnText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.hint}>Use the phone and password sent by admin after selection. Example: 9876543210 / astro123</Text>
          </View>

          <Text style={styles.steps}>
            Astro panel alag app hai (port 8083).{'\n'}
            User panel (8081) ka QR mat scan karo.
          </Text>
          <Text style={styles.apiHint}>API: {getApiBaseUrl()}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 32 },
  hero: { alignItems: 'center', marginTop: 24, marginBottom: 28 },
  brand: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginTop: 12 },
  tagline: { fontSize: 14, fontWeight: '700', color: COLORS.primaryDark, marginTop: 2 },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  card: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(253, 185, 19, 0.18)',
    ...shadowStyle({ offsetY: 6, blur: 18, opacity: 0.12, elevation: 4 }),
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  cardSub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 18,
  },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 8, marginTop: 12 },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    color: colors.text,
    fontSize: 15,
    marginBottom: 6,
  },
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 18,
    ...shadowStyle({ offsetY: 4, blur: 12, opacity: 0.15, elevation: 3 }),
  },
  btnText: { color: COLORS.text, fontWeight: '800', fontSize: 15, letterSpacing: 0.4 },
  hint: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 14, lineHeight: 18 },
  badge: {
    alignSelf: 'center',
    backgroundColor: COLORS.yellow,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginTop: 10,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: COLORS.text },
  steps: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },
  apiHint: { fontSize: 10, color: colors.textMuted, textAlign: 'center', marginTop: 6 },
});