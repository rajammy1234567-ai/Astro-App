import { View, Text, TextInput, Switch, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../constants/theme';
import ImageField from './ImageField';

export default function FormFields({ fields, form, setForm }) {
  return fields.map((field) => (
    <View key={field.key}>
      {field.type === 'checkbox' ? (
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{field.checkboxLabel || field.label}</Text>
          <Switch
            value={!!form[field.key]}
            onValueChange={(v) => setForm({ ...form, [field.key]: v })}
            trackColor={{ true: colors.primary }}
          />
        </View>
      ) : field.type === 'select' ? (
        <>
          <Text style={styles.label}>{field.label}</Text>
          <View style={styles.selectRow}>
            {field.options.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.chip, form[field.key] === opt.value && styles.chipActive]}
                onPress={() => setForm({ ...form, [field.key]: opt.value })}
              >
                <Text style={[styles.chipText, form[field.key] === opt.value && styles.chipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      ) : field.type === 'image' ? (
        <ImageField
          label={field.label}
          value={form[field.key]}
          onChange={(v) => setForm({ ...form, [field.key]: v })}
          placeholder={field.placeholder}
        />
      ) : field.type === 'textarea' ? (
        <>
          <Text style={styles.label}>{field.label}</Text>
          <TextInput
            style={[styles.input, { minHeight: (field.rows || 3) * 28 }]}
            placeholder={field.label}
            placeholderTextColor={colors.textMuted}
            multiline
            value={String(form[field.key] ?? '')}
            onChangeText={(v) => setForm({ ...form, [field.key]: v })}
          />
        </>
      ) : (
        <>
          <Text style={styles.label}>{field.label}</Text>
          <TextInput
            style={styles.input}
            placeholder={field.placeholder || field.label}
            placeholderTextColor={colors.textMuted}
            keyboardType={field.type === 'number' ? 'numeric' : 'default'}
            value={String(form[field.key] ?? '')}
            onChangeText={(v) => setForm({ ...form, [field.key]: v })}
          />
        </>
      )}
    </View>
  ));
}

const styles = StyleSheet.create({
  label: { fontSize: 13, color: colors.textMuted, marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, padding: 14, color: colors.text, marginBottom: 8,
  },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 4 },
  switchLabel: { color: colors.text, flex: 1, marginRight: 12 },
  selectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, color: colors.textMuted },
  chipTextActive: { color: '#0f172a', fontWeight: '700' },
});