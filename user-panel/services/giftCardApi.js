import api from './api';
import { ENDPOINTS } from '../constants/api';

export const giftCardApi = {
  redeem: (code) => api.post(`${ENDPOINTS.GIFT_CARDS}/redeem`, { code }),
};