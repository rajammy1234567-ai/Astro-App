import api from './api';
import { ENDPOINTS } from '../constants/api';

export const authApi = {
  register: (payload) => api.post(ENDPOINTS.AUTH.REGISTER, payload),
  login: (payload) => api.post(ENDPOINTS.AUTH.LOGIN, payload),
  sendOtp: (payload) => api.post(ENDPOINTS.AUTH.SEND_OTP, payload),
  verifyOtp: (payload) => api.post(ENDPOINTS.AUTH.VERIFY_OTP, payload),
  logout: () => api.post(ENDPOINTS.AUTH.LOGOUT),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
};