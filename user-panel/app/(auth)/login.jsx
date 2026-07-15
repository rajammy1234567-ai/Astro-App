import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Screen from '../../components/common/Screen';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import AppLogo from '../../components/common/AppLogo';
import { COLORS } from '../../constants/colors';
import { SHADOW_LG } from '../../constants/theme';
import { hasCompleteProfile } from '../../utils/birthDetails';
import { getApiBaseUrl } from '../../utils/platform';
import {
  wakeServer,
  wakeStatusMessage,
  isRemoteApi,
  isRenderApi,
} from '../../utils/serverHealth';

/** Accepts normal emails; trims spaces (mobile keyboards add them sometimes) */
const isValidEmail = (email) => {
  const e = String(email || '').trim().toLowerCase();
  // simple + practical: a@b.c
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
};

function showNativeAlert(title, message) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(`${title}\n\n${message}`);
    return;
  }
  const { Alert } = require('react-native');
  Alert.alert(title, message);
}

/** Web autofill sometimes skips onChangeText — also read nativeEvent / target */
function pickText(textOrEvent) {
  if (typeof textOrEvent === 'string') return textOrEvent;
  const e = textOrEvent;
  const fromNative = e?.nativeEvent?.text;
  if (typeof fromNative === 'string') return fromNative;
  const fromTarget = e?.target?.value ?? e?.currentTarget?.value;
  if (typeof fromTarget === 'string') return fromTarget;
  return '';
}

function CheckRow({ ok, label }) {
  return (
    <View style={styles.checkRow}>
      <Ionicons
        name={ok ? 'checkmark-circle' : 'ellipse-outline'}
        size={16}
        color={ok ? COLORS.success : COLORS.textLight}
      />
      <Text style={[styles.checkText, ok && styles.checkTextOk]}>{label}</Text>
    </View>
  );
}

export default function LoginScreen() {
  const { mode } = useLocalSearchParams();
  const [authMode, setAuthMode] = useState(mode === 'signup' ? 'signup' : 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [localError, setLocalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [serverOk, setServerOk] = useState(null);
  const [checkingServer, setCheckingServer] = useState(true);
  const [serverStatus, setServerStatus] = useState('Server check…');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { register, login, authLoading, error, clearError } = useAuth();
  const apiUrl = getApiBaseUrl();
  const remoteApi = isRemoteApi(apiUrl);

  // Don't lock form during background wake — submit will wake if needed
  const busy = authLoading || submitting;

  useEffect(() => {
    clearError();
    setLocalError('');
    setSuccessMsg('');
  }, [authMode, clearError]);

  // Wake Render (or check local) on login screen open — login feels fast after this
  useEffect(() => {
    let cancelled = false;
    setCheckingServer(true);
    setServerOk(null);
    setServerStatus(remoteApi ? 'Server wake start…' : 'Server check…');

    wakeServer({
      maxMs: remoteApi ? 75000 : 8000,
      onProgress: (info) => {
        if (!cancelled) setServerStatus(wakeStatusMessage(info));
      },
    }).then((result) => {
      if (cancelled) return;
      setServerOk(result.ok);
      setCheckingServer(false);
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
              ? 'Server abhi slow/sleep — Login dabao, hum dubara try karenge'
              : '✗ Server offline — cd server → npm run dev')
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [remoteApi]);

  const normalizedEmail = email.trim().toLowerCase();
  const nameOk = authMode === 'login' || name.trim().length >= 2;
  const emailOk = isValidEmail(normalizedEmail);
  const passwordOk = password.length >= 6;
  const formReady = nameOk && emailOk && passwordOk;

  const missing = useMemo(() => {
    const list = [];
    if (authMode === 'signup' && name.trim().length < 2) {
      list.push(name.trim().length === 0 ? 'Full name likho' : 'Name min 2 letters');
    }
    if (!email.trim()) list.push('Email likho');
    else if (!emailOk) list.push('Sahi email likho (jaise you@gmail.com)');
    if (!password) list.push('Password likho');
    else if (password.length < 6) list.push(`Password me ${6 - password.length} aur character chahiye`);
    return list;
  }, [authMode, name, email, emailOk, password]);

  const goAfterAuth = (u) => {
    if (!hasCompleteProfile(u)) {
      router.replace('/onboarding/profile');
    } else {
      router.replace('/(tabs)/home');
    }
  };

  const handleSubmit = async () => {
    if (busy) return;
    clearError();
    setLocalError('');
    setSuccessMsg('');

    // Always allow press — show clear errors instead of grey locked button
    if (!formReady) {
      setLocalError(missing.join('\n') || 'Please fill all fields');
      return;
    }

    // Local offline: hard block. Remote (Render): still try after wake.
    if (serverOk === false && !remoteApi) {
      setLocalError(
        `Server offline. PC pe:\ncd server\nnpm run dev\n\nAPI: ${apiUrl}`
      );
      return;
    }

    const payload = {
      email: normalizedEmail,
      password,
      ...(authMode === 'signup' ? { name: name.trim() } : {}),
    };

    setSubmitting(true);
    try {
      // Ensure server is awake before auth (Render free cold-start)
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
          setLocalError(
            woke.message ||
              `Server se connect nahi hua.\nAPI: ${apiUrl}`
          );
          return;
        }
        setServerStatus('✓ Server ready — logging in…');
      }

      const result =
        authMode === 'signup' ? await register(payload) : await login(payload);

      if (result.meta.requestStatus === 'fulfilled') {
        const u = result.payload?.user;
        if (authMode === 'signup') {
          setSuccessMsg(
            result.payload?.isNewUser
              ? 'Account ban gaya! ₹100 bonus. Profile open ho raha…'
              : 'Account ready. Profile open ho raha…'
          );
          setTimeout(() => goAfterAuth(u), 350);
        } else {
          goAfterAuth(u);
        }
        return;
      }

      let msg =
        result.payload?.message ||
        result.error?.message ||
        (authMode === 'signup' ? 'Account create nahi hua' : 'Login fail');

      if (result.payload?.networkError || /connect|network|timeout/i.test(msg)) {
        msg = remoteApi
          ? `Server slow / sleep (Render free).\n1) 30 sec wait karke dubara Login\n2) Ya local: START-EVERYTHING.bat\n\nAPI: ${apiUrl}`
          : `Server se connect nahi hua.\n\n1) cd server → npm run dev\n2) Expo restart\n\nAPI: ${apiUrl}`;
      }
      if (/already registered/i.test(msg)) {
        msg = 'Yeh email pehle se hai. Upar Login tab dabao.';
      }

      setLocalError(msg);
    } catch (err) {
      setLocalError(err?.message || 'Kuch galat ho gaya. Dobara try karo.');
    } finally {
      setSubmitting(false);
    }
  };

  const displayError = localError || error;
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
          <Text style={styles.tagline}>India&apos;s best astrology app</Text>
        </View>

        <View
          style={[
            styles.serverPill,
            serverOk === true && styles.serverOk,
            serverOk === false && styles.serverBad,
          ]}
        >
          {checkingServer ? (
            <Text style={styles.serverText}>{serverStatus}</Text>
          ) : serverOk ? (
            <Text style={styles.serverText}>{serverStatus || '✓ Server connected'}</Text>
          ) : (
            <Text style={styles.serverText}>
              {serverStatus ||
                (remoteApi
                  ? 'Server sleep mode — Login dabao, wake ho jayega'
                  : '✗ Server offline — pehle PC pe: cd server → npm run dev')}
            </Text>
          )}
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
              <Text
                style={[styles.authModeText, authMode === 'signup' && styles.authModeTextActive]}
              >
                Create Account
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.cardTitle}>
            {authMode === 'signup' ? 'Create your account' : 'Welcome back'}
          </Text>

          {authMode === 'signup' && (
            <>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={[styles.input, inputBorder('name')]}
                value={name}
                onChangeText={(t) => setName(pickText(t))}
                onChange={(e) => setName(pickText(e))}
                placeholder="Apna naam (min 2 letters)"
                placeholderTextColor={COLORS.textLight}
                autoComplete="name"
                textContentType="name"
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
              />
            </>
          )}

          <Text style={styles.label}>Email Address *</Text>
          <View style={[styles.fieldRow, inputBorder('email')]}>
            <Ionicons name="mail-outline" size={18} color={COLORS.textSecondary} />
            <TextInput
              style={styles.fieldInput}
              value={email}
              onChangeText={(t) => setEmail(pickText(t))}
              onChange={(e) => setEmail(pickText(e))}
              placeholder="you@gmail.com"
              placeholderTextColor={COLORS.textLight}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          <Text style={styles.label}>Password *</Text>
          <View style={[styles.fieldRow, inputBorder('password')]}>
            <Ionicons name="lock-closed-outline" size={18} color={COLORS.textSecondary} />
            <TextInput
              style={styles.fieldInput}
              value={password}
              onChangeText={(t) => setPassword(pickText(t))}
              onChange={(e) => setPassword(pickText(e))}
              placeholder="Kam se kam 6 characters"
              placeholderTextColor={COLORS.textLight}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete={authMode === 'signup' ? 'new-password' : 'password'}
              textContentType={authMode === 'signup' ? 'newPassword' : 'password'}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
            />
            <TouchableOpacity
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Live checklist — user sees exactly why button was grey before */}
          <View style={styles.checklist}>
            {authMode === 'signup' && (
              <CheckRow ok={name.trim().length >= 2} label={`Name (${name.trim().length}/2+)`} />
            )}
            <CheckRow ok={emailOk} label={emailOk ? 'Email OK' : 'Valid email (you@gmail.com)'} />
            <CheckRow
              ok={passwordOk}
              label={
                passwordOk
                  ? 'Password OK (6+)'
                  : `Password ${password.length}/6 characters`
              }
            />
          </View>

          {successMsg ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={styles.successText}>{successMsg}</Text>
            </View>
          ) : null}

          {displayError ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={COLORS.error} />
              <Text style={styles.error}>{displayError}</Text>
            </View>
          ) : null}

          {/* ALWAYS clickable — only loading disables */}
          <TouchableOpacity
            style={[styles.continueBtn, formReady ? styles.continueActive : styles.continueReady]}
            onPress={handleSubmit}
            disabled={busy}
            activeOpacity={0.85}
          >
            {busy ? (
              <View style={styles.btnRow}>
                <ActivityIndicator size="small" color={COLORS.text} />
                <Text style={[styles.continueText, styles.continueTextActive]}>
                  {serverOk !== true && remoteApi
                    ? 'Server wake…'
                    : authMode === 'signup'
                      ? 'Creating…'
                      : 'Logging in…'}
                </Text>
              </View>
            ) : (
              <Text style={[styles.continueText, styles.continueTextActive]}>
                {authMode === 'signup' ? 'CREATE ACCOUNT' : 'LOGIN'}
              </Text>
            )}
          </TouchableOpacity>

          {!formReady ? (
            <Text style={styles.formHint}>
              Upar green ✓ complete karo, phir button dabao. Incomplete pe bhi button dab sakte ho —
              error dikhega.
            </Text>
          ) : (
            <Text style={[styles.formHint, { color: COLORS.success }]}>
              Sab ready hai — CREATE ACCOUNT dabao ✓
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
          style={styles.switchMode}
        >
          <Text style={styles.switchModeText}>
            {authMode === 'login' ? 'New user? Create Account' : 'Already have account? Login'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.apiHint}>
          {remoteApi
            ? `Cloud API (Render free pe pehli baar 30–60s lag sakta hai)\n${apiUrl}`
            : `Local API · fast\n${apiUrl}`}
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
    marginBottom: 16,
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
  serverPill: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    backgroundColor: COLORS.borderLight,
  },
  serverOk: { backgroundColor: COLORS.successLight },
  serverBad: { backgroundColor: COLORS.errorLight },
  serverText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 17,
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
    backgroundColor: COLORS.surface,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
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
  checklist: {
    backgroundColor: COLORS.cream || COLORS.primaryLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    gap: 6,
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkText: { fontSize: 12, color: COLORS.textLight, fontWeight: '600' },
  checkTextOk: { color: COLORS.success },
  formHint: {
    marginTop: 10,
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  switchMode: { alignItems: 'center', marginTop: 16, marginBottom: 8 },
  switchModeText: { fontSize: 14, color: COLORS.link, fontWeight: '600' },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.successLight,
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  successText: {
    flex: 1,
    color: COLORS.success,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  continueReady: {
    // Always looks tappable even if form incomplete
    backgroundColor: COLORS.yellow,
    opacity: 0.85,
  },
  continueActive: {
    backgroundColor: COLORS.yellow,
    opacity: 1,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  continueText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  continueTextActive: {
    color: COLORS.text,
  },
  apiHint: {
    fontSize: 10,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 12,
  },
});
