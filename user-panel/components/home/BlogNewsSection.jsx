import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import ArticleModal from '../common/ArticleModal';
import { Ionicons } from '@expo/vector-icons';
import RemoteImage from '../common/RemoteImage';
import { COLORS } from '../../constants/colors';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

function SectionHeader({ title, onPress }) {
  return (
    <View style={styles.header}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <TouchableOpacity onPress={onPress} style={styles.seeAllRow} activeOpacity={0.7}>
        <Text style={styles.seeAll}>View All</Text>
        <Ionicons name="chevron-forward" size={14} color={COLORS.link} />
      </TouchableOpacity>
    </View>
  );
}

function BlogCard({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.blogCard} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.imgWrap}>
        <RemoteImage uri={item.image} type="blog" style={styles.blogImg} fallbackIcon="newspaper-outline" />
        <View style={styles.views}>
          <Ionicons name="eye-outline" size={12} color="#FFF" />
          <Text style={styles.viewsText}>{item.views || '0'}</Text>
        </View>
      </View>
      <Text style={styles.blogTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.blogMeta} numberOfLines={1}>
        {item.author || 'AstroTalk'}
      </Text>
      <Text style={styles.blogDate}>{item.date}</Text>
    </TouchableOpacity>
  );
}

function NewsCard({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.newsCard} onPress={onPress} activeOpacity={0.88}>
      <RemoteImage uri={item.image} type="news" style={styles.newsImg} fallbackIcon="megaphone-outline" />
      <Text style={styles.newsTitle} numberOfLines={3}>
        {item.title}
      </Text>
      <Text style={styles.newsSource}>{item.source || 'News'}</Text>
      <Text style={styles.newsDate}>{item.date}</Text>
    </TouchableOpacity>
  );
}

function EmptyStrip({ icon, text, onPress }) {
  return (
    <TouchableOpacity style={styles.emptyStrip} onPress={onPress} activeOpacity={0.85}>
      <Ionicons name={icon} size={22} color={COLORS.primaryDark} />
      <Text style={styles.emptyText}>{text}</Text>
    </TouchableOpacity>
  );
}

export default function BlogNewsSection({ blogs = [], news = [] }) {
  const router = useRouter();
  const [modal, setModal] = useState(null);

  return (
    <View style={styles.wrap}>
      <SectionHeader title="Latest from Blog" onPress={() => router.push('/blog')} />
      {blogs.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
          {blogs.map((b) => (
            <BlogCard
              key={b._id}
              item={{ ...b, date: b.date || formatDate(b.createdAt) }}
              onPress={() =>
                setModal({
                  type: 'blog',
                  item: { ...b, date: b.date || formatDate(b.createdAt) },
                })
              }
            />
          ))}
        </ScrollView>
      ) : (
        <EmptyStrip
          icon="book-outline"
          text="Astrology blogs will appear here"
          onPress={() => router.push('/blog')}
        />
      )}

      <SectionHeader title="AstroTalk in News" onPress={() => router.push('/news')} />
      {news.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
          {news.map((n) => (
            <NewsCard
              key={n.id || n._id}
              item={{ ...n, date: n.date || formatDate(n.createdAt) }}
              onPress={() =>
                setModal({
                  type: 'news',
                  item: { ...n, date: n.date || formatDate(n.createdAt) },
                })
              }
            />
          ))}
        </ScrollView>
      ) : (
        <EmptyStrip
          icon="newspaper-outline"
          text="Latest news will appear here"
          onPress={() => router.push('/news')}
        />
      )}

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
  wrap: { marginTop: 6 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  seeAllRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAll: { fontSize: 13, fontWeight: '700', color: COLORS.link },
  hScroll: { paddingHorizontal: 14, gap: 12, paddingBottom: 6 },
  blogCard: {
    width: 210,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...Platform.select({
      ios: {
        shadowColor: '#1E1033',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 2 },
    }),
  },
  imgWrap: { position: 'relative', borderRadius: 12, overflow: 'hidden' },
  blogImg: { width: '100%', height: 118, borderRadius: 12 },
  views: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  viewsText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  blogTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
    lineHeight: 18,
    minHeight: 36,
    paddingHorizontal: 2,
  },
  blogMeta: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4, paddingHorizontal: 2 },
  blogDate: { fontSize: 11, color: COLORS.textLight, marginTop: 2, paddingHorizontal: 2, marginBottom: 4 },
  newsCard: {
    width: 210,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  newsImg: { width: '100%', height: 118, borderRadius: 12 },
  newsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
    lineHeight: 18,
    minHeight: 54,
    paddingHorizontal: 2,
  },
  newsSource: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4, paddingHorizontal: 2 },
  newsDate: { fontSize: 11, color: COLORS.textLight, marginTop: 2, paddingHorizontal: 2, marginBottom: 4 },
  emptyStrip: {
    marginHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  emptyText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600', flex: 1 },
});
