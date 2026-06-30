import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { USER } from '../../constants/mockData';
import { COLORS } from '../../constants/colors';

export default function RemedyHeader({ title = 'AstroRemedy', onMenuPress }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity onPress={onMenuPress} activeOpacity={0.7}>
        <Image source={{ uri: USER.image }} style={styles.avatar} />
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.right}>
        <TouchableOpacity style={styles.ordersBtn} activeOpacity={0.8}>
          <Ionicons name="time-outline" size={14} color={COLORS.text} />
          <Text style={styles.ordersText}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.searchBtn} activeOpacity={0.7}>
          <Ionicons name="search" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  title: { flex: 1, fontSize: 18, fontWeight: '800', color: COLORS.text },
  right: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ordersBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 16,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  ordersText: { fontSize: 12, fontWeight: '700', color: COLORS.text },
  searchBtn: { padding: 2 },
});