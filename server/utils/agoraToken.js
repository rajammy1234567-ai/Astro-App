const { RtcTokenBuilder, RtcRole } = require('agora-token');

/** Fixed UIDs so user + astrologer never collide in the same channel */
const USER_RTC_UID = 1;
const ASTRO_RTC_UID = 2;

const getAgoraConfig = () => {
  const appId = process.env.AGORA_APP_ID?.trim();
  const appCertificate = process.env.AGORA_APP_CERTIFICATE?.trim();
  if (!appId || !appCertificate) {
    return null;
  }
  return { appId, appCertificate };
};

/** Deterministic channel name both clients must use */
const channelForSession = (chat) => {
  if (!chat) return '';
  if (chat.agoraChannel) return String(chat.agoraChannel);
  return `session_${chat._id}`;
};

const buildRtcToken = ({ channelName, uid, role = 'publisher', expireSeconds = 3600 }) => {
  const config = getAgoraConfig();
  if (!config) {
    throw new Error('Agora not configured. Add AGORA_APP_ID and AGORA_APP_CERTIFICATE in server/.env');
  }

  const numericUid = Number(uid);
  if (!Number.isFinite(numericUid) || numericUid <= 0) {
    throw new Error('RTC uid must be a positive integer');
  }

  const rtcRole = role === 'subscriber' ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;
  const privilegeExpire = Math.floor(Date.now() / 1000) + Math.max(600, expireSeconds);

  const token = RtcTokenBuilder.buildTokenWithUid(
    config.appId,
    config.appCertificate,
    String(channelName),
    numericUid,
    rtcRole,
    privilegeExpire,
    privilegeExpire
  );

  return {
    appId: config.appId,
    token,
    channelName: String(channelName),
    uid: numericUid,
    expiresAt: privilegeExpire,
    role: 'publisher',
  };
};

module.exports = {
  getAgoraConfig,
  buildRtcToken,
  channelForSession,
  USER_RTC_UID,
  ASTRO_RTC_UID,
};
