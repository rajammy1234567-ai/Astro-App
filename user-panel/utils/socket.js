import { io } from 'socket.io-client';
import { getApiBaseUrl } from './platform';

let socket = null;

export function getSocketUrl() {
  return getApiBaseUrl().replace(/\/api\/?$/, '');
}

export function getSocket() {
  if (!socket) {
    socket = io(getSocketUrl(), {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return socket;
}

export function joinLiveRoom(sessionId) {
  getSocket().emit('join-live', sessionId);
}

export function leaveLiveRoom(sessionId) {
  getSocket().emit('leave-live', sessionId);
}