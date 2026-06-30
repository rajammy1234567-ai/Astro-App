import api from './api';
import { ENDPOINTS } from '../constants/api';

export const poojaApi = {
  getAll: () => api.get(ENDPOINTS.POOJA),
  book: (id) => api.post(`${ENDPOINTS.POOJA}/${id}/book`),
};