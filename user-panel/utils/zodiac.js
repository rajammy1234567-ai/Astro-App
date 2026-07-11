/** Sun-sign rashi from DOB (DD/MM/YYYY) — shared with free tools */
import { sunRashiFromDob } from './vedic';

export function rashiFromDob(dobStr) {
  const r = sunRashiFromDob(dobStr);
  return r?.name || null;
}
