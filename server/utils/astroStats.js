const Chat = require('../models/Chat');
const Order = require('../models/Order');
const { getDurationSeconds } = require('./sessionBilling');

function formatDuration(seconds) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${r}s`;
  return `${r}s`;
}

/** Live + stored online time */
function getOnlineSeconds(astro) {
  let total = Number(astro.totalOnlineSeconds || 0);
  if (astro.isOnline && astro.onlineSince) {
    total += Math.max(0, Math.floor((Date.now() - new Date(astro.onlineSince).getTime()) / 1000));
  }
  return total;
}

/**
 * Full consultation stats for one astrologer (admin + partner).
 */
async function computeAstrologerStats(astroId) {
  const sessions = await Chat.find({ astrologer: astroId })
    .select(
      'user type status totalCharged startedAt acceptedAt endedAt createdAt freeSecondsRemaining paidSecondsRemaining'
    )
    .lean();

  let chatSessions = 0;
  let callSessions = 0;
  let completedSessions = 0;
  let activeSessions = 0;
  let pendingSessions = 0;
  let rejectedSessions = 0;
  let totalSessionSeconds = 0;
  let chatSeconds = 0;
  let callSeconds = 0;
  let consultationEarnings = 0;
  const userSet = new Set();

  for (const s of sessions) {
    if (s.user) userSet.add(String(s.user));
    if (s.type === 'call') callSessions += 1;
    else chatSessions += 1;

    if (s.status === 'ended') completedSessions += 1;
    else if (['active', 'paused', 'accepted'].includes(s.status)) activeSessions += 1;
    else if (s.status === 'pending') pendingSessions += 1;
    else if (s.status === 'rejected') rejectedSessions += 1;

    const dur = getDurationSeconds(s);
    totalSessionSeconds += dur;
    if (s.type === 'call') callSeconds += dur;
    else chatSeconds += dur;

    consultationEarnings += Number(s.totalCharged || 0);
  }

  const serviceOrders = await Order.find({
    astrologer: astroId,
    orderType: { $in: ['pooja', 'remedy'] },
  })
    .select('totalAmount heldAmount releasedToAstrologer payoutStatus orderType createdAt poojaName')
    .lean();

  let serviceSales = 0;
  let serviceReleased = 0;
  let poojaCount = 0;
  let remedyCount = 0;
  for (const o of serviceOrders) {
    serviceSales += Number(o.heldAmount || o.totalAmount || 0);
    serviceReleased += Number(o.releasedToAstrologer || 0);
    if (o.orderType === 'remedy') remedyCount += 1;
    else poojaCount += 1;
  }

  return {
    totalSessions: sessions.length,
    chatSessions,
    callSessions,
    completedSessions,
    activeSessions,
    pendingSessions,
    rejectedSessions,
    uniqueUsers: userSet.size,
    totalSessionSeconds,
    chatSeconds,
    callSeconds,
    totalSessionTimeLabel: formatDuration(totalSessionSeconds),
    chatTimeLabel: formatDuration(chatSeconds),
    callTimeLabel: formatDuration(callSeconds),
    consultationEarnings,
    serviceSales,
    serviceReleased,
    serviceHeldForAdmin: Math.max(0, serviceSales - serviceReleased),
    poojaBookings: poojaCount,
    remedyBookings: remedyCount,
    totalSales: consultationEarnings + serviceSales,
  };
}

module.exports = {
  formatDuration,
  getOnlineSeconds,
  computeAstrologerStats,
};
