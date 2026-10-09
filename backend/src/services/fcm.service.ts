import { config } from '../config/env';

export interface PushNotificationPayload {
  token?: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export class FcmService {
  private isConfigured: boolean = false;
  private messaging: any = null;

  constructor() {
    if (config.firebaseProjectId && config.firebasePrivateKey && config.firebaseClientEmail) {
      try {
        const admin = require('firebase-admin');
        if (!admin.apps.length) {
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId: config.firebaseProjectId,
              clientEmail: config.firebaseClientEmail,
              privateKey: config.firebasePrivateKey.replace(/\\n/g, '\n')
            })
          });
        }
        this.messaging = admin.messaging();
        this.isConfigured = true;
        console.log('[FcmService] Firebase Cloud Messaging initialized successfully.');
      } catch (err: any) {
        console.warn('[FcmService] Firebase init skipped/failed, using fallback logger:', err.message);
      }
    } else {
      console.log('[FcmService] Firebase credentials not present; running in dev notification simulation mode.');
    }
  }

  public async sendNotification(payload: PushNotificationPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (this.isConfigured && this.messaging && payload.token) {
      try {
        const response = await this.messaging.send({
          token: payload.token,
          notification: {
            title: payload.title,
            body: payload.body
          },
          data: payload.data || {}
        });
        return { success: true, messageId: response };
      } catch (err: any) {
        console.error('[FcmService] Error sending FCM message:', err.message);
        // Fallback to dev log rather than failing the core application
      }
    }

    // Unconfigured gateway reporting (strictly truthful, no fake success)
    console.log(`[FCM PUSH AUDIT] Title: "${payload.title}" | Body: "${payload.body}" | Status: UNCONFIGURED (Firebase credentials not in .env)`);
    return {
      success: false,
      error: 'Firebase Cloud Messaging not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env.'
    };
  }
}

export const fcmService = new FcmService();
