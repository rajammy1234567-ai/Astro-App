import api from './api';
import { ENDPOINTS } from '../constants/api';

export const newsApi = {
  getAll: () => api.get(ENDPOINTS.NEWS),
};