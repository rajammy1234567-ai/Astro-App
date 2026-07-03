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
        <Text style={styles.hint}>Loading admin...</Text>
      </View>
    );
  }

  if (bootstrapError && !isAuthenticated) {
    return (
      <View style={styles.center}>
        <Text style={styles.errTitle}>⚠️ Server Error</Text>
        <Text style={styles.errMsg}>{bootstrapError}</Text>
        <Text style={styles.api}>API: {getApiBaseUrl()}</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.btnText}>Login Try Karo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <Redirect href={isAuthenticated ? '/(tabs)/dashboard' : '/(auth)/login'} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg, padding: 24 },
  hint: { marginTop: 12, color: colors.textMuted },
  errTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  errMsg: { color: colors.danger, textAlign: 'center', marginTop: 8 },
  api: { fontSize: 11, color: colors.textMuted, marginTop: 8 },
  btn: { marginTop: 20, backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  btnText: { fontWeight: '700', color: '#0f172a' },
});