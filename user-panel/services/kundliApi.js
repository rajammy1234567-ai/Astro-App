import api from './api';

/** Live Vedic APIs proxied via our server (AstrologyAPI key never leaves backend). */
export const kundliApi = {
  status: () => api.get('/kundli/status'),

  generate: (body) => api.post('/kundli/generate', body),

  planets: (body) => api.post('/kundli/planets', body),

  panchang: (body = {}) => api.post('/kundli/panchang', body),

  match: (boy, girl) => api.post('/kundli/match', { boy, girl }),

  dasha: (body) => api.post('/kundli/dasha', body),

  doshas: (body) => api.post('/kundli/doshas', body),

  aiReading: (body) => api.post('/kundli/ai-reading', body),

  pdf: (body) => api.post('/kundli/pdf', body),

  searchPlace: (place) => api.post('/kundli/geo', { place }),
};
