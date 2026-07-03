import { Redirect, useRouter } from 'expo-router';
import { ActivityIndicator, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl } from '../utils/platform';
import { colors } from '../constants/theme';

export default function Index() {
  const { isAuthenticated, loading, bootstrapError } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (bootstrapError && !isAuthenticated) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Connection Failed</Text>
        <Text style={styles.errorMsg}>{bootstrapError}</Text>
        <Text style={styles.apiHint}>API: {getApiBaseUrl()}</Text>
        <Text style={styles.steps}>
          1. Backend chalao: cd server, npm run dev{'\n'}
          2. Phone aur PC same WiFi pe hon{'\n'}
          3. Expo restart: npx expo start -c
        </Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.btnText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <Redirect href={isAuthenticated ? '/(tabs)/dashboard' : '/(auth)/login'} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.bg, padding: 24,
  },
  loadingText: { marginTop: 12, color: colors.textMuted, fontSize: 14 },
  errorIcon: { fontSize: 40, marginBottom: 8 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 },
  errorMsg: { fontSize: 14, color: colors.danger, textAlign: 'center', marginBottom: 8 },
  apiHint: { fontSize: 11, color: colors.textMuted, marginBottom: 12 },
  steps: { fontSize: 13, color: colors.textMuted, lineHeight: 22, textAlign: 'center', marginBottom: 20 },
  btn: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});