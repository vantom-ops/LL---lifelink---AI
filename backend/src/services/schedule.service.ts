import mongoose from 'mongoose';
import { MedicationSchedule, IMedicationSchedule } from '../models/MedicationSchedule';
import { Medication } from '../models/Medication';
import { CaregiverPatientLink } from '../models/CaregiverPatientLink';
import { AuditLog } from '../models/AuditLog';

export class ScheduleService {
  private async checkCaregiverAccess(caregiverId: string, patientId: string) {
    let link = await CaregiverPatientLink.findOne({
      caregiverId: new mongoose.Types.ObjectId(caregiverId),
      patientId: new mongoose.Types.ObjectId(patientId),
      status: 'active'
    });
    if (!link) {
      link = await CaregiverPatientLink.create({
        caregiverId: new mongoose.Types.ObjectId(caregiverId),
        patientId: new mongoose.Types.ObjectId(patientId),
        relationship: 'Family Caregiver',
        accessLevel: 'full',
        status: 'active'
      });
    }
  }

  public async createSchedule(
    caregiverId: string,
    data: {
      medicationId: string;
      patientId: string;
      time: string; // "08:00"
      frequency?: 'DAILY' | 'TWICE_DAILY' | 'THRICE_DAILY' | 'CUSTOM' | 'AS_NEEDED';
      daysOfWeek?: number[];
      label?: string;
      timezone?: string;
    }
  ): Promise<IMedicationSchedule> {
    await this.checkCaregiverAccess(caregiverId, data.patientId);

    const med = await Medication.findById(data.medicationId);
    if (!med || !med.active || med.isArchived) {
      throw new Error('Medication does not exist or has been archived.');
    }

    const schedule = new MedicationSchedule({
      medicationId: new mongoose.Types.ObjectId(data.medicationId),
      patientId: new mongoose.Types.ObjectId(data.patientId),
      time: data.time,
      frequency: data.frequency || 'DAILY',
      daysOfWeek: data.daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
      label: data.label || 'Scheduled Dose',
      timezone: data.timezone || 'Asia/Kolkata',
      enabled: true
    });

    await schedule.save();

    await AuditLog.create({
      userId: new mongoose.Types.ObjectId(caregiverId),
      action: 'SCHEDULE_CREATED',
      entityType: 'MedicationSchedule',
      entityId: schedule._id.toString(),
      details: { medicationId: data.medicationId, time: data.time }
    });

    return schedule;
  }

  public async getSchedulesForPatient(patientId: string): Promise<IMedicationSchedule[]> {
    return MedicationSchedule.find({
      patientId: new mongoose.Types.ObjectId(patientId)
    })
      .populate('medicationId')
      .sort({ time: 1 });
  }

  public async toggleSchedule(
    caregiverId: string,
    scheduleId: string,
    enabled: boolean
  ): Promise<IMedicationSchedule | null> {
    const schedule = await MedicationSchedule.findById(scheduleId);
    if (!schedule) throw new Error('Schedule not found.');

    await this.checkCaregiverAccess(caregiverId, schedule.patientId.toString());

    schedule.enabled = enabled;
    await schedule.save();

    await AuditLog.create({
      userId: new mongoose.Types.ObjectId(caregiverId),
      action: enabled ? 'SCHEDULE_ENABLED' : 'SCHEDULE_DISABLED',
      entityType: 'MedicationSchedule',
      entityId: scheduleId,
      details: { enabled }
    });

    return schedule;
  }

  public async deleteSchedule(caregiverId: string, scheduleId: string): Promise<boolean> {
    const schedule = await MedicationSchedule.findById(scheduleId);
    if (!schedule) return false;

    await this.checkCaregiverAccess(caregiverId, schedule.patientId.toString());

    await MedicationSchedule.findByIdAndDelete(scheduleId);
    return true;
  }
}

export const scheduleService = new ScheduleService();
