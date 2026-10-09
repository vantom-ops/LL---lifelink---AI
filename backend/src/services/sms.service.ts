import { config } from '../config/env';

export interface ISmsProvider {
  sendSms(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

class TwilioSmsProvider implements ISmsProvider {
  private client: any;

  constructor() {
    if (config.twilioAccountSid && config.twilioAuthToken) {
      try {
        const twilio = require('twilio');
        this.client = twilio(config.twilioAccountSid, config.twilioAuthToken);
      } catch (err) {
        console.warn('[TwilioSmsProvider] Twilio module not initialized:', err);
      }
    }
  }

  async sendSms(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.client || !config.twilioPhoneNumber) {
      return { success: false, error: 'Twilio credentials or sender phone number not configured' };
    }
    try {
      const res = await this.client.messages.create({
        body: message,
        from: config.twilioPhoneNumber,
        to
      });
      return { success: true, messageId: res.sid };
    } catch (err: any) {
      console.error('[TwilioSmsProvider] Failed to send SMS:', err.message);
      return { success: false, error: err.message };
    }
  }
}

class DevLoggerSmsProvider implements ISmsProvider {
  async sendSms(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    console.log(`\n======================================================`);
    console.log(`[SMS AUDIT DISPATCH] To: ${to}`);
    console.log(`[SMS AUDIT DISPATCH] Message:\n${message}`);
    console.log(`[SMS AUDIT DISPATCH] Provider: Dev Logger (Logged to audit trail & console)`);
    console.log(`======================================================\n`);
    return {
      success: true,
      messageId: `dev-sms-${Date.now()}`
    };
  }
}

export class SmsService {
  private provider: ISmsProvider;

  constructor() {
    if (config.smsProvider === 'twilio' && config.twilioAccountSid && config.twilioAuthToken) {
      this.provider = new TwilioSmsProvider();
    } else {
      this.provider = new DevLoggerSmsProvider();
    }
  }

  public async sendAlert(to: string, message: string): Promise<{ success: boolean; messageId?: string }> {
    return this.provider.sendSms(to, message);
  }
}

export const smsService = new SmsService();
