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
                <Ionicons name="book" size={28} color="#FFF" />
                <Text style={styles.heroTitle}>Learn Astrology</Text>
                <Text style={styles.heroSub}>Expert articles on planets, remedies & more</Text>
              </View>
            </>
          }
          ListEmptyComponent={
            !error ? (
              <EmptyState
                icon="newspaper-outline"
                title="No blogs yet"
                subtitle="Admin se blog add karo — yahan dikhega."
              />
            ) : null
          }
          renderItem={({ item }) => (
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
                <Text style={styles.meta}>{item.author} · {item.date || formatDate(item.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
      <ArticleModal visible={!!selected} type="blog" item={selected} onClose={() => setSelected(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 32 },
  hero: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 20, marginBottom: 16, alignItems: 'center' },
  heroTitle: { color: '#FFF', fontSize: 18, fontWeight: '800', marginTop: 8 },
  heroSub: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 4 },
  card: { backgroundColor: COLORS.surface, borderRadius: 12, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.borderLight },
  cover: { width: '100%', height: 160 },
  cardBody: { padding: 14 },
  badge: { alignSelf: 'flex-start', backgroundColor: COLORS.primaryLight, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6, marginBottom: 8 },
  badgeText: { color: COLORS.primaryDark, fontSize: 11, fontWeight: '600' },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.text, lineHeight: 24 },
  excerpt: { fontSize: 13, color: COLORS.textSecondary, marginTop: 6, lineHeight: 20 },
  meta: { fontSize: 12, color: COLORS.textLight, marginTop: 8 },
});