import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { config } from './env';

let mongod: MongoMemoryServer | null = null;

export async function connectDatabase(): Promise<typeof mongoose> {
  const uri = config.mongodbUri;

  if (uri === 'memory') {
    console.log('[Database] Starting in-memory MongoDB server...');
    mongod = await MongoMemoryServer.create();
    const memoryUri = mongod.getUri();
    console.log(`[Database] In-memory MongoDB started at: ${memoryUri}`);
    return await mongoose.connect(memoryUri);
  }

  try {
    console.log(`[Database] Attempting connection to MongoDB at: ${uri}`);
    // Connect with a short timeout so we can gracefully fallback to memory-server if mongod is not running
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log('[Database] Successfully connected to MongoDB.');
    return mongoose;
  } catch (err: any) {
    console.warn(`[Database] Failed to connect to MongoDB (${err.message}).`);
    console.log('[Database] Starting fallback in-memory MongoDB server for seamless demo and local execution...');
    try {
      mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();
      console.log(`[Database] In-memory MongoDB running at: ${memoryUri}`);
      return await mongoose.connect(memoryUri);
    } catch (memErr: any) {
      console.error('[Database] Fatal: could not start in-memory Mongo either.', memErr);
      throw memErr;
    }
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongod) {
    await mongod.stop();
  }
}
