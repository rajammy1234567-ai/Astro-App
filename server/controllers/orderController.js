const Order = require('../models/Order');
const Product = require('../models/Product');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');

const getOrCreateWallet = async (userId) => {
  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    wallet = await Wallet.create({ user: userId, balance: 0 });
  }
  return wallet;
};

const ONLINE_METHODS = new Set(['upi', 'gpay', 'card', 'razorpay']);

const createOrder = async (req, res) => {
  try {
    const { products, shippingAddress, paymentMethod: rawMethod, paymentId } = req.body;

    if (!Array.isArray(products) || !products.length) {
      return res.status(400).json({ message: 'Cart is empty' });
    }
    if (!shippingAddress?.trim()) {
      return res.status(400).json({ message: 'Shipping address is required' });
    }

    let paymentMethod = String(rawMethod || 'wallet').toLowerCase();
    if (paymentMethod === 'googlepay') paymentMethod = 'gpay';
    if (!['wallet', 'upi', 'gpay', 'card', 'razorpay'].includes(paymentMethod)) {
      return res.status(400).json({
        message: 'Invalid payment method. Use wallet, upi, gpay, card, or razorpay.',
      });
    }

    const orderItems = [];
    let totalAmount = 0;

    for (const item of products) {
      const product = await Product.findById(item.product);
      if (!product || !product.isActive) {
        return res.status(400).json({ message: `Product not available: ${item.product}` });
      }

      const quantity = Math.max(1, Number(item.quantity) || 1);
      if (product.stock < quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}. Only ${product.stock} left.`,
        });
      }

      orderItems.push({
        product: product._id,
        quantity,
        price: product.price,
      });
      totalAmount += product.price * quantity;
    }

    let balance = null;
    let payRef = paymentId || null;

    if (paymentMethod === 'wallet') {
      const wallet = await getOrCreateWallet(req.user._id);
      if (wallet.balance < totalAmount) {
        return res.status(400).json({
          message: 'Insufficient wallet balance. Please recharge your wallet or pay with UPI/GPay.',
          code: 'INSUFFICIENT_WALLET',
          balance: wallet.balance,
          required: totalAmount,
        });
      }

      wallet.balance -= totalAmount;
      await wallet.save();
      balance = wallet.balance;
      payRef = payRef || `wallet_${Date.now()}`;

      await Transaction.create({
        user: req.user._id,
        amount: totalAmount,
        type: 'debit',
        description: `Store order (${orderItems.length} item${orderItems.length > 1 ? 's' : ''}) — Wallet`,
        status: 'completed',
        razorpayPaymentId: payRef,
      });
    } else if (ONLINE_METHODS.has(paymentMethod)) {
      // Dummy / external UPI-GPay-Card flow — does not debit wallet
      payRef = payRef || `pay_${paymentMethod}_${Date.now()}`;

      await Transaction.create({
        user: req.user._id,
        amount: totalAmount,
        type: 'debit',
        description: `Store order (${orderItems.length} item${orderItems.length > 1 ? 's' : ''}) — ${paymentMethod.toUpperCase()}`,
        status: 'completed',
        razorpayPaymentId: payRef,
      });

      const wallet = await getOrCreateWallet(req.user._id);
      balance = wallet.balance;
    }

    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
    }

    const order = await Order.create({
      user: req.user._id,
      orderType: 'store',
      products: orderItems,
      totalAmount,
      shippingAddress: shippingAddress.trim(),
      status: 'confirmed',
      paymentMethod,
      paymentStatus: 'paid',
      razorpayPaymentId: payRef,
    });

    const methodLabel =
      paymentMethod === 'wallet'
        ? 'Wallet'
        : paymentMethod === 'gpay'
          ? 'GPay'
          : paymentMethod === 'upi'
            ? 'UPI'
            : paymentMethod === 'card'
              ? 'Card'
              : 'Online';

    res.json({
      message: `Order placed successfully via ${methodLabel}`,
      order,
      balance,
      paymentMethod,
      paymentId: payRef,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('products.product')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createOrder, getOrders };
