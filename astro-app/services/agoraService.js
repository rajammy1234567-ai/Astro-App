/**
 * Agora Call Service — Astrologer Panel
 * ======================================
 * DUMMY IMPLEMENTATION — production-ready structure.
 *
 * To activate real Agora:
 *   1. npm install react-native-agora
 *   2. Replace AGORA_APP_ID with your actual App ID from console.agora.io
 *   3. Generate tokens from your backend at /api/agora/token
 *   4. Uncomment the RtcEngine calls below and remove dummy timers
 *
 * The channel name convention: `session_<sessionId>`
 */

const AGORA_APP_ID = 'YOUR_AGORA_APP_ID_HERE'; // TODO: Replace with real App ID

let _dummyCallbacks = {};

/** Join a voice/video call channel */
export async function joinChannel({ channelName, uid, token, onUserJoined, onUserOffline, onError }) {
  console.log('[Agora] joinChannel:', channelName, '(dummy mode)');

  // Store callbacks for dummy simulation
  _dummyCallbacks = { onUserJoined, onUserOffline, onError };

  // Simulate remote user joining after 1.5s
  setTimeout(() => {
    onUserJoined && onUserJoined(uid + 1);
  }, 1500);

  return { channelName, uid, appId: AGORA_APP_ID };
}

/** Leave the current channel */
export async function leaveChannel() {
  console.log('[Agora] leaveChannel (dummy mode)');
  _dummyCallbacks = {};
  return true;
}

/** Toggle local microphone mute */
export async function setMuted(muted) {
  console.log('[Agora] setMuted:', muted, '(dummy mode)');
  return muted;
}

/** Toggle local camera */
export async function setCameraEnabled(enabled) {
  console.log('[Agora] setCameraEnabled:', enabled, '(dummy mode)');
  return enabled;
}

/** Switch front/back camera */
export async function switchCamera() {
  console.log('[Agora] switchCamera (dummy mode)');
  return true;
}

/** Set speakerphone on/off */
export async function setSpeakerphone(enabled) {
  console.log('[Agora] setSpeakerphone:', enabled, '(dummy mode)');
  return enabled;
}

export const agoraService = {
  joinChannel,
  leaveChannel,
  setMuted,
  setCameraEnabled,
  switchCamera,
  setSpeakerphone,
  APP_ID: AGORA_APP_ID,
};

export default agoraService;
