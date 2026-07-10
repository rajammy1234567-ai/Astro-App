import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { useScreenInsets } from '../../hooks/useScreenInsets';
import { Ionicons } from '@expo/vector-icons';
import RemoteImage from '../common/RemoteImage';
import { COLORS } from '../../constants/colors';

/** Light cream header — matches Home/AppHeader, no dark blue */
export default function RemedyHeader({ onMenuPress }) {
  const safe = useScreenInsets();
  const router = useRouter();
  const user = useSelector((s) => s.auth.user);
  const displayName = user?.name?.split(' ')[0] || 'Guest';

  return (
    <View style={[styles.wrap, { paddingTop: safe.top(6) }]}>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.left}
          onPress={onMenuPress || (() => router.push('/profile'))}
          activeOpacity={0.75}
        >
          <RemoteImage
            uri={user?.avatar}
            type="avatar"
            style={styles.avatar}
            fallbackIcon="person"
            iconSize={18}
          />
          <View>
            <Text style={styles.greeting}>Hi {displayName}</Text>
            <Text style={styles.subtitle}>AstroRemedy</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.right}>
          <TouchableOpacity
            style={styles.ordersBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/orders')}
          >
            <Ionicons name="bag-handle-outline" size={15} color={COLORS.text} />
            <Text style={styles.ordersText}>Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.75}
            onPress={() => router.push('/store')}
          >
            <Ionicons name="search" size={20} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.75}
            onPress={() => router.push('/store/cart')}
          >
            <Ionicons name="cart-outline" size={20} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.cream,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 4,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  greeting: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 11, color: COLORS.textSecondary, marginTop: 1, fontWeight: '600' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ordersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  ordersText: { fontSize: 12, fontWeight: '800', color: COLORS.text },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
