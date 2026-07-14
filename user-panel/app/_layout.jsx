import 'react-native-gesture-handler';
// Side-effect import — required so reanimated/worklets init before first render
import 'react-native-reanimated';
import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { Provider } from 'react-redux';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from '../redux/store';
import WebShell from '../components/common/WebShell';
import AuthBootstrap from '../components/auth/AuthBootstrap';
import ProfileGate from '../components/auth/ProfileGate';
import RootErrorBoundary from '../components/common/RootErrorBoundary';
import { COLORS } from '../constants/colors';

/**
 * Root layout — cross-platform.
 * AuthBootstrap keeps branded splash until session + first data are ready.
 */
export default function RootLayout() {
  return (
    <RootErrorBoundary>
      <SafeAreaProvider>
        <WebShell>
          <Provider store={store}>
            <AuthBootstrap>
              <ProfileGate>
                <StatusBar
                  style="dark"
                  translucent={Platform.OS === 'android'}
                  backgroundColor={COLORS.cream}
                />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: COLORS.cream },
                    animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                    animationDuration: Platform.OS === 'web' ? 0 : undefined,
                  }}
                />
              </ProfileGate>
            </AuthBootstrap>
          </Provider>
        </WebShell>
      </SafeAreaProvider>
    </RootErrorBoundary>
  );
}