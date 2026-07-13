import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import {
  MONTHS,
  daysInMonth,
  formatDobFromDate,
  parseDobToDate,
  toHtmlDateValue,
  fromHtmlDateValue,
} from '../../utils/dateTimeFormat';

const NOW = new Date();
const YEARS = Array.from({ length: 100 }, (_, i) => NOW.getFullYear() - i);

/**
 * Calendar-style DOB picker. Value format: DD/MM/YYYY
 */
export default function BirthDatePicker({
  label = 'Date of Birth',
  value,
  onChange,
  placeholder = 'Select date',
  style,
}) {
  const parsed = parseDobToDate(value);
  const [open, setOpen] = useState(false);
  const [y, setY] = useState(parsed?.getFullYear() || 1995);
  const [m, setM] = useState(parsed ? parsed.getMonth() : 0);
  const [d, setD] = useState(parsed?.getDate() || 15);

  const maxDay = daysInMonth(y, m);
  const days = useMemo(() => Array.from({ length: maxDay }, (_, i) => i + 1), [maxDay]);

  const openModal = () => {
    const p = parseDobToDate(value);
    if (p) {
      setY(p.getFullYear());
      setM(p.getMonth());
      setD(p.getDate());
    }
    setOpen(true);
  };

  const confirm = () => {
    const day = Math.min(d, daysInMonth(y, m));
    onChange?.(formatDobFromDate(new Date(y, m, day)));
    setOpen(false);
  };

  // Web: native calendar
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.wrap, style]}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <View style={styles.webRow}>
          <Ionicons name="calendar" size={18} color={COLORS.primaryDark} />
          <input
            type="date"
            value={toHtmlDateValue(parseDobToDate(value) || null)}
            max={toHtmlDateValue(NOW)}
            min="1925-01-01"
            onChange={(e) => onChange?.(fromHtmlDateValue(e.target.value))}
            style={webInputStyle}
          />
        </View>
        {value ? <Text style={styles.hint}>Selected: {value}</Text> : null}
      </View>
    );
  }

  return (
    <View style={[styles.wrap, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity style={styles.field} onPress={openModal} activeOpacity={0.85}>
        <Ionicons name="calendar" size={18} color={COLORS.primaryDark} />
        <Text style={[styles.fieldText, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={COLORS.textLight} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Select date of birth</Text>
            <View style={styles.cols}>
              <Col title="Day" data={days} selected={Math.min(d, maxDay)} onSelect={setD} />
              <Col
                title="Month"
                data={MONTHS}
                selected={MONTHS[m]}
                onSelect={(name) => setM(MONTHS.indexOf(name))}
              />
              <Col title="Year" data={YEARS} selected={y} onSelect={setY} />
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setOpen(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.okBtn} onPress={confirm}>
                <Text style={styles.okText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Col({ title, data, selected, onSelect }) {
  return (
    <View style={styles.col}>
      <Text style={styles.colTitle}>{title}</Text>
      <ScrollView style={styles.colScroll} showsVerticalScrollIndicator={false}>
        {data.map((item) => {
          const active = item === selected;
          return (
            <TouchableOpacity
              key={String(item)}
              style={[styles.colItem, active && styles.colItemOn]}
              onPress={() => onSelect(item)}
            >
              <Text style={[styles.colItemText, active && styles.colItemTextOn]}>{item}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const webInputStyle = {
  flex: 1,
  border: 'none',
  outline: 'none',
  fontSize: 16,
  fontWeight: '600',
  color: '#1A1A1A',
  backgroundColor: 'transparent',
  fontFamily: 'inherit',
  minHeight: 24,
  width: '100%',
};

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
  webRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
  },
  fieldText: { flex: 1, fontSize: 16, fontWeight: '600', color: COLORS.text },
  placeholder: { color: COLORS.textLight, fontWeight: '500' },
  hint: { marginTop: 6, fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
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
    maxHeight: '70%',
  },
  sheetTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  cols: { flexDirection: 'row', gap: 8, height: 220 },
  col: { flex: 1 },
  colTitle: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  colScroll: { flex: 1 },
  colItem: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 4,
  },
  colItemOn: { backgroundColor: COLORS.primary },
  colItemText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  colItemTextOn: { color: COLORS.bannerDark, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelText: { fontWeight: '700', color: COLORS.textSecondary },
  okBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  okText: { fontWeight: '800', color: COLORS.bannerDark },
});
