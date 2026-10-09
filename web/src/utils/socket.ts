import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('ll_token') : null;
    const socketUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/api$/, '');

    socket = io(socketUrl, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000
    });

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected to backend server.');
    });

    socket.on('disconnect', () => {
      console.log('[Socket.IO] Disconnected from backend server.');
    });
  }

  return socket;
}
