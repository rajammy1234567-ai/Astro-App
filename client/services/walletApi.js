import api from './api';
import { ENDPOINTS } from '../constants/api';

export const walletApi = {
  getBalance: () => api.get(ENDPOINTS.WALLET),
  addMoney: (amount) => api.post(`${ENDPOINTS.WALLET}/add`, { amount }),
  getTransactions: (params) => api.get(`${ENDPOINTS.WALLET}/transactions`, { params }),
};