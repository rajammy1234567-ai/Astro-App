import api from './api';
import { ENDPOINTS } from '../constants/api';

export const freeServiceApi = {
  getAll: () => api.get(ENDPOINTS.FREE_SERVICES),
};