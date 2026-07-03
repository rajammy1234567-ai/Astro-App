import { useEffect, useState } from 'react';
import { FlatList, View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import RemoteImage from '../../components/common/RemoteImage';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import { testimonialApi } from '../../services/testimonialApi';
import { COLORS } from '../../constants/colors';
import { SHADOW } from '../../constants/theme';

export default function TestimonialsScreen() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testimonialApi.getAll()
      .then(setTestimonials)
      .catch(() => setTestimonials([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.container}>
      <Header title="Video Testimonials" />

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={testimonials}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.hero}>
              <Ionicons name="play-circle" size={28} color="#FFF" />
              <Text style={styles.heroTitle}>Real Stories, Real Results</Text>
              <Text style={styles.heroSub}>Hear from our happy customers</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => item.videoUrl && Linking.openURL(item.videoUrl)}
            >
              <View style={styles.thumbWrap}>
                <RemoteImage uri={item.thumbnail} type="avatar" style={styles.thumb} fallbackIcon="videocam-outline" />
                <View style={styles.playOverlay}>
                  <Ionicons name="play" size={24} color="#FFF" />
                </View>
              </View>
              <View style={styles.info}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{item.name}</Text>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12} color={COLORS.star} />
                    <Text style={styles.rating}>{item.rating}</Text>
                  </View>
                </View>
                {item.location && <Text style={styles.location}>{item.location}</Text>}
                <Text style={styles.quote} numberOfLines={3}>"{item.quote}"</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  list: { padding: 16, paddingBottom: 32 },
  hero: {
    backgroundColor: COLORS.primary, borderRadius: 12, padding: 18,
    alignItems: 'center', marginBottom: 16,
  },
  heroTitle: { color: '#FFF', fontSize: 17, fontWeight: '800', marginTop: 6 },
  heroSub: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 4 },
  card: { backgroundColor: COLORS.surface, borderRadius: 12, marginBottom: 12, overflow: 'hidden', ...SHADOW },
  thumbWrap: { position: 'relative' },
  thumb: { width: '100%', height: 160, backgroundColor: COLORS.border },
  playOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center',
  },
  info: { padding: 14 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rating: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  location: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  quote: { fontSize: 13, color: COLORS.textSecondary, marginTop: 8, lineHeight: 20, fontStyle: 'italic' },
});