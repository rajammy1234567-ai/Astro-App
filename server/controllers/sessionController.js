const Chat = require('../models/Chat');
const Astrologer = require('../models/Astrologer');
const {
  FREE_CHAT_SECONDS,
  updateSessionTimer,
  payForMinutes,
  deductWallet,
  formatSession,
} = require('../utils/sessionBilling');

const publicFilter = { isPublished: true, approvedViaApplication: true };

const createSession = async (req, res) => {
  try {
    const { astrologerId, type = 'chat', minutes = 1 } = req.body;
    const sessionType = type === 'call' ? 'call' : 'chat';

    const astrologer = await Astrologer.findOne({ _id: astrologerId, ...publicFilter });
    if (!astrologer) return res.status(404).json({ message: 'Astrologer not found' });

    if (sessionType === 'chat' && !astrologer.chatEnabled) {
      return res.status(400).json({ message: 'Astrologer not available for chat' });
    }
    if (sessionType === 'call' && !astrologer.callEnabled) {
      return res.status(400).json({ message: 'Astrologer not available for call' });
    }

    const existing = await Chat.findOne({
      user: req.user._id,
      astrologer: astrologerId,
      status: { $in: ['pending', 'active', 'paused', 'accepted'] },
    });
    if (existing) {
      return res.json({
        message: 'Existing session found',
        session: formatSession(existing),
      });
    }

    const chat = await Chat.create({
      user: req.user._id,
      astrologer: astrologerId,
      type: sessionType,
      status: 'pending',
      pricePerMin: astrologer.pricePerMin,
      isActive: true,
      agoraChannel: `call_${Date.now()}_${req.user._id.toString().slice(-6)}`,
      messages: [{
        sender: 'system',
        content: sessionType === 'call'
          ? 'Call request sent. Waiting for astrologer to accept.'
          : 'Chat request sent. Waiting for astrologer to accept. 1st minute FREE after accept!',
      }],
    });

    if (sessionType === 'call') {
      const mins = Math.max(1, Number(minutes) || 1);
      const cost = astrologer.pricePerMin * mins;
      const balance = await deductWallet(
        req.user._id,
        cost,
        `Call consultation — ${mins} min prepaid`
      );
      chat.callPaidUpfront = true;
      chat.paidSecondsRemaining = mins * 60;
      chat.totalCharged = cost;
      chat.messages.push({
        sender: 'system',
        content: `₹${cost} paid for ${mins} minute call. Request sent to astrologer.`,
      });
      await chat.save();
      return res.status(201).json({
        message: 'Call request sent. Waiting for astrologer to accept.',
        session: formatSession(chat),
        balance,
      });
    }

    res.status(201).json({
      message: 'Chat request sent. Waiting for astrologer to accept.',
      session: formatSession(chat),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getMySessions = async (req, res) => {
  try {
    const chats = await Chat.find({ user: req.user._id })
      .sort({ updatedAt: -1 })
      .populate('astrologer', 'name image specialty pricePerMin isOnline');
    const sessions = [];
    for (const chat of chats) {
      await updateSessionTimer(chat);
      if (chat.isModified()) await chat.save();
      sessions.push(formatSession(chat));
    }
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSession = async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate('astrologer', 'name image specialty pricePerMin isOnline');

    if (!chat) return res.status(404).json({ message: 'Session not found' });

    await updateSessionTimer(chat);
    await chat.save();

    res.json(formatSession(chat));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: 'Message required' });

    const chat = await Chat.findOne({ _id: req.params.id, user: req.user._id });
    if (!chat) return res.status(404).json({ message: 'Session not found' });

    await updateSessionTimer(chat);

    if (chat.status === 'pending') {
      return res.status(400).json({ message: 'Waiting for astrologer to accept your request' });
    }
    if (chat.status === 'rejected') {
      return res.status(400).json({ message: 'Astrologer declined your request' });
    }
    if (chat.status === 'ended') {
      return res.status(400).json({ message: 'Session has ended' });
    }
    if (chat.status === 'paused' || chat.requiresPayment) {
      return res.status(402).json({
        message: 'Time ended. Pay to continue chat.',
        requiresPayment: true,
        billing: formatSession(chat).billing,
      });
    }
    if (chat.status !== 'active') {
      return res.status(400).json({ message: 'Session not active yet' });
    }

    const hasTime = (chat.freeSecondsRemaining || 0) + (chat.paidSecondsRemaining || 0) > 0;
    if (!hasTime) {
      chat.status = 'paused';
      chat.requiresPayment = true;
      await chat.save();
      return res.status(402).json({
        message: 'Time ended. Pay to continue.',
        requiresPayment: true,
        billing: formatSession(chat).billing,
      });
    }

    chat.messages.push({ sender: 'user', content: content.trim() });
    chat.lastTickAt = chat.lastTickAt || new Date();
    await chat.save();

    res.json(formatSession(chat));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const paySession = async (req, res) => {
  try {
    const { minutes = 1 } = req.body;
    const chat = await Chat.findOne({ _id: req.params.id, user: req.user._id });
    if (!chat) return res.status(404).json({ message: 'Session not found' });

    if (chat.status === 'ended' || chat.status === 'rejected') {
      return res.status(400).json({ message: 'Session is closed' });
    }

    const mins = Math.max(1, Math.min(60, Number(minutes) || 1));
    const { balance, cost } = await payForMinutes(chat, mins);

    if (chat.status === 'paused') {
      chat.status = 'active';
      chat.isActive = true;
      chat.lastTickAt = new Date();
    }

    await chat.save();

    res.json({
      message: `₹${cost} paid. ${mins} minute${mins > 1 ? 's' : ''} added.`,
      balance,
      session: formatSession(chat),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const endSession = async (req, res) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, user: req.user._id });
    if (!chat) return res.status(404).json({ message: 'Session not found' });

    chat.status = 'ended';
    chat.isActive = false;
    chat.endedAt = new Date();
    chat.messages.push({ sender: 'system', content: 'Session ended by user.' });
    await chat.save();

    res.json({ message: 'Session ended', session: formatSession(chat) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createSession,
  getMySessions,
  getSession,
  sendMessage,
  paySession,
  endSession,
  FREE_CHAT_SECONDS,
};