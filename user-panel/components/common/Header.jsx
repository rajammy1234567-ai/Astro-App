import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useScreenInsets } from '../../hooks/useScreenInsets';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

/**
 * Light cream header (app theme). `variant="dark"` kept as alias of light — no dark blue.
 * @param {string} [subtitle]
 */
export default function Header({
  title,
  subtitle,
  showBack = true,
  rightComponent,
  light = true,
  variant = 'light',
  onBack,
}) {
  const router = useRouter();
  const safe = useScreenInsets();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    // Avoid "GO_BACK was not handled" when no history stack
    if (typeof router.canGoBack === 'function' && router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: safe.top(4) }, light !== false && styles.light]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.row}>
        {showBack ? (
          <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.75}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {!!subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        {rightComponent || <View style={styles.placeholder} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cream,
    paddingBottom: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  light: { backgroundColor: COLORS.cream },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  titleBlock: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  title: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '500',
    textAlign: 'center',
  },
  placeholder: { width: 44 },
});