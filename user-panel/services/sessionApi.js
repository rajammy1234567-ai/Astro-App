import api from './api';

export const sessionApi = {
  book: (data) => api.post('/sessions/book', data),
  /** @param {'chat'|'call'|undefined} type — filter history */
  getMy: (type) =>
    api.get('/sessions/my', type ? { params: { type } } : undefined),
  get: (id) => api.get(`/sessions/${id}`),
  sendMessage: (id, content, extra = {}) =>
    api.post(`/sessions/${id}/messages`, { content, ...extra }),
  uploadMedia: (dataUrl) => api.post('/sessions/upload', { image: dataUrl }),
  pay: (id, minutes) => api.post(`/sessions/${id}/pay`, { minutes }),
  end: (id) => api.put(`/sessions/${id}/end`),
  /** Agora RTC token for voice/video call */
  getCallToken: (sessionId) => api.get(`/agora/token/user/${sessionId}`),
  getAgoraStatus: () => api.get('/agora/status'),
};