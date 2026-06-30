import api from './api';
import { ENDPOINTS } from '../constants/api';

export const testimonialApi = {
  getAll: () => api.get(ENDPOINTS.TESTIMONIALS),
};