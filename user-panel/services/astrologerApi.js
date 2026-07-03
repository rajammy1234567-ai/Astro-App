import api from './api';
import { ENDPOINTS } from '../constants/api';

export const astrologerApi = {
  getAll: (params) => api.get(ENDPOINTS.ASTROLOGERS, { params }),
  getById: (id) => api.get(`${ENDPOINTS.ASTROLOGERS}/${id}`),
  getChatList: () => api.get(`${ENDPOINTS.ASTROLOGERS}/chat-list`),
  getCallList: () => api.get(`${ENDPOINTS.ASTROLOGERS}/call-list`),
  book: (data) => api.post(`${ENDPOINTS.ASTROLOGERS}/book`, data),
};