const Pooja = require('../models/Pooja');
const Order = require('../models/Order');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');

const getOrCreateWallet = async (userId) => {
  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    wallet = await Wallet.create({ user: userId, balance: 0 });
  }
  return wallet;
};

const getPoojas = async (req, res) => {
  try {
    const poojas = await Pooja.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(poojas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const bookPooja = async (req, res) => {
  try {
    const pooja = await Pooja.findById(req.params.id);
    if (!pooja || !pooja.isActive) {
      return res.status(404).json({ message: 'Pooja service not found' });
    }

    const wallet = await getOrCreateWallet(req.user._id);
    if (wallet.balance < pooja.price) {
      return res.status(400).json({ message: 'Insufficient wallet balance. Please recharge.' });
    }

    wallet.balance -= pooja.price;
    await wallet.save();

    await Transaction.create({
      user: req.user._id,
      amount: pooja.price,
      type: 'debit',
      description: `Pooja booking: ${pooja.name}`,
      status: 'completed',
    });

    const order = await Order.create({
      user: req.user._id,
      orderType: 'pooja',
      pooja: pooja._id,
      poojaName: pooja.name,
      totalAmount: pooja.price,
      status: 'confirmed',
      products: [],
    });

    res.json({
      message: 'Pooja booked successfully',
      order,
      balance: wallet.balance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getPoojas, bookPooja };