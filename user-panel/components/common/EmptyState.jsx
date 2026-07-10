import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

export default function EmptyState({ icon = 'file-tray-outline', title, subtitle, actionLabel, onAction }) {
  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={48} color={COLORS.textLight} />
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.action} onPress={onAction}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  title: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginTop: 12, textAlign: 'center' },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 6, textAlign: 'center', lineHeight: 20 },
  action: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 22,
  },
  actionText: { color: COLORS.text, fontSize: 14, fontWeight: '800' },
});