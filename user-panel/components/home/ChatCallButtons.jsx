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
        <View style={styles.iconBubbleDark}>
          <Ionicons name="chatbubbles" size={16} color="#fff" />
        </View>
        <View style={styles.btnTextCol}>
          <Text style={styles.btnTextLight} numberOfLines={1}>
            Chat now
          </Text>
          <Text style={styles.btnHintLight} numberOfLines={1}>
            Instant reply
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.btn, styles.callBtn]}
        onPress={() => router.push('/(tabs)/call')}
        activeOpacity={0.88}
      >
        <View style={styles.iconBubbleLight}>
          <Ionicons name="call" size={16} color={COLORS.bannerDark} />
        </View>
        <View style={styles.btnTextCol}>
          <Text style={styles.btnText} numberOfLines={1}>
            Call now
          </Text>
          <Text style={styles.btnHint} numberOfLines={1}>
            Voice guidance
          </Text>
        </View>
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
    backgroundColor: 'rgba(255,252,248,0.97)',
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
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 8,
    minHeight: 52,
  },
  chatBtn: { backgroundColor: COLORS.bannerDark },
  callBtn: { backgroundColor: COLORS.primary },
  iconBubbleDark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBubbleLight: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(30,16,51,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnTextCol: { flex: 1 },
  btnText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.bannerDark,
  },
  btnTextLight: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
  },
  btnHint: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(30,16,51,0.65)',
    marginTop: 1,
  },
  btnHintLight: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    marginTop: 1,
  },
});
