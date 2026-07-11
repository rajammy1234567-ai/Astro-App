/**
 * AstrologyAPI.com client (Vedic / JSON endpoints).
 * Key stays server-side only — never expose to mobile apps.
 *
 * Auth: header x-astrologyapi-key: ak-...
 * Base: https://json.astrologyapi.com/v1
 */

const BASE_URL = process.env.ASTROLOGY_API_BASE || 'https://json.astrologyapi.com/v1';
const API_KEY = process.env.ASTROLOGY_API_KEY || '';

const RASHI_HINDI = {
  Aries: 'मेष',
  Taurus: 'वृषभ',
  Gemini: 'मिथुन',
  Cancer: 'कर्क',
  Leo: 'सिंह',
  Virgo: 'कन्या',
  Libra: 'तुला',
  Scorpio: 'वृश्चिक',
  Sagittarius: 'धनु',
  Capricorn: 'मकर',
  Aquarius: 'कुंभ',
  Pisces: 'मीन',
};

const HOUSE_MEANINGS = {
  1: 'Self / Lagna',
  2: 'Wealth / Family',
  3: 'Siblings / Courage',
  4: 'Home / Mother',
  5: 'Children / Romance',
  6: 'Health / Enemies',
  7: 'Marriage / Partner',
  8: 'Longevity / Occult',
  9: 'Fortune / Dharma',
  10: 'Career / Status',
  11: 'Gains / Friends',
  12: 'Losses / Moksha',
};

function isConfigured() {
  return Boolean(API_KEY && String(API_KEY).trim());
}

function rashiHindi(name) {
  if (!name) return '';
  const key = Object.keys(RASHI_HINDI).find((k) => k.toLowerCase() === String(name).toLowerCase());
  return key ? RASHI_HINDI[key] : '';
}

/** Parse DD/MM/YYYY → { day, month, year } */
function parseDobParts(dobStr) {
  const s = String(dobStr || '').trim();
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) return null;
  return { day, month, year };
}

/** Parse "10:30 AM" / "22:15" / "10:30" → { hour, min } 24h */
function parseTimeParts(tobStr) {
  const s = String(tobStr || '').trim();
  if (!s) return { hour: 12, min: 0 };

  let m = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?$/);
  if (!m) {
    m = s.match(/^(\d{1,2})\s*(AM|PM|am|pm)$/);
    if (m) return normalizeAmPm(Number(m[1]), 0, m[2]);
    return { hour: 12, min: 0 };
  }
  return normalizeAmPm(Number(m[1]), Number(m[2]), m[3]);
}

function normalizeAmPm(h, min, ampm) {
  let hour = h;
  if (ampm) {
    const ap = ampm.toUpperCase();
    if (ap === 'PM' && hour < 12) hour += 12;
    if (ap === 'AM' && hour === 12) hour = 0;
  }
  if (hour < 0 || hour > 23) hour = 12;
  if (min < 0 || min > 59) min = 0;
  return { hour, min };
}

/**
 * Build AstrologyAPI birth payload.
 * place can be city name — we resolve lat/lon via geo_details when needed.
 */
async function buildBirthPayload({
  dateOfBirth,
  timeOfBirth,
  placeOfBirth,
  lat,
  lon,
  tzone,
  name,
}) {
  const dob = parseDobParts(dateOfBirth);
  if (!dob) {
    const err = new Error('Invalid date of birth. Use DD/MM/YYYY');
    err.status = 400;
    throw err;
  }
  const { hour, min } = parseTimeParts(timeOfBirth);

  let latitude = lat != null && lat !== '' ? Number(lat) : null;
  let longitude = lon != null && lon !== '' ? Number(lon) : null;
  let timezone = tzone != null && tzone !== '' ? Number(tzone) : null;
  let placeName = String(placeOfBirth || '').trim() || 'New Delhi';

  if (latitude == null || longitude == null || Number.isNaN(latitude) || Number.isNaN(longitude)) {
    const geo = await resolvePlace(placeName);
    latitude = geo.lat;
    longitude = geo.lon;
    if (timezone == null) timezone = geo.tzone;
    placeName = geo.place || placeName;
  }

  if (timezone == null || Number.isNaN(timezone)) {
    timezone = 5.5; // IST default
  }

  return {
    day: dob.day,
    month: dob.month,
    year: dob.year,
    hour,
    min,
    lat: latitude,
    lon: longitude,
    tzone: timezone,
    name: name || undefined,
    place: placeName,
  };
}

async function resolvePlace(place) {
  const q = String(place || 'New Delhi').trim() || 'New Delhi';
  try {
    const data = await apiPost('geo_details', { place: q, maxRows: 3 });
    const hit = data?.geonames?.[0];
    if (hit) {
      return {
        place: hit.place_name || q,
        lat: Number(hit.latitude),
        lon: Number(hit.longitude),
        tzone: hit.timezone_id === 'Asia/Kolkata' ? 5.5 : 5.5,
        timezoneId: hit.timezone_id || 'Asia/Kolkata',
      };
    }
  } catch {
    /* fall through */
  }
  // Delhi fallback
  return {
    place: q,
    lat: 28.6139,
    lon: 77.209,
    tzone: 5.5,
    timezoneId: 'Asia/Kolkata',
  };
}

async function apiPost(path, body) {
  if (!isConfigured()) {
    const err = new Error('Astrology API key not configured on server');
    err.status = 503;
    throw err;
  }

  const url = `${BASE_URL.replace(/\/$/, '')}/${String(path).replace(/^\//, '')}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-astrologyapi-key': API_KEY.trim(),
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const msg =
      data?.msg ||
      data?.message ||
      data?.error ||
      `Astrology API error (${res.status}) on ${path}`;
    const err = new Error(msg);
    err.status = res.status >= 400 && res.status < 600 ? res.status : 502;
    err.upstream = data;
    throw err;
  }
  return data;
}

function findPlanet(planets, name) {
  if (!Array.isArray(planets)) return null;
  const n = String(name).toLowerCase();
  return planets.find((p) => String(p.name || '').toLowerCase() === n) || null;
}

function mapPlanetRow(p) {
  if (!p) return null;
  return {
    planet: p.name,
    house: p.house,
    rashi: p.sign,
    rashiHindi: rashiHindi(p.sign),
    degree: typeof p.normDegree === 'number' ? Number(p.normDegree.toFixed(2)) : p.normDegree,
    fullDegree: p.fullDegree,
    nakshatra: p.nakshatra,
    nakshatraLord: p.nakshatraLord,
    pada: p.nakshatra_pad,
    isRetro: p.isRetro === true || p.isRetro === 'true',
    signLord: p.signLord,
    awastha: p.planet_awastha,
  };
}

function buildHouses(planets) {
  const rows = [];
  for (let h = 1; h <= 12; h += 1) {
    const inHouse = (planets || [])
      .filter((p) => p.house === h && String(p.name).toLowerCase() !== 'ascendant')
      .map((p) => p.name);
    const sample = (planets || []).find((p) => p.house === h);
    rows.push({
      house: h,
      meaning: HOUSE_MEANINGS[h] || `House ${h}`,
      planets: inHouse,
      rashi: sample?.sign || '',
      rashiHindi: rashiHindi(sample?.sign),
    });
  }
  return rows;
}

function manglikSummary(manglik) {
  if (!manglik || typeof manglik !== 'object') {
    return { isManglik: false, percentage: 0, note: 'Manglik data unavailable' };
  }

  const pct = Number(
    manglik.percentage_manglik_after_cancellation ??
      manglik.percentage_manglik_present ??
      manglik.percentage ??
      manglik.score ??
      0
  );

  const status = String(manglik.manglik_status || '').toUpperCase();
  // AstrologyAPI often sets is_present=false for mild dosha; use report + percentage
  const present =
    manglik.is_present === true ||
    manglik.is_manglik === true ||
    (status && status !== 'NO' && status !== 'ABSENT' && status !== 'FALSE') ||
    pct > 0 ||
    /present|manglik/i.test(String(manglik.manglik_report || ''));

  const facts = [];
  if (manglik.manglik_present_rule?.based_on_aspect?.length) {
    facts.push(...manglik.manglik_present_rule.based_on_aspect.slice(0, 2));
  }
  if (manglik.manglik_present_rule?.based_on_house?.length) {
    facts.push(...manglik.manglik_present_rule.based_on_house.slice(0, 2));
  }
  const cancel = manglik.manglik_cancel_rule || manglik.cancellations;
  const note =
    manglik.manglik_report ||
    manglik.bot_response ||
    (present
      ? `Mangal dosha indicated${pct ? ` (~${pct}%)` : ''}. ${facts[0] || 'Consult expert for remedies / matching.'}`
      : 'No significant Mangal dosha indicated.');

  return {
    isManglik: Boolean(present),
    percentage: pct,
    status: manglik.manglik_status || (present ? 'PRESENT' : 'ABSENT'),
    note,
    details: facts,
    cancellations: cancel || null,
    is_present_strict: manglik.is_present === true,
  };
}

/**
 * Full Janam Kundli pack used by user + astrologer flows.
 */
async function generateFullKundli(input) {
  const birth = await buildBirthPayload(input);
  const today = new Date();
  const ref = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const [
    planets,
    astroDetails,
    dasha,
    majorDasha,
    manglik,
    kaalSarp,
    sadeSati,
    ascReport,
    moonReport,
    chartSvg,
  ] = await Promise.all([
    apiPost('planets', birth),
    apiPost('astro_details', birth).catch(() => null),
    apiPost('current_vdasha', birth).catch(() => null),
    apiPost('major_vdasha', birth).catch(() => []),
    apiPost('manglik', birth).catch(() => null),
    apiPost('kalsarpa_details', birth).catch(() => null),
    apiPost('sadhesati_current_status', birth).catch(() => null),
    apiPost('general_ascendant_report', birth).catch(() => null),
    apiPost('general_rashi_report/moon', birth).catch(() => null),
    apiPost('horo_chart_image/D1', birth).catch(() => null),
  ]);

  const planetList = Array.isArray(planets) ? planets : [];
  const asc = findPlanet(planetList, 'Ascendant');
  const sun = findPlanet(planetList, 'Sun');
  const moon = findPlanet(planetList, 'Moon');
  const chart = planetList
    .filter((p) => String(p.name).toLowerCase() !== 'ascendant')
    .map(mapPlanetRow)
    .filter(Boolean);

  const lagnaSign = asc?.sign || astroDetails?.ascendant || '';
  const moonSign = moon?.sign || astroDetails?.sign || '';
  const sunSign = sun?.sign || '';
  const nak = {
    name: moon?.nakshatra || astroDetails?.Naksahtra || astroDetails?.nakshatra || '',
    pada: moon?.nakshatra_pad || '',
    lord: moon?.nakshatraLord || '',
  };

  const manglikMapped = manglikSummary(manglik);
  const kaalPresent = Boolean(kaalSarp?.present);
  const sadeActive =
    typeof sadeSati?.is_undergoing_sadhesati === 'string'
      ? /yes/i.test(sadeSati.is_undergoing_sadhesati)
      : Boolean(sadeSati?.is_undergoing_sadhesati);

  const name = input.name || birth.name || 'Native';
  const summaryParts = [
    `${name}: Lagna ${lagnaSign}${rashiHindi(lagnaSign) ? ` (${rashiHindi(lagnaSign)})` : ''},` +
      ` Moon ${moonSign}${rashiHindi(moonSign) ? ` (${rashiHindi(moonSign)})` : ''},` +
      ` Sun ${sunSign}${rashiHindi(sunSign) ? ` (${rashiHindi(sunSign)})` : ''}.`,
    nak.name
      ? `Birth nakshatra ${nak.name}${nak.pada ? ` (Pada ${nak.pada})` : ''}${nak.lord ? `, lord ${nak.lord}` : ''}.`
      : '',
    manglikMapped.note,
    kaalPresent
      ? `Kaal Sarp: ${kaalSarp?.type || 'Present'}. ${kaalSarp?.one_line || ''}`.trim()
      : 'Kaal Sarp dosha not indicated.',
    sadeActive
      ? `Sade Sati: ${sadeSati?.is_undergoing_sadhesati || 'Active'}.`
      : 'Sade Sati not active currently.',
    dasha?.major
      ? `Current Maha Dasha: ${dasha.major.planet} (${dasha.major.start} → ${dasha.major.end}).`
      : '',
  ].filter(Boolean);

  return {
    source: 'astrologyapi',
    name,
    dateOfBirth: input.dateOfBirth,
    timeOfBirth: input.timeOfBirth,
    placeOfBirth: birth.place || input.placeOfBirth,
    gender: input.gender || '',
    location: {
      lat: birth.lat,
      lon: birth.lon,
      tzone: birth.tzone,
    },
    lagna: {
      name: lagnaSign,
      hindi: rashiHindi(lagnaSign),
      degree: asc?.normDegree != null ? Number(Number(asc.normDegree).toFixed(2)) : null,
      lord: asc?.signLord || astroDetails?.ascendant_lord || '',
      nakshatra: asc?.nakshatra || '',
      pada: asc?.nakshatra_pad || '',
    },
    sunRashi: {
      name: sunSign,
      hindi: rashiHindi(sunSign),
      degree: sun?.normDegree != null ? Number(Number(sun.normDegree).toFixed(2)) : null,
    },
    moonRashi: {
      name: moonSign,
      hindi: rashiHindi(moonSign),
      degree: moon?.normDegree != null ? Number(Number(moon.normDegree).toFixed(2)) : null,
    },
    nakshatra: nak,
    chart,
    houses: buildHouses(planetList),
    manglik: manglikMapped,
    doshas: {
      manglik: manglikMapped,
      kaalSarp: {
        present: kaalPresent,
        type: kaalSarp?.type || null,
        note: kaalSarp?.one_line || (kaalPresent ? 'Kaal Sarp present' : 'Not present'),
      },
      sadeSati: {
        active: sadeActive,
        note:
          typeof sadeSati?.is_undergoing_sadhesati === 'string'
            ? sadeSati.is_undergoing_sadhesati
            : sadeActive
              ? 'Currently undergoing Sade Sati'
              : 'Not undergoing Sade Sati',
        moonSign: sadeSati?.moon_sign,
        saturnSign: sadeSati?.saturn_sign,
      },
    },
    dasha: {
      current: dasha
        ? {
            maha: dasha.major || null,
            antar: dasha.minor || null,
            pratyantar: dasha.sub_minor || dasha.sub || null,
          }
        : null,
      major: Array.isArray(majorDasha) ? majorDasha.slice(0, 12) : [],
    },
    astroDetails: astroDetails
      ? {
          varna: astroDetails.Varna,
          vashya: astroDetails.Vashya,
          yoni: astroDetails.Yoni,
          gana: astroDetails.Gan,
          nadi: astroDetails.Nadi,
          signLord: astroDetails.SignLord,
          ascendantLord: astroDetails.ascendant_lord,
        }
      : null,
    readings: {
      ascendant: ascReport?.asc_report?.report || ascReport?.report || null,
      moon: moonReport?.rashi_report || moonReport?.report || null,
      ascendantSign: ascReport?.asc_report?.ascendant || lagnaSign,
    },
    chartSvg: chartSvg?.svg || null,
    lucky: {
      // soft hints from rashi index
      number: ((moon?.sign ? Object.keys(RASHI_HINDI).indexOf(
        Object.keys(RASHI_HINDI).find((k) => k.toLowerCase() === String(moonSign).toLowerCase())
      ) : 0) % 9) + 1 || 3,
      color: ['Red', 'White', 'Green', 'Yellow', 'Blue', 'Orange', 'Purple', 'Pink', 'Gold'][
        (String(moonSign).length + String(lagnaSign).length) % 9
      ],
      day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
        (String(nak.name).length || 1) % 7
      ],
    },
    summary: summaryParts.join(' '),
    referenceDate: ref,
  };
}

async function getPanchang({ date, placeOfBirth, lat, lon, tzone, hour = 12, min = 0 }) {
  let day;
  let month;
  let year;
  if (date) {
    const d = new Date(date);
    if (!Number.isNaN(d.getTime())) {
      day = d.getDate();
      month = d.getMonth() + 1;
      year = d.getFullYear();
    }
  }
  if (!day) {
    const now = new Date();
    day = now.getDate();
    month = now.getMonth() + 1;
    year = now.getFullYear();
  }

  const birth = await buildBirthPayload({
    dateOfBirth: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`,
    timeOfBirth: `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`,
    placeOfBirth: placeOfBirth || 'New Delhi',
    lat,
    lon,
    tzone,
  });

  const [basic, advanced] = await Promise.all([
    apiPost('basic_panchang', birth),
    apiPost('advanced_panchang', birth).catch(() => null),
  ]);

  const tithiName =
    advanced?.tithi?.details?.tithi_name ||
    basic?.tithi ||
    '';
  const paksha =
    advanced?.tithi?.details?.tithi_name?.includes?.('Krishna') || /Krishna/i.test(String(basic?.tithi))
      ? 'Krishna'
      : advanced?.tithi?.details?.tithi_name?.includes?.('Shukla') || /Shukla/i.test(String(basic?.tithi))
        ? 'Shukla'
        : advanced?.tithi?.details?.paksha || '';

  const nakName = advanced?.nakshatra?.details?.nak_name || basic?.nakshatra || '';
  const nakLord = advanced?.nakshatra?.details?.ruler || '';

  return {
    source: 'astrologyapi',
    displayDate: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`,
    vaar: basic?.day || advanced?.day || '',
    vaarHindi: basic?.day || advanced?.day || '',
    tithi: tithiName || basic?.tithi,
    paksha: paksha || '',
    nakshatra: nakName,
    nakshatraLord: nakLord,
    yoga: advanced?.yog?.details?.yog_name || basic?.yog || '',
    karana: advanced?.karan?.details?.karan_name || basic?.karan || '',
    sunrise: advanced?.sunrise || basic?.sunrise || '',
    sunset: advanced?.sunset || basic?.sunset || '',
    moonrise: advanced?.moonrise || '',
    moonset: advanced?.moonset || '',
    rahuKaal: advanced?.rahukaal || advanced?.rahukaal_timing || '',
    abhijit: advanced?.abhijit_muhurta || advanced?.abhijit || '',
    gulika: advanced?.gulika || '',
    yamaganda: advanced?.yamaghanta || advanced?.yamakanta || '',
    place: birth.place,
    note: 'Live Panchang from AstrologyAPI (location-aware).',
    raw: { basic, advanced: advanced ? { day: advanced.day, sunrise: advanced.sunrise } : null },
  };
}

async function matchKundli(boyInput, girlInput) {
  const boy = await buildBirthPayload(boyInput);
  const girl = await buildBirthPayload(girlInput);

  const matchBody = {
    m_day: boy.day,
    m_month: boy.month,
    m_year: boy.year,
    m_hour: boy.hour,
    m_min: boy.min,
    m_lat: boy.lat,
    m_lon: boy.lon,
    m_tzone: boy.tzone,
    f_day: girl.day,
    f_month: girl.month,
    f_year: girl.year,
    f_hour: girl.hour,
    f_min: girl.min,
    f_lat: girl.lat,
    f_lon: girl.lon,
    f_tzone: girl.tzone,
  };

  const [points, report, manglikReport] = await Promise.all([
    apiPost('match_ashtakoot_points', matchBody),
    apiPost('match_making_report', matchBody).catch(() => null),
    apiPost('match_manglik_report', matchBody).catch(() => null),
  ]);

  const kootKeys = [
    ['varna', 'Varna', 1],
    ['vashya', 'Vashya', 2],
    ['tara', 'Tara', 3],
    ['yoni', 'Yoni', 4],
    ['graha_maitri', 'Graha Maitri', 5],
    ['gan', 'Gana', 6],
    ['bhakoot', 'Bhakoot', 7],
    ['nadi', 'Nadi', 8],
  ];

  const kootas = kootKeys.map(([key, label, maxFallback]) => {
    const k = points?.[key] || {};
    return {
      key,
      label,
      score: k.received_points ?? k.points ?? 0,
      max: k.total_points ?? maxFallback,
      male: k.male_koot_attribute || '',
      female: k.female_koot_attribute || '',
      description: k.description || '',
    };
  });

  const total =
    report?.ashtakoota?.received_points ??
    points?.total?.received_points ??
    points?.total_points ??
    kootas.reduce((s, k) => s + Number(k.score || 0), 0);

  const maxScore =
    report?.ashtakoota?.total_points ||
    points?.total?.total_points ||
    36;

  const percent = Math.round((Number(total) / Number(maxScore || 36)) * 100);
  let level = 'low';
  let verdict = 'Low compatibility — expert review recommended';
  if (total >= 28) {
    level = 'excellent';
    verdict = 'Excellent match';
  } else if (total >= 24) {
    level = 'good';
    verdict = 'Good match';
  } else if (total >= 18) {
    level = 'average';
    verdict = 'Average match — acceptable with care';
  }

  const manglikNote =
    report?.manglik?.status != null
      ? `Manglik check: male ${report.manglik.male_percentage ?? '?'}%, female ${report.manglik.female_percentage ?? '?'}%.`
      : manglikReport
        ? 'Manglik report generated — review details with astrologer.'
        : '';

  return {
    ok: true,
    source: 'astrologyapi',
    total: Number(total),
    maxScore: Number(maxScore),
    percent,
    level,
    verdict,
    summary:
      report?.conclusion?.report ||
      report?.conclusion?.match_report ||
      `Ashtakoot score ${total}/${maxScore} (${percent}%). ${verdict}. ${manglikNote}`.trim(),
    kootas,
    boy: {
      name: boyInput.name || 'Boy',
      moon: { name: points?.boy_rasi || points?.male_rasi || '' },
      nakshatra: { name: points?.boy_nakshatra || points?.male_nakshatra || '' },
    },
    girl: {
      name: girlInput.name || 'Girl',
      moon: { name: points?.girl_rasi || points?.female_rasi || '' },
      nakshatra: { name: points?.girl_nakshatra || points?.female_nakshatra || '' },
    },
    manglikNote,
    report: report
      ? {
          ashtakoota: report.ashtakoota,
          manglik: report.manglik,
          rajju: report.rajju_dosha,
          vedha: report.vedha_dosha,
          conclusion: report.conclusion,
        }
      : null,
    manglikReport: manglikReport || null,
  };
}

async function getDasha(input) {
  const birth = await buildBirthPayload(input);
  const [current, major] = await Promise.all([
    apiPost('current_vdasha', birth),
    apiPost('major_vdasha', birth).catch(() => []),
  ]);
  return {
    source: 'astrologyapi',
    current,
    major: Array.isArray(major) ? major : [],
  };
}

async function getDoshas(input) {
  const birth = await buildBirthPayload(input);
  const [manglik, kaalSarp, sadeSati] = await Promise.all([
    apiPost('manglik', birth).catch(() => null),
    apiPost('kalsarpa_details', birth).catch(() => null),
    apiPost('sadhesati_current_status', birth).catch(() => null),
  ]);
  return {
    source: 'astrologyapi',
    manglik: manglikSummary(manglik),
    kaalSarp: {
      present: Boolean(kaalSarp?.present),
      type: kaalSarp?.type || null,
      note: kaalSarp?.one_line || '',
      raw: kaalSarp,
    },
    sadeSati: {
      active:
        typeof sadeSati?.is_undergoing_sadhesati === 'string'
          ? /yes/i.test(sadeSati.is_undergoing_sadhesati)
          : Boolean(sadeSati?.is_undergoing_sadhesati),
      note: sadeSati?.is_undergoing_sadhesati || '',
      moonSign: sadeSati?.moon_sign,
      saturnSign: sadeSati?.saturn_sign,
      raw: sadeSati,
    },
  };
}

async function getAiReading(input) {
  const birth = await buildBirthPayload(input);
  const [asc, moon, sunHouse, personality] = await Promise.all([
    apiPost('general_ascendant_report', birth).catch(() => null),
    apiPost('general_rashi_report/moon', birth).catch(() => null),
    apiPost('general_house_report/sun', birth).catch(() => null),
    apiPost('personality_report/tropical', birth).catch(() => null),
  ]);

  const personalityText = Array.isArray(personality?.report)
    ? personality.report.join('\n\n')
    : personality?.report || null;

  return {
    source: 'astrologyapi',
    testing: true,
    ascendant: {
      sign: asc?.asc_report?.ascendant || null,
      report: asc?.asc_report?.report || null,
    },
    moonRashi: {
      report: moon?.rashi_report || null,
      planet: moon?.planet || 'Moon',
    },
    sunHouse: {
      report: sunHouse?.house_report || null,
      planet: sunHouse?.planet || 'Sun',
    },
    personality: personalityText,
  };
}

/** PDF endpoints are plan-gated; attempt common paths, mark testing on failure */
async function getPdfKundli(input) {
  const birth = await buildBirthPayload(input);
  const body = {
    ...birth,
    name: input.name || birth.name || 'Native',
    place: birth.place || input.placeOfBirth || 'India',
    language: input.language || 'en',
    company_name: process.env.APP_NAME || 'Astrotalk',
    company_email: process.env.SMTP_FROM || 'support@astrotalk.com',
    domain_url: process.env.PUBLIC_WEB_URL || 'https://astrotalk.com',
  };

  const paths = ['pdf/mini_kundli', 'basic_horoscope_pdf', 'horoscope_pdf'];
  for (const path of paths) {
    try {
      const data = await apiPost(path, body);
      return {
        source: 'astrologyapi',
        testing: false,
        ok: true,
        data,
      };
    } catch {
      /* try next */
    }
  }

  // Fallback: rich JSON report (usable while PDF plan not enabled)
  const full = await generateFullKundli(input);
  return {
    source: 'astrologyapi',
    testing: true,
    ok: true,
    message:
      'PDF generation is in testing / plan-gated on this API key. Returning full JSON kundli instead.',
    report: full,
  };
}

/** Format kundli as chat-friendly text for astrologer → user */
function formatKundliChatMessage(k) {
  const lines = [
    '🕉 *Janam Kundli Report*',
    '────────────────────',
    `👤 ${k.name}`,
    `🎂 ${k.dateOfBirth} · ⏰ ${k.timeOfBirth}`,
    `📍 ${k.placeOfBirth}`,
    '',
    `🔺 Lagna: ${k.lagna?.name || '—'}${k.lagna?.hindi ? ` (${k.lagna.hindi})` : ''}`,
    `🌙 Moon: ${k.moonRashi?.name || '—'}${k.moonRashi?.hindi ? ` (${k.moonRashi.hindi})` : ''}`,
    `☀️ Sun: ${k.sunRashi?.name || '—'}${k.sunRashi?.hindi ? ` (${k.sunRashi.hindi})` : ''}`,
    `⭐ Nakshatra: ${k.nakshatra?.name || '—'}${k.nakshatra?.pada ? ` · Pada ${k.nakshatra.pada}` : ''}`,
    '',
    `⚠️ Manglik: ${k.manglik?.isManglik ? 'Yes' : 'No'} — ${k.manglik?.note || ''}`,
    `🐍 Kaal Sarp: ${k.doshas?.kaalSarp?.present ? k.doshas.kaalSarp.type || 'Present' : 'Not present'}`,
    `🪐 Sade Sati: ${k.doshas?.sadeSati?.active ? 'Active' : 'Not active'}`,
    '',
  ];

  if (k.dasha?.current?.maha) {
    const m = k.dasha.current.maha;
    lines.push(`⏳ Maha Dasha: ${m.planet} (${m.start} → ${m.end})`);
    if (k.dasha.current.antar) {
      const a = k.dasha.current.antar;
      lines.push(`   Antar: ${a.planet} (${a.start} → ${a.end})`);
    }
    lines.push('');
  }

  lines.push('🪐 Planets:');
  (k.chart || []).slice(0, 9).forEach((p) => {
    lines.push(
      `  • ${p.planet}: ${p.rashi} · H${p.house}${p.isRetro ? ' (R)' : ''}${p.nakshatra ? ` · ${p.nakshatra}` : ''}`
    );
  });

  if (k.readings?.ascendant) {
    lines.push('');
    lines.push('📖 Lagna reading (short):');
    lines.push(String(k.readings.ascendant).slice(0, 500) + (k.readings.ascendant.length > 500 ? '…' : ''));
  }

  lines.push('');
  lines.push('────────────────────');
  lines.push('Aapka Janam Kundli upar diya gaya hai. Detailed guidance ke liye chat continue karein.');
  return lines.join('\n');
}

module.exports = {
  isConfigured,
  apiPost,
  buildBirthPayload,
  resolvePlace,
  generateFullKundli,
  getPanchang,
  matchKundli,
  getDasha,
  getDoshas,
  getAiReading,
  getPdfKundli,
  formatKundliChatMessage,
  parseDobParts,
  parseTimeParts,
  rashiHindi,
};
