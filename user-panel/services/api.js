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
      return Promise.reject({
        message: 'Server se connect nahi ho pa raha. Backend chalao: cd server && npm run dev',
        networkError: true,
      });
    }
    const data = error.response.data;
    return Promise.reject(
      typeof data === 'object' && data?.message
        ? data
        : { message: data?.message || error.message || 'Something went wrong' }
    );
  }
);

export default api;