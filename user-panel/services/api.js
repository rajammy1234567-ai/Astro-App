import axios from 'axios';
import { getApiBaseUrl } from '../utils/platform';
import { storage } from '../utils/storage';

const api = axios.create({
  // Render free tier cold-start can take 30–60s
  timeout: 45000,
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
      return Promise.reject({
        message: `Could not connect to the server (${base}). Is the Render URL correct? On the free plan the first request may take 30–60s. EXPO_PUBLIC_API_URL must be baked into the APK.`,
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