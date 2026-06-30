import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import AppLogo from '../../components/common/AppLogo';
import { COLORS } from '../../constants/colors';

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const SCREEN_WIDTH = Dimensions.get('window').width;

export default function LoginScreen() {
  const [loginType, setLoginType] = useState('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  const [segmentWidth, setSegmentWidth] = useState(0);
  const [pagerWidth, setPagerWidth] = useState(SCREEN_WIDTH - 88);
  const pagerRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sendOtp, otpSending, error, clearError } = useAuth();

  useEffect(() => {
    clearError();
  }, [loginType, clearError]);

  const switchTab = (type, fromScroll = false) => {
    if (type === loginType && !fromScroll) return;
    Keyboard.dismiss();
    clearError();
    setFocusedField(null);
    setLoginType(type);

    const index = type === 'phone' ? 0 : 1;
    Animated.spring(slideAnim, {
      toValue: index,
      useNativeDriver: true,
      friction: 8,
      tension: 80,
    }).start();

    if (!fromScroll && pagerRef.current && pagerWidth > 0) {
      pagerRef.current.scrollTo({ x: index * pagerWidth, animated: true });
    }
  };

  const onPagerScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    if (pagerWidth <= 0) return;
    slideAnim.setValue(offsetX / pagerWidth);
  };

  const onPagerScrollEnd = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    if (pagerWidth <= 0) return;
    const index = Math.round(offsetX / pagerWidth);
    const type = index === 0 ? 'phone' : 'email';
    if (type !== loginType) {
      switchTab(type, true);
    }
  };

  const canContinue = loginType === 'phone'
    ? phone.length === 10
    : isValidEmail(email.trim());

  const handleContinue = async () => {
    if (!canContinue || otpSending) return;
    clearError();

    const payload = loginType === 'phone'
      ? { loginType: 'phone', phone }
      : { loginType: 'email', email: email.trim().toLowerCase() };

    const result = await sendOtp(payload);

    if (result.meta.requestStatus === 'fulfilled') {
      const { viaEmail, devOtp } = result.payload || {};
      router.push({
        pathname: '/(auth)/otp',
        params: loginType === 'phone'
          ? { loginType: 'phone', phone, devOtp: devOtp || '123456' }
          : {
              loginType: 'email',
              email: email.trim().toLowerCase(),
              viaEmail: viaEmail ? '1' : '0',
              devOtp: devOtp || '',
            },
      });
    }
  };

  const inputBorder = (field) => ({
    borderColor: focusedField === field ? COLORS.primary : COLORS.border,
    borderWidth: focusedField === field ? 1.5 : 1,
  });

  const indicatorWidth = segmentWidth > 0 ? (segmentWidth - 8) / 2 : 0;
  const indicatorTranslate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, indicatorWidth],
  });

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
          <Text style={styles.cardTitle}>Login or Sign Up</Text>

          <View
            style={styles.segment}
            onLayout={(e) => setSegmentWidth(e.nativeEvent.layout.width)}
          >
            {indicatorWidth > 0 ? (
              <Animated.View
                style={[
                  styles.segmentIndicator,
                  {
                    width: indicatorWidth,
                    transform: [{ translateX: indicatorTranslate }],
                  },
                ]}
              />
            ) : null}

            <TouchableOpacity
              style={styles.segmentBtn}
              onPress={() => switchTab('phone')}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8 }}
            >
              <Ionicons
                name="call-outline"
                size={16}
                color={loginType === 'phone' ? COLORS.text : COLORS.textSecondary}
              />
              <Text style={[styles.segmentText, loginType === 'phone' && styles.segmentTextActive]}>
                Mobile
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.segmentBtn}
              onPress={() => switchTab('email')}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8 }}
            >
              <Ionicons
                name="mail-outline"
                size={16}
                color={loginType === 'email' ? COLORS.text : COLORS.textSecondary}
              />
              <Text style={[styles.segmentText, loginType === 'email' && styles.segmentTextActive]}>
                Email
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.swipeHint}>Swipe left/right or tap tab to switch</Text>

          <ScrollView
            ref={pagerRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onPagerScroll}
            onMomentumScrollEnd={onPagerScrollEnd}
            scrollEventThrottle={16}
            nestedScrollEnabled
            keyboardShouldPersistTaps="always"
            style={styles.pager}
            onLayout={(e) => setPagerWidth(e.nativeEvent.layout.width)}
          >
            <View style={[styles.page, { width: pagerWidth }]}>
              <Text style={styles.label}>Mobile Number</Text>
              <View style={styles.phoneRow}>
                <View style={[styles.countryBox, inputBorder('country')]}>
                  <Text style={styles.flag}>🇮🇳</Text>
                  <Text style={styles.code}>+91</Text>
                </View>
                <TextInput
                  style={[styles.phoneInput, inputBorder('phone')]}
                  value={phone}
                  onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit number"
                  placeholderTextColor={COLORS.textLight}
                  keyboardType="phone-pad"
                  maxLength={10}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              <Text style={styles.hint}>
                {phone.length > 0 && phone.length < 10
                  ? `${10 - phone.length} more digit${10 - phone.length === 1 ? '' : 's'} needed`
                  : 'OTP will be sent via SMS (dev: 123456)'}
              </Text>
            </View>

            <View style={[styles.page, { width: pagerWidth }]}>
              <Text style={styles.label}>Email Address</Text>
              <View style={[styles.emailRow, inputBorder('email')]}>
                <Ionicons name="mail-outline" size={18} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.emailInput}
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
              <Text style={styles.hint}>
                {email.length > 0 && !isValidEmail(email.trim())
                  ? 'Enter a valid email address'
                  : 'OTP will be sent to your Gmail inbox'}
              </Text>
            </View>
          </ScrollView>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={COLORS.error} />
              <Text style={styles.error}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.continueBtn, canContinue && !otpSending && styles.continueActive]}
            onPress={handleContinue}
            disabled={!canContinue || otpSending}
            activeOpacity={0.85}
          >
            {otpSending ? (
              <View style={styles.btnRow}>
                <ActivityIndicator size="small" color={COLORS.text} />
                <Text style={[styles.continueText, styles.continueTextActive]}>Sending OTP...</Text>
              </View>
            ) : (
              <Text style={[styles.continueText, canContinue && styles.continueTextActive]}>
                GET OTP
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.terms}>
          By continuing, you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Use</Text> &{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
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
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 18,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: COLORS.borderLight,
    borderRadius: 10,
    padding: 4,
    marginBottom: 8,
    position: 'relative',
  },
  segmentIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    zIndex: 1,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  segmentTextActive: {
    color: COLORS.text,
    fontWeight: '700',
  },
  swipeHint: {
    fontSize: 11,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 12,
  },
  pager: {
    marginBottom: 4,
  },
  page: {
    paddingRight: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 10,
  },
  countryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 6,
    backgroundColor: COLORS.surface,
  },
  flag: { fontSize: 16 },
  code: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  phoneInput: {
    flex: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
    backgroundColor: COLORS.surface,
  },
  emailInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    padding: 0,
    minHeight: 24,
  },
  hint: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 8,
    minHeight: 16,
  },
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