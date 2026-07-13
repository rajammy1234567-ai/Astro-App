import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  TextInput, Alert, Dimensions, Image,
} from 'react-native';
import Screen from '../../components/common/Screen';
import RemoteImage from '../../components/common/RemoteImage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import { astrologerApi } from '../../services/astrologerApi';
import { reviewApi } from '../../services/reviewApi';
import { followingApi } from '../../services/followingApi';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../constants/colors';

const { width: SCREEN_W } = Dimensions.get('window');

export default function AstrologerDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [astro, setAstro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [reviewRating, setReviewRating] = useState('5');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!id) return;
    astrologerApi.getById(id)
      .then(setAstro)
      .catch(() => setAstro(null))
      .finally(() => setLoading(false));
  }, [id]);

  // Load follow state for this astrologer
  useEffect(() => {
    if (!isAuthenticated || !id) {
      setFollowing(false);
      return;
    }
    followingApi.getAll()
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        setFollowing(arr.some((a) => String(a._id) === String(id)));
      })
      .catch(() => setFollowing(false));
  }, [isAuthenticated, id]);

  const handleFollow = async () => {
    if (!astro?._id) return;
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please log in to follow this astrologer.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }
    setFollowLoading(true);
    try {
      const res = await followingApi.toggle(astro._id);
      const nowFollowing = !!res.following;
      setFollowing(nowFollowing);
      Alert.alert(
        nowFollowing ? 'Following ❤️' : 'Unfollowed',
        nowFollowing
          ? `You are now following ${astro.name}.`
          : `You have unfollowed ${astro.name}.`
      );
    } catch (err) {
      Alert.alert('Failed', err.message || 'Could not update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleReview = async () => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please log in to submit a review');
      return;
    }
    if (!reviewComment.trim()) {
      Alert.alert('Comment required');
      return;
    }
    setSubmittingReview(true);
    try {
      await reviewApi.add(astro._id, {
        rating: Number(reviewRating),
        comment: reviewComment.trim(),
      });
      const updated = await astrologerApi.getById(astro._id);
      setAstro(updated);
      setReviewComment('');
      Alert.alert('Thanks!', 'Your review has been submitted');
    } catch (err) {
      Alert.alert('Failed', err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const openBooking = (bookingType) => {
    const chatOk = astro.chatOnline ?? astro.isOnline;
    const callOk = astro.callOnline ?? astro.isOnline;
    const ok = bookingType === 'call' ? callOk : chatOk;
    if (!ok) {
      Alert.alert(
        bookingType === 'call' ? 'Call Offline' : 'Chat Offline',
        `Yeh astrologer ne ${bookingType === 'call' ? 'Call' : 'Chat'} Online band rakha hai.`
      );
      return;
    }
    router.push({
      pathname: '/astrologers/booking',
      params: { id: astro._id, type: bookingType },
    });
  };

  if (loading) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <Header title="Astrologer Profile" light />
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  if (!astro) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <Header title="Astrologer Profile" light />
        <View style={styles.offlineBox}>
          <Ionicons name="moon-outline" size={48} color={COLORS.textLight} />
          <Text style={styles.offlineTitle}>Astrologer is offline</Text>
          <Text style={styles.offlineSub}>They will appear here when online</Text>
        </View>
      </Screen>
    );
  }

  const packages = astro.pricingPackages || [];
  const reviews = astro.reviews || [];
  const gallery = astro.gallery || [];

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <Header title="Astrologer Profile" light />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <RemoteImage uri={astro.image} type="astrologer" style={styles.avatar} fallbackIcon="person" iconSize={40} />
          <View style={styles.onlineRow}>
            <View
              style={[
                styles.onlineDot,
                !(astro.chatOnline || astro.callOnline || astro.isOnline) && {
                  backgroundColor: COLORS.textLight,
                },
              ]}
            />
            <Text
              style={[
                styles.onlineText,
                !(astro.chatOnline || astro.callOnline || astro.isOnline) && {
                  color: COLORS.textLight,
                },
              ]}
            >
              {astro.chatOnline || astro.callOnline || astro.isOnline
                ? `Online${astro.chatOnline ? ' · Chat' : ''}${astro.callOnline ? ' · Call' : ''}`
                : 'Offline'}
            </Text>
          </View>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{astro.name}</Text>
            {astro.isVerified && <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />}
          </View>
          <Text style={styles.specialty}>{astro.specialty}</Text>
          <Text style={styles.lang}>{astro.languages?.join(', ')}</Text>
          <Text style={styles.exp}>Experience: {astro.experience || 0} Years</Text>

          {astro.bio ? <Text style={styles.bio}>{astro.bio}</Text> : null}

          <View style={styles.stats}>
            <Text style={styles.stat}>⭐ {astro.rating}</Text>
            <Text style={styles.stat}>{astro.reviewCount || reviews.length} reviews</Text>
            <Text style={styles.stat}>{astro.orders}+ orders</Text>
          </View>

          <TouchableOpacity
            style={[styles.followBtn, following && styles.followingBtn]}
            onPress={handleFollow}
            disabled={followLoading}
            activeOpacity={0.85}
          >
            {followLoading ? (
              <ActivityIndicator size="small" color={following ? COLORS.error : COLORS.text} />
            ) : (
              <>
                <Ionicons
                  name={following ? 'heart' : 'heart-outline'}
                  size={18}
                  color={following ? '#fff' : COLORS.text}
                />
                <Text style={[styles.followText, following && styles.followingText]}>
                  {following ? 'Following · Unfollow' : 'Follow Astrologer'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.btns}>
            {astro.chatEnabled && (
              <TouchableOpacity style={styles.chatBtn} onPress={() => openBooking('chat')}>
                <Text style={styles.chatText}>Chat</Text>
              </TouchableOpacity>
            )}
            {astro.callEnabled && (
              <TouchableOpacity style={styles.callBtn} onPress={() => openBooking('call')}>
                <Text style={styles.callText}>Call</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {packages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Consultation Charges</Text>
            <View style={styles.packageGrid}>
              {packages.map((p) => (
                <View key={p.minutes} style={styles.packageCard}>
                  <Text style={styles.packageMins}>{p.minutes} min</Text>
                  <Text style={styles.packagePrice}>₹{p.price}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {gallery.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {gallery.map((uri, i) => (
                <Image key={uri + i} source={{ uri }} style={styles.galleryImg} />
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reviews ({reviews.length})</Text>
          {reviews.map((r) => (
            <View key={r._id} style={styles.reviewCard}>
              <View style={styles.reviewTop}>
                <Text style={styles.reviewName}>{r.userName}</Text>
                <Text style={styles.reviewStars}>{'⭐'.repeat(Math.round(r.rating))}</Text>
              </View>
              <Text style={styles.reviewComment}>{r.comment}</Text>
            </View>
          ))}
          {reviews.length === 0 && (
            <Text style={styles.noReviews}>No reviews yet</Text>
          )}
        </View>

        <View style={styles.reviewForm}>
          <Text style={styles.sectionTitle}>Rate this Astrologer</Text>
          <TextInput
            style={styles.input}
            placeholder="Rating (1-5)"
            value={reviewRating}
            onChangeText={setReviewRating}
            keyboardType="numeric"
            placeholderTextColor={COLORS.textLight}
          />
          <TextInput
            style={[styles.input, { minHeight: 70 }]}
            placeholder="Write your review..."
            value={reviewComment}
            onChangeText={setReviewComment}
            multiline
            placeholderTextColor={COLORS.textLight}
          />
          <TouchableOpacity style={styles.submitReview} onPress={handleReview} disabled={submittingReview}>
            <Text style={styles.submitReviewText}>
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.freeBox}>
          <Ionicons name="gift-outline" size={16} color={COLORS.success} />
          <Text style={styles.freeText}>1st minute chat FREE!</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 14, paddingBottom: 32 },
  offlineBox: { alignItems: 'center', padding: 40 },
  offlineTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginTop: 12 },
  offlineSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 6 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 20, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 8 },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success },
  onlineText: { fontSize: 12, fontWeight: '700', color: COLORS.success },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  specialty: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  lang: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  exp: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  bio: { fontSize: 13, color: COLORS.textSecondary, marginTop: 12, textAlign: 'center', lineHeight: 20 },
  stats: { flexDirection: 'row', gap: 16, marginTop: 14 },
  stat: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  followingBtn: { backgroundColor: COLORS.error, borderColor: COLORS.error },
  followingText: { color: '#fff' },
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
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 10 },
  packageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  packageCard: {
    width: (SCREEN_W - 48) / 2 - 5,
    backgroundColor: COLORS.yellowLight,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  packageMins: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  packagePrice: { fontSize: 18, fontWeight: '800', color: COLORS.error, marginTop: 4 },
  galleryImg: { width: 120, height: 120, borderRadius: 10, marginRight: 10 },
  reviewCard: {
    backgroundColor: COLORS.surface, borderRadius: 10, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between' },
  reviewName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  reviewStars: { fontSize: 11 },
  reviewComment: { fontSize: 13, color: COLORS.textSecondary, marginTop: 6, lineHeight: 18 },
  noReviews: { fontSize: 13, color: COLORS.textLight },
  reviewForm: {
    marginTop: 16, backgroundColor: COLORS.surface, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
    padding: 12, marginBottom: 10, fontSize: 14, color: COLORS.text,
  },
  submitReview: {
    backgroundColor: COLORS.primary, borderRadius: 8, padding: 12, alignItems: 'center',
  },
  submitReviewText: { fontWeight: '800', color: COLORS.text },
  freeBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: COLORS.yellowLight, borderRadius: 8, padding: 12, marginTop: 14,
  },
  freeText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
});