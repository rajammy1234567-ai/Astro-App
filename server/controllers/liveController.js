const LiveSession = require('../models/LiveSession');
const LiveComment = require('../models/LiveComment');
const Astrologer = require('../models/Astrologer');
const { buildRtcToken } = require('../utils/agoraToken');

let ioRef = null;

const setLiveIo = (io) => {
  ioRef = io;
};

const emitLive = (roomId, event, payload) => {
  if (ioRef) ioRef.to(`live:${roomId}`).emit(event, payload);
};

const formatSession = (session) => {
  const s = session.toObject ? session.toObject() : session;
  const astro = s.astrologer;
  return {
    _id: s._id,
    title: s.title,
    status: s.status,
    channelName: s.channelName,
    viewerCount: s.viewerCount,
    isMuted: s.isMuted,
    isCameraOff: s.isCameraOff,
    startedAt: s.startedAt,
    endedAt: s.endedAt,
    astrologer: astro && typeof astro === 'object'
      ? {
          _id: astro._id,
          name: astro.name,
          image: astro.image,
          specialty: astro.specialty,
          rating: astro.rating,
          pricePerMin: astro.pricePerMin,
        }
      : astro,
  };
};

const getActiveLives = async (req, res) => {
  try {
    const sessions = await LiveSession.find({ status: 'live' })
      .populate('astrologer', 'name image specialty rating pricePerMin isVerified isBlocked')
      .sort({ startedAt: -1 });
    res.json(
      sessions
        .filter((s) => s.astrologer && !s.astrologer.isBlocked)
        .map(formatSession)
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLiveById = async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id)
      .populate('astrologer', 'name image specialty rating pricePerMin isVerified');
    if (!session) return res.status(404).json({ message: 'Live session not found' });
    res.json(formatSession(session));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getComments = async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Live session not found' });

    const comments = await LiveComment.find({ liveSession: session._id })
      .sort({ createdAt: 1 })
      .limit(200);
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const startLive = async (req, res) => {
  try {
    if (req.astrologer.isBlocked) {
      return res.status(403).json({ message: 'Your account is blocked by admin. Contact support.' });
    }

    const existing = await LiveSession.findOne({
      astrologer: req.astrologer._id,
      status: 'live',
    });
    if (existing) {
      return res.json(formatSession(await existing.populate('astrologer', 'name image specialty rating pricePerMin')));
    }

    const channelName = `live_${req.astrologer._id}_${Date.now()}`;
    const session = await LiveSession.create({
      astrologer: req.astrologer._id,
      title: req.body.title?.trim() || `${req.astrologer.name} is Live`,
      channelName,
      status: 'live',
    });

    await Astrologer.findByIdAndUpdate(req.astrologer._id, { isLive: true, isOnline: true });

    const populated = await session.populate('astrologer', 'name image specialty rating pricePerMin');
    const data = formatSession(populated);
    emitLive(session._id, 'live-started', data);
    if (ioRef) ioRef.emit('live-list-updated', data);

    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const endLive = async (req, res) => {
  try {
    const session = await LiveSession.findOne({
      _id: req.params.id,
      astrologer: req.astrologer._id,
      status: 'live',
    });
    if (!session) return res.status(404).json({ message: 'Active live session not found' });

    session.status = 'ended';
    session.endedAt = new Date();
    await session.save();

    await Astrologer.findByIdAndUpdate(req.astrologer._id, { isLive: false });

    const data = formatSession(await session.populate('astrologer', 'name image specialty rating pricePerMin'));
    emitLive(session._id, 'live-ended', { sessionId: session._id });
    if (ioRef) ioRef.emit('live-list-updated', { ...data, status: 'ended' });

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateControls = async (req, res) => {
  try {
    const session = await LiveSession.findOne({
      _id: req.params.id,
      astrologer: req.astrologer._id,
      status: 'live',
    });
    if (!session) return res.status(404).json({ message: 'Active live session not found' });

    if (typeof req.body.isMuted === 'boolean') session.isMuted = req.body.isMuted;
    if (typeof req.body.isCameraOff === 'boolean') session.isCameraOff = req.body.isCameraOff;
    await session.save();

    const payload = {
      sessionId: session._id,
      isMuted: session.isMuted,
      isCameraOff: session.isCameraOff,
    };
    emitLive(session._id, 'live-controls', payload);

    res.json(payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyLive = async (req, res) => {
  try {
    const session = await LiveSession.findOne({
      astrologer: req.astrologer._id,
      status: 'live',
    }).populate('astrologer', 'name image specialty rating pricePerMin');
    if (!session) return res.json(null);
    res.json(formatSession(session));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const postUserComment = async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id);
    if (!session || session.status !== 'live') {
      return res.status(400).json({ message: 'Live session is not active' });
    }

    const text = req.body.text?.trim();
    if (!text) return res.status(400).json({ message: 'Comment text required' });

    const comment = await LiveComment.create({
      liveSession: session._id,
      authorType: 'user',
      authorId: req.user._id,
      authorName: req.user.name || 'User',
      text,
    });

    emitLive(session._id, 'live-comment', comment);
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const postAstroReply = async (req, res) => {
  try {
    const session = await LiveSession.findOne({
      _id: req.params.id,
      astrologer: req.astrologer._id,
      status: 'live',
    });
    if (!session) return res.status(404).json({ message: 'Active live session not found' });

    const text = req.body.text?.trim();
    if (!text) return res.status(400).json({ message: 'Reply text required' });

    const comment = await LiveComment.create({
      liveSession: session._id,
      authorType: 'astrologer',
      authorId: req.astrologer._id,
      authorName: req.astrologer.name,
      text,
      replyTo: req.body.replyTo || undefined,
    });

    emitLive(session._id, 'live-comment', comment);
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const joinLive = async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id)
      .populate('astrologer', 'name image specialty rating pricePerMin');
    if (!session || session.status !== 'live') {
      return res.status(400).json({ message: 'Live session is not active' });
    }

    session.viewerCount += 1;
    await session.save();

    emitLive(session._id, 'live-viewers', { viewerCount: session.viewerCount });

    res.json(formatSession(session));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const leaveLive = async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id);
    if (!session || session.status !== 'live') {
      return res.json({ viewerCount: 0 });
    }

    session.viewerCount = Math.max(0, session.viewerCount - 1);
    await session.save();

    emitLive(session._id, 'live-viewers', { viewerCount: session.viewerCount });
    res.json({ viewerCount: session.viewerCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLiveToken = async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id);
    if (!session || session.status !== 'live') {
      return res.status(400).json({ message: 'Live session is not active' });
    }

    const role = req.astrologer ? 'publisher' : 'subscriber';
    const uid = req.astrologer ? 1 : 0;

    const tokenData = buildRtcToken({
      channelName: session.channelName,
      uid,
      role,
    });

    res.json({
      ...tokenData,
      sessionId: session._id,
      isMuted: session.isMuted,
      isCameraOff: session.isCameraOff,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  setLiveIo,
  getActiveLives,
  getLiveById,
  getComments,
  startLive,
  endLive,
  updateControls,
  getMyLive,
  postUserComment,
  postAstroReply,
  joinLive,
  leaveLive,
  getLiveToken,
};
