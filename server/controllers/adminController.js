const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Astrologer = require('../models/Astrologer');
const Product = require('../models/Product');
const Blog = require('../models/Blog');
const News = require('../models/News');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const Pooja = require('../models/Pooja');
const GiftCard = require('../models/GiftCard');
const Testimonial = require('../models/Testimonial');
const SupportFaq = require('../models/SupportFaq');
const FreeService = require('../models/FreeService');
const Chat = require('../models/Chat');
const LiveSession = require('../models/LiveSession');

const signAdminToken = (id) =>
  jwt.sign({ id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin || !(await admin.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    res.json({
      token: signAdminToken(admin._id),
      admin: { _id: admin._id, name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMe = async (req, res) => {
  res.json(req.admin);
};

const astroEarningsAgg = async (astroId) => {
  const result = await Chat.aggregate([
    { $match: { astrologer: astroId, totalCharged: { $gt: 0 } } },
    { $group: { _id: null, total: { $sum: '$totalCharged' }, sessions: { $sum: 1 } } },
  ]);
  return { totalEarnings: result[0]?.total || 0, paidSessions: result[0]?.sessions || 0 };
};

const getDashboard = async (req, res) => {
  try {
    const [
      totalUsers,
      totalAstrologers,
      totalOrders,
      totalProducts,
      totalRevenue,
      recentOrders,
      recentUsers,
      onlineAstrologers,
      liveAstrologers,
      blockedUsers,
      blockedAstrologers,
      astroEarningsTotal,
      activeLives,
    ] = await Promise.all([
      User.countDocuments(),
      Astrologer.countDocuments(),
      Order.countDocuments(),
      Product.countDocuments(),
      Transaction.aggregate([
        { $match: { type: 'credit', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Order.find().sort({ createdAt: -1 }).limit(8).populate('user', 'name phone email'),
      User.find().sort({ createdAt: -1 }).limit(5).select('name phone email createdAt'),
      Astrologer.countDocuments({ isOnline: true }),
      Astrologer.countDocuments({ isLive: true }),
      User.countDocuments({ isBlocked: true }),
      Astrologer.countDocuments({ isBlocked: true }),
      Chat.aggregate([
        { $match: { totalCharged: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$totalCharged' } } },
      ]),
      LiveSession.find({ status: 'live' })
        .populate('astrologer', 'name phone specialty image')
        .sort({ startedAt: -1 })
        .limit(10),
    ]);

    const orderStats = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    res.json({
      stats: {
        totalUsers,
        totalAstrologers,
        onlineAstrologers,
        liveAstrologers,
        blockedUsers,
        blockedAstrologers,
        totalAstrologerEarnings: astroEarningsTotal[0]?.total || 0,
        totalOrders,
        totalProducts,
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingOrders: orderStats.find((s) => s._id === 'pending')?.count || 0,
        confirmedOrders: orderStats.find((s) => s._id === 'confirmed')?.count || 0,
      },
      recentOrders,
      recentUsers,
      activeLives,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const listUsers = async (req, res) => {
  try {
    const users = await User.find().select('-following -password').sort({ createdAt: -1 });
    const wallets = await Wallet.find({ user: { $in: users.map((u) => u._id) } });
    const walletMap = Object.fromEntries(wallets.map((w) => [w.user.toString(), w.balance]));

    const userIds = users.map((u) => u._id);
    const [spentAgg, chatAgg] = await Promise.all([
      Transaction.aggregate([
        { $match: { user: { $in: userIds }, type: 'debit', status: 'completed' } },
        { $group: { _id: '$user', total: { $sum: '$amount' } } },
      ]),
      Chat.aggregate([
        { $match: { user: { $in: userIds } } },
        { $group: { _id: '$user', count: { $sum: 1 } } },
      ]),
    ]);
    const spentMap = Object.fromEntries(spentAgg.map((s) => [s._id.toString(), s.total]));
    const chatMap = Object.fromEntries(chatAgg.map((c) => [c._id.toString(), c.count]));

    res.json(users.map((u) => ({
      ...u.toObject(),
      balance: walletMap[u._id.toString()] || 0,
      totalSpent: spentMap[u._id.toString()] || 0,
      totalSessions: chatMap[u._id.toString()] || 0,
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-following -password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const [wallet, transactions, sessions] = await Promise.all([
      Wallet.findOne({ user: user._id }),
      Transaction.find({ user: user._id }).sort({ createdAt: -1 }).limit(50),
      Chat.find({ user: user._id })
        .populate('astrologer', 'name specialty image phone')
        .sort({ createdAt: -1 })
        .limit(30),
    ]);

    const totalSpent = transactions
      .filter((t) => t.type === 'debit' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    res.json({
      user: user.toObject(),
      wallet: wallet || { balance: 0 },
      totalSpent,
      totalSessions: sessions.length,
      transactions,
      sessions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const blockUser = async (req, res) => {
  try {
    const { isBlocked, blockReason } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        isBlocked: !!isBlocked,
        blockReason: isBlocked ? (blockReason || 'Blocked by admin') : '',
        blockedAt: isBlocked ? new Date() : null,
      },
      { new: true }
    ).select('-following -password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-following');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const crud = (Model, opts = {}) => ({
  list: async (req, res) => {
    try {
      const items = await Model.find(opts.filter || {}).sort({ createdAt: -1 });
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  create: async (req, res) => {
    try {
      const body = { ...req.body };
      // Admin-created/published astrologers must show on user app
      if (Model.modelName === 'Astrologer') {
        if (body.isPublished) body.approvedViaApplication = true;
      }
      const item = await Model.create(body);
      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  update: async (req, res) => {
    try {
      const body = { ...req.body };
      if (Model.modelName === 'Astrologer' && body.isPublished === true) {
        body.approvedViaApplication = true;
      }
      const item = await Model.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
      if (!item) return res.status(404).json({ message: 'Not found' });
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  remove: async (req, res) => {
    try {
      await Model.findByIdAndDelete(req.params.id);
      res.json({ message: 'Deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
});

const listAstrologers = async (req, res) => {
  try {
    const astrologers = await Astrologer.find().select('-password').sort({ createdAt: -1 });
    const liveSessions = await LiveSession.find({ status: 'live' });
    const liveMap = Object.fromEntries(liveSessions.map((s) => [s.astrologer.toString(), s]));

    const enriched = await Promise.all(astrologers.map(async (a) => {
      const earn = await astroEarningsAgg(a._id);
      const live = liveMap[a._id.toString()];
      return {
        ...a.toObject(),
        totalEarnings: earn.totalEarnings,
        paidSessions: earn.paidSessions,
        isLiveNow: !!live,
        liveTitle: live?.title || '',
        liveViewers: live?.viewerCount || 0,
        liveSessionId: live?._id || null,
      };
    }));

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Publish on User App also marks as approved (admin "auto-approves") */
const updateAstrologer = async (req, res) => {
  try {
    const body = { ...req.body };
    delete body.password;
    if (body.isPublished === true) {
      body.approvedViaApplication = true;
    }
    const item = await Astrologer.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    }).select('-password');
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAstrologerDetails = async (req, res) => {
  try {
    const astrologer = await Astrologer.findById(req.params.id).select('-password');
    if (!astrologer) return res.status(404).json({ message: 'Astrologer not found' });

    const [earn, sessions, liveSession, liveHistory] = await Promise.all([
      astroEarningsAgg(astrologer._id),
      Chat.find({ astrologer: astrologer._id })
        .populate('user', 'name phone email avatar')
        .sort({ createdAt: -1 })
        .limit(30),
      LiveSession.findOne({ astrologer: astrologer._id, status: 'live' }),
      LiveSession.find({ astrologer: astrologer._id }).sort({ startedAt: -1 }).limit(10),
    ]);

    res.json({
      astrologer: astrologer.toObject(),
      totalEarnings: earn.totalEarnings,
      paidSessions: earn.paidSessions,
      totalSessions: sessions.length,
      isLiveNow: !!liveSession,
      liveSession,
      liveHistory,
      sessions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const blockAstrologer = async (req, res) => {
  try {
    const { isBlocked, blockReason } = req.body;
    const astrologer = await Astrologer.findByIdAndUpdate(
      req.params.id,
      {
        isBlocked: !!isBlocked,
        blockReason: isBlocked ? (blockReason || 'Blocked by admin') : '',
        blockedAt: isBlocked ? new Date() : null,
        isLive: false,
        isOnline: false,
      },
      { new: true }
    ).select('-password');
    if (!astrologer) return res.status(404).json({ message: 'Astrologer not found' });

    await LiveSession.updateMany(
      { astrologer: astrologer._id, status: 'live' },
      { status: 'ended', endedAt: new Date() }
    );

    res.json(astrologer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const astrologers = { ...crud(Astrologer), list: listAstrologers, update: updateAstrologer };
const products = crud(Product);
const blogs = crud(Blog);
const news = crud(News);
const poojas = crud(Pooja);
const testimonials = crud(Testimonial);
const supportFaqs = crud(SupportFaq);
const freeServices = crud(FreeService);

const listOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name phone email')
      .populate('products.product')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('user', 'name phone email');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const listTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('user', 'name phone email')
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const listGiftCards = async (req, res) => {
  try {
    const cards = await GiftCard.find().populate('redeemedBy', 'name email').sort({ createdAt: -1 });
    res.json(cards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createGiftCard = async (req, res) => {
  try {
    const { code, amount } = req.body;
    if (!code || !amount) return res.status(400).json({ message: 'Code and amount required' });
    const card = await GiftCard.create({ code: code.toUpperCase(), amount });
    res.status(201).json(card);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateGiftCard = async (req, res) => {
  try {
    const card = await GiftCard.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!card) return res.status(404).json({ message: 'Not found' });
    res.json(card);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteGiftCard = async (req, res) => {
  try {
    await GiftCard.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  login,
  getMe,
  getDashboard,
  listUsers,
  getUserDetails,
  blockUser,
  updateUser,
  deleteUser,
  getAstrologerDetails,
  blockAstrologer,
  astrologers,
  products,
  blogs,
  news,
  poojas,
  testimonials,
  supportFaqs,
  freeServices,
  listOrders,
  updateOrder,
  listTransactions,
  listGiftCards,
  createGiftCard,
  updateGiftCard,
  deleteGiftCard,
};