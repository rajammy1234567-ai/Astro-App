import { useEffect, useState, useRef } from 'react';
import { Platform } from 'react-native';
import { useDispatch } from 'react-redux';
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from '../../hooks/useAuth';
import { hydrateCart, fetchProducts } from '../../redux/storeSlice';
import { fetchAstrologers } from '../../redux/astrologerSlice';
import { fetchBlogs } from '../../redux/blogSlice';
import AppSplash from '../common/AppSplash';
import {
  delay,
  withTimeout,
  SPLASH_MIN_MS,
  SPLASH_MAX_MS,
  PREFETCH_TIMEOUT_MS,
} from '../../utils/bootstrap';
import { wakeServer, isRemoteApi } from '../../utils/serverHealth';

// Keep native splash visible until we say hide (native only; web no-ops safely)
try {
  SplashScreen.preventAutoHideAsync?.();
} catch {
  /* web / unsupported */
}

/**
 * Blocks app UI until:
 * 1) Auth session restored (or timeout)
 * 2) Optional home prefetch (parallel, timeout)
 * 3) Min splash time for polish
 * Never waits longer than SPLASH_MAX_MS.
 */
export default function AuthBootstrap({ children }) {
  const dispatch = useDispatch();
  const { initialized, restoreSession } = useAuth();
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState('Starting…');
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return undefined;
    started.current = true;
    let cancelled = false;

    // Fire-and-forget: wake Render free tier early (login feels faster)
    if (isRemoteApi()) {
      wakeServer({ maxMs: 60000 }).catch(() => null);
    }

    const finish = async () => {
      try {
        await SplashScreen.hideAsync?.();
      } catch {
        /* ignore */
      }
      if (!cancelled) setReady(true);
    };

    const run = async () => {
      try {
        const t0 = Date.now();
        setPhase('Restoring session…');

        // Auth + cart in parallel
        await Promise.all([
          restoreSession().catch(() => null),
          Promise.resolve(dispatch(hydrateCart())).catch(() => null),
        ]);

        if (cancelled) return;
        setPhase('Loading content…');

        // Prefetch home data — don't block forever if server is slow
        await withTimeout(
          Promise.allSettled([
            dispatch(fetchAstrologers()),
            dispatch(fetchBlogs()),
            dispatch(fetchProducts()),
          ]),
          PREFETCH_TIMEOUT_MS,
          null
        );

        if (cancelled) return;

        // Smooth min display
        const elapsed = Date.now() - t0;
        if (elapsed < SPLASH_MIN_MS) {
          await delay(SPLASH_MIN_MS - elapsed);
        }

        await finish();
      } catch (err) {
        console.warn('[AuthBootstrap] bootstrap failed, opening app anyway', err?.message);
        await finish();
      }
    };

    // Absolute safety net: never leave user on splash forever
    const hardCap = setTimeout(async () => {
      if (cancelled || ready) return;
      try {
        await SplashScreen.hideAsync?.();
      } catch {
        /* ignore */
      }
      setReady(true);
    }, SPLASH_MAX_MS + 500);

    run();

    return () => {
      cancelled = true;
      clearTimeout(hardCap);
    };
  }, [dispatch, restoreSession, ready]);

  // Show splash until bootstrap finished; allow brief handoff if auth flag lags
  if (!ready) {
    return <AppSplash message={phase} />;
  }

  if (!initialized) {
    return <AppSplash message="Finishing setup…" />;
  }

  return children;
}
