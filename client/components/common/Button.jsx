import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '../../constants/colors';

export default function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  size = 'md',
}) {
  const variants = {
    primary: { bg: COLORS.yellow, text: COLORS.text, border: COLORS.yellow },
    secondary: { bg: 'transparent', text: COLORS.text, border: COLORS.border },
    success: { bg: COLORS.chatBtn, text: '#FFF', border: COLORS.chatBtn },
    outline: { bg: COLORS.surface, text: COLORS.text, border: COLORS.border },
  };
  const v = variants[variant] || variants.primary;
  const isSmall = size === 'sm';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isSmall && styles.buttonSm,
        { backgroundColor: v.bg, borderColor: v.border },
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <Text style={[styles.text, isSmall && styles.textSm, { color: v.text }, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  buttonSm: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textSm: {
    fontSize: 13,
    fontWeight: '600',
  },
});