const jwt = require('jsonwebtoken');
const Astrologer = require('../models/Astrologer');
const Chat = require('../models/Chat');
const {
  FREE_CHAT_SECONDS,
  updateSessionTimer,
  formatSession,
  creditWallet,
} = require('../utils/sessionBilling');

const signAstroToken = (id) =>
  jwt.sign({ id, role: 'astrologer' }, process.env.JWT_SECRET, { expiresIn: '30d' });

const { normalizePackages } = require('../utils/astrologerHelpers');

const toPublicProfile = (astro) => ({
  _id: astro._id,
  name: astro.name,
  phone: astro.phone,
  email: astro.email,
  image: astro.image,
  specialty: astro.specialty,
  bio: astro.bio,
  rating: astro.rating,
  pricePerMin: astro.pricePerMin,
  pricingPackages: normalizePackages(astro.pricingPackages, astro.pricePerMin),
  gallery: astro.gallery || [],
  isOnline: astro.isOnline,
  isVerified: astro.isVerified,
  isPublished: astro.isPublished,
  approvedViaApplication: astro.approvedViaApplication,
  experience: astro.experience,
  orders: astro.orders,
  languages: astro.languages,
  chatEnabled: astro.chatEnabled,
  callEnabled: astro.callEnabled,
  pendingHeld: astro.pendingHeld || 0,
  availableBalance: astro.availableBalance || 0,
  totalReleased: astro.totalReleased || 0,
});

const login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ message: 'Phone and password required' });
    }
    const astrologer = await Astrologer.findOne({ phone: phone.trim() });
    if (!astrologer || !(await astrologer.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid phone or password' });
    }
    if (astrologer.isBlocked) {
      return res.status(403).json({ message: astrologer.blockReason || 'Your account has been blocked by admin.' });
    }
    res.json({
      token: signAstroToken(astrologer._id),
      astrologer: toPublicProfile(astrologer),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMe = async (req, res) => {
  res.json(toPublicProfile(req.astrologer));
};

/**
 * Permanently delete astrologer partner account.
 * Body: { password, confirm: 'DELETE' }
 */
const deleteAccount = async (req, res) => {
  try {
    const password = String(req.body.password || '');
    const confirm = String(req.body.confirm || '').trim().toUpperCase();

    if (confirm !== 'DELETE') {
      return res.status(400).json({
        message: 'Type DELETE to confirm account deletion.',
      });
    }
    if (!password) {
      return res.status(400).json({ message: 'Password is required to delete account.' });
    }

    const astrologer = await Astrologer.findById(req.astrologer._id);
    if (!astrologer) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const ok = await astrologer.matchPassword(password);
    if (!ok) {
      return res.status(401).json({ message: 'Incorrect password. Account not deleted.' });
    }

    const astroId = astrologer._id;

    // Close any open sessions so users are not left hanging
    await Chat.updateMany(
      {
        astrologer: astroId,
        status: { $in: ['pending', 'accepted', 'active', 'paused'] },
      },
      {
        $set: {
          status: 'ended',
          isActive: false,
          endedAt: new Date(),
        },
        $push: {
          messages: {
            sender: 'system',
            content: 'Session ended — astrologer deleted their account.',
            timestamp: new Date(),
          },
        },
      }
    );

    // Hide from live / public listing side-effects
    await Astrologer.findByIdAndDelete(astroId);

    res.json({
      message: 'Your astrologer account has been permanently deleted.',
      deleted: true,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const allowed = [
      'name', 'bio', 'specialty', 'image', 'languages', 'experience',
      'chatEnabled', 'callEnabled', 'pricePerMin', 'pricingPackages', 'gallery',
    ];
    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    if (updates.pricingPackages) {
      updates.pricingPackages = normalizePackages(updates.pricingPackages, updates.pricePerMin || req.astrologer.pricePerMin);
      if (updates.pricingPackages[0]) {
        updates.pricePerMin = updates.pricingPackages[0].price;
      }
    }

    if (updates.gallery) {
      updates.gallery = (updates.gallery || []).slice(0, 12);
    }

    // Auto-publish when approved applicants finish their core profile
    const currentAstrologer = req.astrologer.toObject ? req.astrologer.toObject() : req.astrologer;
    const mergedProfile = { ...currentAstrologer, ...updates };
    const normalizedLanguages = Array.isArray(mergedProfile.languages)
      ? mergedProfile.languages
      : String(mergedProfile.languages || '')
          .split(',')
          .map((lang) => lang.trim())
          .filter(Boolean);
    const hasCoreProfile = Boolean(
      mergedProfile.name?.trim() &&
      mergedProfile.specialty?.trim() &&
      mergedProfile.bio?.trim() &&
      mergedProfile.image &&
      Number(mergedProfile.experience) > 0 &&
      normalizedLanguages.length > 0 &&
      Array.isArray(mergedProfile.pricingPackages) &&
      mergedProfile.pricingPackages.some((pkg) => Number(pkg.price) > 0) &&
      (mergedProfile.chatEnabled !== false || mergedProfile.callEnabled !== false)
    );

    if (req.body.isPublished !== undefined) {
      updates.isPublished = req.body.isPublished;
    } else if (req.astrologer.approvedViaApplication && !req.astrologer.isPublished && hasCoreProfile) {
      updates.isPublished = true;
    }

    const astrologer = await Astrologer.findByIdAndUpdate(
      req.astrologer._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    res.json(toPublicProfile(astrologer));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleOnline = async (req, res) => {
  try {
    const astrologer = await Astrologer.findById(req.astrologer._id);
    astrologer.isOnline = req.body.isOnline ?? !astrologer.isOnline;
    await astrologer.save();
    res.json({ isOnline: astrologer.isOnline });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDashboard = async (req, res) => {
  try {
    const astroId = req.astrologer._id;
    const Pooja = require('../models/Pooja');
    const Order = require('../models/Order');
    const [pendingCount, activeChats, totalChats, recentChats, myServices, serviceBookings] =
      await Promise.all([
        Chat.countDocuments({ astrologer: astroId, status: 'pending' }),
        Chat.countDocuments({ astrologer: astroId, status: { $in: ['active', 'paused'] } }),
        Chat.countDocuments({ astrologer: astroId }),
        Chat.find({ astrologer: astroId })
          .sort({ updatedAt: -1 })
          .limit(10)
          .populate('user', 'name phone email avatar'),
        Pooja.countDocuments({ astrologer: astroId, isActive: true }),
        Order.countDocuments({
          astrologer: astroId,
          orderType: { $in: ['pooja', 'remedy'] },
        }),
      ]);

    const pendingHeld = req.astrologer.pendingHeld || 0;
    const availableBalance = req.astrologer.availableBalance || 0;

    res.json({
      stats: {
        totalOrders: req.astrologer.orders || 0,
        rating: req.astrologer.rating || 0,
        pricePerMin: req.astrologer.pricePerMin || 0,
        isOnline: req.astrologer.isOnline,
        pendingRequests: pendingCount,
        activeChats,
        totalChats,
        myServices,
        serviceBookings,
        pendingHeld,
        availableBalance,
        totalReleased: req.astrologer.totalReleased || 0,
        // Available (released by admin) + chat estimate for display
        earnings: availableBalance,
      },
      recentChats,
      moneyNote:
        'Pooja/remedy payments go to admin first. Your share appears in Pending, then Available after admin release (usually after a few months).',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPendingRequests = async (req, res) => {
  try {
    const chats = await Chat.find({
      astrologer: req.astrologer._id,
      status: 'pending',
    })
      .sort({ createdAt: -1 })
      .populate('user', 'name phone email avatar dateOfBirth timeOfBirth placeOfBirth gender');
    res.json(chats.map((c) => formatSession(c)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ astrologer: req.astrologer._id })
      .sort({ updatedAt: -1 })
      .populate('user', 'name phone email avatar dateOfBirth timeOfBirth placeOfBirth gender');

    const result = [];
    for (const chat of chats) {
      await updateSessionTimer(chat);
      if (chat.isModified()) await chat.save();
      result.push(formatSession(chat));
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getChatById = async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      astrologer: req.astrologer._id,
    }).populate('user', 'name phone email avatar dateOfBirth timeOfBirth placeOfBirth gender');

    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    await updateSessionTimer(chat);
    await chat.save();

    res.json(formatSession(chat));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const acceptChat = async (req, res) => {
  try {
    // Must be signed Online in partner panel to accept
    if (!req.astrologer.isOnline) {
      return res.status(400).json({
        message: 'Pehle Online ON karo (partner panel toggle). Offline pe chat/call accept nahi hota.',
      });
    }

    const chat = await Chat.findOne({
      _id: req.params.id,
      astrologer: req.astrologer._id,
    });
    if (!chat) return res.status(404).json({ message: 'Request not found' });
    if (chat.status !== 'pending') {
      return res.status(400).json({ message: 'Request already handled' });
    }
    if (chat.type === 'call' && !chat.callPaidUpfront) {
      return res.status(400).json({ message: 'User has not paid for call yet' });
    }

    chat.status = 'active';
    chat.acceptedAt = new Date();
    chat.startedAt = new Date();
    chat.lastTickAt = new Date();
    chat.isActive = true;

    if (chat.type === 'chat') {
      chat.freeSecondsRemaining = FREE_CHAT_SECONDS;
    }

    chat.messages.push({
      sender: 'system',
      content: chat.type === 'call'
        ? 'Call accepted! Call is now connected.'
        : 'Chat accepted! 1st minute is FREE for user.',
    });

    await chat.save();
    res.json({
      message: chat.type === 'call' ? 'Call accepted' : 'Chat accepted',
      session: formatSession(chat),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const rejectChat = async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      astrologer: req.astrologer._id,
    });
    if (!chat) return res.status(404).json({ message: 'Request not found' });
    if (chat.status !== 'pending') {
      return res.status(400).json({ message: 'Request already handled' });
    }

    chat.status = 'rejected';
    chat.isActive = false;
    chat.endedAt = new Date();

    // Refund prepaid call amount when request is declined
    let refunded = 0;
    if (chat.type === 'call' && chat.callPaidUpfront && (chat.totalCharged || 0) > 0) {
      refunded = chat.totalCharged;
      try {
        await creditWallet(
          chat.user,
          refunded,
          `Call refund — astrologer declined (₹${refunded})`
        );
        chat.totalCharged = 0;
        chat.paidSecondsRemaining = 0;
        chat.callPaidUpfront = false;
        chat.messages.push({
          sender: 'system',
          content: `Astrologer declined. ₹${refunded} refunded to your wallet.`,
        });
      } catch (refundErr) {
        console.error('Call refund failed:', refundErr.message);
        chat.messages.push({
          sender: 'system',
          content: 'Astrologer declined the request. Refund pending — contact support.',
        });
      }
    } else {
      chat.messages.push({ sender: 'system', content: 'Astrologer declined the request.' });
    }

    await chat.save();

    res.json({
      message: refunded > 0 ? `Request declined. ₹${refunded} refunded to user.` : 'Request declined',
      session: formatSession(chat),
      refunded,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { content, mediaType, mediaUrl } = req.body;
    const hasMedia = !!(mediaUrl && String(mediaUrl).trim());
    const text = (content || '').trim();
    if (!text && !hasMedia) {
      return res.status(400).json({ message: 'Message or media required' });
    }
    const chat = await Chat.findOne({
      _id: req.params.id,
      astrologer: req.astrologer._id,
    });
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    await updateSessionTimer(chat);

    if (chat.status === 'pending') {
      return res.status(400).json({ message: 'Accept the request first' });
    }
    if (chat.status === 'ended' || chat.status === 'rejected') {
      return res.status(400).json({ message: 'Session has ended' });
    }
    if (chat.status !== 'active' && chat.status !== 'paused') {
      return res.status(400).json({ message: 'Session not active' });
    }

    const kind = hasMedia && (mediaType === 'video' || mediaType === 'image')
      ? mediaType
      : 'text';
    chat.messages.push({
      sender: 'astrologer',
      content: text || (kind === 'video' ? '🎥 Video' : kind === 'image' ? '📷 Photo' : ''),
      mediaType: kind,
      mediaUrl: hasMedia ? String(mediaUrl).trim() : '',
    });
    await chat.save();
    res.json(formatSession(chat));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const closeChat = async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      astrologer: req.astrologer._id,
    });
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    chat.status = 'ended';
    chat.isActive = false;
    chat.endedAt = new Date();
    chat.messages.push({ sender: 'system', content: 'Session ended by astrologer.' });
    await chat.save();
    res.json({ message: 'Chat ended', session: formatSession(chat) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  login,
  getMe,
  updateProfile,
  deleteAccount,
  toggleOnline,
  getDashboard,
  getPendingRequests,
  getChats,
  getChatById,
  acceptChat,
  rejectChat,
  sendMessage,
  closeChat,
};