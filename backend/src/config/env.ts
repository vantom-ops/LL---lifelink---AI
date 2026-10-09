import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ll-lifelink',
  jwtSecret: process.env.JWT_SECRET || 'll-lifelink-super-secret-jwt-key-2026',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'll-lifelink-super-secret-refresh-key-2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  
  // Storage
  storageProvider: process.env.STORAGE_PROVIDER || 'local',
  storageBucket: process.env.STORAGE_BUCKET || 'lifelink-storage',
  uploadDir: process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads'),
  
  // Firebase
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || '',
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
  firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY || '',
  
  // Twilio / SMS
  smsProvider: process.env.SMS_PROVIDER || 'dev-logger',
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
  
  // AI Provider (Gemini / Mock fallback)
  aiProvider: process.env.AI_PROVIDER || 'gemini',
  aiApiKey: process.env.AI_API_KEY || process.env.GEMINI_API_KEY || '',
  
  // CORS
  clientOrigin: process.env.CLIENT_ORIGIN || '*'
};
