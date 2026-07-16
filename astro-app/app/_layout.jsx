// Must be first — native gesture + reanimated/worklets init before any UI
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/AuthContext';
import RootErrorBoundary from '../components/common/RootErrorBoundary';
import { COLORS } from '../constants/colors';

export default function RootLayout() {
  return (
    <RootErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: COLORS.background },
            }}
          />
        </AuthProvider>
      </SafeAreaProvider>
    </RootErrorBoundary>
  );
}