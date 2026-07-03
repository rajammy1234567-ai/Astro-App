export async function pickLocalImage() {
  let ImagePicker;
  try {
    ImagePicker = await import('expo-image-picker');
  } catch {
    throw new Error(
      'expo-image-picker install nahi hai. Terminal mein chalao: cd admin-app && npm install --legacy-peer-deps && npm run fresh'
    );
  }

  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    throw new Error('Gallery permission denied. Settings se photos access allow karo.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.8,
    base64: true,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  if (!asset.base64) {
    throw new Error('Image read nahi ho payi. Dubara try karo.');
  }

  const mime = asset.mimeType || 'image/jpeg';
  return `data:${mime};base64,${asset.base64}`;
}