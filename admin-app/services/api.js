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
      return Promise.reject({
        message: 'Server connect nahi ho raha. APK me Render EXPO_PUBLIC_API_URL set karke rebuild karo.',
        networkError: true,
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