import api from './api';
import { ENDPOINTS } from '../constants/api';

export const walletApi = {
  getBalance: () => api.get(ENDPOINTS.WALLET),
  /** Create Razorpay (or dummy) order — does not credit yet */
  createOrder: (amount) => api.post(`${ENDPOINTS.WALLET}/add`, { amount }),
  /** After payment success — credits wallet */
  verifyPayment: (payload) => api.post(`${ENDPOINTS.WALLET}/verify`, payload),
  /** @deprecated use createOrder + verifyPayment */
  addMoney: (amount) => api.post(`${ENDPOINTS.WALLET}/add`, { amount }),
  getTransactions: (params) => api.get(`${ENDPOINTS.WALLET}/transactions`, { params }),
};