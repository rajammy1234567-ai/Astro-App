import { View, TextInput, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

/**
 * Safe text input for web + native.
 * Avoids RN-web "Unexpected text node" by never rendering bare strings in Views.
 */
export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  maxLength,
  error,
  secureTextEntry = false,
  style,
  prefix,
  editable = true,
}) {
  const safeValue = value == null ? '' : String(value);
  const showLabel = typeof label === 'string' && label.trim().length > 0;
  const showPrefix = typeof prefix === 'string' && prefix.length > 0;
  const showError = typeof error === 'string' && error.trim().length > 0;

  return (
    <View style={[styles.container, style]}>
      {showLabel ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputWrapper, showError ? styles.inputError : null]}>
        {showPrefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          style={styles.input}
          value={safeValue}
          onChangeText={(t) => onChangeText?.(t == null ? '' : String(t))}
          placeholder={placeholder || ''}
          placeholderTextColor={COLORS.textLight}
          keyboardType={keyboardType}
          maxLength={maxLength}
          secureTextEntry={secureTextEntry}
          editable={editable}
        />
      </View>
      {showError ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 16,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  prefix: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    color: COLORS.text,
    fontSize: 16,
  },
  error: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
  },
});
