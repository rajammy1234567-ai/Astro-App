import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import SectionHeader from '../common/SectionHeader';
import { BLOGS } from '../../constants/mockData';
import { COLORS } from '../../constants/colors';
import { SHADOW } from '../../constants/theme';

export default function BlogSection({ blogs = BLOGS }) {
  const router = useRouter();
  const items = blogs.length ? blogs : BLOGS;

  return (
    <View style={styles.container}>
      <SectionHeader title="Astrology Blog" onSeeAll={() => router.push('/blog')} />
      {items.slice(0, 3).map((blog) => (
        <TouchableOpacity key={blog._id} style={styles.card} activeOpacity={0.85}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{blog.category || 'Astro'}</Text>
          </View>
          <Text style={styles.title}>{blog.title}</Text>
          <Text style={styles.excerpt} numberOfLines={2}>{blog.excerpt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    ...SHADOW,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  badgeText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  title: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  excerpt: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 6,
    lineHeight: 19,
  },
});