import cron from 'node-cron';
import { eventService } from './event.service';
import { MedicationSchedule } from '../models/MedicationSchedule';
import { MedicationEvent } from '../models/MedicationEvent';
import { notificationService } from './notification.service';
import mongoose from 'mongoose';

export class SchedulerService {
  private cronJob: cron.ScheduledTask | null = null;
  private intervalTimer: NodeJS.Timeout | null = null;

  public start() {
    console.log('[SchedulerService] Starting LL LifeLink Medication & Escalation Engine...');

    // Run every minute: check for due reminders and process 5-minute escalations
    this.cronJob = cron.schedule('* * * * *', async () => {
      await this.runTick();
    });

    // Also run a short 30-second interval check for responsive local testing
    this.intervalTimer = setInterval(async () => {
      await this.checkEscalations();
    }, 30000);
  }

  public stop() {
    if (this.cronJob) this.cronJob.stop();
    if (this.intervalTimer) clearInterval(this.intervalTimer);
    console.log('[SchedulerService] Stopped.');
  }

  public async runTick() {
    try {
      await this.checkDueReminders();
      await this.checkEscalations();
    } catch (err: any) {
      console.error('[SchedulerService] Error in tick:', err.message);
    }
  }

  private async checkDueReminders() {
    const now = new Date();
    const currentHours = now.getHours().toString().padStart(2, '0');
    const currentMinutes = now.getMinutes().toString().padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMinutes}`;
    const dayOfWeek = now.getDay();

    // Find schedules matching current minute
    const activeSchedules = await MedicationSchedule.find({
      time: currentTimeStr,
      enabled: true,
      daysOfWeek: dayOfWeek
    }).populate('medicationId');

    for (const sched of activeSchedules) {
      const med = sched.medicationId as any;
      if (!med || !med.active || med.isArchived) continue;

      // Check if event already created for today
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      let event = await MedicationEvent.findOne({
        scheduleId: sched._id,
        scheduledTime: { $gte: startOfDay, $lte: endOfDay }
      });

      if (!event) {
        event = new MedicationEvent({
          scheduleId: sched._id,
          medicationId: med._id,
          patientId: sched.patientId,
          scheduledTime: now,
          status: 'DUE',
          reminderSentAt: now,
          escalationDueAt: new Date(now.getTime() + 5 * 60 * 1000)
        });
        await event.save();
      } else if (event.status === 'UPCOMING') {
        event.status = 'DUE';
        event.reminderSentAt = now;
        event.escalationDueAt = new Date(now.getTime() + 5 * 60 * 1000);
        await event.save();
      }

      // Notify senior device
      await notificationService.notifySenior(
        sched.patientId.toString(),
        'MEDICATION_DUE',
        `Time for Medicine: ${med.name}`,
        `Please take ${med.name} (${med.dose} ${med.unit}). Instructions: ${med.foodRelation || 'After food'}.`,
        { eventId: event._id.toString(), medicationName: med.name, dose: med.dose }
      );
    }
  }

  public async checkEscalations(): Promise<number> {
    return eventService.processEscalations();
  }

  /**
   * Demo Simulation Feature:
   * Fast-forward / simulate 5-minute timeout on all DUE / UPCOMING events immediately
   * without having to wait 5 minutes!
   */
  public async simulateFiveMinuteTimeout(patientId?: string): Promise<{ escalatedCount: number; events: any[] }> {
    const filter: any = { status: { $in: ['UPCOMING', 'DUE'] } };
    if (patientId) {
      filter.patientId = new mongoose.Types.ObjectId(patientId);
    }

    const events = await MedicationEvent.find(filter)
      .populate('medicationId')
      .populate('patientId');

    const updated = [];
    const now = new Date();

    for (const ev of events) {
      ev.status = 'PENDING_CONFIRMATION';
      ev.caregiverAlertSentAt = now;
      await ev.save();

      const med = ev.medicationId as any;
      const patient = ev.patientId as any;

      if (patient) {
        await notificationService.notifyCaregiversForPatient(
          patient._id.toString(),
          'PENDING_CONFIRMATION',
          `Escalation Alert: No Response for ${med?.name || 'Medicine'}`,
          `${patient.preferredName || patient.fullName} has not confirmed taking ${med?.name || 'their medicine'}. Caregiver escalation triggered.`,
          {
            eventId: ev._id.toString(),
            patientId: patient._id.toString(),
            medicationName: med?.name
          }
        );
      }
      updated.push(ev);
    }

    return { escalatedCount: updated.length, events: updated };
  }
}

export const schedulerService = new SchedulerService();
