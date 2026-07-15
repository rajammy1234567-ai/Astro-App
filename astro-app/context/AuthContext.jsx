import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import { storage } from '../utils/storage';
import { wakeServer, isRemoteApi } from '../utils/serverHealth';

const BOOTSTRAP_TIMEOUT_MS = 10000;

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [astrologer, setAstrologer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bootstrapError, setBootstrapError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const timeout = setTimeout(() => {
      if (!cancelled) {
        // Don't block login forever on cold Render — open app with soft error
        setBootstrapError(
          isRemoteApi()
            ? 'Server wake slow (Render free). Login screen se try karo.'
            : 'Connection timeout — check backend & WiFi'
        );
        setLoading(false);
      }
    }, BOOTSTRAP_TIMEOUT_MS);

    (async () => {
      // Start wake early (non-blocking for no-token path)
      const wakePromise = isRemoteApi()
        ? wakeServer({ maxMs: 20000 }).catch(() => null)
        : Promise.resolve(null);

      const token = await storage.get('astroToken');
      if (!token) {
        // Still warm remote server while user sees login
        wakePromise.catch(() => null);
        clearTimeout(timeout);
        if (!cancelled) setLoading(false);
        return;
      }

      // Logged-in: ensure host is up before /me (avoids long hang then fail)
      if (isRemoteApi()) {
        await wakePromise;
      }

      try {
        const data = await api.get('/me');
        if (!cancelled) {
          setAstrologer(data);
          setBootstrapError(null);
          await storage.set('astroUser', data);
        }
      } catch (err) {
        // Only wipe session on real auth errors — keep token on network blips
        if (err?.status === 401 || err?.status === 403) {
          await storage.remove('astroToken');
          await storage.remove('astroUser');
        }
        if (!cancelled && err.networkError) {
          setBootstrapError(err.message);
        }
      } finally {
        clearTimeout(timeout);
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, []);

  const login = async (phone, password) => {
    const res = await api.post('/login', { phone, password });
    await storage.set('astroToken', res.token);
    await storage.set('astroUser', res.astrologer);
    setAstrologer(res.astrologer);
    setBootstrapError(null);
    return res;
  };

  const logout = async () => {
    await storage.remove('astroToken');
    await storage.remove('astroUser');
    setAstrologer(null);
  };

  const refreshProfile = async () => {
    const data = await api.get('/me');
    setAstrologer(data);
    await storage.set('astroUser', data);
    return data;
  };

  /** @param {boolean|{isOnline?:boolean,chatOnline?:boolean,callOnline?:boolean}} payload */
  const setOnline = async (payload) => {
    const body =
      typeof payload === 'boolean' ? { isOnline: payload } : payload || {};
    await api.put('/online', body);
    await refreshProfile();
  };

  const updateProfile = async (data) => {
    const updated = await api.put('/me', data);
    setAstrologer(updated);
    await storage.set('astroUser', updated);
    return updated;
  };

  /** Permanently delete partner account (requires password + confirm DELETE) */
  const deleteAccount = async (password) => {
    const res = await api.delete('/me', {
      data: { password, confirm: 'DELETE' },
    });
    await storage.remove('astroToken');
    await storage.remove('astroUser');
    setAstrologer(null);
    return res;
  };

  return (
    <AuthContext.Provider value={{
      astrologer,
      loading,
      bootstrapError,
      login,
      logout,
      deleteAccount,
      refreshProfile,
      setOnline,
      updateProfile,
      isAuthenticated: !!astrologer,
    }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);