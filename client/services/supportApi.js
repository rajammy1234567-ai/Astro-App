import api from './api';
import { ENDPOINTS } from '../constants/api';

export const supportApi = {
  getFaqs: () => api.get(`${ENDPOINTS.SUPPORT}/faqs`),
};