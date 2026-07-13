import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/common/Screen';
import SearchBar from '../../components/common/SearchBar';
import AstrologerListCard from '../../components/home/AstrologerListCard';
import { astrologerApi } from '../../services/astrologerApi';
import { COLORS } from '../../constants/colors';
import { CATEGORIES } from '../../constants/mockData';
import { useScreenInsets } from '../../hooks/useScreenInsets';

const QUICK = [
  { label: 'Chat', route: '/(tabs)/chat', icon: 'chatbubbles-outline' },
  { label: 'Call', route: '/(tabs)/call', icon: 'call-outline' },
  { label: 'Kundli', route: '/kundli', icon: 'planet-outline' },
  { label: 'Pooja', route: '/pooja', icon: 'flame-outline' },
  { label: 'Remedies', route: '/(tabs)/remedies', icon: 'leaf-outline' },
  { label: 'Following', route: '/following', icon: 'heart-outline' },
  { label: 'Horoscope', route: '/horoscope', icon: 'sunny-outline' },
  { label: 'Store', route: '/store', icon: 'diamond-outline' },
];

export default function SearchScreen() {
  const router = useRouter();
  const safe = useScreenInsets();
  const params = useLocalSearchParams();
  const initial = typeof params.q === 'string' ? params.q : '';
  const [q, setQ] = useState(initial);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const runSearch = useCallback(async (term) => {
    const query = String(term || '').trim();
    if (query.length < 1) {
      setResults([]);
      setSearched(false);
      setError('');
      return;
    }
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      // Server search — all published (not only currently online list cache)
      const data = await astrologerApi.getAll({ search: query });
      const list = Array.isArray(data) ? data : [];
      // Client-side specialty fallback if API ignores search
      const ql = query.toLowerCase();
      const filtered = list.filter(
        (a) =>
          a.name?.toLowerCase().includes(ql) ||
          a.specialty?.toLowerCase().includes(ql) ||
          a.languages?.some((l) => String(l).toLowerCase().includes(ql)) ||
          a.badge?.toLowerCase().includes(ql)
      );
      setResults(filtered.length ? filtered : list.filter((a) => a.name?.toLowerCase().includes(ql)));
    } catch (err) {
      setResults([]);
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initial) runSearch(initial);
  }, [initial, runSearch]);

  // Debounced live search
  useEffect(() => {
    const t = setTimeout(() => {
      if (q.trim()) runSearch(q);
      else {
        setResults([]);
        setSearched(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [q, runSearch]);

  const shortcuts = useMemo(() => {
    const ql = q.trim().toLowerCase();
    if (!ql) return QUICK;
    return QUICK.filter((s) => s.label.toLowerCase().includes(ql));
  }, [q]);

  const categoryHits = useMemo(() => {
    const ql = q.trim().toLowerCase();
    if (!ql) return [];
    return CATEGORIES.filter((c) => c.label.toLowerCase().includes(ql));
  }, [q]);

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <View style={[styles.top, { paddingTop: safe.top(8) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.searchWrap}>
          <SearchBar
            value={q}
            onChangeText={setQ}
            placeholder="Search astrologers, services…"
            style={styles.searchBar}
          />
        </View>
        {q.length > 0 ? (
          <TouchableOpacity
            onPress={() => {
              setQ('');
              setResults([]);
              setSearched(false);
              Keyboard.dismiss();
            }}
            hitSlop={8}
          >
            <Text style={styles.clear}>Clear</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item._id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: safe.tabBar + 24, flexGrow: 1 }}
        ListHeaderComponent={
          <View>
            {!searched || !q.trim() ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick links</Text>
                <View style={styles.quickGrid}>
                  {shortcuts.map((s) => (
                    <TouchableOpacity
                      key={s.route + s.label}
                      style={styles.quickChip}
                      onPress={() => router.push(s.route)}
                    >
                      <Ionicons name={s.icon} size={16} color={COLORS.bannerDark} />
                      <Text style={styles.quickText}>{s.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null}

            {categoryHits.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Services</Text>
                {categoryHits.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={styles.serviceRow}
                    onPress={() => router.push(c.route)}
                  >
                    <Ionicons name="sparkles-outline" size={18} color={COLORS.primaryDark} />
                    <Text style={styles.serviceText}>{c.label}</Text>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            {searched ? (
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>
                  Astrologers {loading ? '' : `(${results.length})`}
                </Text>
                {loading ? <ActivityIndicator color={COLORS.primary} size="small" /> : null}
              </View>
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        }
        renderItem={({ item }) => <AstrologerListCard astrologer={item} mode="chat" />}
        ListEmptyComponent={
          searched && !loading ? (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={40} color={COLORS.textLight} />
              <Text style={styles.emptyTitle}>No astrologers found</Text>
              <Text style={styles.emptySub}>Try another name or specialty</Text>
            </View>
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 8,
    gap: 6,
    backgroundColor: COLORS.cream,
  },
  backBtn: { padding: 6 },
  searchWrap: { flex: 1 },
  searchBar: { marginHorizontal: 0, marginBottom: 0 },
  clear: { fontSize: 13, fontWeight: '700', color: COLORS.link, paddingHorizontal: 4 },
  section: { paddingHorizontal: 14, marginTop: 8, marginBottom: 6 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginTop: 12,
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(253,185,19,0.35)',
  },
  quickText: { fontSize: 12, fontWeight: '700', color: COLORS.bannerDark },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.borderLight,
  },
  serviceText: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.text },
  empty: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 24 },
  emptyTitle: { marginTop: 10, fontSize: 16, fontWeight: '800', color: COLORS.text },
  emptySub: { marginTop: 4, fontSize: 13, color: COLORS.textSecondary },
  error: { color: COLORS.error, paddingHorizontal: 14, marginBottom: 8, fontWeight: '600' },
});
