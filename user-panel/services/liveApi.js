import api from './api';

export default {
  getActiveLives: () => api.get('/live'),
  getLive: (id) => api.get(`/live/${id}`),
  getComments: (id) => api.get(`/live/${id}/comments`),
  joinLive: (id) => api.post(`/live/${id}/join`),
  leaveLive: (id) => api.post(`/live/${id}/leave`),
  postComment: (id, text) => api.post(`/live/${id}/comments`, { text }),
  getToken: (id) => api.get(`/live/${id}/token`),
};