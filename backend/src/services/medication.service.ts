import mongoose from 'mongoose';
import { Medication, IMedication } from '../models/Medication';
import { MedicationSchedule } from '../models/MedicationSchedule';
import { AuditLog } from '../models/AuditLog';
import { CaregiverPatientLink } from '../models/CaregiverPatientLink';

export class MedicationService {
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

  public async createMedication(
    caregiverId: string,
    data: {
      patientId: string;
      name: string;
      genericName?: string;
      dose: string;
      unit: string;
      form?: string;
      instructions?: string;
      foodRelation: 'BEFORE_MEAL' | 'AFTER_MEAL' | 'WITH_MEAL' | 'EMPTY_STOMACH' | 'NO_RESTRICTION';
      imageUrl?: string;
      sourcePrescriptionId?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<IMedication> {
    await this.checkCaregiverAccess(caregiverId, data.patientId);

    const medication = new Medication({
      patientId: new mongoose.Types.ObjectId(data.patientId),
      name: data.name,
      genericName: data.genericName,
      dose: data.dose,
      unit: data.unit || 'tablet',
      form: data.form || 'Tablet',
      instructions: data.instructions,
      foodRelation: data.foodRelation,
      imageUrl: data.imageUrl,
      sourcePrescriptionId: data.sourcePrescriptionId
        ? new mongoose.Types.ObjectId(data.sourcePrescriptionId)
        : undefined,
      startDate: data.startDate || new Date(),
      endDate: data.endDate,
      active: true,
      isArchived: false
    });

    await medication.save();

    await AuditLog.create({
      userId: new mongoose.Types.ObjectId(caregiverId),
      action: 'MEDICATION_CREATED',
      entityType: 'Medication',
      entityId: medication._id.toString(),
      details: { name: medication.name, dose: medication.dose, patientId: data.patientId }
    });

    return medication;
  }

  public async updateMedication(
    caregiverId: string,
    medicationId: string,
    updates: Partial<IMedication>
  ): Promise<IMedication | null> {
    const existing = await Medication.findById(medicationId);
    if (!existing) throw new Error('Medication not found.');

    await this.checkCaregiverAccess(caregiverId, existing.patientId.toString());

    const updated = await Medication.findByIdAndUpdate(
      medicationId,
      { $set: updates },
      { new: true }
    );

    await AuditLog.create({
      userId: new mongoose.Types.ObjectId(caregiverId),
      action: 'MEDICATION_UPDATED',
      entityType: 'Medication',
      entityId: medicationId,
      details: updates
    });

    return updated;
  }

  public async archiveMedication(
    caregiverId: string,
    medicationId: string,
    reason?: string
  ): Promise<IMedication | null> {
    const existing = await Medication.findById(medicationId);
    if (!existing) throw new Error('Medication not found.');

    await this.checkCaregiverAccess(caregiverId, existing.patientId.toString());

    // Deactivate schedules but preserve historical events
    await MedicationSchedule.updateMany(
      { medicationId: existing._id },
      { enabled: false }
    );

    const updated = await Medication.findByIdAndUpdate(
      medicationId,
      {
        $set: {
          active: false,
          isArchived: true,
          archivedAt: new Date(),
          archivedReason: reason || 'Archived by caregiver'
        }
      },
      { new: true }
    );

    await AuditLog.create({
      userId: new mongoose.Types.ObjectId(caregiverId),
      action: 'MEDICATION_ARCHIVED',
      entityType: 'Medication',
      entityId: medicationId,
      details: { reason }
    });

    return updated;
  }

  public async getMedicationsForPatient(
    patientId: string,
    includeArchived: boolean = false
  ): Promise<IMedication[]> {
    const filter: any = { patientId: new mongoose.Types.ObjectId(patientId) };
    if (!includeArchived) {
      filter.isArchived = false;
      filter.active = true;
    }
    return Medication.find(filter).sort({ createdAt: -1 });
  }

  public async getMedicationById(medicationId: string): Promise<IMedication | null> {
    return Medication.findById(medicationId);
  }
}

export const medicationService = new MedicationService();
