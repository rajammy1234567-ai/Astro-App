const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');

const getOrCreateWallet = async (userId) => {
  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    wallet = await Wallet.create({ user: userId, balance: 0 });
  }
  return wallet;
};

const getWallet = async (req, res) => {
  try {
    const wallet = await getOrCreateWallet(req.user._id);
    res.json({ balance: wallet.balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addMoney = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 1) {
      return res.status(400).json({ message: 'Valid amount required' });
    }

    if (!process.env.RAZORPAY_KEY_ID) {
      const wallet = await getOrCreateWallet(req.user._id);
      wallet.balance += amount;
      await wallet.save();

      await Transaction.create({
        user: req.user._id,
        amount,
        type: 'credit',
        description: 'Wallet recharge (dev mode)',
        status: 'completed',
      });

      return res.json({
        message: 'Amount added successfully',
        balance: wallet.balance,
        devMode: true,
      });
    }

    const getRazorpay = require('../config/razorpay');
    const order = await getRazorpay().orders.create({
      amount: amount * 100,
      currency: 'INR',
      receipt: `wallet_${req.user._id}_${Date.now()}`,
    });
    res.json({ orderId: order.id, amount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getWallet, addMoney, getTransactions };