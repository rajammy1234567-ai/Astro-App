const Chat = require('../models/Chat');
const Astrologer = require('../models/Astrologer');
const User = require('../models/User');
const {
  FREE_CHAT_SECONDS,
  updateSessionTimer,
  payForMinutes,
  deductWallet,
  formatSession,
} = require('../utils/sessionBilling');
const {
  normalizeBirthDetails,
  validateBirthDetails,
  buildKundliIntroMessage,
} = require('../utils/birthDetails');

const createSession = async (req, res) => {
  try {
    const { astrologerId, type = 'chat', minutes = 1, birthDetails: bodyBirth } = req.body;
    const sessionType = type === 'call' ? 'call' : 'chat';

    // Fresh read — published, not blocked, and online for THIS mode only
    const astrologer = await Astrologer.findById(astrologerId);
    if (!astrologer || astrologer.isBlocked || !astrologer.isPublished) {
      return res.status(404).json({ message: 'Astrologer not found or not available' });
    }

    if (sessionType === 'chat') {
      if (astrologer.chatEnabled === false) {
        return res.status(400).json({ message: 'Astrologer not available for chat' });
      }
      // Strict: must have Chat Online ON (call-only status → not on chat list)
      if (astrologer.chatOnline !== true) {
        return res.status(400).json({
          message: 'Astrologer ne Chat Online band rakha hai. Jab woh Chat ON kare tab request bhejo.',
          code: 'ASTRO_CHAT_OFFLINE',
        });
      }
    }

    if (sessionType === 'call') {
      if (astrologer.callEnabled === false) {
        return res.status(400).json({ message: 'Astrologer not available for call' });
      }
      // Strict: must have Call Online ON (chat-only status → not on call list)
      if (astrologer.callOnline !== true) {
        return res.status(400).json({
          message: 'Astrologer ne Call Online band rakha hai. Jab woh Call ON kare tab request bhejo.',
          code: 'ASTRO_CALL_OFFLINE',
        });
      }
    }

    // Birth chart details — required for every consultation
    const userDoc = await User.findById(req.user._id);
    const birthDetails = normalizeBirthDetails(bodyBirth || req.body, userDoc || {});
    const birthCheck = validateBirthDetails(birthDetails);
    if (!birthCheck.ok) {
      return res.status(400).json({
        message: birthCheck.message,
        requiresBirthDetails: true,
        missing: birthCheck.missing || [],
      });
    }

    // Persist latest details on user profile for next booking
    if (userDoc) {
      userDoc.name = birthDetails.name;
      userDoc.dateOfBirth = birthDetails.dateOfBirth;
      userDoc.timeOfBirth = birthDetails.timeOfBirth;
      userDoc.placeOfBirth = birthDetails.placeOfBirth;
      if (birthDetails.gender) userDoc.gender = birthDetails.gender;
      await userDoc.save();
    }

    // Reuse only same type (chat vs call) so call booking is not blocked by open chat
    const existing = await Chat.findOne({
      user: req.user._id,
      astrologer: astrologerId,
      type: sessionType,
      status: { $in: ['pending', 'active', 'paused', 'accepted'] },
    });
    if (existing) {
      // Refresh birth snapshot if session already open
      existing.userBirthDetails = birthDetails;
      const hasKundliMsg = (existing.messages || []).some(
        (m) => m.sender === 'user' && String(m.content || '').includes('Client Kundli Details')
      );
      if (!hasKundliMsg) {
        existing.messages.unshift({
          sender: 'user',
          content: buildKundliIntroMessage(birthDetails),
          timestamp: new Date(),
        });
      }
      await existing.save();
      return res.json({
        message: 'Existing session found',
        session: formatSession(existing),
      });
    }

    const kundliMessage = buildKundliIntroMessage(birthDetails);
    const chat = await Chat.create({
      user: req.user._id,
      astrologer: astrologerId,
      type: sessionType,
      status: 'pending',
      pricePerMin: astrologer.pricePerMin,
      isActive: true,
      userBirthDetails: birthDetails,
      // Stable channel so user + astrologer always join the same RTC room
      agoraChannel: `session_${req.user._id.toString().slice(-4)}_${Date.now().toString(36)}`,
      messages: [
        {
          sender: 'user',
          content: kundliMessage,
        },
        {
          sender: 'system',
          content: sessionType === 'call'
            ? 'Call request sent. Waiting for astrologer to accept. Client birth details attached above.'
            : 'Chat request sent. Waiting for astrologer to accept. 1st minute FREE after accept! Client birth details attached above.',
        },
      ],
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
    const typeFilter = String(req.query.type || '').toLowerCase();
    const query = { user: req.user._id };
    if (typeFilter === 'chat' || typeFilter === 'call') {
      query.type = typeFilter;
    }

    const chats = await Chat.find(query)
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
    const { content, mediaType, mediaUrl } = req.body;
    const hasMedia = !!(mediaUrl && String(mediaUrl).trim());
    const text = (content || '').trim();
    if (!text && !hasMedia) return res.status(400).json({ message: 'Message or media required' });

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

    const kind = hasMedia && (mediaType === 'video' || mediaType === 'image')
      ? mediaType
      : 'text';
    chat.messages.push({
      sender: 'user',
      content: text || (kind === 'video' ? '🎥 Video' : kind === 'image' ? '📷 Photo' : ''),
      mediaType: kind,
      mediaUrl: hasMedia ? String(mediaUrl).trim() : '',
    });
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