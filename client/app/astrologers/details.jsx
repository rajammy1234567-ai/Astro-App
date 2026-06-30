import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import RemoteImage from '../../components/common/RemoteImage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import { ASTROLOGERS } from '../../constants/mockData';
import { followingApi } from '../../services/followingApi';
import { COLORS } from '../../constants/colors';

export default function AstrologerDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const astro = ASTROLOGERS.find((a) => a._id === id) || ASTROLOGERS[0];
  const [following, setFollowing] = useState(false);

  const handleFollow = async () => {
    try {
      const res = await followingApi.toggle(astro._id);
      setFollowing(res.following);
    } catch (_) {}
  };

  return (
    <View style={styles.container}>
      <Header title="Astrologer Profile" light />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <RemoteImage uri={astro.image} type="astrologer" style={styles.avatar} fallbackIcon="person" iconSize={40} />
          <View style={styles.nameRow}>
            <Text style={styles.name}>{astro.name}</Text>
            {astro.isVerified && <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />}
          </View>
          <Text style={styles.specialty}>{astro.specialty}</Text>
          <Text style={styles.lang}>{astro.languages?.join(', ')}</Text>
          <Text style={styles.exp}>Exp- {astro.experience} Years</Text>

          <View style={styles.stats}>
            <Text style={styles.stat}>⭐ {astro.rating}</Text>
            <Text style={styles.stat}>{astro.orders}+ orders</Text>
            <Text style={styles.price}>
              {astro.originalPrice && <Text style={styles.strike}>₹{astro.originalPrice} </Text>}
              ₹{astro.pricePerMin}/min
            </Text>
          </View>

          <TouchableOpacity style={styles.followBtn} onPress={handleFollow}>
            <Ionicons name={following ? 'heart' : 'heart-outline'} size={18} color={following ? COLORS.error : COLORS.text} />
            <Text style={styles.followText}>{following ? 'Following' : 'Follow'}</Text>
          </TouchableOpacity>

          <View style={styles.btns}>
            {astro.chatEnabled && (
              <TouchableOpacity style={styles.chatBtn} onPress={() => router.push('/astrologers/booking')}>
                <Text style={styles.chatText}>Chat</Text>
              </TouchableOpacity>
            )}
            {astro.callEnabled && (
              <TouchableOpacity
                style={styles.callBtn}
                onPress={() => router.push({ pathname: '/astrologers/booking', params: { id, type: 'call' } })}
              >
                <Text style={styles.callText}>Call</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.freeBox}>
          <Ionicons name="gift-outline" size={16} color={COLORS.success} />
          <Text style={styles.freeText}>1st Chat FREE for new users</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  scroll: { padding: 14 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 20, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  specialty: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  lang: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  exp: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  stats: { flexDirection: 'row', gap: 16, marginTop: 14 },
  stat: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  price: { fontSize: 15, fontWeight: '800', color: COLORS.error },
  strike: { color: COLORS.textLight, textDecorationLine: 'line-through', fontWeight: '400' },
  followBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.border,
  },
  followText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  btns: { flexDirection: 'row', gap: 12, marginTop: 16, width: '100%' },
  chatBtn: {
    flex: 1, borderWidth: 1.5, borderColor: COLORS.success, borderRadius: 8,
    paddingVertical: 12, alignItems: 'center',
  },
  chatText: { fontSize: 15, fontWeight: '700', color: COLORS.success },
  callBtn: {
    flex: 1, borderWidth: 1.5, borderColor: COLORS.success, borderRadius: 8,
    paddingVertical: 12, alignItems: 'center',
  },
  callText: { fontSize: 15, fontWeight: '700', color: COLORS.success },
  freeBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: COLORS.yellowLight, borderRadius: 8, padding: 12, marginTop: 14,
  },
  freeText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
});