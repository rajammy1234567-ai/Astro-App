import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getApiBaseUrl } from '../../utils/platform';
import { colors } from '../../constants/theme';

export default function Login() {
  const [email, setEmail] = useState('admin@astrotalk.com');
  const [password, setPassword] = useState('admin123');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)/dashboard');
    } catch (err) {
      Alert.alert('Login Failed', err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.logo}>☀️</Text>
        <Text style={styles.title}>AstroTalk Admin</Text>
        <Text style={styles.subtitle}>Manage your platform on the go</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="admin@astrotalk.com"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>Password</Text>
        <View style={styles.passRow}>
          <TextInput
            style={styles.passInput}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPass}
            placeholder="Enter password"
            placeholderTextColor={colors.textMuted}
          />
          <TouchableOpacity onPress={() => setShowPass((v) => !v)} style={styles.eyeBtn} hitSlop={8}>
            <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#0f172a" /> : <Text style={styles.btnText}>Sign In</Text>}
        </TouchableOpacity>

        <Text style={styles.hint}>Default: admin@astrotalk.com / admin123</Text>
        {__DEV__ && <Text style={styles.apiHint}>API: {getApiBaseUrl()}</Text>}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: 24 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: colors.border },
  logo: { fontSize: 48, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: 24 },
  label: { fontSize: 13, color: colors.textMuted, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, padding: 14, color: colors.text, fontSize: 15,
  },
  passRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: 10,
  },
  passInput: { flex: 1, padding: 14, color: colors.text, fontSize: 15 },
  eyeBtn: { paddingHorizontal: 12, paddingVertical: 10 },
  btn: {
    backgroundColor: colors.primary, borderRadius: 10, padding: 16,
    alignItems: 'center', marginTop: 24,
  },
  btnText: { color: '#0f172a', fontWeight: '700', fontSize: 16 },
  hint: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 16 },
  apiHint: { fontSize: 10, color: colors.textMuted, textAlign: 'center', marginTop: 8 },
});