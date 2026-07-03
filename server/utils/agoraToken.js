const { RtcTokenBuilder, RtcRole } = require('agora-token');

const getAgoraConfig = () => {
  const appId = process.env.AGORA_APP_ID?.trim();
  const appCertificate = process.env.AGORA_APP_CERTIFICATE?.trim();
  if (!appId || !appCertificate) {
    return null;
  }
  return { appId, appCertificate };
};

const buildRtcToken = ({ channelName, uid = 0, role = 'publisher', expireSeconds = 3600 }) => {
  const config = getAgoraConfig();
  if (!config) {
    throw new Error('Agora not configured. Add AGORA_APP_ID and AGORA_APP_CERTIFICATE in server/.env');
  }

  const rtcRole = role === 'subscriber' ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;
  const privilegeExpire = Math.floor(Date.now() / 1000) + expireSeconds;

  const token = RtcTokenBuilder.buildTokenWithUid(
    config.appId,
    config.appCertificate,
    String(channelName),
    Number(uid) || 0,
    rtcRole,
    privilegeExpire,
    privilegeExpire
  );

  return {
    appId: config.appId,
    token,
    channelName: String(channelName),
    uid: Number(uid) || 0,
    expiresAt: privilegeExpire,
  };
};

module.exports = { getAgoraConfig, buildRtcToken };