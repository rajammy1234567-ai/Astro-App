import { getApiBaseUrl } from './platform';

/** Admin uploads save as http://localhost:5000/uploads/... — rewrite for phone/LAN. */
export function resolveMediaUrl(url) {
  if (!url || typeof url !== 'string') return url;
  const serverBase = getApiBaseUrl().replace(/\/api$/, '');
  return url
    .replace(/^http:\/\/localhost:5000/i, serverBase)
    .replace(/^http:\/\/127\.0\.0\.1:5000/i, serverBase);
}