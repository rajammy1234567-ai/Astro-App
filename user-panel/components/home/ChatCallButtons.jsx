import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { floatingAboveTabBar } from '../../utils/layout';

/** Home sticky strip — sits above tab bar (gestures OR 3-button nav safe) */
export default function ChatCallButtons({ sticky = false, style }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const aboveTabs = floatingAboveTabBar(insets, 0);

  const body = (
    <View style={[styles.row, sticky && styles.stickyInner, style]}>
      <TouchableOpacity
        style={[styles.btn, styles.chatBtn]}
        onPress={() => router.push('/(tabs)/chat')}
        activeOpacity={0.88}
      >
        <Ionicons name="chatbubbles" size={18} color="#fff" />
        <Text style={styles.btnTextLight} numberOfLines={1}>Chat with Astrologer</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.btn, styles.callBtn]}
        onPress={() => router.push('/(tabs)/call')}
        activeOpacity={0.88}
      >
        <Ionicons name="call" size={18} color={COLORS.text} />
        <Text style={styles.btnText} numberOfLines={1}>Call with Astrologer</Text>
      </TouchableOpacity>
    </View>
  );

  if (!sticky) return body;

  return (
    <View style={[styles.stickyWrap, { bottom: aboveTabs }]} pointerEvents="box-none">
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    marginVertical: 14,
  },
  stickyWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: 'rgba(255,252,248,0.98)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    paddingBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: -3 },
      },
      android: { elevation: 10 },
    }),
  },
  stickyInner: {
    marginVertical: 0,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 6,
    gap: 6,
    minHeight: 46,
  },
  chatBtn: { backgroundColor: COLORS.bannerDark },
  callBtn: { backgroundColor: COLORS.primary },
  btnText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.text,
    flexShrink: 1,
  },
  btnTextLight: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
    flexShrink: 1,
  },
});
