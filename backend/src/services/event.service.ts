import mongoose from 'mongoose';
import { MedicationEvent, IMedicationEvent } from '../models/MedicationEvent';
import { MedicationSchedule } from '../models/MedicationSchedule';
import { Medication } from '../models/Medication';
import { Patient } from '../models/Patient';
import { CaregiverPatientLink } from '../models/CaregiverPatientLink';
import { notificationService } from './notification.service';
import { smsService } from './sms.service';
import { MedicationEventStatus } from '../types';

export class EventService {
  /**
   * Generates or fetches today's scheduled medication events for a patient.
   * Ensures idempotency: will not recreate an event that already exists for today.
   */
  public async getOrCreateTodayEvents(patientId: string): Promise<IMedicationEvent[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const existingEvents = await MedicationEvent.find({
      patientId: new mongoose.Types.ObjectId(patientId),
      scheduledTime: { $gte: startOfDay, $lte: endOfDay }
    })
      .populate('medicationId')
      .populate('scheduleId')
      .sort({ scheduledTime: 1 });

    if (existingEvents.length > 0) {
      return existingEvents;
    }

    // Generate from active schedules
    const currentDayOfWeek = today.getDay();
    const schedules = await MedicationSchedule.find({
      patientId: new mongoose.Types.ObjectId(patientId),
      enabled: true,
      daysOfWeek: currentDayOfWeek
    }).populate('medicationId');

    const createdEvents: IMedicationEvent[] = [];

    for (const sched of schedules) {
      const med = sched.medicationId as any;
      if (!med || !med.active || med.isArchived) continue;

      const [hours, minutes] = sched.time.split(':').map(Number);
      const scheduledTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes, 0);
      const escalationDueAt = new Date(scheduledTime.getTime() + 5 * 60 * 1000); // 5 minutes after schedule

      // Determine initial status based on current time
      const now = new Date();
      let status: MedicationEventStatus = 'UPCOMING';
      if (now > escalationDueAt) {
        status = 'PENDING_CONFIRMATION';
      } else if (now >= scheduledTime) {
        status = 'DUE';
      }

      const event = new MedicationEvent({
        scheduleId: sched._id,
        medicationId: med._id,
        patientId: new mongoose.Types.ObjectId(patientId),
        scheduledTime,
        status,
        escalationDueAt,
        resendCount: 0,
        offlineQueued: false
      });

      await event.save();
      createdEvents.push(event);
    }

    // Return populated events
    return MedicationEvent.find({
      patientId: new mongoose.Types.ObjectId(patientId),
      scheduledTime: { $gte: startOfDay, $lte: endOfDay }
    })
      .populate('medicationId')
      .populate('scheduleId')
      .sort({ scheduledTime: 1 });
  }

  /**
   * Senior confirms medication as TAKEN
   */
  public async confirmMedicationTaken(
    eventId: string,
    notes?: string,
    clientTimestamp?: Date
  ): Promise<IMedicationEvent> {
    const event = await MedicationEvent.findById(eventId)
      .populate('medicationId')
      .populate('patientId');
    if (!event) throw new Error('Medication event not found.');

    const now = new Date();
    const takenTime = clientTimestamp || now;
    
    // Check if taken late (>30 minutes past scheduled time)
    const diffMinutes = (takenTime.getTime() - event.scheduledTime.getTime()) / (1000 * 60);
    const isLate = diffMinutes > 30;

    event.status = isLate ? 'LATE' : 'TAKEN';
    event.takenAt = takenTime;
    event.responseNotes = notes;
    if (clientTimestamp) event.clientTimestamp = clientTimestamp;
    await event.save();

    const med = event.medicationId as any;
    const patient = event.patientId as any;

    // Notify Caregiver via Socket.IO & notification record
    await notificationService.notifyCaregiversForPatient(
      patient._id.toString(),
      'MEDICATION_TAKEN',
      `Medication Taken: ${med?.name || 'Medicine'}`,
      `${patient?.preferredName || patient?.fullName || 'Senior'} took ${med?.name || 'dose'} at ${takenTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
      { eventId: event._id.toString(), status: event.status, takenAt: event.takenAt }
    );

    return event;
  }

  /**
   * Senior marks medication as NOT TAKEN
   */
  public async markMedicationNotTaken(
    eventId: string,
    reason?: string
  ): Promise<IMedicationEvent> {
    const event = await MedicationEvent.findById(eventId)
      .populate('medicationId')
      .populate('patientId');
    if (!event) throw new Error('Medication event not found.');

    event.status = 'NOT_TAKEN';
    event.markedNotTakenAt = new Date();
    event.responseNotes = reason || 'Marked as not taken by senior';
    await event.save();

    const med = event.medicationId as any;
    const patient = event.patientId as any;

    await notificationService.notifyCaregiversForPatient(
      patient._id.toString(),
      'PENDING_CONFIRMATION',
      `Attention: ${med?.name || 'Medicine'} was not taken`,
      `${patient?.preferredName || patient?.fullName || 'Senior'} marked ${med?.name || 'medicine'} as not taken: "${event.responseNotes}"`,
      { eventId: event._id.toString(), status: 'NOT_TAKEN' }
    );

    return event;
  }

  /**
   * Caregiver resends reminder to senior's phone
   */
  public async resendReminder(
    caregiverId: string,
    eventId: string
  ): Promise<IMedicationEvent> {
    const event = await MedicationEvent.findById(eventId)
      .populate('medicationId')
      .populate('patientId');
    if (!event) throw new Error('Medication event not found.');

    event.resendCount += 1;
    event.lastResentAt = new Date();
    // Extend escalation by another 5 minutes
    event.escalationDueAt = new Date(Date.now() + 5 * 60 * 1000);
    await event.save();

    const med = event.medicationId as any;
    const patient = event.patientId as any;

    // Send push reminder to senior phone + realtime socket
    await notificationService.notifySenior(
      patient._id.toString(),
      'MEDICATION_DUE',
      `Reminder: Time for your ${med?.name || 'medicine'}!`,
      `Your caregiver sent a reminder for ${med?.name || 'medicine'} (${med?.dose || ''}). Please check and confirm.`,
      { eventId: event._id.toString(), resendCount: event.resendCount }
    );

    return event;
  }

  /**
   * Synchronize queued offline events from mobile without creating duplicates
   */
  public async syncOfflineQueue(
    patientId: string,
    queuedEvents: Array<{
      eventId: string;
      status: MedicationEventStatus;
      clientTimestamp: string;
      responseNotes?: string;
    }>
  ): Promise<{ syncedCount: number; results: any[] }> {
    let syncedCount = 0;
    const results = [];

    for (const item of queuedEvents) {
      const event = await MedicationEvent.findOne({
        _id: item.eventId,
        patientId: new mongoose.Types.ObjectId(patientId)
      });

      if (!event) continue;

      // Duplicate prevention: if already TAKEN or marked, don't overwrite with older offline data
      if (['TAKEN', 'LATE'].includes(event.status)) {
        results.push({ eventId: item.eventId, status: event.status, skipped: true });
        continue;
      }

      event.status = item.status;
      event.clientTimestamp = new Date(item.clientTimestamp);
      event.takenAt = item.status === 'TAKEN' ? event.clientTimestamp : undefined;
      event.responseNotes = item.responseNotes;
      event.offlineQueued = true;
      event.syncedAt = new Date();
      await event.save();

      syncedCount++;
      results.push({ eventId: item.eventId, status: event.status, synced: true });
    }

    return { syncedCount, results };
  }

  /**
   * Process 5-minute timeout escalation for unconfirmed medications
   */
  public async processEscalations(): Promise<number> {
    const now = new Date();
    const overdueEvents = await MedicationEvent.find({
      status: { $in: ['UPCOMING', 'DUE'] },
      escalationDueAt: { $lte: now }
    })
      .populate('medicationId')
      .populate('patientId');

    let count = 0;
    for (const event of overdueEvents) {
      event.status = 'PENDING_CONFIRMATION';
      event.caregiverAlertSentAt = now;
      await event.save();

      const med = event.medicationId as any;
      const patient = event.patientId as any;

      if (patient) {
        // Send alert to caregiver
        await notificationService.notifyCaregiversForPatient(
          patient._id.toString(),
          'PENDING_CONFIRMATION',
          `Alert: No response for ${med?.name || 'Medication'} (5 min passed)`,
          `${patient.preferredName || patient.fullName} has not confirmed taking ${med?.name || 'their medicine'} scheduled at ${event.scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
          {
            eventId: event._id.toString(),
            patientId: patient._id.toString(),
            medicationName: med?.name,
            scheduledTime: event.scheduledTime
          }
        );

        // SMS fallback if caregiver has phone configured
        if (patient.emergencyContactPhone) {
          await smsService.sendAlert(
            patient.emergencyContactPhone,
            `LL LifeLink Alert: ${patient.preferredName || patient.fullName} has not confirmed ${med?.name || 'medicine'} within 5 minutes. Please check the dashboard or call them.`
          );
        }
      }

      count++;
    }

    return count;
  }
}

export const eventService = new EventService();
