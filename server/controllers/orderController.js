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

const createOrder = async (req, res) => {
  try {
    const { products, shippingAddress } = req.body;

    if (!Array.isArray(products) || !products.length) {
      return res.status(400).json({ message: 'Cart is empty' });
    }
    if (!shippingAddress?.trim()) {
      return res.status(400).json({ message: 'Shipping address is required' });
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

    const wallet = await getOrCreateWallet(req.user._id);
    if (wallet.balance < totalAmount) {
      return res.status(400).json({ message: 'Insufficient wallet balance. Please recharge.' });
    }

    wallet.balance -= totalAmount;
    await wallet.save();

    await Transaction.create({
      user: req.user._id,
      amount: totalAmount,
      type: 'debit',
      description: `Store order (${orderItems.length} item${orderItems.length > 1 ? 's' : ''})`,
      status: 'completed',
    });

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
    });

    res.json({
      message: 'Order placed successfully',
      order,
      balance: wallet.balance,
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