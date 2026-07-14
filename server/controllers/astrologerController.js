const Astrologer = require('../models/Astrologer');
const AstrologerReview = require('../models/AstrologerReview');
const { formatPublicAstrologer } = require('../utils/astrologerHelpers');

// Published + not blocked
const listFilter = { isPublished: true, isBlocked: { $ne: true } };
const profileFilter = { isPublished: true, isBlocked: { $ne: true } };

const sortOnlineFirst = { isOnline: -1, rating: -1 };

/**
 * STRICT mode lists (astrologer controls own status):
 * - type=chat → only chatOnline === true  (User Chat tab)
 * - type=call → only callOnline === true  (User Call tab)
 * Master isOnline = chatOnline || callOnline (display only).
 */
const getAstrologers = async (req, res) => {
  try {
    const filter = { ...listFilter };
    if (req.query.filter === 'new') filter.isNew = true;
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: 'i' };
    }

    if (req.query.type === 'chat') {
      filter.chatEnabled = { $ne: false };
      filter.chatOnline = true;
    } else if (req.query.type === 'call') {
      filter.callEnabled = { $ne: false };
      filter.callOnline = true;
    } else if (req.query.online === '1' || req.query.online === 'true') {
      // Home "online" — anyone available on chat OR call
      filter.$or = [{ chatOnline: true }, { callOnline: true }, { isOnline: true }];
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
    const astrologers = await Astrologer.find({
      ...listFilter,
      chatEnabled: { $ne: false },
      chatOnline: true,
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
    const astrologers = await Astrologer.find({
      ...listFilter,
      callEnabled: { $ne: false },
      callOnline: true,
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