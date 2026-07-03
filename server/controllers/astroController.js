const jwt = require('jsonwebtoken');
const Astrologer = require('../models/Astrologer');
const Chat = require('../models/Chat');
const Order = require('../models/Order');

const signAstroToken = (id) =>
  jwt.sign({ id, role: 'astrologer' }, process.env.JWT_SECRET, { expiresIn: '30d' });

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
      'name', 'bio', 'specialty', 'image', 'languages',
      'chatEnabled', 'callEnabled', 'pricePerMin',
    ];
    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });
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
    const [activeChats, totalChats, recentChats] = await Promise.all([
      Chat.countDocuments({ astrologer: astroId, isActive: true }),
      Chat.countDocuments({ astrologer: astroId }),
      Chat.find({ astrologer: astroId })
        .sort({ updatedAt: -1 })
        .limit(10)
        .populate('user', 'name phone image'),
    ]);

    res.json({
      stats: {
        totalOrders: req.astrologer.orders || 0,
        rating: req.astrologer.rating || 0,
        pricePerMin: req.astrologer.pricePerMin || 0,
        isOnline: req.astrologer.isOnline,
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

const getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ astrologer: req.astrologer._id })
      .sort({ updatedAt: -1 })
      .populate('user', 'name phone image');
    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getChatById = async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      astrologer: req.astrologer._id,
    }).populate('user', 'name phone image');
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    res.json(chat);
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

    chat.messages.push({ sender: 'astrologer', content: content.trim() });
    chat.isActive = true;
    await chat.save();
    res.json(chat);
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
    chat.isActive = false;
    await chat.save();
    res.json({ message: 'Chat ended', chat });
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
  getChats,
  getChatById,
  sendMessage,
  closeChat,
};