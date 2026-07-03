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
            <AppLogo size={80} />
            <Text style={styles.brand}>AstroTalk</Text>
            <Text style={styles.tagline}>Partner Panel</Text>
            <Text style={styles.subtitle}>Manage chats, calls & your profile</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Astrologer Sign In</Text>

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
                <Text style={styles.btnText}>SIGN IN</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.hint}>Demo: 9876543210 / astro123</Text>
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
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...shadowStyle({ offsetY: 4, blur: 12, opacity: 0.06, elevation: 3 }),
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 18,
  },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 8, marginTop: 4 },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    color: colors.text,
    fontSize: 15,
    marginBottom: 8,
  },
  btn: {
    backgroundColor: COLORS.yellow,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  btnText: { color: COLORS.text, fontWeight: '800', fontSize: 15, letterSpacing: 0.5 },
  hint: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 14 },
  steps: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 16,
  },
  apiHint: { fontSize: 10, color: colors.textMuted, textAlign: 'center', marginTop: 8 },
});