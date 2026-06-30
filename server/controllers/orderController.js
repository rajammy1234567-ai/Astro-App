const Order = require('../models/Order');

const createOrder = async (req, res) => {
  try {
    const { products, totalAmount, shippingAddress } = req.body;
    const order = await Order.create({
      user: req.user._id,
      orderType: 'store',
      products,
      totalAmount,
      shippingAddress,
    });

    if (!process.env.RAZORPAY_KEY_ID) {
      order.status = 'confirmed';
      await order.save();
      return res.json({ order, devMode: true });
    }

    const getRazorpay = require('../config/razorpay');
    const razorpayOrder = await getRazorpay().orders.create({
      amount: totalAmount * 100,
      currency: 'INR',
      receipt: `order_${order._id}`,
    });
    order.razorpayOrderId = razorpayOrder.id;
    await order.save();
    res.json({ order, razorpayOrderId: razorpayOrder.id });
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