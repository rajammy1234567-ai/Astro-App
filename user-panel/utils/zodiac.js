/** Western sun-sign style rashi from DOB (DD/MM/YYYY) */
import { parseDob } from './birthDetails';

const SIGNS = [
  { name: 'Capricorn', until: [1, 19] },
  { name: 'Aquarius', until: [2, 18] },
  { name: 'Pisces', until: [3, 20] },
  { name: 'Aries', until: [4, 19] },
  { name: 'Taurus', until: [5, 20] },
  { name: 'Gemini', until: [6, 20] },
  { name: 'Cancer', until: [7, 22] },
  { name: 'Leo', until: [8, 22] },
  { name: 'Virgo', until: [9, 22] },
  { name: 'Libra', until: [10, 22] },
  { name: 'Scorpio', until: [11, 21] },
  { name: 'Sagittarius', until: [12, 21] },
  { name: 'Capricorn', until: [12, 31] },
];

export function rashiFromDob(dobStr) {
  const d = parseDob(dobStr);
  if (!d) return null;
  const month = d.getMonth() + 1;
  const day = d.getDate();
  for (const s of SIGNS) {
    const [m, maxDay] = s.until;
    if (month < m || (month === m && day <= maxDay)) return s.name;
  }
  return 'Capricorn';
}
