import { io, Socket } from 'socket.io-client';

// Use same hostname as frontend, with backend port from env or default 3086
const API_PORT = import.meta.env.VITE_API_PORT || '3086';
const BACKEND_URL = `http://${window.location.hostname}:${API_PORT}`;

export { BACKEND_URL };

export const socket: Socket = io(BACKEND_URL, {
  autoConnect: false,
});

export function connectSocket(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (socket.connected) {
      resolve();
      return;
    }

    socket.connect();

    socket.once('connect', () => {
      resolve();
    });

    socket.once('connect_error', (error) => {
      reject(error);
    });
  });
}

export function disconnectSocket(): void {
  socket.disconnect();
}
