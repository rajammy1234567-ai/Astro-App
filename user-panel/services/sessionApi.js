import api from './api';

export const sessionApi = {
  book: (data) => api.post('/sessions/book', data),
  getMy: () => api.get('/sessions/my'),
  get: (id) => api.get(`/sessions/${id}`),
  sendMessage: (id, content, extra = {}) =>
    api.post(`/sessions/${id}/messages`, { content, ...extra }),
  uploadMedia: (dataUrl) => api.post('/sessions/upload', { image: dataUrl }),
  pay: (id, minutes) => api.post(`/sessions/${id}/pay`, { minutes }),
  end: (id) => api.put(`/sessions/${id}/end`),
};