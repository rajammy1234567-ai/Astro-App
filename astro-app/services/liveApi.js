import axios from 'axios';
import { getApiBaseUrl } from '../utils/platform';
import { storage } from '../utils/storage';

const liveApi = axios.create({
  timeout: 12000,
  headers: { 'Content-Type': 'application/json' },
});

liveApi.interceptors.request.use(async (config) => {
  config.baseURL = `${getApiBaseUrl()}/live`;
  const token = await storage.get('astroToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

liveApi.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const data = err.response?.data;
    return Promise.reject(
      typeof data === 'object' && data?.message
        ? data
        : { message: data?.message || err.message || 'Something went wrong' }
    );
  }
);

export default {
  getMyLive: () => liveApi.get('/astro/mine'),
  startLive: (title) => liveApi.post('/astro/start', { title }),
  endLive: (id) => liveApi.put(`/astro/${id}/end`),
  updateControls: (id, data) => liveApi.put(`/astro/${id}/controls`, data),
  getComments: (id) => liveApi.get(`/${id}/comments`),
  replyComment: (id, text, replyTo) => liveApi.post(`/astro/${id}/comments`, { text, replyTo }),
  getToken: (id) => liveApi.get(`/astro/${id}/token`),
};