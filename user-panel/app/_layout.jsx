import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from '../redux/store';
import WebShell from '../components/common/WebShell';
import AuthBootstrap from '../components/auth/AuthBootstrap';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <WebShell>
        <Provider store={store}>
          <AuthBootstrap>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }} />
          </AuthBootstrap>
        </Provider>
      </WebShell>
    </SafeAreaProvider>
  );
}