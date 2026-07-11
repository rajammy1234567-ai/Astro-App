import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import Screen from '../../components/common/Screen';
import Header from '../../components/common/Header';
import Button from '../../components/common/Button';
import RemoteImage from '../../components/common/RemoteImage';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../services/authApi';
import { sessionApi } from '../../services/sessionApi';
import { setUser } from '../../redux/authSlice';
import { COLORS } from '../../constants/colors';
import { SHADOW, SHADOW_MD } from '../../constants/theme';
import { ageFromDob, parseDob, GENDER_OPTIONS } from '../../utils/birthDetails';
import { formatPhone } from '../../utils/formatters';

export default function EditProfileScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [timeOfBirth, setTimeOfBirth] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [gender, setGender] = useState('');

  const age = ageFromDob(dateOfBirth);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    authApi.getMe()
      .then((me) => {
        setName(me.name || '');
        setEmail(me.email || '');
        setPhone(me.phone || '');
        setAvatar(me.avatar || '');
        setDateOfBirth(me.dateOfBirth || '');
        setTimeOfBirth(me.timeOfBirth || '');
        setPlaceOfBirth(me.placeOfBirth || '');
        setGender(me.gender || '');
        dispatch(setUser(me));
      })
      .catch(() => {
        if (user) {
          setName(user.name || '');
          setEmail(user.email || '');
          setPhone(user.phone || '');
          setAvatar(user.avatar || '');
          setDateOfBirth(user.dateOfBirth || '');
          setTimeOfBirth(user.timeOfBirth || '');
          setPlaceOfBirth(user.placeOfBirth || '');
          setGender(user.gender || '');
        }
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  const pickAvatar = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission', 'Gallery access is required to change your photo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        base64: true,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      if (!asset.base64) {
        Alert.alert('Error', 'Could not read the image. Please try another photo.');
        return;
      }

      setUploading(true);
      const mime = asset.mimeType || 'image/jpeg';
      const dataUrl = `data:${mime};base64,${asset.base64}`;
      const up = await sessionApi.uploadMedia(dataUrl);
      if (up?.url) {
        setAvatar(up.url);
        // Optimistic local preview already via state
      } else {
        Alert.alert('Upload failed', 'Photo upload failed.');
      }
    } catch (err) {
      Alert.alert('Upload failed', err.message || 'Photo upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      Alert.alert('Name', 'Name must be at least 2 characters.');
      return;
    }

    const emailTrim = email.trim().toLowerCase();
    if (emailTrim && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      Alert.alert('Email', 'Enter a valid email or leave this field empty.');
      return;
    }

    if (dateOfBirth.trim() && !parseDob(dateOfBirth)) {
      Alert.alert('Date of Birth', 'Format: DD/MM/YYYY (e.g. 15/08/1995)');
      return;
    }

    if (gender && !['male', 'female', 'other'].includes(gender)) {
      Alert.alert('Gender', 'Please select a gender.');
      return;
    }

    if (age != null && age < 13) {
      Alert.alert('Age', 'Minimum age must be 13 years.');
      return;
    }

    setSaving(true);
    try {
      const updated = await authApi.updateProfile({
        name: trimmedName,
        email: emailTrim,
        avatar: avatar || undefined,
        dateOfBirth: dateOfBirth.trim(),
        timeOfBirth: timeOfBirth.trim(),
        placeOfBirth: placeOfBirth.trim(),
        gender: gender || '',
      });
      dispatch(setUser({
        ...updated,
        age: ageFromDob(updated.dateOfBirth) ?? age,
      }));
      Alert.alert(
        'Profile Saved',
        'Your profile has been updated.',
        [{ text: 'OK', onPress: () => router.replace('/profile') }]
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'Save failed. Try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Screen edges={['left', 'right', 'bottom']} style={styles.screen}>
        <Header title="Edit Profile" />
        <View style={styles.center}>
          <Ionicons name="lock-closed-outline" size={40} color={COLORS.textLight} />
          <Text style={styles.muted}>Please log in to edit your profile</Text>
          <Button title="Login" onPress={() => router.push('/(auth)/login')} style={{ marginTop: 16 }} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['left', 'right', 'bottom']} keyboard style={styles.screen}>
      <Header title="Edit Profile" subtitle="Name, photo & birth details" />
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <TouchableOpacity style={styles.avatarWrap} onPress={pickAvatar} activeOpacity={0.85}>
              <RemoteImage
                uri={avatar}
                type="avatar"
                style={styles.avatar}
                fallbackIcon="person"
                iconSize={36}
              />
              <View style={styles.camBadge}>
                {uploading ? (
                  <ActivityIndicator size="small" color={COLORS.text} />
                ) : (
                  <Ionicons name="camera" size={14} color={COLORS.text} />
                )}
              </View>
            </TouchableOpacity>
            <Text style={styles.heroTitle}>Update your profile</Text>
            <Text style={styles.heroSub}>Update your photo, name, email, and birth details</Text>
          </View>

          <Text style={styles.section}>Basic info</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your full name"
              placeholderTextColor={COLORS.textLight}
              autoCapitalize="words"
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={COLORS.textLight}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Phone</Text>
            <View style={styles.readOnly}>
              <Ionicons name="call-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.readOnlyText}>
                {phone ? formatPhone(phone) : '— (login number cannot be changed)'}
              </Text>
            </View>
          </View>

          <Text style={styles.section}>Birth / Kundli details</Text>
          <View style={styles.card}>
            <Text style={styles.hint}>
              Useful for consultations and free Kundli. You can update these anytime.
            </Text>

            <Text style={styles.label}>Date of Birth (DD/MM/YYYY)</Text>
            <TextInput
              style={styles.input}
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              placeholder="15/08/1995"
              placeholderTextColor={COLORS.textLight}
            />
            <Text style={styles.ageLine}>
              Age: {age != null ? `${age} years (auto)` : '— enter DOB'}
            </Text>

            <Text style={styles.label}>Time of Birth</Text>
            <TextInput
              style={styles.input}
              value={timeOfBirth}
              onChangeText={setTimeOfBirth}
              placeholder="10:30 AM"
              placeholderTextColor={COLORS.textLight}
            />

            <Text style={styles.label}>Place of Birth</Text>
            <TextInput
              style={styles.input}
              value={placeOfBirth}
              onChangeText={setPlaceOfBirth}
              placeholder="City, State"
              placeholderTextColor={COLORS.textLight}
            />

            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderRow}>
              {GENDER_OPTIONS.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  style={[styles.chip, gender === g.id && styles.chipActive]}
                  onPress={() => setGender(g.id)}
                >
                  <Text style={[styles.chipText, gender === g.id && styles.chipTextActive]}>
                    {g.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Button title="Save Profile" onPress={handleSave} loading={saving || uploading} />
          <TouchableOpacity style={styles.cancel} onPress={() => router.back()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.cream },
  scroll: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  muted: { color: COLORS.textSecondary, fontWeight: '600', marginTop: 8 },

  hero: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.primary + '55',
    ...SHADOW_MD,
  },
  avatarWrap: { position: 'relative', marginBottom: 12 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  camBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  heroTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  heroSub: {
    fontSize: 12, color: COLORS.textSecondary, marginTop: 6, textAlign: 'center', lineHeight: 17,
  },

  section: {
    fontSize: 12, fontWeight: '800', color: COLORS.textLight,
    letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8, marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOW,
  },
  hint: {
    fontSize: 12, color: COLORS.textSecondary, lineHeight: 17, marginBottom: 12, fontWeight: '500',
  },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 6, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 12,
    backgroundColor: COLORS.cream,
  },
  readOnly: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: COLORS.borderLight,
    marginBottom: 4,
  },
  readOnlyText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
  genderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cream,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.text, fontWeight: '800' },
  ageLine: {
    fontSize: 13, fontWeight: '700', color: COLORS.success, marginTop: -6, marginBottom: 12,
  },
  cancel: { alignItems: 'center', paddingVertical: 14 },
  cancelText: { color: COLORS.textSecondary, fontWeight: '700', fontSize: 14 },
});
