const Pooja = require('../models/Pooja');
const Order = require('../models/Order');
const Astrologer = require('../models/Astrologer');
const AstrologerPayout = require('../models/AstrologerPayout');
const { DEFAULT_ASTRO_SHARE, HOLD_MONTHS } = require('../utils/serviceEscrow');

// ── Astrologer: my pooja / remedy offerings ───────────────────────────

const listMyServices = async (req, res) => {
  try {
    const items = await Pooja.find({ astrologer: req.astrologer._id }).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createMyService = async (req, res) => {
  try {
    const { name, description, duration, price, icon, image, serviceType, isActive } = req.body;
    if (!name || price == null) {
      return res.status(400).json({ message: 'Name and price are required' });
    }
    const type = serviceType === 'remedy' ? 'remedy' : 'pooja';
    const item = await Pooja.create({
      name: String(name).trim(),
      description: description || '',
      duration: duration || (type === 'remedy' ? 'As advised' : '2 hours'),
      price: Number(price),
      icon: icon || (type === 'remedy' ? 'leaf-outline' : 'flame-outline'),
      image: image || '',
      serviceType: type,
      astrologer: req.astrologer._id,
      astrologerSharePercent: DEFAULT_ASTRO_SHARE,
      isActive: isActive !== false,
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateMyService = async (req, res) => {
  try {
    const item = await Pooja.findOne({ _id: req.params.id, astrologer: req.astrologer._id });
    if (!item) return res.status(404).json({ message: 'Service not found' });

    const allowed = ['name', 'description', 'duration', 'price', 'icon', 'image', 'serviceType', 'isActive'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (key === 'price') item.price = Number(req.body.price);
        else if (key === 'serviceType') item.serviceType = req.body.serviceType === 'remedy' ? 'remedy' : 'pooja';
        else if (key === 'isActive') item.isActive = !!req.body.isActive;
        else item[key] = req.body[key];
      }
    }
    await item.save();
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteMyService = async (req, res) => {
  try {
    const item = await Pooja.findOneAndDelete({
      _id: req.params.id,
      astrologer: req.astrologer._id,
    });
    if (!item) return res.status(404).json({ message: 'Service not found' });
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const myServiceBookings = async (req, res) => {
  try {
    const orders = await Order.find({
      astrologer: req.astrologer._id,
      orderType: { $in: ['pooja', 'remedy'] },
    })
      .populate('user', 'name phone email')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const myEarnings = async (req, res) => {
  try {
    const astro = await Astrologer.findById(req.astrologer._id).select(
      'pendingHeld availableBalance totalReleased name'
    );
    const heldOrders = await Order.find({
      astrologer: req.astrologer._id,
      payoutStatus: { $in: ['held', 'partial'] },
    })
      .select(
        'poojaName orderType totalAmount astrologerShareAmount releasedToAstrologer payoutStatus payoutEligibleAt createdAt'
      )
      .sort({ createdAt: -1 })
      .limit(50);

    const payouts = await AstrologerPayout.find({ astrologer: req.astrologer._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('order', 'poojaName totalAmount');

    res.json({
      pendingHeld: astro?.pendingHeld || 0,
      availableBalance: astro?.availableBalance || 0,
      totalReleased: astro?.totalReleased || 0,
      holdMonths: HOLD_MONTHS,
      defaultSharePercent: DEFAULT_ASTRO_SHARE,
      note: 'Pooja/remedy payments go to admin first. Your share is released by admin after the hold period.',
      heldOrders,
      recentPayouts: payouts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Admin: escrow & release ───────────────────────────────────────────

const adminListHeldOrders = async (req, res) => {
  try {
    const status = req.query.status; // held | partial | released | all
    const filter = {
      orderType: { $in: ['pooja', 'remedy'] },
      fundsHeldByAdmin: true,
    };
    if (status && status !== 'all') filter.payoutStatus = status;
    else if (!status) filter.payoutStatus = { $in: ['held', 'partial'] };

    const orders = await Order.find(filter)
      .populate('user', 'name phone email')
      .populate('astrologer', 'name phone pendingHeld availableBalance')
      .sort({ createdAt: -1 })
      .limit(200);

    const totals = await Order.aggregate([
      {
        $match: {
          orderType: { $in: ['pooja', 'remedy'] },
          fundsHeldByAdmin: true,
        },
      },
      {
        $group: {
          _id: '$payoutStatus',
          count: { $sum: 1 },
          held: { $sum: '$heldAmount' },
          share: { $sum: '$astrologerShareAmount' },
          released: { $sum: '$releasedToAstrologer' },
        },
      },
    ]);

    res.json({
      holdMonths: HOLD_MONTHS,
      defaultSharePercent: DEFAULT_ASTRO_SHARE,
      totals,
      orders,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Admin releases (part of) the astrologer's share from a held order.
 * Body: { amount?, percent?, force?, note? }
 * - percent: 0-100 of remaining share (default 100)
 * - force: allow before payoutEligibleAt
 */
const adminReleasePayout = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (!['pooja', 'remedy'].includes(order.orderType)) {
      return res.status(400).json({ message: 'Only pooja/remedy orders support this payout' });
    }
    if (!order.astrologer) {
      return res.status(400).json({ message: 'No astrologer linked to this order' });
    }
    if (order.payoutStatus === 'released') {
      return res.status(400).json({ message: 'Already fully released' });
    }

    const remaining = Math.max(0, (order.astrologerShareAmount || 0) - (order.releasedToAstrologer || 0));
    if (remaining <= 0) {
      return res.status(400).json({ message: 'Nothing left to release' });
    }

    const now = new Date();
    const eligible = !order.payoutEligibleAt || now >= new Date(order.payoutEligibleAt);
    const force = !!req.body.force;
    if (!eligible && !force) {
      return res.status(400).json({
        message: `Payout eligible after ${order.payoutEligibleAt?.toISOString?.() || order.payoutEligibleAt}. Use force:true to release early.`,
        payoutEligibleAt: order.payoutEligibleAt,
        code: 'NOT_YET_ELIGIBLE',
      });
    }

    let amount = remaining;
    if (req.body.amount != null) {
      amount = Math.min(remaining, Math.max(0, Number(req.body.amount)));
    } else if (req.body.percent != null) {
      const pct = Math.min(100, Math.max(0, Number(req.body.percent)));
      amount = Math.round((remaining * pct) / 100);
    }
    if (amount <= 0) {
      return res.status(400).json({ message: 'Release amount must be > 0' });
    }

    order.releasedToAstrologer = (order.releasedToAstrologer || 0) + amount;
    if (order.releasedToAstrologer >= order.astrologerShareAmount) {
      order.payoutStatus = 'released';
    } else {
      order.payoutStatus = 'partial';
    }
    if (req.body.note) order.payoutNote = String(req.body.note);
    await order.save();

    await Astrologer.findByIdAndUpdate(order.astrologer, {
      $inc: {
        pendingHeld: -amount,
        availableBalance: amount,
        totalReleased: amount,
      },
    });

    const payout = await AstrologerPayout.create({
      order: order._id,
      astrologer: order.astrologer,
      amount,
      percentOfShare: Math.round((amount / (order.astrologerShareAmount || amount)) * 100),
      note: req.body.note || '',
      earlyRelease: !eligible,
    });

    const astro = await Astrologer.findById(order.astrologer).select(
      'name pendingHeld availableBalance totalReleased'
    );

    res.json({
      message: `Released ₹${amount} to ${astro?.name || 'astrologer'}`,
      order,
      payout,
      astrologer: astro,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  listMyServices,
  createMyService,
  updateMyService,
  deleteMyService,
  myServiceBookings,
  myEarnings,
  adminListHeldOrders,
  adminReleasePayout,
};
