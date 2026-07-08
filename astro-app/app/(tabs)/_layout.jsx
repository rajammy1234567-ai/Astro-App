import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, Platform, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors, COLORS } from '../../constants/theme';

export default function TabsLayout() {
  const { isAuthenticated, loading } = useAuth();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 12);

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={COLORS.primary} />
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
          borderTopWidth: 1,
          height: 56 + bottomPad,
          paddingBottom: bottomPad,
          paddingTop: 8,
          position: 'absolute',
          elevation: 0,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: 4 },
        tabBarHideOnKeyboard: Platform.OS === 'android',
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={size} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "chatbubbles" : "chatbubbles-outline"} size={size} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="calls"
        options={{
          title: 'Calls',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "call" : "call-outline"} size={size} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "person-circle" : "person-circle-outline"} size={size + 2} color={color} />
          )
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
});