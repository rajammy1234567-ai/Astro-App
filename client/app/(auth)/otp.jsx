import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../constants/colors';

export default function OtpScreen() {
  const { phone, email, loginType, viaEmail, devOtp } = useLocalSearchParams();
  const [otp, setOtp] = useState('');
  const [resending, setResending] = useState(false);
  const [sentViaEmail, setSentViaEmail] = useState(viaEmail === '1');
  const [devOtpHint, setDevOtpHint] = useState(
    viaEmail === '1' ? '' : (devOtp || '123456')
  );
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { verifyOtp, sendOtp, verifying, otpSending, error, clearError } = useAuth();
  const canVerify = otp.length === 6;
  const isEmail = loginType === 'email' || !!email;
  const showDevHint = !sentViaEmail;

  const handleVerify = async () => {
    if (!canVerify) return;
    clearError();

    const payload = isEmail
      ? { loginType: 'email', email, otp }
      : { loginType: 'phone', phone, otp };

    const result = await verifyOtp(payload);

    if (result.meta.requestStatus === 'fulfilled') {
      const isNew = result.payload?.isNewUser;
      if (isNew) {
        Alert.alert(
          'Welcome to Astrotalk!',
          'Account created successfully. ₹100 welcome bonus added to your wallet.',
          [{ text: 'Get Started', onPress: () => router.replace('/(tabs)/home') }]
        );
      } else {
        router.replace('/(tabs)/home');
      }
    }
  };

  const handleResend = async () => {
    if (otpSending) return;
    setResending(true);
    clearError();
    const payload = isEmail
      ? { loginType: 'email', email }
      : { loginType: 'phone', phone };

    const result = await sendOtp(payload);
    setResending(false);

    if (result.meta.requestStatus === 'fulfilled') {
      const { viaEmail: emailSent, devOtp: newDevOtp } = result.payload || {};
      if (emailSent) {
        setSentViaEmail(true);
        setDevOtpHint('');
        Alert.alert('OTP Sent', 'Check your Gmail inbox and spam folder.');
      } else {
        setSentViaEmail(false);
        if (newDevOtp) setDevOtpHint(newDevOtp);
        Alert.alert('OTP Sent', `Dev mode OTP: ${newDevOtp || devOtpHint}`);
      }
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()} activeOpacity={0.7}>
        <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.iconWrap}>
        <Ionicons name="shield-checkmark-outline" size={40} color={COLORS.text} />
      </View>

      <Text style={styles.title}>Enter OTP</Text>
      <Text style={styles.subtitle}>
        {sentViaEmail
          ? `OTP sent to ${email}. Check inbox & spam folder.`
          : `Sent to ${isEmail ? email : `+91 ${phone}`}`}
      </Text>

      <TextInput
        style={styles.otpInput}
        value={otp}
        onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 6))}
        placeholder="123456"
        placeholderTextColor={COLORS.textLight}
        keyboardType="number-pad"
        maxLength={6}
        autoFocus
      />

      {showDevHint ? (
        <Text style={styles.devHint}>Dev mode OTP: {devOtpHint || '123456'}</Text>
      ) : null}

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : null}

      <TouchableOpacity
        style={[styles.continueBtn, canVerify && styles.continueActive]}
        onPress={handleVerify}
        disabled={!canVerify || verifying}
        activeOpacity={0.85}
      >
        <Text style={[styles.continueText, canVerify && styles.continueTextActive]}>
          {verifying ? 'VERIFYING...' : 'VERIFY & CONTINUE'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.resend} onPress={handleResend} disabled={resending || otpSending}>
        <Text style={styles.resendText}>Didn't receive OTP? </Text>
        <Text style={styles.resendLink}>{resending || otpSending ? 'Sending...' : 'Resend'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 28,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    padding: 8,
    alignSelf: 'flex-start',
  },
  backText: { fontSize: 15, color: COLORS.text },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.yellowLight,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 32,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    marginBottom: 28,
    textAlign: 'center',
  },
  otpInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 22,
    color: COLORS.text,
    letterSpacing: 10,
    textAlign: 'center',
    fontWeight: '600',
  },
  devHint: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
  },
  error: {
    color: COLORS.error,
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 18,
  },
  continueBtn: {
    backgroundColor: COLORS.continueDisabled,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  continueActive: { backgroundColor: COLORS.yellow },
  continueText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.continueText,
    letterSpacing: 1,
  },
  continueTextActive: { color: COLORS.text },
  resend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  resendText: { color: COLORS.textSecondary, fontSize: 14 },
  resendLink: { color: COLORS.text, fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
});