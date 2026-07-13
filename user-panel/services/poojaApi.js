import api from './api';
import { ENDPOINTS } from '../constants/api';

export const poojaApi = {
  /** type: 'pooja' | 'remedy' | undefined (all) */
  getAll: (type) => api.get(type ? `${ENDPOINTS.POOJA}?type=${type}` : ENDPOINTS.POOJA),
  book: (id) => api.post(`${ENDPOINTS.POOJA}/${id}/book`),
};