import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useScreenInsets } from '../../hooks/useScreenInsets';
import { Ionicons } from '@expo/vector-icons';
import { USER } from '../../constants/mockData';
import { COLORS } from '../../constants/colors';

export default function RemedyHeader({ onMenuPress }) {
  const safe = useScreenInsets();
  const router = useRouter();

  return (
    <View style={[styles.wrap, { paddingTop: safe.top(6) }]}>
      <View style={styles.container}>
        <TouchableOpacity onPress={onMenuPress} activeOpacity={0.7}>
          <Image source={{ uri: USER.image }} style={styles.avatar} />
        </TouchableOpacity>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>AstroRemedy</Text>
          <Text style={styles.subtitle}>Spiritual products & expert guidance</Text>
        </View>
        <View style={styles.right}>
          <TouchableOpacity
            style={styles.ordersBtn}
            activeOpacity={0.8}
            onPress={() => router.push('/orders')}
          >
            <Ionicons name="bag-handle-outline" size={15} color={COLORS.text} />
            <Text style={styles.ordersText}>Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.searchBtn}
            activeOpacity={0.7}
            onPress={() => router.push('/store')}
          >
            <Ionicons name="search" size={20} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.bannerDark,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  titleBlock: { flex: 1 },
  title: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  subtitle: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2, fontWeight: '500' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ordersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  ordersText: { fontSize: 11, fontWeight: '700', color: COLORS.text },
  searchBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});