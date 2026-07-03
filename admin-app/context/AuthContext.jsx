import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import { storage } from '../utils/storage';

const BOOTSTRAP_TIMEOUT_MS = 8000;
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bootstrapError, setBootstrapError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled) {
        setBootstrapError('Connection timeout — backend check karo');
        setLoading(false);
      }
    }, BOOTSTRAP_TIMEOUT_MS);

    (async () => {
      const token = await storage.get('adminToken');
      if (!token) {
        clearTimeout(timeout);
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const data = await api.get('/me');
        if (!cancelled) {
          setAdmin(data);
          setBootstrapError(null);
          await storage.set('adminUser', data);
        }
      } catch (err) {
        await storage.remove('adminToken');
        await storage.remove('adminUser');
        if (!cancelled && err.networkError) setBootstrapError(err.message);
      } finally {
        clearTimeout(timeout);
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; clearTimeout(timeout); };
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/login', { email, password });
    await storage.set('adminToken', res.token);
    await storage.set('adminUser', res.admin);
    setAdmin(res.admin);
    setBootstrapError(null);
    return res;
  };

  const logout = async () => {
    await storage.remove('adminToken');
    await storage.remove('adminUser');
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, loading, bootstrapError, login, logout, isAuthenticated: !!admin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);