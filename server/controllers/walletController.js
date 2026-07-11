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

const useDummyRazorpay = () => {
  // Real Razorpay only when both keys exist AND dummy flag is not forced on
  if (process.env.RAZORPAY_DUMMY === 'true' || process.env.RAZORPAY_DUMMY === '1') {
    return true;
  }
  return !process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET;
};

/** Create order (dummy Razorpay for now — real keys later) */
const addMoney = async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    if (!amount || amount < 1) {
      return res.status(400).json({ message: 'Valid amount required' });
    }

    if (useDummyRazorpay()) {
      const orderId = `order_dummy_${req.user._id.toString().slice(-6)}_${Date.now()}`;
      return res.json({
        orderId,
        amount,
        amountPaise: Math.round(amount * 100),
        currency: 'INR',
        keyId: 'rzp_test_dummy',
        dummy: true,
        message: 'Dummy Razorpay order created. Complete payment in app to credit wallet.',
      });
    }

    const getRazorpay = require('../config/razorpay');
    const order = await getRazorpay().orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `wallet_${req.user._id}_${Date.now()}`,
    });
    res.json({
      orderId: order.id,
      amount,
      amountPaise: order.amount,
      currency: order.currency || 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      dummy: false,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Confirm payment after Razorpay (or dummy) success and credit wallet.
 * Dummy mode: always credits when orderId starts with order_dummy_ or body.dummy=true.
 */
const verifyPayment = async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    const { orderId, paymentId, signature, dummy } = req.body;

    if (!amount || amount < 1) {
      return res.status(400).json({ message: 'Valid amount required' });
    }

    const isDummy =
      dummy === true ||
      useDummyRazorpay() ||
      (typeof orderId === 'string' && orderId.startsWith('order_dummy_'));

    if (!isDummy) {
      // Real Razorpay signature verify can be wired later
      if (!paymentId) {
        return res.status(400).json({ message: 'paymentId required' });
      }
      // TODO: crypto.createHmac verify with RAZORPAY_KEY_SECRET when going live
    }

    const wallet = await getOrCreateWallet(req.user._id);
    wallet.balance += amount;
    await wallet.save();

    const payRef = paymentId || `pay_dummy_${Date.now()}`;
    await Transaction.create({
      user: req.user._id,
      amount,
      type: 'credit',
      description: isDummy
        ? `Wallet recharge (Razorpay dummy) — ₹${amount}`
        : `Wallet recharge — ₹${amount}`,
      razorpayPaymentId: payRef,
      status: 'completed',
    });

    res.json({
      message: isDummy
        ? `₹${amount} added to your wallet (dummy payment)`
        : `₹${amount} added to your wallet`,
      balance: wallet.balance,
      paymentId: payRef,
      orderId: orderId || null,
      dummy: isDummy,
      signature: signature || null,
    });
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

module.exports = { getWallet, addMoney, verifyPayment, getTransactions };