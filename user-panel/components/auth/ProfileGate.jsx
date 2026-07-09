import { useEffect, useRef } from 'react';
import { useRouter, useSegments, usePathname } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { hasCompleteProfile } from '../../utils/birthDetails';

/**
 * After login: if kundli/basic details missing → force /onboarding/profile
 */
export default function ProfileGate({ children }) {
  const { user, isAuthenticated, initialized } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();
  const redirecting = useRef(false);

  useEffect(() => {
    if (!initialized) return;

    const root = segments[0];
    const onAuth = root === '(auth)';
    const onOnboarding = root === 'onboarding' || pathname?.includes('/onboarding');

    // Logged out → don't force profile
    if (!isAuthenticated) {
      redirecting.current = false;
      return;
    }

    const complete = hasCompleteProfile(user);

    // Incomplete profile → onboarding (except already there)
    if (!complete && !onOnboarding) {
      if (redirecting.current) return;
      redirecting.current = true;
      router.replace('/onboarding/profile');
      return;
    }

    // Complete but stuck on onboarding → home
    if (complete && onOnboarding) {
      router.replace('/(tabs)/home');
      return;
    }

    // Auth screens while logged in + complete → home
    if (complete && onAuth) {
      router.replace('/(tabs)/home');
      return;
    }

    redirecting.current = false;
  }, [initialized, isAuthenticated, user, segments, pathname, router]);

  return children;
}
