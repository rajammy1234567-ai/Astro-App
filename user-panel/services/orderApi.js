import api from './api';
import { ENDPOINTS } from '../constants/api';

export const orderApi = {
  getAll: () => api.get(ENDPOINTS.ORDERS),
  create: (data) => api.post(ENDPOINTS.ORDERS, data),
};