import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { FILTERS } from '../../constants/mockData';
import { COLORS } from '../../constants/colors';

const FILTER_ICON_SET = {
  all: { set: 'ion', name: 'grid-outline' },
  new: { set: 'ion', name: 'time-outline' },
  love: { set: 'mci', name: 'heart-outline' },
  career: { set: 'mci', name: 'briefcase-outline' },
};

function FilterIcon({ id, active }) {
  const cfg = FILTER_ICON_SET[id] || FILTER_ICON_SET.all;
  const color = active ? COLORS.text : COLORS.textSecondary;
  if (cfg.set === 'mci') {
    return <MaterialCommunityIcons name={cfg.name} size={14} color={color} />;
  }
  return <Ionicons name={cfg.name} size={14} color={color} />;
}

export default function FilterChips({ active, onSelect, showFilterIcon = true }) {
  return (
    <View style={styles.wrapper}>
      {showFilterIcon && (
        <TouchableOpacity style={styles.filterIcon} activeOpacity={0.7}>
          <Ionicons name="options-outline" size={20} color={COLORS.text} />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>1</Text>
          </View>
        </TouchableOpacity>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {FILTERS.map((f) => {
          const isActive = active === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              style={[
                styles.chip,
                isActive && styles.chipActive,
                f.color && !isActive && { backgroundColor: f.color },
              ]}
              onPress={() => onSelect(f.id)}
              activeOpacity={0.75}
            >
              <FilterIcon id={f.id} active={isActive} />
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    marginBottom: 8,
  },
  filterIcon: {
    marginRight: 10,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: COLORS.error,
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { color: '#FFF', fontSize: 8, fontWeight: '700' },
  scroll: { gap: 8, paddingRight: 14 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: COLORS.yellow,
    borderColor: COLORS.primary,
    borderWidth: 1.5,
  },
  chipText: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.text, fontWeight: '700' },
});