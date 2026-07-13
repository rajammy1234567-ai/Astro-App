const Astrologer = require('../models/Astrologer');
const AstrologerReview = require('../models/AstrologerReview');
const { formatPublicAstrologer } = require('../utils/astrologerHelpers');

// Published + not blocked
const listFilter = { isPublished: true, isBlocked: { $ne: true } };
const profileFilter = { isPublished: true, isBlocked: { $ne: true } };

const sortOnlineFirst = { isOnline: -1, rating: -1 };

/**
 * Chat list: only those who turned Chat Online ON (and capability chatEnabled).
 * Call list: only those who turned Call Online ON.
 * Master isOnline = chatOnline || callOnline.
 */
const getAstrologers = async (req, res) => {
  try {
    const filter = { ...listFilter };
    // type filter applied after base query via $and when needed
    if (req.query.filter === 'new') filter.isNew = true;
    if (req.query.online === '1' || req.query.online === 'true') {
      filter.isOnline = true;
    }
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: 'i' };
    }

    if (req.query.type === 'chat') {
      filter.chatEnabled = { $ne: false };
      filter.$or = [
        { chatOnline: true },
        { chatOnline: { $exists: false }, isOnline: true },
        { chatOnline: null, isOnline: true },
      ];
    }
    if (req.query.type === 'call') {
      filter.callEnabled = { $ne: false };
      filter.$or = [
        { callOnline: true },
        { callOnline: { $exists: false }, isOnline: true },
        { callOnline: null, isOnline: true },
      ];
    }

    const astrologers = await Astrologer.find(filter)
      .select('-password')
      .sort(sortOnlineFirst);
    res.json(astrologers.map((a) => formatPublicAstrologer(a)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getChatList = async (req, res) => {
  try {
    // Chat Online ON — or legacy isOnline if chatOnline not set yet
    const astrologers = await Astrologer.find({
      ...listFilter,
      chatEnabled: { $ne: false },
      $or: [
        { chatOnline: true },
        { chatOnline: { $exists: false }, isOnline: true },
        { chatOnline: null, isOnline: true },
      ],
    })
      .select('-password')
      .sort(sortOnlineFirst);
    res.json(astrologers.map((a) => formatPublicAstrologer(a)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCallList = async (req, res) => {
  try {
    // Call Online ON — or legacy isOnline if callOnline not set yet
    const astrologers = await Astrologer.find({
      ...listFilter,
      callEnabled: { $ne: false },
      $or: [
        { callOnline: true },
        { callOnline: { $exists: false }, isOnline: true },
        { callOnline: null, isOnline: true },
      ],
    })
      .select('-password')
      .sort(sortOnlineFirst);
    res.json(astrologers.map((a) => formatPublicAstrologer(a)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAstrologerById = async (req, res) => {
  try {
    const astrologer = await Astrologer.findOne({
      _id: req.params.id,
      ...profileFilter,
    }).select('-password');
    if (!astrologer) {
      return res.status(404).json({ message: 'Astrologer not found or not available' });
    }

    const reviews = await AstrologerReview.find({
      astrologer: astrologer._id,
      isVisible: true,
    }).sort({ createdAt: -1 });

    res.json(formatPublicAstrologer(astrologer, reviews));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const bookAstrologer = async (req, res) => {
  req.url = '/book';
  const { createSession } = require('./sessionController');
  return createSession(req, res);
};

module.exports = {
  getAstrologers,
  getChatList,
  getCallList,
  getAstrologerById,
  bookAstrologer,
};