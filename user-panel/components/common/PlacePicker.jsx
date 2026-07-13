import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  TextInput,
  FlatList,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { searchPlaces } from '../../constants/cities';

/**
 * Searchable place of birth picker (cities list + custom entry).
 */
export default function PlacePicker({
  label = 'Place of Birth',
  value,
  onChange,
  placeholder = 'Select city / place',
  style,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const results = useMemo(() => searchPlaces(query, 50), [query]);

  const openModal = () => {
    setQuery(value || '');
    setOpen(true);
  };

  const pick = (place) => {
    onChange?.(place);
    setOpen(false);
  };

  const useTyped = () => {
    const t = query.trim();
    if (t.length >= 2) {
      onChange?.(t);
      setOpen(false);
    }
  };

  return (
    <View style={[styles.wrap, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity style={styles.field} onPress={openModal} activeOpacity={0.85}>
        <Ionicons name="location" size={18} color={COLORS.primaryDark} />
        <Text style={[styles.fieldText, !value && styles.placeholder]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={COLORS.textLight} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>Select place of birth</Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchRow}>
              <Ionicons name="search" size={18} color={COLORS.textLight} />
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder="Search city… e.g. Delhi, Mumbai"
                placeholderTextColor={COLORS.textLight}
                autoFocus={Platform.OS !== 'web'}
              />
            </View>

            <FlatList
              data={results}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              style={styles.list}
              ListEmptyComponent={
                <Text style={styles.empty}>No match — type your city and tap Use below</Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.row} onPress={() => pick(item)} activeOpacity={0.8}>
                  <Ionicons name="location-outline" size={16} color={COLORS.primaryDark} />
                  <Text style={styles.rowText}>{item}</Text>
                </TouchableOpacity>
              )}
            />

            {query.trim().length >= 2 ? (
              <TouchableOpacity style={styles.customBtn} onPress={useTyped}>
                <Text style={styles.customText}>Use “{query.trim()}”</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
  },
  fieldText: { flex: 1, fontSize: 16, fontWeight: '600', color: COLORS.text },
  placeholder: { color: COLORS.textLight, fontWeight: '500' },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    height: '75%',
  },
  sheetHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sheetTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text, padding: 0 },
  list: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.borderLight,
  },
  rowText: { fontSize: 14, fontWeight: '600', color: COLORS.text, flex: 1 },
  empty: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginTop: 24,
    fontSize: 13,
  },
  customBtn: {
    marginTop: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  customText: { fontWeight: '800', color: COLORS.bannerDark, fontSize: 14 },
});
