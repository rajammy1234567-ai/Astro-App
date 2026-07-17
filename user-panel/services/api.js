import axios from 'axios';
import { getApiBaseUrl } from '../utils/platform';
import { storage } from '../utils/storage';

const api = axios.create({
  // Auth is fast after wakeServer(); keep moderate timeout
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  config.baseURL = getApiBaseUrl();
  const token = await storage.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (!error.response) {
      const base = error.config?.baseURL || getApiBaseUrl();
      const isRemote = String(base).startsWith('https://');
      return Promise.reject({
        message: isRemote
          ? `Server se connect nahi hua (${base}). Render free tier sleep pe ho sakta hai — 30–60s baad dubara try karo.`
          : `Server se connect nahi hua (${base}). PC pe server chalu karo: cd server → npm run dev. Phir Expo restart: npx expo start -c`,
        networkError: true,
        baseURL: base,
      });
    }
    const data = error.response.data;
    const status = error.response.status;
    if (typeof data === 'object' && data?.message) {
      return Promise.reject({ ...data, status });
    }
    return Promise.reject({
      message: data?.message || error.message || `Request failed (${status})`,
      status,
    });
  }
);

export default api;