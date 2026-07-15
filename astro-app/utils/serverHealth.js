/**
 * Server health + cold-start wake (Render free tier can sleep 15+ min).
 * First request after sleep often needs 30–90s — ping /health before login.
 */
import { getApiBaseUrl } from './platform';

export function isRemoteApi(url = getApiBaseUrl()) {
  if (!url || typeof url !== 'string') return false;
  const u = url.trim();
  if (!u.startsWith('https://')) return false;
  return !u.includes('localhost') && !u.includes('127.0.0.1');
}

export function isRenderApi(url = getApiBaseUrl()) {
  return /onrender\.com/i.test(url || '');
}

function healthUrl(base = getApiBaseUrl()) {
  return `${String(base || '').replace(/\/$/, '')}/health`;
}

export async function pingHealth(timeoutMs = 6000) {
  const url = healthUrl();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return { ok: false, url, status: res.status };
    }
    return { ok: true, url, status: res.status };
  } catch (err) {
    return {
      ok: false,
      url,
      error: err?.name === 'AbortError' ? 'timeout' : err?.message || 'network',
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function wakeServer(opts = {}) {
  const maxMs = opts.maxMs ?? (isRemoteApi() ? 75000 : 8000);
  const remote = isRemoteApi();
  const base = getApiBaseUrl();
  const started = Date.now();
  let attempt = 0;

  while (Date.now() - started < maxMs) {
    attempt += 1;
    const elapsed = Date.now() - started;
    opts.onProgress?.({
      attempt,
      elapsed,
      remote,
      url: base,
      render: isRenderApi(base),
    });

    const timeoutMs = remote ? Math.min(12000, 4000 + attempt * 1000) : 4000;
    const result = await pingHealth(timeoutMs);
    if (result.ok) {
      return {
        ok: true,
        url: base,
        attempt,
        elapsed: Date.now() - started,
        remote,
      };
    }

    const pause = remote ? Math.min(2500, 800 + attempt * 200) : 400;
    if (Date.now() - started + pause >= maxMs) break;
    await new Promise((r) => setTimeout(r, pause));
  }

  return {
    ok: false,
    url: base,
    attempt,
    elapsed: Date.now() - started,
    remote,
    message: remote
      ? 'Server abhi start nahi hua (Render free tier sleep). 30–60 sec baad dubara try karo.'
      : 'Local server offline. PC pe: cd server → npm run dev',
  };
}

export function wakeStatusMessage({ attempt, elapsed, remote, render }) {
  if (!remote) {
    return attempt <= 1 ? 'Server check…' : 'Local server wait…';
  }
  const sec = Math.max(1, Math.round(elapsed / 1000));
  if (render) {
    return `Render server wake ho raha hai… ${sec}s (pehli baar 30–60s normal)`;
  }
  return `Server start… ${sec}s (attempt ${attempt})`;
}
