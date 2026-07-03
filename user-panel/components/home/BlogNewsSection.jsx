import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import ArticleModal from '../common/ArticleModal';
import { Ionicons } from '@expo/vector-icons';
import RemoteImage from '../common/RemoteImage';
import { BLOGS, NEWS } from '../../constants/mockData';
import { COLORS } from '../../constants/colors';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

function BlogCard({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.blogCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.imgWrap}>
        <RemoteImage uri={item.image} type="blog" style={styles.blogImg} fallbackIcon="newspaper-outline" />
        <View style={styles.views}>
          <Ionicons name="eye-outline" size={12} color="#FFF" />
          <Text style={styles.viewsText}>{item.views || '0'}</Text>
        </View>
      </View>
      <Text style={styles.blogTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.blogMeta}>{item.author}</Text>
      <Text style={styles.blogDate}>{item.date}</Text>
    </TouchableOpacity>
  );
}

function NewsCard({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.newsCard} onPress={onPress} activeOpacity={0.85}>
      <RemoteImage uri={item.image} type="news" style={styles.newsImg} fallbackIcon="megaphone-outline" />
      <Text style={styles.newsTitle} numberOfLines={3}>{item.title}</Text>
      <Text style={styles.newsSource}>{item.source}</Text>
      <Text style={styles.newsDate}>{item.date}</Text>
    </TouchableOpacity>
  );
}

export default function BlogNewsSection({ blogs = BLOGS, news = NEWS }) {
  const router = useRouter();
  const [modal, setModal] = useState(null);

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Latest from blog</Text>
        <TouchableOpacity onPress={() => router.push('/blog')}>
          <Text style={styles.seeAll}>View All</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
        {blogs.map((b) => (
          <BlogCard
            key={b._id}
            item={{ ...b, date: b.date || formatDate(b.createdAt) }}
            onPress={() => setModal({ type: 'blog', item: { ...b, date: b.date || formatDate(b.createdAt) } })}
          />
        ))}
      </ScrollView>

      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Astrotalk in News</Text>
        <TouchableOpacity onPress={() => router.push('/news')}>
          <Text style={styles.seeAll}>View All</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
        {news.map((n) => (
          <NewsCard
            key={n.id || n._id}
            item={{ ...n, date: n.date || formatDate(n.createdAt) }}
            onPress={() => setModal({ type: 'news', item: { ...n, date: n.date || formatDate(n.createdAt) } })}
          />
        ))}
      </ScrollView>

      <ArticleModal
        visible={!!modal}
        type={modal?.type}
        item={modal?.item}
        onClose={() => setModal(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginTop: 16,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  seeAll: { fontSize: 13, fontWeight: '600', color: COLORS.link },
  hScroll: { paddingHorizontal: 14, gap: 12, paddingBottom: 8 },
  blogCard: { width: 200 },
  imgWrap: { position: 'relative', borderRadius: 8, overflow: 'hidden' },
  blogImg: { width: 200, height: 120 },
  views: {
    position: 'absolute', bottom: 6, left: 6,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  viewsText: { color: '#FFF', fontSize: 10 },
  blogTitle: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginTop: 8, lineHeight: 18 },
  blogMeta: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4 },
  blogDate: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  newsCard: { width: 200 },
  newsImg: { width: 200, height: 120, borderRadius: 8 },
  newsTitle: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginTop: 8, lineHeight: 18 },
  newsSource: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4 },
  newsDate: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
});