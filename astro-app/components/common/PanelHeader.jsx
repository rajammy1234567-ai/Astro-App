import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, colors } from '../../constants/theme';

/**
 * Premium cosmic header for partner panel
 */
export default function PanelHeader({
  title,
  subtitle,
  right,
  onBack,
  dark = true,
  children,
  large = false,
}) {
  return (
    <View style={[styles.wrap, dark ? styles.dark : styles.light, large && styles.wrapLarge]}>
      {/* decorative layers (fake gradient depth) */}
      {dark && (
        <>
          <View style={styles.blob1} />
          <View style={styles.blob2} />
          <View style={styles.ring} />
          <View style={styles.starA} />
          <View style={styles.starB} />
          <View style={styles.starC} />
        </>
      )}

      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.row}>
          {onBack ? (
            <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={20} color={dark ? '#fff' : colors.text} />
            </TouchableOpacity>
          ) : (
            <View style={styles.brandMark}>
              <Ionicons name="planet" size={18} color={COLORS.primary} />
            </View>
          )}

          <View style={styles.titles}>
            <Text style={[styles.kicker, !dark && styles.kickerLight]}>ASTROTALK PARTNER</Text>
            <Text style={[styles.title, !dark && styles.titleLight, large && styles.titleLarge]} numberOfLines={1}>
              {title}
            </Text>
            {!!subtitle && (
              <Text style={[styles.sub, !dark && styles.subLight]} numberOfLines={2}>
                {subtitle}
              </Text>
            )}
          </View>

          {right || <View style={{ width: 40 }} />}
        </View>

        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    overflow: 'hidden',
  },
  wrapLarge: {
    paddingBottom: 22,
  },
  dark: {
    backgroundColor: COLORS.bannerDark,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  light: {
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  safe: { zIndex: 2 },
  blob1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: COLORS.bannerMid,
    top: -60,
    right: -40,
    opacity: 0.9,
  },
  blob2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(109,40,217,0.35)',
    bottom: -30,
    left: -20,
  },
  ring: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    borderColor: 'rgba(245,197,24,0.18)',
    top: 20,
    right: 70,
  },
  starA: {
    position: 'absolute', top: 22, right: 28, width: 5, height: 5,
    borderRadius: 3, backgroundColor: COLORS.primary, opacity: 0.95,
  },
  starB: {
    position: 'absolute', top: 48, right: 52, width: 3, height: 3,
    borderRadius: 2, backgroundColor: '#fff', opacity: 0.45,
  },
  starC: {
    position: 'absolute', top: 70, left: 30, width: 4, height: 4,
    borderRadius: 2, backgroundColor: '#fff', opacity: 0.3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 6,
  },
  brandMark: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(245,197,24,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(245,197,24,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titles: { flex: 1 },
  kicker: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1.4,
    marginBottom: 3,
  },
  kickerLight: { color: COLORS.primaryDark },
  title: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.3 },
  titleLarge: { fontSize: 24 },
  titleLight: { color: colors.text },
  sub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.58)',
    marginTop: 3,
    fontWeight: '500',
    lineHeight: 16,
  },
  subLight: { color: colors.textMuted },
});
