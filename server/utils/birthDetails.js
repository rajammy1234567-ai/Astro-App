/**
 * Normalize + validate kundli birth details for consultations.
 */

const GENDER_LABEL = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
};

function normalizeBirthDetails(input = {}, fallbackUser = {}) {
  const name = String(input.name ?? fallbackUser.name ?? '').trim();
  const dateOfBirth = String(input.dateOfBirth ?? fallbackUser.dateOfBirth ?? '').trim();
  const timeOfBirth = String(input.timeOfBirth ?? fallbackUser.timeOfBirth ?? '').trim();
  const placeOfBirth = String(input.placeOfBirth ?? fallbackUser.placeOfBirth ?? '').trim();
  let gender = String(input.gender ?? fallbackUser.gender ?? '').trim().toLowerCase();
  if (!['male', 'female', 'other', ''].includes(gender)) gender = '';

  return { name, dateOfBirth, timeOfBirth, placeOfBirth, gender };
}

function ageFromDob(dobStr) {
  if (!dobStr || !/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(String(dobStr).trim())) return null;
  const [d, m, y] = String(dobStr).trim().split('/').map(Number);
  const birth = new Date(y, m - 1, d);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const md = today.getMonth() - birth.getMonth();
  if (md < 0 || (md === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age >= 0 && age <= 120 ? age : null;
}

function validateBirthDetails(details) {
  const missing = [];
  if (!details.name || details.name.length < 2) missing.push('Full Name');
  if (!details.dateOfBirth) missing.push('Date of Birth');
  if (!details.timeOfBirth) missing.push('Time of Birth');
  if (!details.placeOfBirth) missing.push('Place of Birth');
  if (!details.gender || !['male', 'female', 'other'].includes(details.gender)) {
    missing.push('Gender / Sex');
  }

  if (missing.length) {
    return {
      ok: false,
      message: `These details are required for consultation: ${missing.join(', ')}`,
      missing,
    };
  }

  // Soft format checks (DD/MM/YYYY)
  if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(details.dateOfBirth)) {
    return { ok: false, message: 'Date of Birth format: DD/MM/YYYY (e.g. 15/08/1995)' };
  }
  if (details.timeOfBirth.length < 3) {
    return { ok: false, message: 'Please enter Time of Birth (e.g. 10:30 AM)' };
  }

  const age = ageFromDob(details.dateOfBirth);
  return { ok: true, age };
}

function genderLabel(gender) {
  return GENDER_LABEL[gender] || (gender ? gender : 'Not shared');
}

/** First auto message shown to astrologer (and user) when session starts */
function buildKundliIntroMessage(details) {
  const age = ageFromDob(details.dateOfBirth);
  const lines = [
    '📋 Client Kundli Details',
    '────────────────────',
    `👤 Name: ${details.name}`,
    `🎂 Date of Birth: ${details.dateOfBirth}${age != null ? ` (Age: ${age} yrs)` : ''}`,
    `⏰ Time of Birth: ${details.timeOfBirth}`,
    `📍 Place of Birth: ${details.placeOfBirth}`,
    `⚧ Gender: ${genderLabel(details.gender)}`,
    '────────────────────',
    'Please use these birth details for accurate reading.',
  ];
  return lines.join('\n');
}

function hasCompleteBirthDetails(userLike = {}) {
  const d = normalizeBirthDetails({}, userLike);
  return validateBirthDetails(d).ok;
}

module.exports = {
  normalizeBirthDetails,
  validateBirthDetails,
  buildKundliIntroMessage,
  hasCompleteBirthDetails,
  genderLabel,
  ageFromDob,
};
