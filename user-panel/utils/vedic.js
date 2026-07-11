/**
 * Client-side Vedic / free-service calculators.
 * Deterministic from DOB / TOB / name / date — no external API required.
 * Suitable for Free Kundli, Horoscope, Panchang, Numerology, Matching.
 */
import { parseDob } from './birthDetails';

export const RASHI_LIST = [
  { name: 'Aries', hindi: 'मेष', lord: 'Mars', element: 'Fire', quality: 'Movable' },
  { name: 'Taurus', hindi: 'वृषभ', lord: 'Venus', element: 'Earth', quality: 'Fixed' },
  { name: 'Gemini', hindi: 'मिथुन', lord: 'Mercury', element: 'Air', quality: 'Dual' },
  { name: 'Cancer', hindi: 'कर्क', lord: 'Moon', element: 'Water', quality: 'Movable' },
  { name: 'Leo', hindi: 'सिंह', lord: 'Sun', element: 'Fire', quality: 'Fixed' },
  { name: 'Virgo', hindi: 'कन्या', lord: 'Mercury', element: 'Earth', quality: 'Dual' },
  { name: 'Libra', hindi: 'तुला', lord: 'Venus', element: 'Air', quality: 'Movable' },
  { name: 'Scorpio', hindi: 'वृश्चिक', lord: 'Mars', element: 'Water', quality: 'Fixed' },
  { name: 'Sagittarius', hindi: 'धनु', lord: 'Jupiter', element: 'Fire', quality: 'Dual' },
  { name: 'Capricorn', hindi: 'मकर', lord: 'Saturn', element: 'Earth', quality: 'Movable' },
  { name: 'Aquarius', hindi: 'कुंभ', lord: 'Saturn', element: 'Air', quality: 'Fixed' },
  { name: 'Pisces', hindi: 'मीन', lord: 'Jupiter', element: 'Water', quality: 'Dual' },
];

const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];

const NAK_LORDS = [
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu',
  'Jupiter', 'Saturn', 'Mercury', 'Ketu', 'Venus', 'Sun',
  'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu',
  'Jupiter', 'Saturn', 'Mercury',
];

const TITHIS = [
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi',
  'Saptami', 'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi',
  'Trayodashi', 'Chaturdashi', 'Purnima/Amavasya',
];

const YOGAS = [
  'Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda',
  'Sukarma', 'Dhriti', 'Shoola', 'Ganda', 'Vriddhi', 'Dhruva',
  'Vyaghata', 'Harshana', 'Vajra', 'Siddhi', 'Vyatipata', 'Variyan',
  'Parigha', 'Shiva', 'Siddha', 'Sadhya', 'Shubha', 'Shukla',
  'Brahma', 'Indra', 'Vaidhriti',
];

const KARANAS = [
  'Bava', 'Balava', 'Kaulava', 'Taitila', 'Garija', 'Vanija', 'Vishti (Bhadra)',
  'Shakuni', 'Chatushpada', 'Naga', 'Kimstughna',
];

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAYS_HI = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];

const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

/** Stable hash 0..mod-1 from string */
function hashStr(str, mod = 1000) {
  let h = 0;
  const s = String(str || '');
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return mod ? h % mod : h;
}

function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000);
}

/** Sun sign (rashi) from DOB — tropical approximation used for free tools */
export function sunRashiFromDob(dobStr) {
  const d = parseDob(dobStr);
  if (!d) return null;
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const cuts = [
    [1, 19, 9], [2, 18, 10], [3, 20, 11], [4, 19, 0], [5, 20, 1], [6, 20, 2],
    [7, 22, 3], [8, 22, 4], [9, 22, 5], [10, 22, 6], [11, 21, 7], [12, 21, 8], [12, 31, 9],
  ];
  for (const [mm, maxD, idx] of cuts) {
    if (m < mm || (m === mm && day <= maxD)) return RASHI_LIST[idx];
  }
  return RASHI_LIST[9];
}

/** Moon rashi — offset from sun using day+year seed (demo Vedic-style variety) */
export function moonRashiFromDob(dobStr) {
  const sun = sunRashiFromDob(dobStr);
  if (!sun) return null;
  const d = parseDob(dobStr);
  const offset = (dayOfYear(d) + d.getFullYear()) % 12;
  const sunIdx = RASHI_LIST.findIndex((r) => r.name === sun.name);
  return RASHI_LIST[(sunIdx + offset) % 12];
}

/** Lagna / Ascendant from birth time (hour-based rising) */
export function lagnaFromBirth(dobStr, tobStr) {
  const sun = sunRashiFromDob(dobStr);
  if (!sun) return null;
  const hour = parseHour(tobStr);
  const sunIdx = RASHI_LIST.findIndex((r) => r.name === sun.name);
  // Rough: ascendant advances ~1 rashi every 2 hours from sun-based base
  const lagnaIdx = (sunIdx + Math.floor(((hour + 6) % 24) / 2)) % 12;
  return RASHI_LIST[lagnaIdx];
}

function parseHour(tobStr) {
  if (!tobStr) return 12;
  const s = String(tobStr).trim().toUpperCase();
  const m = s.match(/(\d{1,2})[:.](\d{2})?\s*(AM|PM)?/);
  if (!m) {
    const n = parseInt(s, 10);
    return Number.isFinite(n) ? n % 24 : 12;
  }
  let h = parseInt(m[1], 10) % 24;
  const ap = m[3];
  if (ap === 'PM' && h < 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return h;
}

export function nakshatraFromDob(dobStr) {
  const d = parseDob(dobStr);
  if (!d) return null;
  const idx = (dayOfYear(d) + d.getFullYear() * 3) % 27;
  return {
    name: NAKSHATRAS[idx],
    lord: NAK_LORDS[idx],
    pada: (dayOfYear(d) % 4) + 1,
    index: idx,
  };
}

/** Simplified planetary house placement 1–12 */
export function planetaryChart(dobStr, tobStr = '') {
  const d = parseDob(dobStr);
  if (!d) return [];
  const lagna = lagnaFromBirth(dobStr, tobStr);
  const lagnaIdx = RASHI_LIST.findIndex((r) => r.name === lagna.name);
  const seed = dayOfYear(d) + d.getFullYear() + parseHour(tobStr) * 7;

  return PLANETS.map((planet, i) => {
    const house = ((seed + i * 5 + hashStr(planet, 11)) % 12) + 1;
    const rashiIdx = (lagnaIdx + house - 1) % 12;
    return {
      planet,
      house,
      rashi: RASHI_LIST[rashiIdx].name,
      rashiHindi: RASHI_LIST[rashiIdx].hindi,
      lord: RASHI_LIST[rashiIdx].lord,
    };
  });
}

const HOUSE_MEANINGS = [
  'Self, personality, physical body',
  'Wealth, family, speech',
  'Siblings, courage, short travel',
  'Home, mother, property',
  'Children, intellect, romance',
  'Health, enemies, service',
  'Marriage, partnership, business',
  'Longevity, transformation, occult',
  'Fortune, dharma, higher learning',
  'Career, status, father',
  'Gains, friends, aspirations',
  'Expenses, spirituality, foreign',
];

export function houseSummary(chart) {
  return Array.from({ length: 12 }, (_, i) => {
    const house = i + 1;
    const occupants = chart.filter((p) => p.house === house).map((p) => p.planet);
    return {
      house,
      meaning: HOUSE_MEANINGS[i],
      planets: occupants,
      rashi: chart.find((p) => p.house === house)?.rashi || RASHI_LIST[i].name,
    };
  });
}

/** Manglik: Mars in 1,4,7,8,12 */
export function manglikStatus(chart) {
  const mars = chart.find((p) => p.planet === 'Mars');
  if (!mars) return { isManglik: false, note: 'Mars data unavailable' };
  const bad = [1, 4, 7, 8, 12];
  const isManglik = bad.includes(mars.house);
  return {
    isManglik,
    house: mars.house,
    note: isManglik
      ? `Mangal dosha indicated (Mars in house ${mars.house}). Match with another Manglik or consult expert.`
      : `No strong Mangal dosha (Mars in house ${mars.house}).`,
  };
}

export function generateKundli({ name, dateOfBirth, timeOfBirth, placeOfBirth, gender }) {
  const sun = sunRashiFromDob(dateOfBirth);
  const moon = moonRashiFromDob(dateOfBirth);
  const lagna = lagnaFromBirth(dateOfBirth, timeOfBirth);
  const nak = nakshatraFromDob(dateOfBirth);
  const chart = planetaryChart(dateOfBirth, timeOfBirth);
  const houses = houseSummary(chart);
  const manglik = manglikStatus(chart);
  const d = parseDob(dateOfBirth);

  return {
    name: name || 'Native',
    dateOfBirth,
    timeOfBirth: timeOfBirth || '—',
    placeOfBirth: placeOfBirth || '—',
    gender: gender || '—',
    sunRashi: sun,
    moonRashi: moon,
    lagna,
    nakshatra: nak,
    chart,
    houses,
    manglik,
    lucky: {
      number: ((d ? dayOfYear(d) : 1) % 9) + 1,
      color: sun?.element === 'Fire' ? 'Red / Orange'
        : sun?.element === 'Earth' ? 'Green / Brown'
          : sun?.element === 'Air' ? 'Blue / White'
            : 'White / Silver',
      day: WEEKDAYS[(d?.getDay() ?? 0)],
    },
    summary: buildKundliSummary(name, sun, moon, lagna, nak, manglik),
  };
}

function buildKundliSummary(name, sun, moon, lagna, nak, manglik) {
  return [
    `${name || 'Native'}'s Sun rashi is ${sun?.name} (${sun?.hindi}) — lord ${sun?.lord}, element ${sun?.element}.`,
    `Moon rashi ${moon?.name} (${moon?.hindi}) reflects emotional nature.`,
    `Lagna ${lagna?.name} (${lagna?.hindi}) shapes personality and life approach.`,
    `Birth nakshatra ${nak?.name} (Pada ${nak?.pada}), lord ${nak?.lord}.`,
    manglik.note,
    'This is a free algorithmic kundli — for detailed matching and remedies, consult an astrologer.',
  ].join(' ');
}

/* ───────────── Daily Horoscope ───────────── */

const HORO_POOL = {
  career: [
    'Steady career progress — seniors may support you.',
    'A good day to start new projects; confidence stays high.',
    'Stay clear of office politics; focus on your work.',
    'Strong signs of promotion or recognition.',
    'Teamwork will bring the best results.',
  ],
  love: [
    'Openness in relationships will clear misunderstandings.',
    'Romance and bonding are strong — spend quality time together.',
    'Understanding your partner\'s feelings matters today.',
    'Singles may find opportunities in their social circle.',
    'Family bonds will also offer support.',
  ],
  money: [
    'Finances are stable; avoid unnecessary spending.',
    'A good day for investment research.',
    'Favourable for receiving pending payments.',
    'A budget review will bring long-term benefit.',
    'If a sudden expense comes up, stay calm.',
  ],
  health: [
    'Energy levels are good — light exercise helps.',
    'Pay attention to sleep and hydration.',
    'Manage stress; take a short break.',
    'Keep your diet light; avoid overdoing spicy food.',
    'Try 10 minutes of meditation for mental peace.',
  ],
};

export function dailyHoroscope(rashiName, date = new Date()) {
  const key = `${rashiName}-${date.toISOString().slice(0, 10)}`;
  const h = hashStr(key, 100000);
  const pick = (arr, salt) => arr[(h + salt) % arr.length];
  const rashi = RASHI_LIST.find((r) => r.name === rashiName) || RASHI_LIST[0];
  const score = 55 + (h % 41); // 55–95

  return {
    rashi: rashi.name,
    hindi: rashi.hindi,
    date: date.toISOString().slice(0, 10),
    score,
    mood: score >= 80 ? 'Excellent' : score >= 65 ? 'Good' : 'Average',
    career: pick(HORO_POOL.career, 1),
    love: pick(HORO_POOL.love, 3),
    money: pick(HORO_POOL.money, 5),
    health: pick(HORO_POOL.health, 7),
    luckyNumber: (h % 9) + 1,
    luckyColor: rashi.element === 'Fire' ? 'Orange'
      : rashi.element === 'Earth' ? 'Green'
        : rashi.element === 'Air' ? 'Sky Blue'
          : 'Silver',
    tip: `Today ${rashi.lord}'s influence is active — keep your ${rashi.element} energy balanced.`,
  };
}

/* ───────────── Panchang ───────────── */

export function panchangForDate(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const doy = dayOfYear(d);
  const tithiIdx = (doy + d.getFullYear()) % 15;
  const paksha = Math.floor(((doy + d.getFullYear()) % 30) / 15) === 0 ? 'Shukla' : 'Krishna';
  const nakIdx = (doy * 2 + d.getMonth()) % 27;
  const yogaIdx = (doy + 5) % 27;
  const karanaIdx = (doy + d.getDay()) % 11;
  const weekday = d.getDay();

  // Rough sunrise / sunset for India average
  const sunriseMin = 360 + ((doy % 40) - 20); // ~5:40–6:20
  const sunsetMin = 1080 + ((doy % 50) - 25); // ~17:35–18:25
  const fmt = (mins) => {
    const h = Math.floor(mins / 60);
    const m = Math.abs(mins % 60);
    const ap = h >= 12 ? 'PM' : 'AM';
    const hh = ((h + 11) % 12) + 1;
    return `${hh}:${String(m).padStart(2, '0')} ${ap}`;
  };

  // Rahu kaal segments by weekday (standard table, local approx)
  const rahuSlots = [
    ['4:30 PM', '6:00 PM'], // Sun
    ['7:30 AM', '9:00 AM'],
    ['3:00 PM', '4:30 PM'],
    ['12:00 PM', '1:30 PM'],
    ['1:30 PM', '3:00 PM'],
    ['10:30 AM', '12:00 PM'],
    ['9:00 AM', '10:30 AM'],
  ];

  return {
    date: d.toISOString().slice(0, 10),
    displayDate: d.toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    }),
    vaar: WEEKDAYS[weekday],
    vaarHindi: WEEKDAYS_HI[weekday],
    tithi: `${paksha} ${TITHIS[tithiIdx]}`,
    paksha,
    nakshatra: NAKSHATRAS[nakIdx],
    nakshatraLord: NAK_LORDS[nakIdx],
    yoga: YOGAS[yogaIdx],
    karana: KARANAS[karanaIdx],
    sunrise: fmt(sunriseMin),
    sunset: fmt(sunsetMin),
    rahuKaal: `${rahuSlots[weekday][0]} – ${rahuSlots[weekday][1]}`,
    abhijit: '11:45 AM – 12:30 PM (approx)',
    note: 'This free Panchang is based on a local India average. For muhurat, city-specific expert advice is better.',
  };
}

/* ───────────── Numerology ───────────── */

const LETTER_MAP = {
  A: 1, I: 1, J: 1, Q: 1, Y: 1,
  B: 2, K: 2, R: 2,
  C: 3, G: 3, L: 3, S: 3,
  D: 4, M: 4, T: 4,
  E: 5, H: 5, N: 5, X: 5,
  U: 6, V: 6, W: 6,
  O: 7, Z: 7,
  F: 8, P: 8,
};

function digitSum(n) {
  let x = Math.abs(Number(n) || 0);
  while (x > 9 && x !== 11 && x !== 22 && x !== 33) {
    x = String(x).split('').reduce((a, b) => a + Number(b), 0);
  }
  return x;
}

function nameNumber(name) {
  const letters = String(name || '').toUpperCase().replace(/[^A-Z]/g, '');
  let sum = 0;
  for (const ch of letters) sum += LETTER_MAP[ch] || 0;
  return digitSum(sum);
}

const LIFE_PATH_MEANING = {
  1: 'Leader, independent, pioneering energy.',
  2: 'Diplomat, partner-oriented, sensitive.',
  3: 'Creative, expressive, social charm.',
  4: 'Builder, disciplined, practical.',
  5: 'Freedom lover, adaptable, adventurous.',
  6: 'Caretaker, responsible, family-focused.',
  7: 'Thinker, spiritual, analytical.',
  8: 'Ambitious, authority, material success.',
  9: 'Humanitarian, compassionate, wise.',
  11: 'Intuitive master number — inspiration & vision.',
  22: 'Master builder — large-scale achievements.',
  33: 'Master teacher — healing & service.',
};

export function numerologyReport({ name, dateOfBirth }) {
  const d = parseDob(dateOfBirth);
  if (!d) return null;

  const dd = d.getDate();
  const mm = d.getMonth() + 1;
  const yyyy = d.getFullYear();

  const lifePath = digitSum(dd + mm + yyyy);
  const destiny = nameNumber(name);
  const soul = nameNumber(
    String(name || '').toUpperCase().replace(/[^A-Z]/g, '').replace(/[^AEIOU]/g, '')
  );
  const personality = nameNumber(
    String(name || '').toUpperCase().replace(/[^A-Z]/g, '').replace(/[AEIOU]/g, '')
  );
  const birthday = digitSum(dd);

  const lucky = [
    lifePath,
    destiny,
    ((lifePath + destiny) % 9) || 9,
  ].filter((v, i, a) => a.indexOf(v) === i);

  return {
    name: name || 'You',
    dateOfBirth,
    lifePath,
    lifePathMeaning: LIFE_PATH_MEANING[lifePath] || LIFE_PATH_MEANING[digitSum(lifePath)],
    destiny,
    destinyMeaning: LIFE_PATH_MEANING[destiny] || 'Unique personal expression.',
    soulUrge: soul,
    personality,
    birthday,
    luckyNumbers: lucky,
    luckyColor: lifePath % 2 === 0 ? 'Blue / Green' : 'Red / Gold',
    tip: `Life Path ${lifePath} natives get the best results with patience and consistent action.`,
  };
}

/* ───────────── Kundli Matching (Ashtakoot) ───────────── */

const KOOT_NAMES = [
  { key: 'varna', label: 'Varna', max: 1 },
  { key: 'vashya', label: 'Vashya', max: 2 },
  { key: 'tara', label: 'Tara', max: 3 },
  { key: 'yoni', label: 'Yoni', max: 4 },
  { key: 'grahaMaitri', label: 'Graha Maitri', max: 5 },
  { key: 'gana', label: 'Gana', max: 6 },
  { key: 'bhakoot', label: 'Bhakoot', max: 7 },
  { key: 'nadi', label: 'Nadi', max: 8 },
];

export function matchKundli(boy, girl) {
  const bMoon = moonRashiFromDob(boy.dateOfBirth);
  const gMoon = moonRashiFromDob(girl.dateOfBirth);
  const bNak = nakshatraFromDob(boy.dateOfBirth);
  const gNak = nakshatraFromDob(girl.dateOfBirth);
  if (!bMoon || !gMoon || !bNak || !gNak) {
    return { ok: false, message: 'Valid DOB required for both (DD/MM/YYYY).' };
  }

  const bIdx = RASHI_LIST.findIndex((r) => r.name === bMoon.name);
  const gIdx = RASHI_LIST.findIndex((r) => r.name === gMoon.name);
  const diff = Math.abs(bIdx - gIdx);

  // Deterministic but DOB-based scores
  const seed = hashStr(`${boy.dateOfBirth}-${girl.dateOfBirth}-${bNak.index}-${gNak.index}`, 1000);

  const scores = {
    varna: (bIdx % 4) >= (gIdx % 4) ? 1 : 0,
    vashya: diff <= 3 || diff >= 9 ? 2 : diff <= 5 ? 1 : 0,
    tara: (Math.abs(bNak.index - gNak.index) % 9) <= 4 ? 3 : 1.5,
    yoni: bNak.index % 14 === gNak.index % 14 ? 4 : (bNak.index % 14 + gNak.index % 14) % 2 === 0 ? 2 : 1,
    grahaMaitri: bMoon.lord === gMoon.lord ? 5 : diff % 3 === 0 ? 4 : 2,
    gana: (bNak.index % 3) === (gNak.index % 3) ? 6 : 3,
    bhakoot: [0, 6, 5, 7].includes(diff) ? 0 : 7,
    nadi: (bNak.index % 3) === (gNak.index % 3) ? 0 : 8,
  };

  // slight seed jitter only within remaining room (keep max caps)
  Object.keys(scores).forEach((k, i) => {
    const max = KOOT_NAMES.find((x) => x.key === k).max;
    if (scores[k] < max && (seed + i) % 7 === 0) {
      scores[k] = Math.min(max, scores[k] + 0.5);
    }
  });

  const kootas = KOOT_NAMES.map((k) => ({
    ...k,
    score: Math.round(scores[k.key] * 10) / 10,
  }));

  const total = Math.round(kootas.reduce((s, k) => s + k.score, 0) * 10) / 10;
  const percent = Math.round((total / 36) * 100);

  let verdict = 'Not recommended without remedies';
  let level = 'low';
  if (total >= 28) { verdict = 'Excellent match'; level = 'excellent'; }
  else if (total >= 24) { verdict = 'Very good match'; level = 'good'; }
  else if (total >= 18) { verdict = 'Average — workable with understanding'; level = 'average'; }
  else if (total >= 12) { verdict = 'Below average — consult expert'; level = 'low'; }

  const bManglik = manglikStatus(planetaryChart(boy.dateOfBirth, boy.timeOfBirth));
  const gManglik = manglikStatus(planetaryChart(girl.dateOfBirth, girl.timeOfBirth));
  const manglikNote =
    bManglik.isManglik === gManglik.isManglik
      ? 'Manglik status compatible (both similar).'
      : 'Manglik mismatch — expert remedy / matching review suggested.';

  return {
    ok: true,
    boy: {
      name: boy.name || 'Boy',
      moon: bMoon,
      nakshatra: bNak,
      manglik: bManglik,
    },
    girl: {
      name: girl.name || 'Girl',
      moon: gMoon,
      nakshatra: gNak,
      manglik: gManglik,
    },
    kootas,
    total,
    max: 36,
    percent,
    verdict,
    level,
    manglikNote,
    summary: `Ashtakoot score ${total}/36 (${percent}%). ${verdict}. ${manglikNote}`,
  };
}
