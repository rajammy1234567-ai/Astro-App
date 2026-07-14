import { useCallback, useState } from 'react';
import { FlatList, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Screen from '../../components/common/Screen';
import { useFocusEffect } from 'expo-router';
import ArticleModal from '../../components/common/ArticleModal';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import RemoteImage from '../../components/common/RemoteImage';
import EmptyState from '../../components/common/EmptyState';
import ServerBanner from '../../components/common/ServerBanner';
import { blogApi } from '../../services/blogApi';
import { COLORS } from '../../constants/colors';
import { formatDate } from '../../utils/formatters';

export default function BlogScreen() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  const loadBlogs = useCallback(() => {
    setLoading(true);
    setError(null);
    blogApi.getAll()
      .then(setBlogs)
      .catch((err) => {
        setBlogs([]);
        setError(err.message || 'Blog load failed');
      })
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBlogs();
    }, [loadBlogs])
  );

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <Header title="Astrology Blog" />
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={blogs}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <>
              <ServerBanner message={error} />
              <View style={styles.hero}>
                <Ionicons name="planet" size={32} color={COLORS.primary} />
                <Text style={styles.heroTitle}>Astrology Blog</Text>
                <Text style={styles.heroSub}>Expert articles on planets, remedies, kundli & life guidance</Text>
              </View>
            </>
          }
          ListEmptyComponent={
            !error ? (
              <EmptyState
                icon="newspaper-outline"
                title="No blogs yet"
                subtitle="Blogs by admin & astrologers will appear here."
              />
            ) : null
          }
          renderItem={({ item }) => {
            const authorName = item.authorProfile?.name || item.author || 'Astrologer';
            const authorImg = item.authorImage || item.authorProfile?.image;
            return (
            <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => setSelected(item)}>
              <RemoteImage uri={item.image} type="blog" style={styles.cover} fallbackIcon="newspaper-outline" />
              <View style={styles.cardBody}>
                {item.category && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.category}</Text>
                  </View>
                )}
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.excerpt} numberOfLines={2}>
                  {item.excerpt || item.content}
                </Text>
                <View style={styles.authorRow}>
                  {authorImg ? (
                    <RemoteImage uri={authorImg} type="astrologer" style={styles.authorPic} fallbackIcon="person" />
                  ) : (
                    <View style={styles.authorPicFallback}>
                      <Text style={styles.authorLetter}>{authorName.charAt(0)}</Text>
                    </View>
                  )}
                  <Text style={styles.meta}>
                    {authorName} · {item.date || formatDate(item.createdAt)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
            );
          }}
        />
      )}
      <ArticleModal visible={!!selected} type="blog" item={selected} onClose={() => setSelected(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 32 },
  hero: {
    backgroundColor: COLORS.bannerDark, borderRadius: 16, padding: 22, marginBottom: 16, alignItems: 'center',
  },
  heroTitle: { color: COLORS.primary, fontSize: 20, fontWeight: '900', marginTop: 8 },
  heroSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 6, textAlign: 'center' },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 16, marginBottom: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  cover: { width: '100%', height: 180 },
  cardBody: { padding: 16 },
  badge: {
    alignSelf: 'flex-start', backgroundColor: COLORS.bannerDark,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 8,
  },
  badgeText: { color: COLORS.primary, fontSize: 11, fontWeight: '700' },
  title: { fontSize: 17, fontWeight: '800', color: COLORS.text, lineHeight: 24 },
  excerpt: { fontSize: 13, color: COLORS.textSecondary, marginTop: 8, lineHeight: 20 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  authorPic: { width: 28, height: 28, borderRadius: 14 },
  authorPicFallback: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.bannerDark,
    alignItems: 'center', justifyContent: 'center',
  },
  authorLetter: { color: COLORS.primary, fontWeight: '800', fontSize: 12 },
  meta: { fontSize: 12, color: COLORS.textLight, fontWeight: '600', flex: 1 },
});