import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, Platform, View, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../constants/theme';
import { TAB_BAR_BASE, tabBarBottomInset } from '../../utils/layout';

function TabIcon({ name, focused, color }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconActive]}>
      <Ionicons name={name} size={focused ? 22 : 20} color={color} />
      {focused && <View style={styles.dot} />}
    </View>
  );
}

export default function TabsLayout() {
  const { isAuthenticated, loading } = useAuth();
  const insets = useSafeAreaInsets();
  const bottomPad = tabBarBottomInset(insets);
  const barHeight = TAB_BAR_BASE + bottomPad;

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.loadingCard}>
          <Ionicons name="planet" size={34} color={COLORS.primary} />
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 14 }} />
          <Text style={styles.loadingText}>Partner Panel</Text>
        </View>
      </View>
    );
  }
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.bannerDark,
          borderTopColor: 'rgba(245,197,24,0.14)',
          borderTopWidth: 1,
          height: barHeight,
          paddingBottom: bottomPad,
          paddingTop: 8,
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          elevation: 16,
          shadowColor: '#000',
          shadowOpacity: 0.28,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: -4 },
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.38)',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '800',
          marginTop: 1,
          letterSpacing: 0.3,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="calls"
        options={{
          title: 'Calls',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'call' : 'call-outline'} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? 'person' : 'person-outline'}
              focused={focused}
              color={color}
            />
          ),
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
    backgroundColor: COLORS.bannerDark,
  },
  loadingCard: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(245,197,24,0.2)',
  },
  loadingText: {
    marginTop: 12,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  iconWrap: {
    width: 40,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  iconActive: {
    backgroundColor: 'rgba(245,197,24,0.14)',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginTop: 2,
  },
});
