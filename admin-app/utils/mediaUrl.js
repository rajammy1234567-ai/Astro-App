import { getApiBaseUrl } from './platform';

/** Rewrite localhost / old LAN hosts so phone can load Render uploads. */
export function resolveMediaUrl(url) {
  if (!url || typeof url !== 'string') return url;
  const serverBase = getApiBaseUrl().replace(/\/api\/?$/, '');
  if (url.startsWith('/uploads/')) return `${serverBase}${url}`;
  try {
    const u = new URL(url);
    if (
      u.hostname === 'localhost'
      || u.hostname === '127.0.0.1'
      || u.hostname.startsWith('192.168.')
      || u.hostname.startsWith('10.')
    ) {
      return `${serverBase}${u.pathname}${u.search || ''}`;
    }
  } catch {
    // keep as-is
  }
  return url
    .replace(/^http:\/\/localhost:5000/i, serverBase)
    .replace(/^http:\/\/127\.0\.0\.1:5000/i, serverBase);
}
