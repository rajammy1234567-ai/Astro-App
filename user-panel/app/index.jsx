import { Redirect } from 'expo-router';
import { useSelector } from 'react-redux';
import { hasCompleteProfile } from '../utils/birthDetails';

export default function Index() {
  const { token, user, initialized } = useSelector((s) => s.auth);

  if (!initialized) return null;

  if (!token) return <Redirect href="/(auth)/login" />;
  if (!hasCompleteProfile(user)) return <Redirect href="/onboarding/profile" />;
  return <Redirect href="/(tabs)/home" />;
}