import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { Provider } from 'react-redux';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from '../redux/store';
import WebShell from '../components/common/WebShell';
import AuthBootstrap from '../components/auth/AuthBootstrap';
import ProfileGate from '../components/auth/ProfileGate';
import { COLORS } from '../constants/colors';

/**
 * Root layout — cross-platform.
 * AuthBootstrap keeps branded splash until session + first data are ready.
 */
export default function RootLayout() {
  return (
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
                  // Faster stack on web
                  animationDuration: Platform.OS === 'web' ? 0 : undefined,
                }}
              />
            </ProfileGate>
          </AuthBootstrap>
        </Provider>
      </WebShell>
    </SafeAreaProvider>
  );
}