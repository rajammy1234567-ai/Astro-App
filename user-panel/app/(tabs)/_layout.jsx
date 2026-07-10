import { Tabs } from 'expo-router';
import { Platform, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { TAB_BAR_BASE, tabBarBottomInset } from '../../utils/layout';

function TabIcon({ name, color, focused }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconFocused]}>
      <Ionicons name={name} size={focused ? 22 : 21} color={color} />
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomPad = tabBarBottomInset(insets);
  const barHeight = TAB_BAR_BASE + bottomPad;

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
          paddingTop: 6,
          // Keep bar above system gestures / 3-button nav
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          elevation: 12,
          shadowColor: '#000',
          shadowOpacity: Platform.OS === 'ios' ? 0.08 : 0.15,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -2 },
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        tabBarActiveTintColor: COLORS.bannerDark,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginBottom: Platform.OS === 'ios' ? 0 : 2,
        },
        tabBarHideOnKeyboard: true,
        // Space so list content is not hidden under absolute tab bar
        sceneStyle: {
          backgroundColor: COLORS.cream,
        },
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
    width: 36,
    height: 28,
    borderRadius: 10,
  },
  iconFocused: {
    backgroundColor: 'rgba(30,16,51,0.08)',
  },
});
