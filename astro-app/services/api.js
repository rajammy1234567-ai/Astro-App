import axios from 'axios';
import { getApiBaseUrl } from '../utils/platform';
import { storage } from '../utils/storage';

const api = axios.create({
  // After wakeServer() on login screen, auth should be fast
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  config.baseURL = `${getApiBaseUrl()}/astro`;
  const token = await storage.get('astroToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  async (err) => {
    if (!err.response) {
      const base = err.config?.baseURL || `${getApiBaseUrl()}/astro`;
      const isRemote = String(base).startsWith('https://');
      return Promise.reject({
        message: isRemote
          ? `Server se connect nahi ho pa raha (${base}). Render sleep pe ho sakta hai — 30–60s baad try karo.`
          : `Server se connect nahi ho pa raha (${base}). Local server chalu karo ya Render URL set karo.`,
        networkError: true,
        baseURL: base,
      });
    }
    if (err.response?.status === 401 && !err.config?.url?.includes('/login')) {
      await storage.remove('astroToken');
      await storage.remove('astroUser');
    }
    const data = err.response.data;
    return Promise.reject(
      typeof data === 'object' && data?.message
        ? data
        : { message: data?.message || err.message || 'Something went wrong' }
    );
  }
);

export default api;