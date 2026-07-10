import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { astroApi } from '../../services/astroApi';
import { safeGoBack } from '../../utils/navigation';
import { colors } from '../../constants/theme';

export default function ReviewsScreen() {
  const router = useRouter();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ userName: '', rating: '5', comment: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await astroApi.getReviews();
      setReviews(Array.isArray(data) ? data : []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm({ userName: '', rating: '5', comment: '' });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      userName: item.userName,
      rating: String(item.rating),
      comment: item.comment,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.userName.trim() || !form.comment.trim()) {
      Alert.alert('Error', 'Name and comment required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        userName: form.userName.trim(),
        rating: Number(form.rating),
        comment: form.comment.trim(),
      };
      if (editing) {
        await astroApi.updateReview(editing._id, payload);
      } else {
        await astroApi.createReview(payload);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      Alert.alert('Failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item) => {
    Alert.alert('Delete Review', 'Yeh review hata deni hai?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await astroApi.deleteReview(item._id);
            await load();
          } catch (err) {
            Alert.alert('Failed', err.message);
          }
        },
      },
    ]);
  };

  const toggleVisible = async (item) => {
    try {
      await astroApi.updateReview(item._id, { isVisible: !item.isVisible });
      await load();
    } catch (err) {
      Alert.alert('Failed', err.message);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeGoBack(router, '/(tabs)/profile')}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Reviews & Ratings</Text>
        <TouchableOpacity onPress={openAdd}>
          <Text style={styles.add}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.primary} />
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No reviews yet. Add your first review.</Text>}
          renderItem={({ item }) => (
            <View style={[styles.card, !item.isVisible && styles.cardHidden]}>
              <View style={styles.cardTop}>
                <Text style={styles.name}>{item.userName}</Text>
                <Text style={styles.stars}>{'⭐'.repeat(Math.round(item.rating))}</Text>
              </View>
              <Text style={styles.comment}>{item.comment}</Text>
              <Text style={styles.meta}>{item.source === 'user' ? 'From user' : 'Added by you'}</Text>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => openEdit(item)}>
                  <Text style={styles.edit}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => toggleVisible(item)}>
                  <Text style={styles.hide}>{item.isVisible ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item)}>
                  <Text style={styles.delete}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{editing ? 'Edit Review' : 'Add Review'}</Text>
            <TextInput style={styles.input} placeholder="User name" value={form.userName} onChangeText={(v) => setForm({ ...form, userName: v })} placeholderTextColor={colors.textMuted} />
            <TextInput style={styles.input} placeholder="Rating 1-5" value={form.rating} onChangeText={(v) => setForm({ ...form, rating: v })} keyboardType="numeric" placeholderTextColor={colors.textMuted} />
            <TextInput style={[styles.input, { minHeight: 80 }]} placeholder="Comment" value={form.comment} onChangeText={(v) => setForm({ ...form, comment: v })} multiline placeholderTextColor={colors.textMuted} />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalOpen(false)}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color={colors.text} /> : <Text style={styles.saveText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { color: colors.primary, fontSize: 16 },
  title: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.text },
  add: { color: colors.primary, fontWeight: '700' },
  list: { padding: 16, paddingBottom: 40 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  cardHidden: { opacity: 0.5 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  stars: { fontSize: 12 },
  comment: { fontSize: 13, color: colors.textMuted, marginTop: 8, lineHeight: 18 },
  meta: { fontSize: 11, color: colors.textMuted, marginTop: 6 },
  actions: { flexDirection: 'row', gap: 16, marginTop: 10 },
  edit: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  hide: { color: colors.textMuted, fontWeight: '700', fontSize: 13 },
  delete: { color: colors.danger, fontWeight: '700', fontSize: 13 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.card, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 12 },
  input: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, padding: 12, marginBottom: 10, color: colors.text,
  },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 14, alignItems: 'center', borderRadius: 10, backgroundColor: colors.border },
  saveBtn: { flex: 1, padding: 14, alignItems: 'center', borderRadius: 10, backgroundColor: colors.primary },
  saveText: { color: colors.text, fontWeight: '700' },
});