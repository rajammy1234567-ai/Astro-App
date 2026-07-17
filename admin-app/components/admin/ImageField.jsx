import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { colors } from '../../constants/theme';
import { uploadImageBase64 } from '../../services/uploadApi';
import { pickLocalImage } from '../../services/pickLocalImage';
import { resolveMediaUrl } from '../../utils/mediaUrl';

export default function ImageField({ label, value, onChange, placeholder }) {
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    try {
      const dataUrl = await pickLocalImage();
      if (!dataUrl) return;

      setUploading(true);
      const url = await uploadImageBase64(dataUrl);
      onChange(url);
    } catch (err) {
      Alert.alert('Upload failed', err.message || 'Image upload nahi ho payi.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder || 'Image URL ya gallery se select karo'}
        placeholderTextColor={colors.textMuted}
        value={String(value ?? '')}
        onChangeText={onChange}
      />
      <TouchableOpacity
        style={[styles.pickBtn, uploading && styles.pickBtnDisabled]}
        onPress={pickImage}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#0f172a" size="small" />
        ) : (
          <Text style={styles.pickBtnText}>📁 Local Image Select</Text>
        )}
      </TouchableOpacity>
      {value ? (
        <Image source={{ uri: resolveMediaUrl(value) }} style={styles.preview} resizeMode="cover" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, color: colors.textMuted, marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, padding: 14, color: colors.text, marginBottom: 8,
  },
  pickBtn: {
    backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 12,
    alignItems: 'center', marginBottom: 10,
  },
  pickBtnDisabled: { opacity: 0.7 },
  pickBtnText: { color: '#0f172a', fontWeight: '700', fontSize: 14 },
  preview: {
    width: 80, height: 80, borderRadius: 10, marginBottom: 8,
    borderWidth: 1, borderColor: colors.border,
  },
});