import { useState } from 'react';
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
  formatTimeOfBirth,
  parseTimeOfBirth,
  toHtmlTimeValue,
  fromHtmlTimeValue,
  pad2,
} from '../../utils/dateTimeFormat';

const HOURS12 = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const MERS = ['AM', 'PM'];

/**
 * Time of birth picker. Value format: "10:30 AM"
 */
export default function BirthTimePicker({
  label = 'Time of Birth',
  value,
  onChange,
  placeholder = 'Select time',
  style,
}) {
  const parsed = parseTimeOfBirth(value) || { hours24: 10, minutes: 0 };
  const [open, setOpen] = useState(false);

  let initH12 = parsed.hours24 % 12;
  if (initH12 === 0) initH12 = 12;
  const initMer = parsed.hours24 >= 12 ? 'PM' : 'AM';

  const [h12, setH12] = useState(initH12);
  const [min, setMin] = useState(parsed.minutes);
  const [mer, setMer] = useState(initMer);

  const openModal = () => {
    const p = parseTimeOfBirth(value) || { hours24: 10, minutes: 0 };
    let h = p.hours24 % 12;
    if (h === 0) h = 12;
    setH12(h);
    setMin(p.minutes);
    setMer(p.hours24 >= 12 ? 'PM' : 'AM');
    setOpen(true);
  };

  const confirm = () => {
    let h24 = h12 % 12;
    if (mer === 'PM') h24 += 12;
    if (mer === 'AM' && h12 === 12) h24 = 0;
    if (mer === 'PM' && h12 === 12) h24 = 12;
    onChange?.(formatTimeOfBirth(h24, min));
    setOpen(false);
  };

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.wrap, style]}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <View style={styles.webRow}>
          <Ionicons name="time" size={18} color={COLORS.primaryDark} />
          <input
            type="time"
            value={toHtmlTimeValue(value) || '10:00'}
            onChange={(e) => onChange?.(fromHtmlTimeValue(e.target.value))}
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
        <Ionicons name="time" size={18} color={COLORS.primaryDark} />
        <Text style={[styles.fieldText, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={COLORS.textLight} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Select time of birth</Text>
            <View style={styles.cols}>
              <Col title="Hour" data={HOURS12} selected={h12} onSelect={setH12} />
              <Col
                title="Min"
                data={MINUTES.map(pad2)}
                selected={pad2(min)}
                onSelect={(v) => setMin(Number(v))}
              />
              <Col title="AM/PM" data={MERS} selected={mer} onSelect={setMer} />
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
