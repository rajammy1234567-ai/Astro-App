import axios from 'axios';
import { getApiBaseUrl } from '../utils/platform';
import { storage } from '../utils/storage';

const api = axios.create({
  timeout: 45000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  config.baseURL = `${getApiBaseUrl()}/admin`;
  const token = await storage.get('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  async (err) => {
    if (!err.response) {
      const base = err.config?.baseURL || `${getApiBaseUrl()}/admin`;
      const isRemote = String(base).startsWith('https://');
      return Promise.reject({
        message: isRemote
          ? `Server connect nahi ho raha (${base}). Render sleep pe ho sakta hai — 30–60s baad try karo.`
          : `Server connect nahi ho raha (${base}). Local server chalu karo ya Render URL set karo.`,
        networkError: true,
        baseURL: base,
      });
    }
    if (err.response?.status === 401 && !err.config?.url?.includes('/login')) {
      await storage.remove('adminToken');
      await storage.remove('adminUser');
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