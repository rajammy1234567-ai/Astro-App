import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { getApiBaseUrl } from '../../utils/platform';

export default function ServerBanner({ message }) {
  if (!message) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.title}>Could not connect to server</Text>
      <Text style={styles.text}>{message}</Text>
      <Text style={styles.hint}>
        1. Start server: cd server → npm run dev{'\n'}
        2. Phone and PC on the same WiFi{'\n'}
        3. From project root: npm run setup:env{'\n'}
        4. Restart Expo: npx expo start -c{'\n'}
        API: {getApiBaseUrl()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    margin: 14,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  title: { fontSize: 14, fontWeight: '700', color: '#B91C1C', marginBottom: 4 },
  text: { fontSize: 13, color: '#7F1D1D', lineHeight: 18 },
  hint: { fontSize: 11, color: COLORS.textSecondary, marginTop: 8, lineHeight: 16 },
});