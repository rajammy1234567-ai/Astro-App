const Chat = require('../models/Chat');
const { buildRtcToken, getAgoraConfig } = require('../utils/agoraToken');

const getTokenForUser = async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.sessionId,
      user: req.user._id,
      type: 'call',
    });
    if (!chat) return res.status(404).json({ message: 'Call session not found' });
    if (!['pending', 'active', 'paused'].includes(chat.status)) {
      return res.status(400).json({ message: 'Call session is not active' });
    }
    if (!chat.callPaidUpfront) {
      return res.status(402).json({ message: 'Pay for call minutes first' });
    }

    const channelName = chat.agoraChannel || String(chat._id);
    const tokenData = buildRtcToken({
      channelName,
      uid: 0,
      role: 'publisher',
    });

    res.json({
      ...tokenData,
      sessionId: chat._id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTokenForAstro = async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.sessionId,
      astrologer: req.astrologer._id,
      type: 'call',
    });
    if (!chat) return res.status(404).json({ message: 'Call session not found' });
    if (!['active', 'paused'].includes(chat.status)) {
      return res.status(400).json({ message: 'Accept the call request first' });
    }

    const channelName = chat.agoraChannel || String(chat._id);
    const tokenData = buildRtcToken({
      channelName,
      uid: 1,
      role: 'publisher',
    });

    res.json({
      ...tokenData,
      sessionId: chat._id,
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
  });
};

module.exports = { getTokenForUser, getTokenForAstro, getStatus };