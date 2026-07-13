import { Redirect } from 'expo-router';
import { useSelector } from 'react-redux';
import AppSplash from '../components/common/AppSplash';
import { hasCompleteProfile } from '../utils/birthDetails';

/**
 * Entry gate — never blank screen while auth initializes.
 */
export default function Index() {
  const { token, user, initialized } = useSelector((s) => s.auth);

  if (!initialized) {
    return <AppSplash message="Opening AstroTalk…" />;
  }

  if (!token) return <Redirect href="/(auth)/login" />;
  if (!hasCompleteProfile(user)) return <Redirect href="/onboarding/profile" />;
  return <Redirect href="/(tabs)/home" />;
}
