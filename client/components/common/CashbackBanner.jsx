import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../../constants/colors';

function CoinIcon({ size = 40 }) {
  return (
    <View style={[styles.coinIcon, { width: size, height: size, borderRadius: size / 2 }]}>
      <Ionicons name="cash" size={size * 0.5} color={COLORS.primary} />
    </View>
  );
}

export default function CashbackBanner({ variant = 'light' }) {
  const router = useRouter();
  const isDark = variant === 'dark';

  if (isDark) {
    return (
      <View style={styles.darkBanner}>
        <View style={styles.darkContent}>
          <Text style={styles.darkTitle}>100% CASHBACK!</Text>
          <Text style={styles.darkSub}>on your first recharge</Text>
          <TouchableOpacity
            style={styles.rechargeBtn}
            onPress={() => router.push('/wallet/add-money')}
            activeOpacity={0.85}
          >
            <Text style={styles.rechargeText}>RECHARGE NOW</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.coinArea}>
          <CoinIcon size={56} />
        </View>
        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.lightBanner}>
      <CoinIcon size={36} />
      <View style={styles.lightCenter}>
        <Text style={styles.lightTitle}>100% Cashback!</Text>
        <View style={styles.lineRow}>
          <View style={styles.line} />
          <Text style={styles.lineText}>ON FIRST RECHARGE</Text>
          <View style={styles.line} />
        </View>
        <TouchableOpacity
          style={styles.rechargeBtn}
          onPress={() => router.push('/wallet/add-money')}
          activeOpacity={0.85}
        >
          <Text style={styles.rechargeText}>RECHARGE NOW</Text>
        </TouchableOpacity>
      </View>
      <CoinIcon size={36} />
    </View>
  );
}

const styles = StyleSheet.create({
  darkBanner: {
    backgroundColor: COLORS.bannerDark,
    marginHorizontal: 14,
    borderRadius: 12,
    padding: 18,
    marginBottom: 14,
    overflow: 'hidden',
    minHeight: 130,
  },
  darkContent: { zIndex: 1, maxWidth: '62%' },
  darkTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  darkSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    marginBottom: 12,
  },
  rechargeBtn: {
    backgroundColor: COLORS.yellow,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  rechargeText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  coinArea: {
    position: 'absolute',
    right: 18,
    top: 28,
  },
  coinIcon: {
    backgroundColor: 'rgba(253, 185, 19, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(253, 185, 19, 0.35)',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: { backgroundColor: COLORS.primary, width: 16 },
  lightBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 14,
    marginBottom: 8,
    gap: 10,
  },
  lightCenter: { alignItems: 'center', flex: 1 },
  lightTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    gap: 8,
  },
  line: { flex: 1, height: 1, backgroundColor: COLORS.border, maxWidth: 40 },
  lineText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' },
});