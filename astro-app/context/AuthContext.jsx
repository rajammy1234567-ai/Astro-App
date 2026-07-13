import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import { storage } from '../utils/storage';

const BOOTSTRAP_TIMEOUT_MS = 8000;

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [astrologer, setAstrologer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bootstrapError, setBootstrapError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const timeout = setTimeout(() => {
      if (!cancelled) {
        setBootstrapError('Connection timeout — check backend & WiFi');
        setLoading(false);
      }
    }, BOOTSTRAP_TIMEOUT_MS);

    (async () => {
      const token = await storage.get('astroToken');
      if (!token) {
        clearTimeout(timeout);
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const data = await api.get('/me');
        if (!cancelled) {
          setAstrologer(data);
          setBootstrapError(null);
          await storage.set('astroUser', data);
        }
      } catch (err) {
        await storage.remove('astroToken');
        await storage.remove('astroUser');
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