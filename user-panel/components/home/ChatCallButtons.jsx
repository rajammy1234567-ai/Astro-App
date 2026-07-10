import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';

/** Sticky bottom bar — always visible on home */
export default function ChatCallButtons({ sticky = false, style }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const body = (
    <View style={[styles.row, sticky && styles.stickyInner, style]}>
      <TouchableOpacity
        style={[styles.btn, styles.chatBtn]}
        onPress={() => router.push('/(tabs)/chat')}
        activeOpacity={0.88}
      >
        <Ionicons name="chatbubbles" size={18} color="#fff" />
        <Text style={styles.btnTextLight}>Chat with Astrologer</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.btn, styles.callBtn]}
        onPress={() => router.push('/(tabs)/call')}
        activeOpacity={0.88}
      >
        <Ionicons name="call" size={18} color={COLORS.text} />
        <Text style={styles.btnText}>Call with Astrologer</Text>
      </TouchableOpacity>
    </View>
  );

  if (!sticky) return body;

  return (
    <View style={[styles.stickyWrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
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
    bottom: 0,
    backgroundColor: 'rgba(255,252,248,0.96)',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: -4 },
      },
      android: { elevation: 12 },
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
    paddingVertical: 14,
    gap: 6,
  },
  chatBtn: { backgroundColor: COLORS.bannerDark },
  callBtn: { backgroundColor: COLORS.primary },
  btnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
  },
  btnTextLight: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
  },
});
