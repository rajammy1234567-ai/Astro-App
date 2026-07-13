const Pooja = require('../models/Pooja');
const Order = require('../models/Order');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Astrologer = require('../models/Astrologer');
const { buildEscrowFields } = require('../utils/serviceEscrow');

const getOrCreateWallet = async (userId) => {
  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    wallet = await Wallet.create({ user: userId, balance: 0 });
  }
  return wallet;
};

/** Public list — active poojas & remedies with astrologer info */
const getPoojas = async (req, res) => {
  try {
    const type = req.query.type; // pooja | remedy | all
    const filter = { isActive: true };
    if (type === 'pooja' || type === 'remedy') filter.serviceType = type;

    const poojas = await Pooja.find(filter)
      .populate('astrologer', 'name image specialty rating isOnline badge')
      .sort({ createdAt: -1 });
    res.json(poojas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const bookPooja = async (req, res) => {
  try {
    const pooja = await Pooja.findById(req.params.id).populate('astrologer', 'name');
    if (!pooja || !pooja.isActive) {
      return res.status(404).json({ message: 'Service not found or inactive' });
    }

    const wallet = await getOrCreateWallet(req.user._id);
    if (wallet.balance < pooja.price) {
      return res.status(400).json({
        message: 'Insufficient wallet balance. Please recharge.',
        code: 'INSUFFICIENT_WALLET',
        balance: wallet.balance,
        required: pooja.price,
      });
    }

    wallet.balance -= pooja.price;
    await wallet.save();

    const serviceLabel = pooja.serviceType === 'remedy' ? 'Remedy' : 'Pooja';
    await Transaction.create({
      user: req.user._id,
      amount: pooja.price,
      type: 'debit',
      description: `${serviceLabel} booking: ${pooja.name}${pooja.astrologer?.name ? ` · by ${pooja.astrologer.name}` : ''}`,
      status: 'completed',
    });

    const escrow = buildEscrowFields({
      totalAmount: pooja.price,
      astrologerId: pooja.astrologer?._id || pooja.astrologer || null,
      sharePercent: pooja.astrologerSharePercent,
    });

    // Track pending share on astrologer (still held by admin)
    if (escrow.astrologer && escrow.astrologerShareAmount > 0) {
      await Astrologer.findByIdAndUpdate(escrow.astrologer, {
        $inc: { pendingHeld: escrow.astrologerShareAmount, orders: 1 },
      });
    }

    const order = await Order.create({
      user: req.user._id,
      orderType: pooja.serviceType === 'remedy' ? 'remedy' : 'pooja',
      serviceType: pooja.serviceType || 'pooja',
      pooja: pooja._id,
      poojaName: pooja.name,
      totalAmount: pooja.price,
      status: 'confirmed',
      products: [],
      paymentMethod: 'wallet',
      paymentStatus: 'paid',
      ...escrow,
    });

    res.json({
      message: `${serviceLabel} booked successfully. Payment held securely by platform.`,
      order,
      balance: wallet.balance,
      escrow: {
        heldByAdmin: true,
        note: 'Full amount goes to admin first. Astrologer share is released by admin after the hold period (usually a few months).',
        payoutEligibleAt: order.payoutEligibleAt,
        astrologerSharePercent: order.astrologerSharePercent,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getPoojas, bookPooja };
