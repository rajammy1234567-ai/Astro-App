import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RemoteImage from './RemoteImage';
import { COLORS } from '../../constants/colors';

export default function ArticleModal({ visible, item, type = 'blog', onClose }) {
  if (!item) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.close} onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <ScrollView showsVerticalScrollIndicator={false}>
            {item.image ? (
              <RemoteImage
                uri={item.image}
                type={type}
                style={styles.cover}
                fallbackIcon={type === 'blog' ? 'newspaper-outline' : 'megaphone-outline'}
              />
            ) : null}
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.meta}>
              {type === 'blog'
                ? `${item.author || 'Astrologer'} · ${item.category || 'Astrology'}`
                : item.source || 'News'}
              {item.date ? ` · ${item.date}` : ''}
            </Text>
            <Text style={styles.body}>
              {item.content || item.excerpt || item.description || 'No additional content available.'}
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    padding: 20,
    paddingTop: 12,
  },
  close: { alignSelf: 'flex-end', padding: 4, marginBottom: 8 },
  cover: { width: '100%', height: 180, borderRadius: 12, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.text, lineHeight: 28 },
  meta: { fontSize: 13, color: COLORS.textSecondary, marginTop: 8, marginBottom: 16 },
  body: { fontSize: 15, color: COLORS.text, lineHeight: 24, paddingBottom: 24 },
});