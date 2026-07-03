import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

const BADGES = [
  { icon: 'lock-closed-outline', label: 'Private &\nConfidential' },
  { icon: 'id-card-outline', label: 'Verified\nAstrologers' },
  { icon: 'shield-checkmark-outline', label: 'Secure\nPayments' },
];

export default function TrustBadges() {
  return (
    <View style={styles.container}>
      {BADGES.map((b) => (
        <View key={b.label} style={styles.item}>
          <View style={styles.circle}>
            <Ionicons name={b.icon} size={22} color={COLORS.textSecondary} />
          </View>
          <Text style={styles.label}>{b.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 14,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  item: { alignItems: 'center', flex: 1 },
  circle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 15,
    fontWeight: '500',
  },
});