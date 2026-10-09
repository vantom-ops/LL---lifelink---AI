import http from 'http';
import { Server as SocketServer } from 'socket.io';
import { app } from './app';
import { config } from './config/env';
import { connectDatabase } from './config/database';
import { initializeSockets } from './sockets/socket.handler';
import { schedulerService } from './services/scheduler.service';
import { escalationEngineService } from './services/escalationEngine.service';
import { seedDatabase } from './scripts/seed';
import { User } from './models/User';

async function bootstrap() {
  try {
    console.log('----------------------------------------------------');
    console.log('   Starting LL LifeLink 2.0 Backend & Watchdogs     ');
    console.log('----------------------------------------------------');

    // 1. Connect Database
    await connectDatabase();

    // 2. Check if database is empty and auto-seed for demo convenience
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Bootstrap] No existing users found. Auto-seeding initial demo data...');
      await seedDatabase();
    }

    // 3. Create HTTP & Socket.IO server
    const server = http.createServer(app);
    const io = new SocketServer(server, {
      cors: {
        origin: config.clientOrigin,
        credentials: true
      }
    });

    initializeSockets(io);

    // 4. Start Reminder & Escalation Schedulers
    schedulerService.start();
    escalationEngineService.start();

    // 5. Start HTTP server
    server.listen(config.port, () => {
      console.log(`[Server] LL LifeLink API listening at: http://localhost:${config.port}`);
      console.log(`[Server] Health check: http://localhost:${config.port}/api/health`);
      console.log(`[Server] Demo accounts ready: caregiver@lifelink.com / Password123!`);
    });

    // Robust error handling to keep server resilient
    process.on('uncaughtException', (err: any) => {
      console.error('[Process] Uncaught Exception:', err?.message || err);
    });

    process.on('unhandledRejection', (reason: any) => {
      console.error('[Process] Unhandled Rejection:', reason?.message || reason);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('[Server] SIGTERM received. Shutting down gracefully...');
      schedulerService.stop();
      server.close();
    });

    process.on('SIGINT', () => {
      console.log('[Server] SIGINT received. Shutting down gracefully...');
      schedulerService.stop();
      server.close();
    });
  } catch (err: any) {
    console.error('[Server] Fatal error during startup:', err);
    process.exit(1);
  }
}

bootstrap();
