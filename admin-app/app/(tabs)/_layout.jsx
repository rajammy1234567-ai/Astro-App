import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, Platform, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../constants/theme';

const TAB_BAR_BASE = Platform.select({ ios: 52, android: 56, default: 56 });
const ANDROID_NAV_FALLBACK = 48;

function bottomInset(insets) {
  if (Platform.OS === 'ios') return Math.max(insets.bottom, 8);
  if (insets.bottom > 0) return Math.max(insets.bottom, 16);
  return ANDROID_NAV_FALLBACK;
}

export default function TabsLayout() {
  const { isAuthenticated, loading } = useAuth();
  const insets = useSafeAreaInsets();
  const pad = bottomInset(insets);
  const height = TAB_BAR_BASE + pad;

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height,
          paddingBottom: pad,
          paddingTop: 6,
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          elevation: 10,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="manage"
        options={{
          title: 'Manage',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
});
