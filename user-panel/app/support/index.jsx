import { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import { supportApi } from '../../services/supportApi';
import { SUPPORT_FAQS } from '../../constants/mockData';
import { COLORS } from '../../constants/colors';
import { SHADOW } from '../../constants/theme';

export default function SupportScreen() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    supportApi.getFaqs()
      .then(setFaqs)
      .catch(() => setFaqs(SUPPORT_FAQS))
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.container}>
      <Header title="Customer Support" />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Ionicons name="headset" size={32} color="#FFF" />
          <Text style={styles.heroTitle}>How can we help?</Text>
          <Text style={styles.heroSub}>Browse FAQs or reach out to our support team</Text>
        </View>

        <View style={styles.contactRow}>
          <TouchableOpacity style={styles.contactCard} onPress={() => Linking.openURL('mailto:support@astrotalk.com')}>
            <Ionicons name="mail-outline" size={22} color={COLORS.primary} />
            <Text style={styles.contactText}>Email Us</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactCard} onPress={() => Linking.openURL('tel:+9118001234567')}>
            <Ionicons name="call-outline" size={22} color={COLORS.primary} />
            <Text style={styles.contactText}>Call Us</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.section}>Frequently Asked Questions</Text>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />
        ) : (
          faqs.map((faq) => (
            <TouchableOpacity
              key={faq._id}
              style={styles.faqCard}
              onPress={() => setExpanded(expanded === faq._id ? null : faq._id)}
              activeOpacity={0.8}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQ}>{faq.question}</Text>
                <Ionicons
                  name={expanded === faq._id ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={COLORS.textLight}
                />
              </View>
              {expanded === faq._id && <Text style={styles.faqA}>{faq.answer}</Text>}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  scroll: { padding: 16, paddingBottom: 32 },
  hero: {
    backgroundColor: COLORS.primary, borderRadius: 12, padding: 20,
    alignItems: 'center', marginBottom: 16,
  },
  heroTitle: { color: '#FFF', fontSize: 18, fontWeight: '800', marginTop: 8 },
  heroSub: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 4, textAlign: 'center' },
  contactRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  contactCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.surface, borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  contactText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  section: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 10, textTransform: 'uppercase' },
  faqCard: { backgroundColor: COLORS.surface, borderRadius: 10, padding: 14, marginBottom: 8, ...SHADOW },
  faqHeader: { flexDirection: 'row', alignItems: 'center' },
  faqQ: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.text },
  faqA: { fontSize: 13, color: COLORS.textSecondary, marginTop: 10, lineHeight: 20 },
});