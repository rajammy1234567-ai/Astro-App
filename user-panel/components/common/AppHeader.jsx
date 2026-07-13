import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useScreenInsets } from '../../hooks/useScreenInsets';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import RemoteImage from './RemoteImage';
import { COLORS } from '../../constants/colors';

export default function AppHeader({
  showSearch = false,
  showLang = false,
  showChat = false,
  showCallHistory = false,
  onMenuPress,
  onSearchPress,
}) {
  const safe = useScreenInsets();
  const router = useRouter();
  const user = useSelector((s) => s.auth.user);
  const displayName = user?.name?.split(' ')[0] || 'Guest';

  return (
    <View style={[styles.container, { paddingTop: safe.top(6) }]}>
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.left}
          onPress={onMenuPress || (() => router.push('/profile'))}
          activeOpacity={0.7}
        >
          <View style={styles.avatarRing}>
            <RemoteImage
              uri={user?.avatar}
              type="avatar"
              style={styles.avatar}
              fallbackIcon="person"
              iconSize={18}
            />
          </View>
          <View>
            <Text style={styles.hello}>Namaste 🙏</Text>
            <Text style={styles.greeting} numberOfLines={1}>
              Hi {displayName}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.right}>
          <TouchableOpacity
            style={styles.addCash}
            onPress={() => router.push('/wallet/add-money')}
            activeOpacity={0.8}
          >
            <Ionicons name="wallet" size={14} color={COLORS.bannerDark} />
            <Text style={styles.addCashText}>Add Cash</Text>
            <View style={styles.plusBadge}>
              <Ionicons name="add" size={12} color="#FFF" />
            </View>
          </TouchableOpacity>

          {showLang && (
            <TouchableOpacity
              style={styles.langBtn}
              activeOpacity={0.7}
              onPress={() => router.push('/settings')}
            >
              <Text style={styles.langText}>A अ</Text>
            </TouchableOpacity>
          )}

          {showSearch && (
            <TouchableOpacity style={styles.iconBtn} onPress={onSearchPress} activeOpacity={0.7}>
              <Ionicons name="search" size={22} color={COLORS.text} />
            </TouchableOpacity>
          )}

          {showChat && (
            <TouchableOpacity
              style={styles.iconBtn}
              activeOpacity={0.7}
              onPress={() => router.push({ pathname: '/sessions', params: { type: 'chat' } })}
              accessibilityLabel="Chat history"
            >
              <Ionicons name="chatbubble-outline" size={22} color={COLORS.text} />
            </TouchableOpacity>
          )}

          {showCallHistory && (
            <TouchableOpacity
              style={styles.iconBtn}
              activeOpacity={0.7}
              onPress={() => router.push({ pathname: '/sessions', params: { type: 'call' } })}
              accessibilityLabel="Call history"
            >
              <Ionicons name="time-outline" size={22} color={COLORS.text} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cream,
    paddingBottom: 8,
    paddingHorizontal: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  avatarRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.primary,
    padding: 1,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  hello: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    maxWidth: 140,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addCash: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 7,
    gap: 5,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primaryDark,
        shadowOpacity: 0.25,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  addCashText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.bannerDark,
  },
  plusBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.bannerDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  langBtn: {
    paddingHorizontal: 4,
  },
  langText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  iconBtn: {
    padding: 4,
  },
});
