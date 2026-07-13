import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

const BADGES = [
  { icon: 'lock-closed', label: 'Private &\nConfidential', tint: '#F3E8FF' },
  { icon: 'ribbon', label: 'Verified\nAstrologers', tint: '#FFF3C4' },
  { icon: 'shield-checkmark', label: 'Secure\nPayments', tint: '#E8F5E9' },
];

export default function TrustBadges() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>Why millions trust us</Text>
      <View style={styles.container}>
        {BADGES.map((b) => (
          <View key={b.label} style={styles.item}>
            <View style={[styles.circle, { backgroundColor: b.tint }]}>
              <Ionicons name={b.icon} size={22} color={COLORS.bannerDark} />
            </View>
            <Text style={styles.label}>{b.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 18,
    marginBottom: 8,
    marginHorizontal: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...Platform.select({
      ios: {
        shadowColor: '#1E1033',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 1 },
    }),
  },
  heading: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  item: { alignItems: 'center', flex: 1 },
  circle: {
    width: 54,
    height: 54,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 15,
    fontWeight: '600',
  },
});
