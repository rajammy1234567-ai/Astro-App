import { getApiBaseUrl } from '../utils/platform';

export const API_BASE_URL = getApiBaseUrl();

export const ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    SEND_OTP: '/auth/send-otp',
    VERIFY_OTP: '/auth/verify-otp',
    LOGOUT: '/auth/logout',
  },
  ASTROLOGERS: '/astrologers',
  SESSIONS: '/sessions',
  WALLET: '/wallet',
  BLOG: '/blog',
  STORE: '/store',
  ORDERS: '/orders',
  NEWS: '/news',
  POOJA: '/pooja',
  SUPPORT: '/support',
  TESTIMONIALS: '/testimonials',
  FREE_SERVICES: '/free-services',
  GIFT_CARDS: '/gift-cards',
  FOLLOWING: '/following',
  LIVE: '/live',
};