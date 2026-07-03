import api from './api';

export const astrologerApplicationApi = {
  apply: (data) => api.post('/astrologer-applications/apply', data),
  getMy: () => api.get('/astrologer-applications/my'),
  getNotifications: () => api.get('/astrologer-applications/notifications'),
  markRead: (id) => api.put(`/astrologer-applications/notifications/${id}/read`),
  markAllRead: () => api.put('/astrologer-applications/notifications/read-all'),
};