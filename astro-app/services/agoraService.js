/**
 * Agora RTC — Astrologer Panel
 * Native Agora excluded from APK autolink (launch crash on RN 0.86). Soft-disabled.
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
      throw new Error('Microphone permission required. Settings se mic allow karein.');
    }
    if (video) {
      const camOk =
        result[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;
      if (!camOk) {
        throw new Error('Camera permission required for video call.');
      }
    }
  }

  try {
    // eslint-disable-next-line global-require
    const { Audio } = require('expo-av');
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
  }
}

export async function joinChannel({
  appId,
  token,
  channelName,
  uid = 2,
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
      'Call SDK missing. Partner APK / development build chahiye (Expo Go me awaz nahi jaati).'
    );
    onError?.(err);
    throw err;
  }
  if (!appId || !channelName || !token) {
    const err = new Error('Call credentials incomplete (appId/token/channel)');
    onError?.(err);
    throw err;
  }

  await requestMediaPermissions(video);

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
      console.log('[Agora/astro] joined', channelName, elapsed);
      joined = true;
      currentChannel = channelName;
      onJoinSuccess?.(channelName);
    },
    onUserJoined: (_connection, remoteUid) => {
      console.log('[Agora/astro] remote joined', remoteUid);
      onUserJoined?.(remoteUid);
    },
    onUserOffline: (_connection, remoteUid, reason) => {
      console.log('[Agora/astro] remote offline', remoteUid, reason);
      onUserOffline?.(remoteUid, reason);
    },
    onError: (err, msg) => {
      console.warn('[Agora/astro] error', err, msg);
      onError?.(new Error(msg || `Agora error ${err}`));
    },
    onConnectionStateChanged: (_connection, state, reason) => {
      onConnectionState?.(state, reason);
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
    /* ok */
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

  engine.muteLocalAudioStream(false);
  engine.enableLocalAudio(true);

  const localUid = Number(uid) || 2;
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
    console.warn('[Agora/astro] leave error', e?.message);
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
};

export default agoraService;
