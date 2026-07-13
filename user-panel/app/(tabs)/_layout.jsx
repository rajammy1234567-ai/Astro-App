import { Tabs } from 'expo-router';
import { Platform, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { TAB_BAR_BASE, tabBarBottomInset } from '../../utils/layout';

function TabIcon({ name, color, focused }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconFocused]}>
      <Ionicons name={name} size={focused ? 22 : 20} color={color} />
      {focused ? <View style={styles.focusDot} /> : null}
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomPad = tabBarBottomInset(insets);
  // Slightly roomier for labels + icons without clipping on Android 3-btn nav
  const barHeight = TAB_BAR_BASE + bottomPad + (Platform.OS === 'android' ? 2 : 0);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.borderLight,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: barHeight,
          paddingBottom: bottomPad,
          paddingTop: Platform.OS === 'ios' ? 6 : 8,
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          elevation: 14,
          shadowColor: '#1E1033',
          shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0.18,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -3 },
        },
        tabBarItemStyle: {
          paddingVertical: 2,
          minHeight: 48,
        },
        tabBarActiveTintColor: COLORS.bannerDark,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '800',
          marginTop: 1,
          marginBottom: Platform.OS === 'ios' ? 0 : 2,
          letterSpacing: 0.2,
        },
        tabBarHideOnKeyboard: true,
        // Keep content background consistent under absolute tab bar
        sceneStyle: {
          backgroundColor: COLORS.cream,
        },
        // Avoid jumpy transitions on web
        animation: Platform.OS === 'web' ? 'none' : undefined,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="call"
        options={{
          title: 'Call',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'call' : 'call-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="remedies"
        options={{
          title: 'Remedies',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'flower' : 'flower-outline'} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 30,
    borderRadius: 12,
  },
  iconFocused: {
    backgroundColor: 'rgba(253,185,19,0.18)',
  },
  focusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginTop: 2,
  },
});
