/**
 * Client-side birth / kundli profile helpers
 */

export function parseDob(dobStr) {
  if (!dobStr || !/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(String(dobStr).trim())) {
    return null;
  }
  const [d, m, y] = String(dobStr).trim().split('/').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > new Date().getFullYear()) {
    return null;
  }
  const date = new Date(y, m - 1, d);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  return date;
}

/** Age in years from DOB string DD/MM/YYYY — auto-calculated */
export function ageFromDob(dobStr) {
  const birth = parseDob(dobStr);
  if (!birth) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  if (age < 0 || age > 120) return null;
  return age;
}

export function normalizeProfile(input = {}) {
  return {
    name: String(input.name || '').trim(),
    dateOfBirth: String(input.dateOfBirth || '').trim(),
    timeOfBirth: String(input.timeOfBirth || '').trim(),
    placeOfBirth: String(input.placeOfBirth || '').trim(),
    gender: String(input.gender || '').trim().toLowerCase(),
  };
}

/** True when user has filled all required kundli basics */
export function hasCompleteProfile(user) {
  if (!user) return false;
  const p = normalizeProfile(user);
  if (p.name.length < 2) return false;
  if (!parseDob(p.dateOfBirth)) return false;
  if (!p.timeOfBirth || p.timeOfBirth.length < 3) return false;
  if (!p.placeOfBirth || p.placeOfBirth.length < 2) return false;
  if (!['male', 'female', 'other'].includes(p.gender)) return false;
  return true;
}

export function validateProfile(input) {
  const p = normalizeProfile(input);
  const missing = [];
  if (p.name.length < 2) missing.push('Full Name');
  if (!p.dateOfBirth) missing.push('Date of Birth');
  else if (!parseDob(p.dateOfBirth)) {
    return { ok: false, message: 'Invalid Date of Birth. Format: DD/MM/YYYY (e.g. 15/08/1995)' };
  }
  if (!p.timeOfBirth || p.timeOfBirth.length < 3) missing.push('Time of Birth');
  if (!p.placeOfBirth || p.placeOfBirth.length < 2) missing.push('Place of Birth');
  if (!['male', 'female', 'other'].includes(p.gender)) missing.push('Gender / Sex');

  if (missing.length) {
    return {
      ok: false,
      message: `These details are required: ${missing.join(', ')}`,
      missing,
    };
  }

  const age = ageFromDob(p.dateOfBirth);
  if (age == null) {
    return { ok: false, message: 'Enter a valid Date of Birth so age can be calculated' };
  }
  if (age < 13) {
    return { ok: false, message: 'You must be at least 13 years old to use this app' };
  }

  return { ok: true, profile: p, age };
}

export const GENDER_OPTIONS = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'other', label: 'Other' },
];
