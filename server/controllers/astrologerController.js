const Astrologer = require('../models/Astrologer');
const AstrologerReview = require('../models/AstrologerReview');
const { formatPublicAstrologer } = require('../utils/astrologerHelpers');

// List: only online + published. Detail: published even if offline (profile/follow).
const listFilter = { isPublished: true, isOnline: true, isBlocked: { $ne: true } };
const profileFilter = { isPublished: true, isBlocked: { $ne: true } };

const getAstrologers = async (req, res) => {
  try {
    const filter = { ...listFilter };
    if (req.query.type === 'chat') filter.chatEnabled = true;
    if (req.query.type === 'call') filter.callEnabled = true;
    if (req.query.filter === 'new') filter.isNew = true;
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: 'i' };
    }

    const astrologers = await Astrologer.find(filter).select('-password').sort({ rating: -1 });
    res.json(astrologers.map((a) => formatPublicAstrologer(a)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getChatList = async (req, res) => {
  try {
    const astrologers = await Astrologer.find({
      ...listFilter,
      chatEnabled: true,
    }).select('-password').sort({ rating: -1 });
    res.json(astrologers.map((a) => formatPublicAstrologer(a)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCallList = async (req, res) => {
  try {
    const astrologers = await Astrologer.find({
      ...listFilter,
      callEnabled: true,
    }).select('-password').sort({ rating: -1 });
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