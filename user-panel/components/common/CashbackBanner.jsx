import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../../constants/colors';

const BG =
  'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1000&h=500&fit=crop';

export default function CashbackBanner({ variant = 'light' }) {
  const router = useRouter();
  const isDark = variant === 'dark';

  if (isDark) {
    return (
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={() => router.push('/wallet/add-money')}
        style={styles.darkWrap}
      >
        <ImageBackground source={{ uri: BG }} style={styles.darkBanner} imageStyle={styles.darkImg}>
          <View style={styles.darkOverlay} />
          <View style={styles.darkContent}>
            <View style={styles.offerPill}>
              <Ionicons name="gift" size={12} color={COLORS.bannerDark} />
              <Text style={styles.offerPillText}>LIMITED OFFER</Text>
            </View>
            <Text style={styles.darkTitle}>100% CASHBACK</Text>
            <Text style={styles.darkSub}>on your first wallet recharge</Text>
            <View style={styles.rechargeBtn}>
              <Text style={styles.rechargeText}>RECHARGE NOW</Text>
              <Ionicons name="arrow-forward" size={14} color={COLORS.bannerDark} />
            </View>
          </View>
          <View style={styles.coinArea}>
            <View style={styles.coinBig}>
              <Ionicons name="wallet" size={28} color={COLORS.primary} />
            </View>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.lightBanner}>
      <View style={styles.coinIcon}>
        <Ionicons name="cash" size={20} color={COLORS.primary} />
      </View>
      <View style={styles.lightCenter}>
        <Text style={styles.lightTitle}>100% Cashback!</Text>
        <Text style={styles.lineText}>ON FIRST RECHARGE</Text>
        <TouchableOpacity
          style={styles.rechargeBtn}
          onPress={() => router.push('/wallet/add-money')}
          activeOpacity={0.85}
        >
          <Text style={styles.rechargeText}>RECHARGE NOW</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.coinIcon}>
        <Ionicons name="cash" size={20} color={COLORS.primary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  darkWrap: {
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: 18,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#1E1033',
        shadowOpacity: 0.2,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 },
      },
      android: { elevation: 4 },
    }),
  },
  darkBanner: {
    minHeight: 148,
    padding: 18,
    justifyContent: 'center',
  },
  darkImg: { borderRadius: 18 },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18, 6, 36, 0.72)',
    borderRadius: 18,
  },
  darkContent: { zIndex: 1, maxWidth: '72%' },
  offerPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 8,
  },
  offerPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.bannerDark,
    letterSpacing: 0.4,
  },
  darkTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  darkSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.88)',
    marginTop: 4,
    marginBottom: 14,
    fontWeight: '600',
  },
  rechargeBtn: {
    backgroundColor: COLORS.yellow,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rechargeText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.bannerDark,
    letterSpacing: 0.4,
  },
  coinArea: {
    position: 'absolute',
    right: 16,
    top: 36,
    zIndex: 1,
  },
  coinBig: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(253, 185, 19, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(253, 185, 19, 0.4)',
  },
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
  lineText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600', marginVertical: 6 },
  coinIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(253, 185, 19, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(253, 185, 19, 0.35)',
  },
});
