import api from './api';

export async function uploadImageBase64(dataUrl) {
  const res = await api.post('/upload', { image: dataUrl });
  return res.url;
}