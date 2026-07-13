/**
 * Fast, timeout-bounded helpers for app cold start.
 * Keeps splash smooth without hanging on slow networks.
 */

export function withTimeout(promise, ms, fallbackValue) {
  let timer;
  const timeout = new Promise((resolve, reject) => {
    timer = setTimeout(() => {
      if (fallbackValue !== undefined) resolve(fallbackValue);
      else reject(new Error('timeout'));
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export async function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Min splash display so UI doesn't flash; max so app never freezes */
export const SPLASH_MIN_MS = 750;
export const SPLASH_MAX_MS = 3500;
export const AUTH_TIMEOUT_MS = 2800;
export const PREFETCH_TIMEOUT_MS = 2200;
