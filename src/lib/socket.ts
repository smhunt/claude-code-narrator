import { io, Socket } from 'socket.io-client';

const BACKEND_URL = 'http://10.10.10.24:3086';

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
