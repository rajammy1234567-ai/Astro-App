import api from './api';

export const reviewApi = {
  getForAstrologer: (astrologerId) => api.get(`/astrologers/${astrologerId}/reviews`),
  add: (astrologerId, data) => api.post(`/astrologers/${astrologerId}/reviews`, data),
};