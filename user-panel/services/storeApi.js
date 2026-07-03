import api from './api';
import { ENDPOINTS } from '../constants/api';

export const storeApi = {
  getAll: (params) => api.get(ENDPOINTS.STORE, { params }),
  getById: (id) => api.get(`${ENDPOINTS.STORE}/${id}`),
};