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
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { astroApi } from '../../services/astroApi';
import PanelHeader from '../../components/common/PanelHeader';
import { COLORS, colors, RADIUS, SHADOW_SM } from '../../constants/theme';

const emptyForm = {
  title: '',
  excerpt: '',
  content: '',
  category: 'Astrology',
  image: '',
  isPublished: true,
};

export default function MyBlogsScreen() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await astroApi.getBlogs();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setItems([]);
      Alert.alert('Error', err.message || 'Could not load blogs');
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
      title: item.title || '',
      excerpt: item.excerpt || '',
      content: item.content || '',
      category: item.category || 'Astrology',
      image: item.image || '',
      isPublished: item.isPublished !== false,
    });
    setModal(true);
  };

  const pickCover = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission', 'Gallery access chahiye cover photo ke liye');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.75,
    });
    if (result.canceled || !result.assets?.[0]) return;

    setUploading(true);
    try {
      const asset = result.assets[0];
      const mime = asset.mimeType || 'image/jpeg';
      const dataUrl = `data:${mime};base64,${asset.base64}`;
      const { url } = await astroApi.uploadImage(dataUrl);
      setForm((f) => ({ ...f, image: url }));
    } catch (err) {
      Alert.alert('Upload failed', err.message || 'Try again');
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      Alert.alert('Required', 'Title aur content zaroori hain');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        excerpt: form.excerpt.trim(),
        content: form.content.trim(),
        category: form.category.trim() || 'Astrology',
        image: form.image || '',
        isPublished: !!form.isPublished,
      };
      if (editing?._id) {
        await astroApi.updateBlog(editing._id, payload);
      } else {
        await astroApi.createBlog(payload);
      }
      setModal(false);
      load();
    } catch (err) {
      Alert.alert('Save failed', err.message || 'Could not save blog');
    } finally {
      setSaving(false);
    }
  };

  const remove = (item) => {
    Alert.alert('Delete', `Delete "${item.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await astroApi.deleteBlog(item._id);
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
        title="My Blogs"
        subtitle="User app pe dikhega jab publish ON ho"
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
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="newspaper-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No blogs yet</Text>
              <Text style={styles.emptySub}>
                Astrology tips, remedies, rashi fal — yahan se post karo
              </Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={openCreate}>
                <Text style={styles.emptyBtnText}>Write first blog</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.cover} />
              ) : (
                <View style={[styles.cover, styles.coverPlaceholder]}>
                  <Ionicons name="newspaper-outline" size={28} color={colors.textMuted} />
                </View>
              )}
              <View style={styles.cardBody}>
                <View style={styles.badgeRow}>
                  <View style={styles.catBadge}>
                    <Text style={styles.catText}>{item.category || 'Astrology'}</Text>
                  </View>
                  <View style={[styles.pubBadge, item.isPublished === false && styles.draftBadge]}>
                    <Text style={styles.pubText}>
                      {item.isPublished === false ? 'Draft' : 'Published'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.cardExcerpt} numberOfLines={2}>
                  {item.excerpt || item.content}
                </Text>
                <View style={styles.cardActions}>
                  <TouchableOpacity onPress={() => openEdit(item)}>
                    <Text style={styles.editLink}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => remove(item)}>
                    <Text style={styles.delLink}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={modal} animationType="slide" transparent onRequestClose={() => setModal(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{editing ? 'Edit Blog' : 'New Blog'}</Text>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 20 }}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={form.title}
                onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
                placeholder="Blog title"
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.label}>Category</Text>
              <TextInput
                style={styles.input}
                value={form.category}
                onChangeText={(v) => setForm((f) => ({ ...f, category: v }))}
                placeholder="Astrology"
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.label}>Short excerpt</Text>
              <TextInput
                style={[styles.input, styles.textareaSm]}
                value={form.excerpt}
                onChangeText={(v) => setForm((f) => ({ ...f, excerpt: v }))}
                placeholder="1–2 line preview"
                placeholderTextColor={colors.textMuted}
                multiline
              />
              <Text style={styles.label}>Content *</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={form.content}
                onChangeText={(v) => setForm((f) => ({ ...f, content: v }))}
                placeholder="Full blog article…"
                placeholderTextColor={colors.textMuted}
                multiline
                textAlignVertical="top"
              />
              <Text style={styles.label}>Cover image</Text>
              <TouchableOpacity style={styles.pickBtn} onPress={pickCover} disabled={uploading}>
                {uploading ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : (
                  <Text style={styles.pickBtnText}>
                    {form.image ? 'Change cover photo' : 'Pick cover photo'}
                  </Text>
                )}
              </TouchableOpacity>
              {!!form.image && (
                <Image source={{ uri: form.image }} style={styles.preview} />
              )}
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchLabel}>Publish on User App</Text>
                  <Text style={styles.switchSub}>OFF = draft, sirf aapko dikhega</Text>
                </View>
                <Switch
                  value={form.isPublished}
                  onValueChange={(v) => setForm((f) => ({ ...f, isPublished: v }))}
                  trackColor={{ true: COLORS.success, false: '#D5D0E0' }}
                  thumbColor="#fff"
                />
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
                <Text style={styles.saveText}>{saving ? 'Saving…' : editing ? 'Update' : 'Post'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { padding: 16, paddingBottom: 40 },
  empty: { alignItems: 'center', marginTop: 48, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginTop: 12 },
  emptySub: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 18 },
  emptyBtn: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: RADIUS.md || 12,
  },
  emptyBtnText: { fontWeight: '800', color: COLORS.bannerDark },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...SHADOW_SM,
  },
  cover: { width: '100%', height: 140, backgroundColor: colors.border },
  coverPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: 14 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  catBadge: {
    backgroundColor: `${COLORS.primary}22`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  catText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  pubBadge: {
    backgroundColor: '#166534',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  draftBadge: { backgroundColor: '#b45309' },
  pubText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.text, lineHeight: 22 },
  cardExcerpt: { fontSize: 13, color: colors.textMuted, marginTop: 6, lineHeight: 18 },
  cardActions: { flexDirection: 'row', gap: 16, marginTop: 12 },
  editLink: { color: COLORS.primary, fontWeight: '700' },
  delLink: { color: colors.danger || '#ef4444', fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '92%',
    paddingTop: 18,
    paddingHorizontal: 18,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginBottom: 6 },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    color: colors.text,
    marginBottom: 12,
  },
  textareaSm: { minHeight: 60, textAlignVertical: 'top' },
  textarea: { minHeight: 120, textAlignVertical: 'top' },
  pickBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: colors.bg,
  },
  pickBtnText: { color: COLORS.primary, fontWeight: '700' },
  preview: { width: '100%', height: 140, borderRadius: 10, marginBottom: 12 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  switchLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
  switchSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelText: { color: colors.textMuted, fontWeight: '600' },
  saveBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  saveText: { color: COLORS.bannerDark, fontWeight: '800' },
});
