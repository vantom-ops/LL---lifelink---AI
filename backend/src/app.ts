import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import routes from './routes';
import { errorHandler } from './middleware/error.middleware';
import { config } from './config/env';

export const app = express();

// Security and CORS
app.use(
  helmet({
    crossOriginResourcePolicy: false // Allow loading images/files in frontend
  })
);
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin) return callback(null, true);
      // Allow any localhost port (e.g. 3000, 8080, 5000, etc.) or 127.0.0.1
      if (
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin === config.clientOrigin
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Dev-friendly permissive CORS
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Body parsers
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static uploads directory (for images and documents)
app.use('/uploads', express.static(config.uploadDir));

// Mount API routes
app.use('/api', routes);

// Central error handler
app.use(errorHandler);
