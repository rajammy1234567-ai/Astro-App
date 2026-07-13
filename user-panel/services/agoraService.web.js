/**
 * Web stub — react-native-agora is native-only (Android/iOS APK).
 * Metro resolves this file on web so the native module is never bundled.
 */

const WEB_MSG =
  'Voice/video calls work on the Android/iOS app only. Web pe call available nahi hai.';

export function isAgoraNativeAvailable() {
  return false;
}

export async function joinChannel(opts = {}) {
  const err = new Error(WEB_MSG);
  opts.onError?.(err);
  throw err;
}

export async function leaveChannel() {
  return true;
}

export async function setMuted(muted) {
  return !!muted;
}

export async function setCameraEnabled(enabled) {
  return !!enabled;
}

export async function switchCamera() {
  return false;
}

export async function setSpeakerphone(enabled) {
  return !!enabled;
}

export function getEngine() {
  return null;
}

export function isJoined() {
  return false;
}

export function getChannel() {
  return null;
}

export const agoraService = {
  joinChannel,
  leaveChannel,
  setMuted,
  setCameraEnabled,
  switchCamera,
  setSpeakerphone,
  isAgoraNativeAvailable,
  getEngine,
  isJoined,
  getChannel,
};

export default agoraService;
