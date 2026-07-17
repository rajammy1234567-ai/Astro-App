/**
 * Agora RTC — User Panel
 *
 * IMPORTANT (APK stability — do NOT re-enable without a full EAS rebuild test):
 * react-native-agora native .so crashes many release APKs on launch with RN 0.86.
 * Disabled via:
 *  1) package.json expo.autolinking.exclude
 *  2) react-native.config.js (platforms android/ios = null)
 *  3) metro.config.js stub → empty module
 * Call UI still opens in soft live mode (isAgoraNativeAvailable() === false).
 *
 * Web uses agoraService.web.js.
 */
import { Platform, PermissionsAndroid } from 'react-native';

let engine = null;
let joined = false;
let currentChannel = null;
let eventHandler = null;
let agoraModule = null;
let agoraLoadAttempted = false;

function loadAgora() {
  if (Platform.OS === 'web') return null;
  if (agoraLoadAttempted) return agoraModule;
  agoraLoadAttempted = true;
  try {
    // eslint-disable-next-line global-require, import/no-extraneous-dependencies
    const mod = require('react-native-agora');
    // Metro may resolve to empty module when stubbed
    if (!mod || typeof mod.createAgoraRtcEngine !== 'function') {
      agoraModule = null;
      return null;
    }
    agoraModule = mod;
    return agoraModule;
  } catch (e) {
    console.warn('[Agora] react-native-agora not available:', e?.message);
    agoraModule = null;
    return null;
  }
}

export function isAgoraNativeAvailable() {
  const m = loadAgora();
  return !!(m && m.createAgoraRtcEngine);
}

async function requestMediaPermissions(video = false) {
  if (Platform.OS === 'android') {
    const perms = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
    if (video) perms.push(PermissionsAndroid.PERMISSIONS.CAMERA);
    const result = await PermissionsAndroid.requestMultiple(perms);
    const micOk =
      result[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
    if (!micOk) {
      throw new Error('Microphone permission required for call. Settings se allow karein.');
    }
    if (video) {
      const camOk =
        result[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;
      if (!camOk) {
        throw new Error('Camera permission required for video call.');
      }
    }
  }

  // iOS / shared: also use expo-audio when present
  try {
    // eslint-disable-next-line global-require
    const { Audio } = require('expo-audio');
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Microphone permission required for call.');
    }
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  } catch (e) {
    if (e?.message?.includes('permission')) throw e;
    // expo-audio optional on some builds
  }
}

/**
 * Join RTC channel with real audio (and optional video).
 * @param {object} opts
 * @param {string} opts.appId
 * @param {string} opts.token
 * @param {string} opts.channelName
 * @param {number} opts.uid
 * @param {boolean} [opts.video]
 * @param {function} [opts.onUserJoined]
 * @param {function} [opts.onUserOffline]
 * @param {function} [opts.onJoinSuccess]
 * @param {function} [opts.onError]
 * @param {function} [opts.onConnectionState]
 */
export async function joinChannel({
  appId,
  token,
  channelName,
  uid = 1,
  video = false,
  onUserJoined,
  onUserOffline,
  onJoinSuccess,
  onError,
  onConnectionState,
}) {
  const Agora = loadAgora();
  if (!Agora?.createAgoraRtcEngine) {
    const err = new Error(
      'Call SDK is missing. APK / development build chahiye (Expo Go me real call nahi chalta).'
    );
    onError?.(err);
    throw err;
  }
  if (!appId) {
    const err = new Error('Agora App ID missing from server token response');
    onError?.(err);
    throw err;
  }
  if (!channelName) {
    const err = new Error('Call channel missing');
    onError?.(err);
    throw err;
  }
  if (!token) {
    const err = new Error('Call token missing — server se token nahi mila');
    onError?.(err);
    throw err;
  }

  await requestMediaPermissions(video);

  // Clean previous session
  if (engine) {
    try {
      await leaveChannel();
    } catch {
      /* ignore */
    }
  }

  const {
    createAgoraRtcEngine,
    ChannelProfileType,
    ClientRoleType,
    AudioProfileType,
    AudioScenarioType,
  } = Agora;

  engine = createAgoraRtcEngine();
  engine.initialize({
    appId: String(appId),
    channelProfile: ChannelProfileType.ChannelProfileCommunication,
  });

  eventHandler = {
    onJoinChannelSuccess: (_connection, elapsed) => {
      console.log('[Agora] joined', channelName, 'elapsed', elapsed);
      joined = true;
      currentChannel = channelName;
      onJoinSuccess?.(channelName);
    },
    onUserJoined: (_connection, remoteUid) => {
      console.log('[Agora] remote user joined', remoteUid);
      onUserJoined?.(remoteUid);
    },
    onUserOffline: (_connection, remoteUid, reason) => {
      console.log('[Agora] remote user offline', remoteUid, reason);
      onUserOffline?.(remoteUid, reason);
    },
    onError: (err, msg) => {
      console.warn('[Agora] error', err, msg);
      onError?.(new Error(msg || `Agora error ${err}`));
    },
    onConnectionStateChanged: (_connection, state, reason) => {
      onConnectionState?.(state, reason);
    },
    onRemoteAudioStateChanged: (_connection, remoteUid, state) => {
      console.log('[Agora] remote audio', remoteUid, state);
    },
  };

  engine.registerEventHandler(eventHandler);
  engine.enableAudio();
  engine.setDefaultAudioRouteToSpeakerphone(true);
  try {
    engine.setAudioProfile?.(
      AudioProfileType?.AudioProfileDefault ?? 0,
      AudioScenarioType?.AudioScenarioDefault ?? 0
    );
  } catch {
    /* older SDK */
  }

  if (video) {
    engine.enableVideo();
    engine.startPreview();
  } else {
    try {
      engine.disableVideo?.();
    } catch {
      /* ok */
    }
  }

  // Ensure mic is open
  engine.muteLocalAudioStream(false);
  engine.enableLocalAudio(true);

  const localUid = Number(uid) || 1;
  const result = engine.joinChannel(String(token), String(channelName), localUid, {
    clientRoleType: ClientRoleType.ClientRoleBroadcaster,
    publishMicrophoneTrack: true,
    publishCameraTrack: !!video,
    autoSubscribeAudio: true,
    autoSubscribeVideo: !!video,
  });

  if (result !== 0 && result !== undefined && result < 0) {
    const err = new Error(`joinChannel failed code ${result}`);
    onError?.(err);
    throw err;
  }

  return { channelName, uid: localUid, appId, video };
}

export async function leaveChannel() {
  if (!engine) {
    joined = false;
    currentChannel = null;
    return true;
  }
  try {
    if (eventHandler) {
      try {
        engine.unregisterEventHandler(eventHandler);
      } catch {
        /* ok */
      }
    }
    engine.leaveChannel();
    engine.release();
  } catch (e) {
    console.warn('[Agora] leave error', e?.message);
  }
  engine = null;
  eventHandler = null;
  joined = false;
  currentChannel = null;
  return true;
}

export async function setMuted(muted) {
  if (!engine) return muted;
  engine.muteLocalAudioStream(!!muted);
  return !!muted;
}

export async function setCameraEnabled(enabled) {
  if (!engine) return enabled;
  engine.muteLocalVideoStream(!enabled);
  if (enabled) {
    try {
      engine.enableLocalVideo(true);
      engine.startPreview();
    } catch {
      /* ok */
    }
  } else {
    try {
      engine.stopPreview();
    } catch {
      /* ok */
    }
  }
  return !!enabled;
}

export async function switchCamera() {
  if (!engine) return false;
  engine.switchCamera();
  return true;
}

export async function setSpeakerphone(enabled) {
  if (!engine) return enabled;
  try {
    engine.setEnableSpeakerphone?.(!!enabled);
  } catch {
    /* ok */
  }
  try {
    engine.setDefaultAudioRouteToSpeakerphone?.(!!enabled);
  } catch {
    /* ok */
  }
  return !!enabled;
}

export function getEngine() {
  return engine;
}

export function isJoined() {
  return joined;
}

export function getChannel() {
  return currentChannel;
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
