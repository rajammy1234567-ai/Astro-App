import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import Screen from '../../components/common/Screen';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import Button from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../constants/colors';
import { SHADOW } from '../../constants/theme';

const LANGUAGES = ['English', 'Hindi', 'Punjabi', 'Marathi', 'Tamil'];

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState('English');
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <Screen edges={['left', 'right', 'bottom']} backgroundColor={COLORS.background}>
      <Header title="Settings" />

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.section}>Preferences</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.textSecondary} />
            <Text style={styles.rowText}>Push Notifications</Text>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ true: COLORS.primary }}
            />
          </View>
        </View>

        <Text style={styles.section}>Language</Text>
        <View style={styles.card}>
          {LANGUAGES.map((lang, i) => (
            <TouchableOpacity
              key={lang}
              style={[styles.langRow, i < LANGUAGES.length - 1 && styles.border]}
              onPress={() => setLanguage(lang)}
            >
              <Text style={styles.rowText}>{lang}</Text>
              {language === lang && <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.section}>Support</Text>
        <View style={styles.card}>
          {[
            { label: 'Help & FAQ', route: '/support' },
            { label: 'Contact Us', route: '/support' },
            { label: 'Redeem Gift Card', route: '/wallet/gift-card' },
            { label: 'Privacy Policy', route: null },
            { label: 'Terms of Service', route: null },
          ].map((item, i, arr) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.langRow, i < arr.length - 1 && styles.border]}
              onPress={() => item.route && router.push(item.route)}
            >
              <Text style={styles.rowText}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
            </TouchableOpacity>
          ))}
        </View>

        <Button title="Logout" variant="secondary" onPress={handleLogout} style={styles.logout} />
        <Text style={styles.version}>AstroTalk v1.0.0</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 32 },
  section: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8, marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { backgroundColor: COLORS.surface, borderRadius: 12, marginBottom: 12, ...SHADOW },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  rowText: { flex: 1, fontSize: 15, color: COLORS.text, fontWeight: '500' },
  langRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  border: { borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  logout: { marginTop: 16 },
  version: { textAlign: 'center', color: COLORS.textLight, fontSize: 12, marginTop: 16 },
});