const jwt = require('jsonwebtoken');
const Astrologer = require('../models/Astrologer');
const Chat = require('../models/Chat');
const {
  FREE_CHAT_SECONDS,
  updateSessionTimer,
  formatSession,
} = require('../utils/sessionBilling');

const signAstroToken = (id) =>
  jwt.sign({ id, role: 'astrologer' }, process.env.JWT_SECRET, { expiresIn: '30d' });

const { normalizePackages } = require('../utils/astrologerHelpers');

const toPublicProfile = (astro) => ({
  _id: astro._id,
  name: astro.name,
  phone: astro.phone,
  email: astro.email,
  image: astro.image,
  specialty: astro.specialty,
  bio: astro.bio,
  rating: astro.rating,
  pricePerMin: astro.pricePerMin,
  pricingPackages: normalizePackages(astro.pricingPackages, astro.pricePerMin),
  gallery: astro.gallery || [],
  isOnline: astro.isOnline,
  isVerified: astro.isVerified,
  experience: astro.experience,
  orders: astro.orders,
  languages: astro.languages,
  chatEnabled: astro.chatEnabled,
  callEnabled: astro.callEnabled,
});

const login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ message: 'Phone and password required' });
    }
    const astrologer = await Astrologer.findOne({ phone: phone.trim() });
    if (!astrologer || !(await astrologer.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid phone or password' });
    }
    if (astrologer.isBlocked) {
      return res.status(403).json({ message: astrologer.blockReason || 'Your account has been blocked by admin.' });
    }
    res.json({
      token: signAstroToken(astrologer._id),
      astrologer: toPublicProfile(astrologer),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMe = async (req, res) => {
  res.json(toPublicProfile(req.astrologer));
};

const updateProfile = async (req, res) => {
  try {
    const allowed = [
      'name', 'bio', 'specialty', 'image', 'languages', 'experience',
      'chatEnabled', 'callEnabled', 'pricePerMin', 'pricingPackages', 'gallery',
    ];
    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    if (updates.pricingPackages) {
      updates.pricingPackages = normalizePackages(updates.pricingPackages, updates.pricePerMin || req.astrologer.pricePerMin);
      if (updates.pricingPackages[0]) {
        updates.pricePerMin = updates.pricingPackages[0].price;
      }
    }

    if (updates.gallery) {
      updates.gallery = (updates.gallery || []).slice(0, 12);
    }
    const astrologer = await Astrologer.findByIdAndUpdate(
      req.astrologer._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    res.json(toPublicProfile(astrologer));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleOnline = async (req, res) => {
  try {
    const astrologer = await Astrologer.findById(req.astrologer._id);
    astrologer.isOnline = req.body.isOnline ?? !astrologer.isOnline;
    await astrologer.save();
    res.json({ isOnline: astrologer.isOnline });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDashboard = async (req, res) => {
  try {
    const astroId = req.astrologer._id;
    const [pendingCount, activeChats, totalChats, recentChats] = await Promise.all([
      Chat.countDocuments({ astrologer: astroId, status: 'pending' }),
      Chat.countDocuments({ astrologer: astroId, status: { $in: ['active', 'paused'] } }),
      Chat.countDocuments({ astrologer: astroId }),
      Chat.find({ astrologer: astroId })
        .sort({ updatedAt: -1 })
        .limit(10)
        .populate('user', 'name phone email avatar'),
    ]);

    res.json({
      stats: {
        totalOrders: req.astrologer.orders || 0,
        rating: req.astrologer.rating || 0,
        pricePerMin: req.astrologer.pricePerMin || 0,
        isOnline: req.astrologer.isOnline,
        pendingRequests: pendingCount,
        activeChats,
        totalChats,
        earnings: (req.astrologer.orders || 0) * (req.astrologer.pricePerMin || 0),
      },
      recentChats,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPendingRequests = async (req, res) => {
  try {
    const chats = await Chat.find({
      astrologer: req.astrologer._id,
      status: 'pending',
    })
      .sort({ createdAt: -1 })
      .populate('user', 'name phone email avatar');
    res.json(chats.map((c) => formatSession(c)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ astrologer: req.astrologer._id })
      .sort({ updatedAt: -1 })
      .populate('user', 'name phone email avatar');

    const result = [];
    for (const chat of chats) {
      await updateSessionTimer(chat);
      if (chat.isModified()) await chat.save();
      result.push(formatSession(chat));
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getChatById = async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      astrologer: req.astrologer._id,
    }).populate('user', 'name phone email avatar');

    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    await updateSessionTimer(chat);
    await chat.save();

    res.json(formatSession(chat));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const acceptChat = async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      astrologer: req.astrologer._id,
    });
    if (!chat) return res.status(404).json({ message: 'Request not found' });
    if (chat.status !== 'pending') {
      return res.status(400).json({ message: 'Request already handled' });
    }
    if (chat.type === 'call' && !chat.callPaidUpfront) {
      return res.status(400).json({ message: 'User has not paid for call yet' });
    }

    chat.status = 'active';
    chat.acceptedAt = new Date();
    chat.startedAt = new Date();
    chat.lastTickAt = new Date();
    chat.isActive = true;

    if (chat.type === 'chat') {
      chat.freeSecondsRemaining = FREE_CHAT_SECONDS;
    }

    chat.messages.push({
      sender: 'system',
      content: chat.type === 'call'
        ? 'Call accepted! Call is now connected.'
        : 'Chat accepted! 1st minute is FREE for user.',
    });

    await chat.save();
    res.json({
      message: chat.type === 'call' ? 'Call accepted' : 'Chat accepted',
      session: formatSession(chat),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const rejectChat = async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      astrologer: req.astrologer._id,
    });
    if (!chat) return res.status(404).json({ message: 'Request not found' });
    if (chat.status !== 'pending') {
      return res.status(400).json({ message: 'Request already handled' });
    }

    chat.status = 'rejected';
    chat.isActive = false;
    chat.endedAt = new Date();
    chat.messages.push({ sender: 'system', content: 'Astrologer declined the request.' });
    await chat.save();

    res.json({ message: 'Request declined', session: formatSession(chat) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ message: 'Message content required' });
    }
    const chat = await Chat.findOne({
      _id: req.params.id,
      astrologer: req.astrologer._id,
    });
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

    chat.messages.push({ sender: 'astrologer', content: content.trim() });
    await chat.save();
    res.json(formatSession(chat));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const closeChat = async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      astrologer: req.astrologer._id,
    });
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    chat.status = 'ended';
    chat.isActive = false;
    chat.endedAt = new Date();
    chat.messages.push({ sender: 'system', content: 'Session ended by astrologer.' });
    await chat.save();
    res.json({ message: 'Chat ended', session: formatSession(chat) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  login,
  getMe,
  updateProfile,
  toggleOnline,
  getDashboard,
  getPendingRequests,
  getChats,
  getChatById,
  acceptChat,
  rejectChat,
  sendMessage,
  closeChat,
};