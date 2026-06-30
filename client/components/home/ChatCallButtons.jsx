import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

export default function ChatCallButtons({ style }) {
  const router = useRouter();

  return (
    <View style={[styles.row, style]}>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => router.push('/(tabs)/chat')}
        activeOpacity={0.85}
      >
        <Ionicons name="chatbubbles" size={18} color={COLORS.text} />
        <Text style={styles.btnText}>Chat with Astrologer</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => router.push('/(tabs)/call')}
        activeOpacity={0.85}
      >
        <Ionicons name="call" size={18} color={COLORS.text} />
        <Text style={styles.btnText}>Call with Astrologer</Text>
      </TouchableOpacity>
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
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.yellow,
    borderRadius: 8,
    paddingVertical: 14,
    gap: 6,
  },
  btnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
});