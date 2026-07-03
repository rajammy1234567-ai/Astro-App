import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { Provider } from 'react-redux';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from '../redux/store';
import WebShell from '../components/common/WebShell';
import AuthBootstrap from '../components/auth/AuthBootstrap';
import { COLORS } from '../constants/colors';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <WebShell>
        <Provider store={store}>
          <AuthBootstrap>
            <StatusBar style="dark" translucent={Platform.OS === 'android'} backgroundColor={COLORS.cream} />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.cream } }} />
          </AuthBootstrap>
        </Provider>
      </WebShell>
    </SafeAreaProvider>
  );
}