import mongoose from 'mongoose';
import { Prescription, IPrescription } from '../models/Prescription';
import { Medication } from '../models/Medication';
import { MedicationSchedule } from '../models/MedicationSchedule';
import { MedicationEvent } from '../models/MedicationEvent';
import { notificationService } from './notification.service';
import { ocrService } from './ocr.service';
import { aiService } from './ai.service';
import { AuditLog } from '../models/AuditLog';
import { ExtractedMedicationCandidate } from '../types';

export class PrescriptionService {
  /**
   * Upload prescription, execute OCR and AI parsing, store candidates for review.
   * DOES NOT automatically schedule medications (strict safety rule!).
   */
  public async uploadAndProcessPrescription(
    caregiverId: string,
    patientId: string,
    fileBuffer: Buffer,
    originalFileName: string,
    fileUrl: string
  ): Promise<IPrescription> {
    // 1. Run OCR
    const ocrResult = await ocrService.extractFromBuffer(fileBuffer, originalFileName);

    // 2. Create Prescription in PENDING_REVIEW status
    const prescription = new Prescription({
      patientId: new mongoose.Types.ObjectId(patientId),
      uploadedBy: new mongoose.Types.ObjectId(caregiverId),
      fileUrl,
      originalFileName,
      ocrRawText: ocrResult.rawText,
      extractedMedications: ocrResult.candidates,
      doctorName: ocrResult.doctorName,
      hospitalName: ocrResult.hospitalName,
      prescriptionDate: ocrResult.prescriptionDate,
      verificationStatus: 'PENDING_REVIEW'
    });

    await prescription.save();

    await AuditLog.create({
      userId: new mongoose.Types.ObjectId(caregiverId),
      action: 'PRESCRIPTION_UPLOADED_FOR_REVIEW',
      entityType: 'Prescription',
      entityId: prescription._id.toString(),
      details: {
        originalFileName,
        candidateCount: ocrResult.candidates.length,
        status: 'PENDING_REVIEW'
      }
    });

    return prescription;
  }

  /**
   * Caregiver reviews, corrects, and confirms verified medications.
   * Only upon caregiver confirmation do we create real active Medication records and Schedules.
   */
  public async verifyAndActivatePrescription(
    caregiverId: string,
    prescriptionId: string,
    confirmedMedications: Array<{
      name: string;
      genericName?: string;
      dose: string;
      unit: string;
      form?: string;
      instructions?: string;
      foodRelation: 'BEFORE_MEAL' | 'AFTER_MEAL' | 'WITH_MEAL' | 'EMPTY_STOMACH' | 'NO_RESTRICTION';
      schedules: Array<{
        time: string; // "08:00"
        frequency?: 'DAILY' | 'TWICE_DAILY' | 'THRICE_DAILY' | 'CUSTOM' | 'AS_NEEDED';
        label?: string;
      }>;
    }>
  ): Promise<{ prescription: IPrescription; createdMedications: any[] }> {
    const prescription = await Prescription.findById(prescriptionId);
    if (!prescription) throw new Error('Prescription not found.');

    const createdMedications = [];

    // Create real active medication records from verified list
    for (const item of confirmedMedications) {
      const medication = new Medication({
        patientId: prescription.patientId,
        name: item.name,
        genericName: item.genericName,
        dose: item.dose,
        unit: item.unit || 'tablet',
        form: item.form || 'Tablet',
        instructions: item.instructions,
        foodRelation: item.foodRelation || 'AFTER_MEAL',
        sourcePrescriptionId: prescription._id,
        startDate: new Date(),
        active: true,
        isArchived: false
      });
      await medication.save();

      // Create requested schedules
      if (item.schedules && item.schedules.length > 0) {
        for (const s of item.schedules) {
          const schedule = new MedicationSchedule({
            medicationId: medication._id,
            patientId: prescription.patientId,
            time: s.time,
            frequency: s.frequency || 'DAILY',
            daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
            label: s.label || 'Prescribed Dose',
            enabled: true
          });
          await schedule.save();

          // Automatically generate today's live MedicationEvent so senior and caregiver see it immediately
          const todayEvent = new MedicationEvent({
            scheduleId: schedule._id,
            medicationId: medication._id,
            patientId: prescription.patientId,
            scheduledTime: new Date(),
            status: 'DUE',
            reminderSentAt: new Date(),
            escalationDueAt: new Date(Date.now() + 5 * 60 * 1000)
          });
          await todayEvent.save();

          // Dispatch immediate reminder to senior's screen
          await notificationService.notifySenior(
            prescription.patientId.toString(),
            'MEDICATION_DUE',
            `New Prescribed Medicine: ${medication.name}`,
            `Please take ${medication.name} (${medication.dose} ${medication.unit}). ${medication.instructions || 'After food'}.`,
            { eventId: todayEvent._id.toString(), medicationName: medication.name, dose: medication.dose }
          );
        }
      } else {
        // Default morning schedule if none specified
        const defaultSchedule = new MedicationSchedule({
          medicationId: medication._id,
          patientId: prescription.patientId,
          time: '08:00',
          frequency: 'DAILY',
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          label: 'Morning Dose',
          enabled: true
        });
        await defaultSchedule.save();

        const todayEvent = new MedicationEvent({
          scheduleId: defaultSchedule._id,
          medicationId: medication._id,
          patientId: prescription.patientId,
          scheduledTime: new Date(),
          status: 'DUE',
          reminderSentAt: new Date(),
          escalationDueAt: new Date(Date.now() + 5 * 60 * 1000)
        });
        await todayEvent.save();

        await notificationService.notifySenior(
          prescription.patientId.toString(),
          'MEDICATION_DUE',
          `New Prescribed Medicine: ${medication.name}`,
          `Please take ${medication.name} (${medication.dose} ${medication.unit}).`,
          { eventId: todayEvent._id.toString(), medicationName: medication.name, dose: medication.dose }
        );
      }

      createdMedications.push(medication);
    }

    prescription.verificationStatus = 'VERIFIED';
    prescription.verifiedAt = new Date();
    prescription.verifiedBy = new mongoose.Types.ObjectId(caregiverId);
    await prescription.save();

    await AuditLog.create({
      userId: new mongoose.Types.ObjectId(caregiverId),
      action: 'PRESCRIPTION_VERIFIED_AND_ACTIVATED',
      entityType: 'Prescription',
      entityId: prescription._id.toString(),
      details: {
        activatedCount: createdMedications.length
      }
    });

    return { prescription, createdMedications };
  }

  public async getPrescriptionsForPatient(patientId: string): Promise<IPrescription[]> {
    return Prescription.find({
      patientId: new mongoose.Types.ObjectId(patientId)
    }).sort({ createdAt: -1 });
  }

  public async getPrescriptionById(prescriptionId: string): Promise<IPrescription | null> {
    return Prescription.findById(prescriptionId);
  }
}

export const prescriptionService = new PrescriptionService();
