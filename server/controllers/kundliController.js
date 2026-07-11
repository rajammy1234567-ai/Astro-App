const Chat = require('../models/Chat');
const {
  isConfigured,
  generateFullKundli,
  getPanchang,
  matchKundli,
  getDasha,
  getDoshas,
  getAiReading,
  getPdfKundli,
  formatKundliChatMessage,
  resolvePlace,
  apiPost,
  buildBirthPayload,
} = require('../utils/astrologyApi');
const { formatSession, updateSessionTimer } = require('../utils/sessionBilling');

const requireApi = (res) => {
  if (!isConfigured()) {
    res.status(503).json({
      message: 'Astrology API is not configured. Set ASTROLOGY_API_KEY on the server.',
    });
    return false;
  }
  return true;
};

const status = async (_req, res) => {
  res.json({
    configured: isConfigured(),
    features: [
      'janam_kundli',
      'planet_positions',
      'lagna',
      'moon_sign',
      'nakshatra',
      'panchang',
      'vimshottari_dasha',
      'guna_milan',
      'dosha',
      'pdf_kundli_testing',
      'ai_reading_testing',
    ],
  });
};

const generateKundli = async (req, res) => {
  try {
    if (!requireApi(res)) return;
    const {
      name,
      dateOfBirth,
      timeOfBirth,
      placeOfBirth,
      gender,
      lat,
      lon,
      tzone,
    } = req.body || {};

    if (!dateOfBirth || !timeOfBirth) {
      return res.status(400).json({
        message: 'dateOfBirth (DD/MM/YYYY) and timeOfBirth are required',
      });
    }

    const report = await generateFullKundli({
      name: name || req.user?.name || 'Native',
      dateOfBirth,
      timeOfBirth,
      placeOfBirth: placeOfBirth || 'New Delhi',
      gender,
      lat,
      lon,
      tzone,
    });

    res.json(report);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

const panchang = async (req, res) => {
  try {
    if (!requireApi(res)) return;
    const { date, placeOfBirth, lat, lon, tzone, hour, min } = req.body || {};
    const data = await getPanchang({
      date: date || undefined,
      placeOfBirth: placeOfBirth || 'New Delhi',
      lat,
      lon,
      tzone,
      hour,
      min,
    });
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

const match = async (req, res) => {
  try {
    if (!requireApi(res)) return;
    const { boy, girl } = req.body || {};
    if (!boy?.dateOfBirth || !girl?.dateOfBirth) {
      return res.status(400).json({
        message: 'boy and girl objects with dateOfBirth are required',
      });
    }
    const result = await matchKundli(
      {
        name: boy.name || 'Boy',
        dateOfBirth: boy.dateOfBirth,
        timeOfBirth: boy.timeOfBirth || '10:00 AM',
        placeOfBirth: boy.placeOfBirth || boy.place || 'New Delhi',
        lat: boy.lat,
        lon: boy.lon,
        tzone: boy.tzone,
      },
      {
        name: girl.name || 'Girl',
        dateOfBirth: girl.dateOfBirth,
        timeOfBirth: girl.timeOfBirth || '10:00 AM',
        placeOfBirth: girl.placeOfBirth || girl.place || 'New Delhi',
        lat: girl.lat,
        lon: girl.lon,
        tzone: girl.tzone,
      }
    );
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

const dasha = async (req, res) => {
  try {
    if (!requireApi(res)) return;
    const { dateOfBirth, timeOfBirth, placeOfBirth, lat, lon, tzone, name } = req.body || {};
    if (!dateOfBirth || !timeOfBirth) {
      return res.status(400).json({ message: 'dateOfBirth and timeOfBirth required' });
    }
    const data = await getDasha({
      name,
      dateOfBirth,
      timeOfBirth,
      placeOfBirth: placeOfBirth || 'New Delhi',
      lat,
      lon,
      tzone,
    });
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

const doshas = async (req, res) => {
  try {
    if (!requireApi(res)) return;
    const { dateOfBirth, timeOfBirth, placeOfBirth, lat, lon, tzone, name } = req.body || {};
    if (!dateOfBirth || !timeOfBirth) {
      return res.status(400).json({ message: 'dateOfBirth and timeOfBirth required' });
    }
    const data = await getDoshas({
      name,
      dateOfBirth,
      timeOfBirth,
      placeOfBirth: placeOfBirth || 'New Delhi',
      lat,
      lon,
      tzone,
    });
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

const aiReading = async (req, res) => {
  try {
    if (!requireApi(res)) return;
    const { dateOfBirth, timeOfBirth, placeOfBirth, lat, lon, tzone, name } = req.body || {};
    if (!dateOfBirth || !timeOfBirth) {
      return res.status(400).json({ message: 'dateOfBirth and timeOfBirth required' });
    }
    const data = await getAiReading({
      name,
      dateOfBirth,
      timeOfBirth,
      placeOfBirth: placeOfBirth || 'New Delhi',
      lat,
      lon,
      tzone,
    });
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

const pdfKundli = async (req, res) => {
  try {
    if (!requireApi(res)) return;
    const { dateOfBirth, timeOfBirth, placeOfBirth, lat, lon, tzone, name, language } =
      req.body || {};
    if (!dateOfBirth || !timeOfBirth) {
      return res.status(400).json({ message: 'dateOfBirth and timeOfBirth required' });
    }
    const data = await getPdfKundli({
      name,
      dateOfBirth,
      timeOfBirth,
      placeOfBirth: placeOfBirth || 'New Delhi',
      lat,
      lon,
      tzone,
      language,
    });
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

const planets = async (req, res) => {
  try {
    if (!requireApi(res)) return;
    const birth = await buildBirthPayload(req.body || {});
    const data = await apiPost('planets', birth);
    res.json({ source: 'astrologyapi', planets: data, location: birth });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

const searchPlace = async (req, res) => {
  try {
    if (!requireApi(res)) return;
    const place = req.body?.place || req.query?.q || '';
    if (!place || String(place).trim().length < 2) {
      return res.status(400).json({ message: 'place query required' });
    }
    const data = await resolvePlace(place);
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

/**
 * Astrologer: generate Janam Kundli from session birth details and send to user chat.
 */
const sendKundliToChat = async (req, res) => {
  try {
    if (!requireApi(res)) return;

    const chat = await Chat.findOne({
      _id: req.params.id,
      astrologer: req.astrologer._id,
    }).populate('user', 'name dateOfBirth timeOfBirth placeOfBirth gender');

    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    await updateSessionTimer(chat);

    if (chat.status === 'pending') {
      return res.status(400).json({ message: 'Accept the request first' });
    }
    if (chat.status === 'ended' || chat.status === 'rejected') {
      return res.status(400).json({ message: 'Session has ended' });
    }
    if (chat.status !== 'active' && chat.status !== 'paused') {
      return res.status(400).json({ message: 'Session not active' });
    }

    const birth = chat.userBirthDetails || {};
    const user = chat.user || {};
    const details = {
      name: birth.name || user.name || 'User',
      dateOfBirth: birth.dateOfBirth || user.dateOfBirth || '',
      timeOfBirth: birth.timeOfBirth || user.timeOfBirth || '',
      placeOfBirth: birth.placeOfBirth || user.placeOfBirth || 'New Delhi',
      gender: birth.gender || user.gender || '',
    };

    if (!details.dateOfBirth || !details.timeOfBirth) {
      return res.status(400).json({
        message:
          'Client birth date/time missing. User must share kundli details before you can generate Janam Kundli.',
      });
    }

    const report = await generateFullKundli(details);
    const content = formatKundliChatMessage(report);

    chat.messages.push({
      sender: 'astrologer',
      content,
      mediaType: 'text',
      mediaUrl: '',
    });

    // Optional short follow-up note
    if (req.body?.note && String(req.body.note).trim()) {
      chat.messages.push({
        sender: 'astrologer',
        content: String(req.body.note).trim(),
        mediaType: 'text',
        mediaUrl: '',
      });
    }

    await chat.save();

    res.json({
      message: 'Janam Kundli generated and sent to user',
      session: formatSession(chat),
      kundli: {
        name: report.name,
        lagna: report.lagna,
        moonRashi: report.moonRashi,
        sunRashi: report.sunRashi,
        nakshatra: report.nakshatra,
        manglik: report.manglik,
        dasha: report.dasha?.current || null,
      },
    });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

/**
 * Astrologer preview kundli without sending (uses chat birth details).
 */
const previewKundliForChat = async (req, res) => {
  try {
    if (!requireApi(res)) return;

    const chat = await Chat.findOne({
      _id: req.params.id,
      astrologer: req.astrologer._id,
    }).populate('user', 'name dateOfBirth timeOfBirth placeOfBirth gender');

    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const birth = chat.userBirthDetails || {};
    const user = chat.user || {};
    const details = {
      name: birth.name || user.name || 'User',
      dateOfBirth: birth.dateOfBirth || user.dateOfBirth || '',
      timeOfBirth: birth.timeOfBirth || user.timeOfBirth || '',
      placeOfBirth: birth.placeOfBirth || user.placeOfBirth || 'New Delhi',
      gender: birth.gender || user.gender || '',
    };

    if (!details.dateOfBirth || !details.timeOfBirth) {
      return res.status(400).json({
        message: 'Client birth date/time missing for kundli generation.',
      });
    }

    const report = await generateFullKundli(details);
    res.json(report);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

module.exports = {
  status,
  generateKundli,
  panchang,
  match,
  dasha,
  doshas,
  aiReading,
  pdfKundli,
  planets,
  searchPlace,
  sendKundliToChat,
  previewKundliForChat,
};
