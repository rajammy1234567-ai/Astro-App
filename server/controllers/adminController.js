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
    ]);

    const orderStats = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    res.json({
      stats: {
        totalUsers,
        totalAstrologers,
        onlineAstrologers,
        totalOrders,
        totalProducts,
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingOrders: orderStats.find((s) => s._id === 'pending')?.count || 0,
        confirmedOrders: orderStats.find((s) => s._id === 'confirmed')?.count || 0,
      },
      recentOrders,
      recentUsers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const listUsers = async (req, res) => {
  try {
    const users = await User.find().select('-following').sort({ createdAt: -1 });
    const wallets = await Wallet.find({ user: { $in: users.map((u) => u._id) } });
    const walletMap = Object.fromEntries(wallets.map((w) => [w.user.toString(), w.balance]));
    res.json(users.map((u) => ({ ...u.toObject(), balance: walletMap[u._id.toString()] || 0 })));
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
      const item = await Model.create(req.body);
      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  update: async (req, res) => {
    try {
      const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
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

const astrologers = crud(Astrologer);
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
  updateUser,
  deleteUser,
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