import { Alert, Linking } from 'react-native';

const ALLOWED_PREFIXES = [
  'http://',
  'https://',
  'mailto:',
  'tel:',
  'astro-app://',
  'astrotalkuser://',
];

function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  return ALLOWED_PREFIXES.some((prefix) => trimmed.toLowerCase().startsWith(prefix));
}

/** Safely open external links — prevents crash on invalid URLs like random text */
export async function safeOpenUrl(url, label = 'link') {
  const trimmed = typeof url === 'string' ? url.trim() : '';

  if (!isValidUrl(trimmed)) {
    Alert.alert(
      'Invalid Link',
      `This ${label} is not valid. Admin ko sahi URL add karna hoga (https://meet.google.com/...)`
    );
    return false;
  }

  try {
    const supported = await Linking.canOpenURL(trimmed);
    if (!supported) {
      Alert.alert('Cannot Open', 'Is link ko is device par open nahi kar sakte.');
      return false;
    }
    await Linking.openURL(trimmed);
    return true;
  } catch {
    Alert.alert('Error', 'Link open nahi ho paya. Baad mein try karo.');
    return false;
  }
}