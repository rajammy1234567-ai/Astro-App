import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
  RefreshControl, Alert, TextInput, Modal, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../../services/api';
import { getSectionById } from '../../constants/sections';
import {
  SECTION_DEFAULTS, SECTION_FIELDS, buildFormFromItem, buildPayload,
} from '../../constants/sectionFields';
import FormFields from '../../components/admin/FormFields';
import { getItemLabel, getItemSub } from '../../components/admin/SectionList';
import { normalizeAdminList, rowKey } from '../../utils/normalizeList';
import { colors } from '../../constants/theme';

const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export default function SectionScreen() {
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const section = getSectionById(id);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [orderStatus, setOrderStatus] = useState('pending');
  const [orderModal, setOrderModal] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', email: '', phone: '' });

  const fields = SECTION_FIELDS[id] || [];
  const isReadonly = section?.mode === 'readonly';
  const isOrders = section?.mode === 'orders';
  const isUsers = section?.mode === 'users';
  const canCreate = section?.mode === 'crud' && section?.allowCreate !== false;

  const load = useCallback(async () => {
    if (!section) return;
    try {
      const data = await api.get(section.endpoint);
      setItems(normalizeAdminList(data));
    } catch (err) {
      setItems([]);
      Alert.alert('Load Failed', err.message || 'Could not fetch data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [section]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (section?.mode === 'applications') {
      router.replace('/section/astrologer-applications');
    }
  }, [section, router]);

  if (!section) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>Section not found</Text>
      </View>
    );
  }

  if (section.mode === 'applications') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const openCreate = () => {
    setEditing(null);
    setForm({ ...(SECTION_DEFAULTS[id] || {}) });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    if (!item?._id) return;
    setEditing(item);
    if (isUsers) {
      setUserForm({ name: item.name || '', email: item.email || '', phone: item.phone || '' });
      setModalOpen(true);
      return;
    }
    if (isOrders) {
      setEditing(item);
      setOrderStatus(item.status || 'pending');
      setOrderModal(true);
      return;
    }
    setForm(buildFormFromItem(id, item));
    setModalOpen(true);
  };

  const validateForm = () => {
    const missing = fields.filter((f) => f.required && !String(form[f.key] ?? '').trim());
    if (missing.length) {
      Alert.alert('Required', `Pehle ye bharein: ${missing.map((f) => f.label).join(', ')}`);
      return false;
    }
    if (id === 'products' && !form.isActive) {
      return new Promise((resolve) => {
        Alert.alert(
          'Store mein nahi dikhega',
          '"Show in store" off hai — product save hoga par user app shop mein hidden rahega. Continue?',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Save anyway', onPress: () => resolve(true) },
          ]
        );
      });
    }
    return true;
  };

  const handleSave = async () => {
    if (!isUsers) {
      const ok = await validateForm();
      if (!ok) return;
    }
    setSaving(true);
    try {
      if (isUsers && editing) {
        await api.put(`${section.endpoint}/${editing._id}`, userForm);
      } else {
        const payload = buildPayload(id, form);
        if (editing) await api.put(`${section.endpoint}/${editing._id}`, payload);
        else await api.post(section.endpoint, payload);
      }
      setModalOpen(false);
      await load();
      const createdMsg = id === 'products'
        ? 'Product add ho gaya! User app → Remedies tab → Astro Store mein dikhega.'
        : `${section.title} saved successfully`;
      Alert.alert(editing ? 'Updated' : 'Added', createdMsg);
    } catch (err) {
      Alert.alert('Error', err.message || 'Save failed — server chal raha hai check karo');
    } finally {
      setSaving(false);
    }
  };

  const handleOrderUpdate = async () => {
    setSaving(true);
    try {
      await api.put(`${section.endpoint}/${editing._id}`, { status: orderStatus });
      setOrderModal(false);
      await load();
    } catch (err) {
      Alert.alert('Error', err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item) => {
    if (!item?._id) return;
    Alert.alert('Delete', `Delete "${getItemLabel(item)}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`${section.endpoint}/${item._id}`);
            load();
          } catch (err) {
            Alert.alert('Error', err.message || 'Delete failed');
          }
        },
      },
    ]);
  };

  const handleBlockToggle = (item) => {
    if (!item?._id) return;
    const next = !item.isBlocked;
    Alert.alert(
      next ? 'Block' : 'Unblock',
      `${next ? 'Block' : 'Unblock'} "${getItemLabel(item)}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: next ? 'Block' : 'Unblock',
          style: next ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await api.put(`${section.endpoint}/${item._id}/block`, {
                isBlocked: next,
                blockReason: next ? 'Blocked by admin' : '',
              });
              load();
            } catch (err) {
              Alert.alert('Error', err.message || 'Block update failed');
            }
          },
        },
      ]
    );
  };

  const canBlock = isUsers || id === 'astrologers';
  const showActions = !isReadonly;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.heading} numberOfLines={1}>{section.icon} {section.title}</Text>
          <Text style={styles.count}>{items.length} items</Text>
        </View>
        {canCreate && (
          <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
            <Text style={styles.addText}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.primary} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, index) => rowKey(item, index)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />
          }
          ListEmptyComponent={<Text style={styles.empty}>No items found</Text>}
          renderItem={({ item }) => {
            if (!item) return null;
            return (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{getItemLabel(item)}</Text>
                <Text style={styles.rowSub}>{getItemSub(id, item)}</Text>
              </View>
              {showActions && (
                <View style={styles.actions}>
                  {canBlock && (
                    <TouchableOpacity onPress={() => handleBlockToggle(item)}>
                      <Text style={item.isBlocked ? styles.edit : styles.delete}>
                        {item.isBlocked ? 'Unblock' : 'Block'}
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => openEdit(item)}>
                    <Text style={styles.edit}>{isOrders ? 'Status' : 'Edit'}</Text>
                  </TouchableOpacity>
                  {!isOrders && (
                    <TouchableOpacity onPress={() => handleDelete(item)}>
                      <Text style={styles.delete}>Del</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
            );
          }}
        />
      )}

      {modalOpen && (
      <Modal visible animationType="slide" transparent onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>
              {editing ? 'Edit' : 'Add'} {section.title}
            </Text>
            {id === 'products' && !editing && (
              <Text style={styles.modalHint}>
                Details bharein, neeche "Add Product" dabayein — user app shop mein dikhega.
              </Text>
            )}
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {isUsers ? (
                <>
                  <Text style={styles.label}>Name</Text>
                  <TextInput style={styles.input} value={userForm.name} onChangeText={(v) => setUserForm({ ...userForm, name: v })} placeholderTextColor={colors.textMuted} />
                  <Text style={styles.label}>Phone</Text>
                  <TextInput style={styles.input} value={userForm.phone} onChangeText={(v) => setUserForm({ ...userForm, phone: v })} keyboardType="phone-pad" placeholderTextColor={colors.textMuted} />
                  <Text style={styles.label}>Email</Text>
                  <TextInput style={styles.input} value={userForm.email} onChangeText={(v) => setUserForm({ ...userForm, email: v })} placeholderTextColor={colors.textMuted} />
                </>
              ) : (
                <FormFields fields={fields} form={form} setForm={setForm} />
              )}
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalOpen(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                <Text style={styles.saveText}>
                  {saving ? 'Saving...' : editing ? 'Update' : id === 'products' ? 'Add Product' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      )}

      {orderModal && editing && (
      <Modal visible animationType="slide" transparent onRequestClose={() => setOrderModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Update Order Status</Text>
            <Text style={styles.rowSub}>{getItemLabel(editing)}</Text>
            <View style={styles.statusRow}>
              {ORDER_STATUSES.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.statusChip, orderStatus === s && styles.statusChipActive]}
                  onPress={() => setOrderStatus(s)}
                >
                  <Text style={[styles.statusText, orderStatus === s && styles.statusTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setOrderModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleOrderUpdate} disabled={saving}>
                <Text style={styles.saveText}>{saving ? 'Saving...' : 'Update'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  back: { color: colors.primary, fontSize: 16 },
  heading: { fontSize: 18, fontWeight: '700', color: colors.text },
  count: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  addBtn: { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  addText: { color: '#0f172a', fontWeight: '700' },
  list: { padding: 16, paddingBottom: 40 },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border,
  },
  rowTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  rowSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 12 },
  edit: { color: colors.primary, fontWeight: '600' },
  delete: { color: colors.danger, fontWeight: '600' },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '92%', paddingTop: 20, paddingHorizontal: 20,
  },
  modalScroll: { flexGrow: 0 },
  modalScrollContent: { paddingBottom: 12 },
  modalFooter: {
    flexDirection: 'row', gap: 12, paddingVertical: 16,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  modalCard: { backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalHint: { fontSize: 12, color: colors.primary, marginBottom: 12, lineHeight: 18 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 },
  label: { fontSize: 13, color: colors.textMuted, marginBottom: 6 },
  input: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, padding: 14, color: colors.text, marginBottom: 12,
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  cancelText: { color: colors.textMuted },
  saveBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center' },
  saveText: { color: '#0f172a', fontWeight: '700' },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 16 },
  statusChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  statusChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  statusText: { fontSize: 12, color: colors.textMuted, textTransform: 'capitalize' },
  statusTextActive: { color: '#0f172a', fontWeight: '700' },
});