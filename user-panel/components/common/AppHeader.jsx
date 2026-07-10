import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useScreenInsets } from '../../hooks/useScreenInsets';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import RemoteImage from './RemoteImage';
import { COLORS } from '../../constants/colors';

export default function AppHeader({
  showSearch = false,
  showLang = false,
  /** Opens full chat history (all past + ongoing chats) */
  showChat = false,
  /** Opens full call history (duration summary) */
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
          <RemoteImage uri={user?.avatar} type="avatar" style={styles.avatar} fallbackIcon="person" iconSize={18} />
          <Text style={styles.greeting}>Hi {displayName}</Text>
        </TouchableOpacity>

        <View style={styles.right}>
          <TouchableOpacity
            style={styles.addCash}
            onPress={() => router.push('/wallet/add-money')}
            activeOpacity={0.8}
          >
            <Ionicons name="wallet-outline" size={14} color={COLORS.text} />
            <Text style={styles.addCashText}>Add Cash</Text>
            <View style={styles.plusBadge}>
              <Ionicons name="add" size={12} color="#FFF" />
            </View>
          </TouchableOpacity>

          {showLang && (
            <TouchableOpacity style={styles.langBtn} activeOpacity={0.7} onPress={() => router.push('/settings')}>
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
    paddingBottom: 10,
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
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addCash: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  addCashText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  plusBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  langBtn: {
    paddingHorizontal: 4,
  },
  langText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  iconBtn: {
    padding: 4,
  },
});