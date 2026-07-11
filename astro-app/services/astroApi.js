import api from './api';

export const astroApi = {
  getDashboard: () => api.get('/dashboard'),
  getPendingRequests: () => api.get('/requests'),
  getChats: () => api.get('/chats'),
  getChat: (id) => api.get(`/chats/${id}`),
  acceptChat: (id) => api.put(`/chats/${id}/accept`),
  rejectChat: (id) => api.put(`/chats/${id}/reject`),
  sendMessage: (id, content, extra = {}) =>
    api.post(`/chats/${id}/messages`, { content, ...extra }),
  /** Generate Janam Kundli from client birth details and send in chat */
  sendKundli: (id, note) =>
    api.post(`/chats/${id}/send-kundli`, note ? { note } : {}),
  previewKundli: (id) => api.get(`/chats/${id}/kundli-preview`),
  closeChat: (id) => api.put(`/chats/${id}/close`),
  /** Agora RTC token for voice/video (user+astro same channel) */
  getCallToken: (sessionId) => api.get(`/chats/${sessionId}/call-token`),
  getAgoraStatus: () => api.get('/agora/status'),
  updateProfile: (data) => api.put('/me', data),
  deleteAccount: (password) =>
    api.delete('/me', { data: { password, confirm: 'DELETE' } }),
  setOnline: (isOnline) => api.put('/online', { isOnline }),
  uploadImage: (base64DataUrl) => api.post('/upload', { image: base64DataUrl }),
  getReviews: () => api.get('/reviews'),
  createReview: (data) => api.post('/reviews', data),
  updateReview: (id, data) => api.put(`/reviews/${id}`, data),
  deleteReview: (id) => api.delete(`/reviews/${id}`),
};