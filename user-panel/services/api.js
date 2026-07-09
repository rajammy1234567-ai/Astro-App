import axios from 'axios';
import { getApiBaseUrl } from '../utils/platform';
import { storage } from '../utils/storage';

const api = axios.create({
  timeout: 15000,
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
        message: `Server se connect nahi ho pa raha (${base}). PC pe server chalao (port 5000) aur phone same WiFi pe rakho.`,
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