import api from './api';

export const astroApi = {
  getDashboard: () => api.get('/dashboard'),
  getChats: () => api.get('/chats'),
  getChat: (id) => api.get(`/chats/${id}`),
  sendMessage: (id, content) => api.post(`/chats/${id}/messages`, { content }),
  closeChat: (id) => api.put(`/chats/${id}/close`),
  updateProfile: (data) => api.put('/me', data),
  setOnline: (isOnline) => api.put('/online', { isOnline }),
};