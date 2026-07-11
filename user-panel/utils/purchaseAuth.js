import { Alert } from 'react-native';

export function requireAuthForPurchase(router, isAuthenticated) {
  if (isAuthenticated) return true;

  Alert.alert('Login Required', 'Please log in or create an account to buy products.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Create Account', onPress: () => router.push('/(auth)/login?mode=signup') },
    { text: 'Login', onPress: () => router.push('/(auth)/login') },
  ]);
  return false;
}