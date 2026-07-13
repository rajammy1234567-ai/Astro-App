import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  Switch,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { astroApi } from '../../services/astroApi';
import PanelHeader from '../../components/common/PanelHeader';
import { COLORS, colors, RADIUS, SHADOW_SM } from '../../constants/theme';

const emptyForm = {
  name: '',
  description: '',
  duration: '2 hours',
  price: '',
  serviceType: 'pooja',
  isActive: true,
};

export default function MyServicesScreen() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await astroApi.getServices();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setItems([]);
      Alert.alert('Error', err.message || 'Could not load services');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModal(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      name: item.name || '',
      description: item.description || '',
      duration: item.duration || '',
      price: String(item.price ?? ''),
      serviceType: item.serviceType || 'pooja',
      isActive: item.isActive !== false,
    });
    setModal(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.price) {
      Alert.alert('Required', 'Name and price are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description,
        duration: form.duration,
        price: Number(form.price),
        serviceType: form.serviceType,
        isActive: form.isActive,
      };
      if (editing?._id) {
        await astroApi.updateService(editing._id, payload);
      } else {
        await astroApi.createService(payload);
      }
      setModal(false);
      load();
    } catch (err) {
      Alert.alert('Save failed', err.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const remove = (item) => {
    Alert.alert('Delete', `Remove "${item.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await astroApi.deleteService(item._id);
            load();
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <PanelHeader
        title="My Pooja & Remedies"
        subtitle="Users book these · money goes to admin first"
        onBack={() => router.back()}
        right={
          <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
            <Ionicons name="add" size={22} color={COLORS.bannerDark} />
          </TouchableOpacity>
        }
      />

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i._id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={COLORS.primary}
            />
          }
          ListHeaderComponent={
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={18} color={COLORS.primary} />
              <Text style={styles.infoText}>
                Aap pooja/remedy offer karte ho. User ka full payment pehle admin hold karta hai.
                Kuch mahine baad admin aapko aapka % release karega.
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="flame-outline" size={36} color={COLORS.primary} />
              <Text style={styles.emptyTitle}>No services yet</Text>
              <Text style={styles.emptySub}>Add a pooja or remedy for users to book</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={openCreate}>
                <Text style={styles.emptyBtnText}>+ Add service</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View
                  style={[
                    styles.typePill,
                    item.serviceType === 'remedy' && styles.remedyPill,
                  ]}
                >
                  <Text style={styles.typeText}>
                    {(item.serviceType || 'pooja').toUpperCase()}
                  </Text>
                </View>
                {!item.isActive ? (
                  <Text style={styles.inactive}>OFF</Text>
                ) : (
                  <Text style={styles.active}>LIVE</Text>
                )}
              </View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>
                {item.duration} · ₹{item.price}
              </Text>
              {item.description ? (
                <Text style={styles.desc} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.delBtn} onPress={() => remove(item)}>
                  <Text style={styles.delText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={modal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>
                {editing ? 'Edit service' : 'New pooja / remedy'}
              </Text>

              <Text style={styles.label}>Type</Text>
              <View style={styles.typeRow}>
                {['pooja', 'remedy'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeChip, form.serviceType === t && styles.typeChipOn]}
                    onPress={() => setForm((f) => ({ ...f, serviceType: t }))}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        form.serviceType === t && styles.typeChipTextOn,
                      ]}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                placeholder="e.g. Mangal Dosh Nivaran"
                placeholderTextColor={colors.textLight}
              />

              <Text style={styles.label}>Price (₹) *</Text>
              <TextInput
                style={styles.input}
                value={form.price}
                onChangeText={(v) => setForm((f) => ({ ...f, price: v }))}
                keyboardType="numeric"
                placeholder="2100"
                placeholderTextColor={colors.textLight}
              />

              <Text style={styles.label}>Duration</Text>
              <TextInput
                style={styles.input}
                value={form.duration}
                onChangeText={(v) => setForm((f) => ({ ...f, duration: v }))}
                placeholder="2 hours"
                placeholderTextColor={colors.textLight}
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                value={form.description}
                onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                multiline
                placeholder="What users get…"
                placeholderTextColor={colors.textLight}
              />

              <View style={styles.switchRow}>
                <Text style={styles.label}>Active on user app</Text>
                <Switch
                  value={form.isActive}
                  onValueChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
                  trackColor={{ true: COLORS.success }}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModal(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
                  <Text style={styles.saveText}>{saving ? '…' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { padding: 16, paddingBottom: 40 },
  infoBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: COLORS.primaryLight || '#FFF8E1',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(253,185,19,0.35)',
  },
  infoText: { flex: 1, fontSize: 12, color: COLORS.text, lineHeight: 17, fontWeight: '500' },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginTop: 10 },
  emptySub: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  emptyBtn: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyBtnText: { fontWeight: '800', color: COLORS.bannerDark },
  card: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW_SM,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  typePill: {
    backgroundColor: '#FFF3C4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  remedyPill: { backgroundColor: '#E8F5E9' },
  typeText: { fontSize: 10, fontWeight: '800', color: COLORS.bannerDark },
  active: { fontSize: 10, fontWeight: '800', color: COLORS.success },
  inactive: { fontSize: 10, fontWeight: '800', color: colors.textLight },
  name: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 4, fontWeight: '600' },
  desc: { fontSize: 12, color: colors.textLight, marginTop: 6, lineHeight: 17 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  editBtn: {
    flex: 1,
    backgroundColor: COLORS.bannerDark,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },
  editText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  delBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.error || '#E53935',
  },
  delText: { color: COLORS.error || '#E53935', fontWeight: '800', fontSize: 13 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    maxHeight: '90%',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
    color: COLORS.text,
  },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  typeChipOn: { backgroundColor: COLORS.primary },
  typeChipText: { fontWeight: '700', color: colors.textMuted, textTransform: 'capitalize' },
  typeChipTextOn: { color: COLORS.bannerDark },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalActions: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelText: { fontWeight: '700', color: colors.textMuted },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  saveText: { fontWeight: '800', color: COLORS.bannerDark },
});
