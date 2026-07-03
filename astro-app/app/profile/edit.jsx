import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  Switch, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../constants/theme';

export default function EditProfile() {
  const router = useRouter();
  const { astrologer, updateProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: astrologer?.name || '',
    specialty: astrologer?.specialty || '',
    bio: astrologer?.bio || '',
    image: astrologer?.image || '',
    pricePerMin: String(astrologer?.pricePerMin || 20),
    languages: (astrologer?.languages || []).join(', '),
    chatEnabled: astrologer?.chatEnabled !== false,
    callEnabled: astrologer?.callEnabled !== false,
  });

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        name: form.name.trim(),
        specialty: form.specialty.trim(),
        bio: form.bio.trim(),
        image: form.image.trim(),
        pricePerMin: Number(form.pricePerMin) || 20,
        languages: form.languages.split(',').map((l) => l.trim()).filter(Boolean),
        chatEnabled: form.chatEnabled,
        callEnabled: form.callEnabled,
      });
      Alert.alert('Saved', 'Profile updated successfully');
      router.back();
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
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Edit Profile</Text>
        </View>

        <ScrollView contentContainerStyle={styles.form}>
          <Text style={styles.label}>Name *</Text>
          <TextInput style={styles.input} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} placeholderTextColor={colors.textMuted} />

          <Text style={styles.label}>Specialty</Text>
          <TextInput style={styles.input} value={form.specialty} onChangeText={(v) => setForm({ ...form, specialty: v })} placeholder="Vedic, Tarot..." placeholderTextColor={colors.textMuted} />

          <Text style={styles.label}>Price per minute (₹)</Text>
          <TextInput style={styles.input} value={form.pricePerMin} onChangeText={(v) => setForm({ ...form, pricePerMin: v })} keyboardType="numeric" placeholderTextColor={colors.textMuted} />

          <Text style={styles.label}>Languages (comma separated)</Text>
          <TextInput style={styles.input} value={form.languages} onChangeText={(v) => setForm({ ...form, languages: v })} placeholder="Hindi, English" placeholderTextColor={colors.textMuted} />

          <Text style={styles.label}>Image URL</Text>
          <TextInput style={styles.input} value={form.image} onChangeText={(v) => setForm({ ...form, image: v })} placeholder="https://..." placeholderTextColor={colors.textMuted} />

          <Text style={styles.label}>Bio</Text>
          <TextInput style={[styles.input, { minHeight: 100 }]} value={form.bio} onChangeText={(v) => setForm({ ...form, bio: v })} multiline placeholderTextColor={colors.textMuted} />

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Chat Enabled</Text>
            <Switch value={form.chatEnabled} onValueChange={(v) => setForm({ ...form, chatEnabled: v })} trackColor={{ true: colors.success }} />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Call Enabled</Text>
            <Switch value={form.callEnabled} onValueChange={(v) => setForm({ ...form, callEnabled: v })} trackColor={{ true: colors.success }} />
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save Profile</Text>}
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
  label: { fontSize: 13, color: colors.textMuted, marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, padding: 14, color: colors.text, fontSize: 15,
  },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  switchLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  saveBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 28 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});