const Chat = require('../models/Chat');
const {
  buildRtcToken,
  getAgoraConfig,
  channelForSession,
  USER_RTC_UID,
  ASTRO_RTC_UID,
} = require('../utils/agoraToken');

const ensureChannel = async (chat) => {
  const name = channelForSession(chat);
  if (!chat.agoraChannel || chat.agoraChannel !== name) {
    chat.agoraChannel = name;
    await chat.save();
  }
  return name;
};

const sessionIdFrom = (req) => req.params.sessionId || req.params.id;

const getTokenForUser = async (req, res) => {
  try {
    if (!getAgoraConfig()) {
      return res.status(503).json({
        message: 'Agora not configured on server. Set AGORA_APP_ID and AGORA_APP_CERTIFICATE.',
        configured: false,
      });
    }

    const sessionId = sessionIdFrom(req);
    const chat = await Chat.findOne({
      _id: sessionId,
      user: req.user._id,
      type: 'call',
    });
    if (!chat) return res.status(404).json({ message: 'Call session not found' });
    // User can only get RTC token AFTER astrologer accepts (status active/paused)
    if (!['active', 'paused', 'accepted'].includes(chat.status)) {
      return res.status(400).json({
        message: 'Call starts only after astrologer accepts your request.',
        status: chat.status,
        waitingForAccept: chat.status === 'pending',
      });
    }
    if (!chat.callPaidUpfront) {
      return res.status(402).json({ message: 'Pay for call minutes first' });
    }

    const channelName = await ensureChannel(chat);
    const tokenData = buildRtcToken({
      channelName,
      uid: USER_RTC_UID,
      role: 'publisher',
      expireSeconds: 7200,
    });

    res.json({
      ...tokenData,
      sessionId: chat._id,
      status: chat.status,
      role: 'user',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTokenForAstro = async (req, res) => {
  try {
    if (!getAgoraConfig()) {
      return res.status(503).json({
        message: 'Agora not configured on server. Set AGORA_APP_ID and AGORA_APP_CERTIFICATE.',
        configured: false,
      });
    }

    const sessionId = sessionIdFrom(req);
    const chat = await Chat.findOne({
      _id: sessionId,
      astrologer: req.astrologer._id,
      type: 'call',
    });
    if (!chat) return res.status(404).json({ message: 'Call session not found' });
    if (!['active', 'paused', 'accepted'].includes(chat.status)) {
      return res.status(400).json({
        message: 'Accept the call request first, then join with audio.',
      });
    }

    const channelName = await ensureChannel(chat);
    const tokenData = buildRtcToken({
      channelName,
      uid: ASTRO_RTC_UID,
      role: 'publisher',
      expireSeconds: 7200,
    });

    res.json({
      ...tokenData,
      sessionId: chat._id,
      status: chat.status,
      role: 'astrologer',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStatus = (req, res) => {
  const configured = !!getAgoraConfig();
  res.json({
    configured,
    message: configured
      ? 'Agora RTC ready'
      : 'Add AGORA_APP_ID and AGORA_APP_CERTIFICATE in server/.env',
    userUid: USER_RTC_UID,
    astroUid: ASTRO_RTC_UID,
  });
};

module.exports = { getTokenForUser, getTokenForAstro, getStatus };
