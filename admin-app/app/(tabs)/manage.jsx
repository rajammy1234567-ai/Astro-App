import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SECTION_GROUPS } from '../../constants/sections';
import { colors } from '../../constants/theme';

export default function Manage() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return SECTION_GROUPS;
    return SECTION_GROUPS.map((g) => ({
      ...g,
      items: g.items.filter((i) => i.title.toLowerCase().includes(q) || i.id.includes(q)),
    })).filter((g) => g.items.length > 0);
  }, [search]);

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.heading}>Manage All</Text>
      <Text style={styles.sub}>Web admin-panel ki saari sections yahan hain</Text>

      <TextInput
        style={styles.search}
        placeholder="Search (products, users, orders...)"
        placeholderTextColor={colors.textMuted}
        value={search}
        onChangeText={setSearch}
      />

      <ScrollView contentContainerStyle={styles.list}>
        {filtered.map((group) => (
          <View key={group.title}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            {group.items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.item}
                onPress={() => router.push(`/section/${item.id}`)}
              >
                <Text style={styles.icon}>{item.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.desc}>
                    {item.mode === 'applications' && 'Interview · Approve · Reject'}
                    {item.mode === 'orders' && 'View & update order status'}
                    {item.mode === 'users' && 'Edit name, phone, email · view wallet'}
                    {item.mode === 'readonly' && 'View only'}
                    {item.mode === 'crud' && item.id === 'products' && 'Store products · stock · top selling'}
                    {item.mode === 'crud' && item.id === 'astrologers' && 'Photo · Block · Deactivate login · Publish'}
                    {item.mode === 'crud' && !['products', 'astrologers'].includes(item.id) && 'Add · Edit · Delete'}
                  </Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20 },
  heading: { fontSize: 28, fontWeight: '700', color: colors.text, marginTop: 8 },
  sub: { fontSize: 14, color: colors.textMuted, marginBottom: 12 },
  search: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, padding: 14, color: colors.text, marginBottom: 12,
  },
  list: { paddingBottom: 40 },
  groupTitle: {
    fontSize: 12, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 1, marginTop: 12, marginBottom: 8,
  },
  item: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.border,
  },
  icon: { fontSize: 28, marginRight: 14 },
  title: { fontSize: 16, fontWeight: '600', color: colors.text },
  desc: { fontSize: 11, color: colors.textMuted, marginTop: 3 },
  arrow: { fontSize: 24, color: colors.textMuted },
});