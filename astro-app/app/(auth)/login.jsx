import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getApiBaseUrl } from '../../utils/platform';
import {
  wakeServer,
  wakeStatusMessage,
  isRemoteApi,
  isRenderApi,
} from '../../utils/serverHealth';
import AppLogo from '../../components/common/AppLogo';
import { colors, COLORS, SHADOW_LG } from '../../constants/theme';

export default function Login() {
  const [phone, setPhone] = useState('9876543210');
  const [password, setPassword] = useState('astro123');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [serverOk, setServerOk] = useState(null);
  const [serverStatus, setServerStatus] = useState('Server check…');
  const { login } = useAuth();
  const router = useRouter();
  const apiUrl = getApiBaseUrl();
  const remoteApi = isRemoteApi(apiUrl);

  useEffect(() => {
    let cancelled = false;
    setServerStatus(remoteApi ? 'Server wake start…' : 'Server check…');
    wakeServer({
      maxMs: remoteApi ? 75000 : 8000,
      onProgress: (info) => {
        if (!cancelled) setServerStatus(wakeStatusMessage(info));
      },
    }).then((result) => {
      if (cancelled) return;
      setServerOk(result.ok);
      if (result.ok) {
        const sec = Math.max(1, Math.round((result.elapsed || 0) / 1000));
        setServerStatus(
          result.remote && sec > 3
            ? `✓ Server ready (${sec}s me wake hua)`
            : '✓ Server connected'
        );
      } else {
        setServerStatus(
          result.message ||
            (remoteApi
              ? 'Server sleep — Login dabao, wake try hoga'
              : 'Server offline — cd server → npm run dev')
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [remoteApi]);

  const handleLogin = async () => {
    if (!phone.trim() || !password) {
      Alert.alert('Required', 'Phone aur password daalo');
      return;
    }
    setLoading(true);
    try {
      if (serverOk !== true) {
        setServerStatus(
          isRenderApi(apiUrl)
            ? 'Login se pehle server wake… (30–60s ho sakta hai)'
            : 'Server check…'
        );
        const woke = await wakeServer({
          maxMs: remoteApi ? 75000 : 8000,
          onProgress: (info) => setServerStatus(wakeStatusMessage(info)),
        });
        setServerOk(woke.ok);
        if (!woke.ok) {
          Alert.alert(
            'Server',
            woke.message ||
              (remoteApi
                ? 'Render server sleep pe hai. 30 sec baad dubara try karo.'
                : 'Local server band hai. cd server → npm run dev')
          );
          return;
        }
        setServerStatus('✓ Server ready — logging in…');
      }
      await login(phone.trim(), password);
      router.replace('/(tabs)/dashboard');
    } catch (err) {
      Alert.alert(
        'Login Failed',
        err.message ||
          (remoteApi
            ? 'Invalid credentials ya server slow. Dubara try karo.'
            : 'Invalid credentials')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <View style={styles.blob1} />
        <View style={styles.blob2} />
        <View style={styles.star1} />
        <View style={styles.star2} />
        <SafeAreaView edges={['top']}>
          <View style={styles.heroInner}>
            <AppLogo size={86} />
            <Text style={styles.brand}>AstroTalk</Text>
            <Text style={styles.tag}>PARTNER WORKSPACE</Text>
            <View style={styles.badge}>
              <Ionicons name="shield-checkmark" size={13} color={COLORS.bannerDark} />
              <Text style={styles.badgeText}>Professional Astrologer Login</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.sub}>
              Partner credentials se sign in karein. Chats, calls aur earnings yahin manage hote hain.
            </Text>

            <View
              style={[
                styles.serverPill,
                serverOk === true && styles.serverOk,
                serverOk === false && styles.serverBad,
              ]}
            >
              <Text style={styles.serverText}>{serverStatus}</Text>
            </View>

            <Text style={styles.label}>Phone</Text>
            <View style={styles.field}>
              <Ionicons name="call-outline" size={18} color={colors.textMuted} />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="9876543210"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <Text style={styles.label}>Password</Text>
            <View style={styles.field}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                placeholder="Enter password"
                placeholderTextColor={colors.textMuted}
              />
              <TouchableOpacity onPress={() => setShowPass((v) => !v)}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.btn, loading && { opacity: 0.8 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <>
                  <ActivityIndicator color={COLORS.bannerDark} />
                  <Text style={styles.btnText}>
                    {serverOk !== true && remoteApi ? 'Server wake…' : 'Signing in…'}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.btnText}>Enter Partner Panel</Text>
                  <Ionicons name="arrow-forward" size={18} color={COLORS.bannerDark} />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.hint}>
              <Ionicons name="information-circle-outline" size={16} color={COLORS.link} />
              <Text style={styles.hintText}>
                Demo · 9876543210 / astro123{'\n'}
                Selection ke baad admin password bhejta hai.
              </Text>
            </View>
          </View>

          <View style={styles.pills}>
            {['Chats', 'Calls', 'Live', 'Earnings'].map((t) => (
              <View key={t} style={styles.pill}>
                <Text style={styles.pillText}>{t}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.note}>
            Ye alag app hai (port 8083). User panel ka QR mat scan karo.
          </Text>
          <Text style={styles.api}>
            {remoteApi
              ? `Cloud API (Render free · pehli baar 30–60s)\n${apiUrl}`
              : `Local API · fast\n${apiUrl}`}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  hero: {
    backgroundColor: COLORS.bannerDark,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    paddingBottom: 10,
  },
  blob1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: COLORS.bannerMid, top: -70, right: -50,
  },
  blob2: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(109,40,217,0.35)', bottom: -40, left: -30,
  },
  star1: {
    position: 'absolute', top: 28, right: 36, width: 6, height: 6,
    borderRadius: 3, backgroundColor: COLORS.primary,
  },
  star2: {
    position: 'absolute', top: 60, left: 40, width: 3, height: 3,
    borderRadius: 2, backgroundColor: '#fff', opacity: 0.45,
  },
  heroInner: { alignItems: 'center', paddingTop: 10, paddingBottom: 22 },
  brand: { fontSize: 30, fontWeight: '900', color: '#fff', marginTop: 10, letterSpacing: -0.5 },
  tag: {
    fontSize: 11, fontWeight: '800', color: COLORS.primary, marginTop: 4, letterSpacing: 1.5,
  },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14,
    backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16,
  },
  badgeText: { fontSize: 11, fontWeight: '900', color: COLORS.bannerDark },

  scroll: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 36 },
  card: {
    backgroundColor: '#fff', borderRadius: 26, padding: 20,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOW_LG,
  },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.text, textAlign: 'center' },
  sub: {
    fontSize: 13, color: colors.textMuted, textAlign: 'center',
    marginTop: 6, marginBottom: 12, lineHeight: 19,
  },
  serverPill: {
    borderRadius: 12, padding: 10, marginBottom: 14,
    backgroundColor: COLORS.soft || '#F5F0FF',
  },
  serverOk: { backgroundColor: 'rgba(34,197,94,0.12)' },
  serverBad: { backgroundColor: 'rgba(239,68,68,0.12)' },
  serverText: {
    fontSize: 12, fontWeight: '700', color: COLORS.text,
    textAlign: 'center', lineHeight: 17,
  },
  label: {
    fontSize: 11, fontWeight: '800', color: COLORS.textLight,
    marginBottom: 8, letterSpacing: 0.6, textTransform: 'uppercase',
  },
  field: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 13, marginBottom: 14, backgroundColor: COLORS.soft,
  },
  input: { flex: 1, fontSize: 15, color: COLORS.text, padding: 0, fontWeight: '600' },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 16, marginTop: 4,
  },
  btnText: { fontSize: 16, fontWeight: '900', color: COLORS.bannerDark },
  hint: {
    flexDirection: 'row', gap: 8, marginTop: 14, backgroundColor: COLORS.violetSoft,
    borderRadius: 14, padding: 12, alignItems: 'flex-start',
  },
  hintText: { flex: 1, fontSize: 12, color: colors.textMuted, lineHeight: 18 },

  pills: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18, justifyContent: 'center',
  },
  pill: {
    backgroundColor: COLORS.bannerDark, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14,
  },
  pillText: { color: COLORS.primary, fontSize: 11, fontWeight: '800' },
  note: {
    textAlign: 'center', fontSize: 12, color: colors.textMuted, marginTop: 16, lineHeight: 18,
  },
  api: { textAlign: 'center', fontSize: 10, color: colors.textLight, marginTop: 6 },
});
