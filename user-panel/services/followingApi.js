import api from './api';
import { ENDPOINTS } from '../constants/api';

export const followingApi = {
  getAll: () => api.get(ENDPOINTS.FOLLOWING),
  toggle: (astrologerId) => api.post(`${ENDPOINTS.FOLLOWING}/${astrologerId}`),
};