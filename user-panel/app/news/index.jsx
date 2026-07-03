import { useEffect, useState } from 'react';
import { FlatList, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import ArticleModal from '../../components/common/ArticleModal';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import RemoteImage from '../../components/common/RemoteImage';
import { newsApi } from '../../services/newsApi';
import { NEWS } from '../../constants/mockData';
import { COLORS } from '../../constants/colors';
import { formatDate } from '../../utils/formatters';

export default function NewsScreen() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    newsApi.getAll()
      .then((data) => setNews(data.map((n) => ({ ...n, id: n._id }))))
      .catch(() => setNews(NEWS))
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.container}>
      <Header title="Astro News" />
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={news}
          keyExtractor={(item) => item.id || item._id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.hero}>
              <Ionicons name="newspaper" size={28} color="#FFF" />
              <Text style={styles.heroTitle}>Latest Updates</Text>
              <Text style={styles.heroSub}>Astrotalk in media & industry news</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => setSelected(item)}>
              <RemoteImage uri={item.image} type="news" style={styles.cover} fallbackIcon="megaphone-outline" />
              <View style={styles.cardBody}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.source || 'News'}</Text>
                </View>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.date}>{item.date || formatDate(item.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
      <ArticleModal visible={!!selected} type="news" item={selected} onClose={() => setSelected(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  list: { padding: 16, paddingBottom: 32 },
  hero: { backgroundColor: COLORS.error, borderRadius: 12, padding: 20, marginBottom: 16, alignItems: 'center' },
  heroTitle: { color: '#FFF', fontSize: 18, fontWeight: '800', marginTop: 8 },
  heroSub: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 4 },
  card: { backgroundColor: COLORS.surface, borderRadius: 12, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.borderLight },
  cover: { width: '100%', height: 160 },
  cardBody: { padding: 14 },
  badge: { alignSelf: 'flex-start', backgroundColor: COLORS.errorLight, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6, marginBottom: 8 },
  badgeText: { color: COLORS.error, fontSize: 11, fontWeight: '600' },
  title: { fontSize: 15, fontWeight: '700', color: COLORS.text, lineHeight: 22 },
  date: { fontSize: 12, color: COLORS.textLight, marginTop: 8 },
});