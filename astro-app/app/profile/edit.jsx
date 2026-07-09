import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  Switch, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { astroApi } from '../../services/astroApi';
import { safeGoBack } from '../../utils/navigation';
import { colors } from '../../constants/theme';

const PACKAGE_MINS = [1, 10, 20, 30];

function defaultPackages(pricePerMin) {
  return PACKAGE_MINS.map((m) => ({ minutes: m, price: String(m * (pricePerMin || 20)) }));
}

export default function EditProfile() {
  const router = useRouter();
  const { astrologer, updateProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const initPackages = astrologer?.pricingPackages?.length
    ? PACKAGE_MINS.map((m) => {
        const found = astrologer.pricingPackages.find((p) => p.minutes === m);
        return { minutes: m, price: String(found?.price ?? m * (astrologer.pricePerMin || 20)) };
      })
    : defaultPackages(astrologer?.pricePerMin);

  const [form, setForm] = useState({
    name: astrologer?.name || '',
    specialty: astrologer?.specialty || '',
    bio: astrologer?.bio || '',
    experience: String(astrologer?.experience || ''),
    image: astrologer?.image || '',
    gallery: astrologer?.gallery || [],
    packages: initPackages,
    languages: (astrologer?.languages || []).join(', '),
    chatEnabled: astrologer?.chatEnabled !== false,
    callEnabled: astrologer?.callEnabled !== false,
  });

  const uploadFromPicker = async (target) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission', 'Gallery access chahiye photo upload ke liye');
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

      if (target === 'profile') {
        setForm((f) => ({ ...f, image: url }));
      } else {
        setForm((f) => ({
          ...f,
          gallery: [...(f.gallery || []), url].slice(0, 12),
        }));
      }
    } catch (err) {
      Alert.alert('Upload failed', err.message || 'Try again');
    } finally {
      setUploading(false);
    }
  };

  const removeGallery = (index) => {
    setForm((f) => ({
      ...f,
      gallery: f.gallery.filter((_, i) => i !== index),
    }));
  };

  const setPackagePrice = (minutes, price) => {
    setForm((f) => ({
      ...f,
      packages: f.packages.map((p) => (p.minutes === minutes ? { ...p, price } : p)),
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    setSaving(true);
    try {
      const pricingPackages = form.packages.map((p) => ({
        minutes: p.minutes,
        price: Number(p.price) || 0,
      }));

      await updateProfile({
        name: form.name.trim(),
        specialty: form.specialty.trim(),
        bio: form.bio.trim(),
        experience: Number(form.experience) || 0,
        image: form.image,
        gallery: form.gallery,
        pricingPackages,
        pricePerMin: pricingPackages[0]?.price || 20,
        languages: form.languages.split(',').map((l) => l.trim()).filter(Boolean),
        chatEnabled: form.chatEnabled,
        callEnabled: form.callEnabled,
      });
      Alert.alert('Saved', 'Profile updated — user panel par dikhega jab online ho');
      safeGoBack(router, '/(tabs)/profile');
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => safeGoBack(router, '/(tabs)/profile')}>
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Edit Profile</Text>
        </View>

        <ScrollView contentContainerStyle={styles.form}>
          <Text style={styles.section}>Profile Photo</Text>
          <TouchableOpacity style={styles.photoBox} onPress={() => uploadFromPicker('profile')} disabled={uploading}>
            {form.image ? (
              <Image source={{ uri: form.image }} style={styles.profileImg} />
            ) : (
              <Text style={styles.photoPlaceholder}>+ Upload Photo</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.section}>Gallery (max 12 photos)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
            {form.gallery.map((uri, i) => (
              <View key={uri + i} style={styles.galleryItem}>
                <Image source={{ uri }} style={styles.galleryImg} />
                <TouchableOpacity style={styles.galleryRemove} onPress={() => removeGallery(i)}>
                  <Text style={styles.galleryRemoveText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            {form.gallery.length < 12 && (
              <TouchableOpacity style={styles.galleryAdd} onPress={() => uploadFromPicker('gallery')} disabled={uploading}>
                <Text style={styles.galleryAddText}>+</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          <Text style={styles.label}>Name *</Text>
          <TextInput style={styles.input} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} placeholderTextColor={colors.textMuted} />

          <Text style={styles.label}>Specialty</Text>
          <TextInput style={styles.input} value={form.specialty} onChangeText={(v) => setForm({ ...form, specialty: v })} placeholder="Vedic, Tarot..." placeholderTextColor={colors.textMuted} />

          <Text style={styles.label}>Experience (years)</Text>
          <TextInput style={styles.input} value={form.experience} onChangeText={(v) => setForm({ ...form, experience: v })} keyboardType="numeric" placeholderTextColor={colors.textMuted} />

          <Text style={styles.label}>Languages (comma separated)</Text>
          <TextInput style={styles.input} value={form.languages} onChangeText={(v) => setForm({ ...form, languages: v })} placeholder="Hindi, English" placeholderTextColor={colors.textMuted} />

          <Text style={styles.label}>Bio</Text>
          <TextInput style={[styles.input, { minHeight: 100 }]} value={form.bio} onChangeText={(v) => setForm({ ...form, bio: v })} multiline placeholder="Apni expertise likho..." placeholderTextColor={colors.textMuted} />

          <Text style={styles.section}>Pricing Packages (₹)</Text>
          <Text style={styles.hint}>User panel par yeh charges dikhenge</Text>
          {form.packages.map((p) => (
            <View key={p.minutes} style={styles.packageRow}>
              <Text style={styles.packageLabel}>{p.minutes} min</Text>
              <TextInput
                style={styles.packageInput}
                value={p.price}
                onChangeText={(v) => setPackagePrice(p.minutes, v)}
                keyboardType="numeric"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          ))}

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Chat Enabled</Text>
            <Switch value={form.chatEnabled} onValueChange={(v) => setForm({ ...form, chatEnabled: v })} trackColor={{ true: colors.success }} />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Call Enabled</Text>
            <Switch value={form.callEnabled} onValueChange={(v) => setForm({ ...form, callEnabled: v })} trackColor={{ true: colors.success }} />
          </View>

          <TouchableOpacity style={styles.linkBtn} onPress={() => router.push('/profile/reviews')}>
            <Text style={styles.linkBtnText}>⭐ Manage Reviews & Ratings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving || uploading}>
            {saving ? <ActivityIndicator color={colors.text} /> : <Text style={styles.saveText}>Save Profile</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { color: colors.primary, fontSize: 16 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  form: { padding: 20, paddingBottom: 40 },
  section: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 16, marginBottom: 8 },
  hint: { fontSize: 12, color: colors.textMuted, marginBottom: 10 },
  label: { fontSize: 13, color: colors.textMuted, marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, padding: 14, color: colors.text, fontSize: 15,
  },
  photoBox: {
    width: 120, height: 120, borderRadius: 60, backgroundColor: colors.card,
    borderWidth: 2, borderColor: colors.primary, alignSelf: 'center',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  profileImg: { width: 120, height: 120, borderRadius: 60 },
  photoPlaceholder: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  galleryScroll: { marginBottom: 8 },
  galleryItem: { marginRight: 10, position: 'relative' },
  galleryImg: { width: 80, height: 80, borderRadius: 10 },
  galleryRemove: {
    position: 'absolute', top: -4, right: -4, width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center',
  },
  galleryRemoveText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  galleryAdd: {
    width: 80, height: 80, borderRadius: 10, borderWidth: 2, borderColor: colors.border,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center',
  },
  galleryAddText: { fontSize: 28, color: colors.textMuted },
  packageRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  packageLabel: { width: 56, fontSize: 14, fontWeight: '700', color: colors.text },
  packageInput: {
    flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, padding: 12, color: colors.text, fontSize: 15,
  },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  switchLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  linkBtn: {
    marginTop: 20, padding: 14, borderRadius: 10, backgroundColor: colors.primaryLight,
    alignItems: 'center',
  },
  linkBtnText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  saveBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 20 },
  saveText: { color: colors.text, fontWeight: '700', fontSize: 16 },
});