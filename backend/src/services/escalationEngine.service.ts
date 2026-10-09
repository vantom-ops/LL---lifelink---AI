import { AssistanceRequest } from '../models/AssistanceRequest';
import { assistanceService } from './assistance.service';

export interface EscalationConfig {
  primaryCaregiverTimeoutMinutes: number;
  trustedContactTimeoutMinutes: number;
  professionalResponseTimeoutMinutes: number;
  enableProfessionalEscalation: boolean;
  maxServiceRadiusKm: number;
}

export class EscalationEngineService {
  private config: EscalationConfig = {
    primaryCaregiverTimeoutMinutes: 5,
    trustedContactTimeoutMinutes: 5,
    professionalResponseTimeoutMinutes: 3,
    enableProfessionalEscalation: true,
    maxServiceRadiusKm: 15
  };

  private timer: NodeJS.Timeout | null = null;

  public getConfig(): EscalationConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<EscalationConfig>): EscalationConfig {
    this.config = { ...this.config, ...newConfig };
    console.log('[EscalationEngine] Escalation timeouts updated:', this.config);
    return { ...this.config };
  }

  /**
   * Start recurring watchdog interval
   */
  public start(): void {
    if (this.timer) clearInterval(this.timer);
    console.log('[EscalationEngine] Starting Phase 2 Disability Assistance Escalation Watchdog...');
    this.timer = setInterval(() => {
      this.checkTimeouts().catch(err => {
        console.error('[EscalationEngine] Error in timeout watchdog:', err.message);
      });
    }, 15000); // Check every 15 seconds
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Check for expired escalation stages
   */
  public async checkTimeouts(): Promise<number> {
    const now = Date.now();
    let escalatedCount = 0;

    // 1. Primary Caregiver Timeout
    const primaryCutoff = new Date(now - this.config.primaryCaregiverTimeoutMinutes * 60 * 1000);
    const expiredPrimary = await AssistanceRequest.find({
      status: 'PRIMARY_CAREGIVER_ALERTED',
      createdAt: { $lte: primaryCutoff }
    });

    for (const req of expiredPrimary) {
      console.log(`[EscalationEngine] Primary caregiver timed out for request ${req._id}. Advancing to Care Circle contacts...`);
      await assistanceService.advanceEscalation(req);
      escalatedCount++;
    }

    // 2. Trusted Contact Timeout
    const trustedCutoff = new Date(now - this.config.trustedContactTimeoutMinutes * 60 * 1000);
    const expiredTrusted = await AssistanceRequest.find({
      status: 'ALTERNATIVE_CONTACTS_ALERTED',
      updatedAt: { $lte: trustedCutoff }
    });

    for (const req of expiredTrusted) {
      console.log(`[EscalationEngine] Trusted contacts timed out for request ${req._id}. Advancing to Professional Search...`);
      await assistanceService.advanceEscalation(req);
      escalatedCount++;
    }

    return escalatedCount;
  }

  /**
   * Fast-forward / manual test trigger to immediately escalate a request without waiting
   */
  public async forceAdvance(requestId: string): Promise<any> {
    const request = await AssistanceRequest.findById(requestId);
    if (!request) throw new Error('Request not found');
    return assistanceService.advanceEscalation(request);
  }
}

export const escalationEngineService = new EscalationEngineService();
