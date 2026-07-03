import api from './api';
import { ENDPOINTS } from '../constants/api';

export const blogApi = {
  getAll: (params) => api.get(ENDPOINTS.BLOG, { params }),
  getById: (id) => api.get(`${ENDPOINTS.BLOG}/${id}`),
};