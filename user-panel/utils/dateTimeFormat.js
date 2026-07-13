/** Shared DOB / TOB helpers — app stores DOB as DD/MM/YYYY and time as h:mm AM/PM */

export function pad2(n) {
  return String(n).padStart(2, '0');
}

/** Date → DD/MM/YYYY */
export function formatDobFromDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/** DD/MM/YYYY → Date (local) or null */
export function parseDobToDate(dobStr) {
  if (!dobStr || !/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(String(dobStr).trim())) return null;
  const [d, m, y] = String(dobStr).trim().split('/').map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}

/** Date → YYYY-MM-DD for <input type="date"> */
export function toHtmlDateValue(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** YYYY-MM-DD → DD/MM/YYYY */
export function fromHtmlDateValue(html) {
  if (!html || !/^\d{4}-\d{2}-\d{2}$/.test(html)) return '';
  const [y, m, d] = html.split('-');
  return `${d}/${m}/${y}`;
}

/** Parse "10:30 AM" / "22:15" → { hours24, minutes } */
export function parseTimeOfBirth(str) {
  const s = String(str || '').trim();
  if (!s) return null;

  const ampm = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?$/);
  if (!ampm) return null;
  let h = Number(ampm[1]);
  const min = Number(ampm[2]);
  const mer = ampm[3] ? ampm[3].toUpperCase() : null;
  if (min < 0 || min > 59) return null;
  if (mer) {
    if (h < 1 || h > 12) return null;
    if (mer === 'AM') h = h === 12 ? 0 : h;
    else h = h === 12 ? 12 : h + 12;
  } else if (h < 0 || h > 23) return null;
  return { hours24: h, minutes: min };
}

/** { hours24, minutes } → "10:30 AM" */
export function formatTimeOfBirth(hours24, minutes) {
  const mer = hours24 >= 12 ? 'PM' : 'AM';
  let h = hours24 % 12;
  if (h === 0) h = 12;
  return `${h}:${pad2(minutes)} ${mer}`;
}

/** For <input type="time"> value HH:MM */
export function toHtmlTimeValue(str) {
  const p = parseTimeOfBirth(str);
  if (!p) return '';
  return `${pad2(p.hours24)}:${pad2(p.minutes)}`;
}

export function fromHtmlTimeValue(html) {
  if (!html || !/^\d{2}:\d{2}/.test(html)) return '';
  const [h, m] = html.split(':').map(Number);
  return formatTimeOfBirth(h, m);
}

export const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function daysInMonth(year, monthIndex0) {
  return new Date(year, monthIndex0 + 1, 0).getDate();
}
