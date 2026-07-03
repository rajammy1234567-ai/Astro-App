import { Alert } from 'react-native';

export function requireAuthForPurchase(router, isAuthenticated) {
  if (isAuthenticated) return true;

  Alert.alert('Login Required', 'Product buy karne ke liye pehle login ya account banao.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Create Account', onPress: () => router.push('/(auth)/login?mode=signup') },
    { text: 'Login', onPress: () => router.push('/(auth)/login') },
  ]);
  return false;
}