import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { TokenPayload } from '../services/auth.service';
import { notificationService } from '../services/notification.service';

export function initializeSockets(io: SocketServer) {
  notificationService.setSocketIO(io);

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      // Allow unauthenticated connection with limited room access (e.g. for simple demo observers)
      return next();
    }

    try {
      const decoded = jwt.verify(token as string, config.jwtSecret) as TokenPayload;
      (socket as any).user = decoded;
      next();
    } catch (err) {
      // Continue without user object if invalid token
      next();
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user as TokenPayload | undefined;
    console.log(`[Socket.IO] Client connected: ${socket.id} (User: ${user?.name || 'Anonymous'})`);

    if (user?.userId) {
      // Join user's personal alert room
      socket.join(`user:${user.userId}`);
    }

    // Allow subscribing to specific patient updates
    socket.on('subscribe_patient', (patientId: string) => {
      if (patientId) {
        socket.join(`patient:${patientId}`);
        console.log(`[Socket.IO] Client ${socket.id} subscribed to patient:${patientId}`);
      }
    });

    socket.on('unsubscribe_patient', (patientId: string) => {
      if (patientId) {
        socket.leave(`patient:${patientId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });
}
