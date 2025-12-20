import { io, Socket } from 'socket.io-client';

// Detect Caddy subdomain access vs direct IP access
function getBackendUrl(): string {
  const hostname = window.location.hostname;

  // If accessed via Caddy subdomain (narrator.dev.ecoworks.ca)
  if (hostname === 'narrator.dev.ecoworks.ca') {
    return 'https://api.narrator.dev.ecoworks.ca';
  }

  // Direct IP/localhost access - use port-based URL
  const API_PORT = import.meta.env.VITE_API_PORT || '3086';
  return `http://${hostname}:${API_PORT}`;
}

const BACKEND_URL = getBackendUrl();

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
