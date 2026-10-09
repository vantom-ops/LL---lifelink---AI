import mongoose from 'mongoose';
import { Patient, IPatient } from '../models/Patient';
import { CaregiverPatientLink } from '../models/CaregiverPatientLink';
import { VoicePreference } from '../models/VoicePreference';
import { AuditLog } from '../models/AuditLog';

export class PatientService {
  public async createPatient(
    caregiverId: string,
    data: {
      fullName: string;
      preferredName?: string;
      age: number;
      gender?: string;
      bloodGroup?: string;
      emergencyContactName: string;
      emergencyContactPhone: string;
      address?: string;
      medicalNotes?: string;
      languagePreference?: 'English' | 'Tamil' | 'Tanglish' | 'Hindi' | 'Telugu';
      voiceSpeed?: number;
      fontSizePreference?: 'normal' | 'large' | 'extra-large';
      relationship?: string;
    }
  ): Promise<IPatient> {
    const patient = new Patient({
      fullName: data.fullName,
      preferredName: data.preferredName || data.fullName,
      age: data.age,
      gender: data.gender,
      bloodGroup: data.bloodGroup,
      emergencyContactName: data.emergencyContactName,
      emergencyContactPhone: data.emergencyContactPhone,
      address: data.address,
      medicalNotes: data.medicalNotes,
      languagePreference: data.languagePreference || 'English',
      voiceSpeed: data.voiceSpeed || 0.9,
      fontSizePreference: data.fontSizePreference || 'large',
      createdCaregiverId: new mongoose.Types.ObjectId(caregiverId),
      isActive: true
    });

    await patient.save();

    // Link caregiver to patient
    await CaregiverPatientLink.create({
      caregiverId: new mongoose.Types.ObjectId(caregiverId),
      patientId: patient._id,
      relationship: data.relationship || 'Primary Caregiver',
      isPrimary: true,
      status: 'active'
    });

    // Create default voice preferences
    await VoicePreference.create({
      patientId: patient._id,
      language: data.languagePreference || 'English',
      voiceSpeed: data.voiceSpeed || 0.9,
      voicePitch: 1.0,
      customGreeting: `Good morning ${patient.preferredName || patient.fullName}`
    });

    await AuditLog.create({
      userId: new mongoose.Types.ObjectId(caregiverId),
      action: 'PATIENT_CREATED',
      entityType: 'Patient',
      entityId: patient._id.toString(),
      details: { fullName: patient.fullName, age: patient.age }
    });

    return patient;
  }

  public async getPatientsForCaregiver(caregiverId: string): Promise<IPatient[]> {
    let links = await CaregiverPatientLink.find({
      caregiverId: new mongoose.Types.ObjectId(caregiverId),
      status: 'active'
    });

    // Auto-link registered family caregivers so they immediately have senior access
    if (links.length === 0) {
      const allActive = await Patient.find({ isActive: true });
      for (const p of allActive) {
        await CaregiverPatientLink.create({
          caregiverId: new mongoose.Types.ObjectId(caregiverId),
          patientId: p._id,
          relationship: 'Family Caregiver',
          accessLevel: 'full',
          status: 'active'
        });
      }
      links = await CaregiverPatientLink.find({
        caregiverId: new mongoose.Types.ObjectId(caregiverId),
        status: 'active'
      });
    }

    const patientIds = links.map(l => l.patientId);

    return Patient.find({
      _id: { $in: patientIds },
      isActive: true
    }).sort({ createdAt: -1 });
  }

  public async getPatientById(patientId: string, caregiverId?: string): Promise<IPatient | null> {
    const patient = await Patient.findById(patientId);
    if (!patient || !patient.isActive) return null;

    if (caregiverId) {
      const link = await CaregiverPatientLink.findOne({
        caregiverId: new mongoose.Types.ObjectId(caregiverId),
        patientId: patient._id,
        status: 'active'
      });
      if (!link) {
        throw new Error('Access denied: You are not authorized to view this patient.');
      }
    }

    return patient;
  }

  public async updatePatient(
    patientId: string,
    actorUserId: string,
    updates: Partial<IPatient>,
    actorRole: 'CAREGIVER' | 'SENIOR' = 'CAREGIVER'
  ): Promise<IPatient | null> {
    const existing = await Patient.findById(patientId);
    if (!existing || !existing.isActive) {
      throw new Error('Patient not found');
    }

    const updated = await Patient.findByIdAndUpdate(
      patientId,
      { $set: updates },
      { new: true }
    );

    await AuditLog.create({
      actorUserId: new mongoose.Types.ObjectId(actorUserId),
      actorRole,
      patientId: new mongoose.Types.ObjectId(patientId),
      action: 'PATIENT_UPDATED',
      resourceType: 'Patient',
      resourceId: patientId,
      success: true,
      metadata: { updates }
    });

    return updated;
  }

  public async getHealthCondition(patientId: string) {
    const patient = await Patient.findById(patientId);
    if (!patient || !patient.isActive) {
      throw new Error('Patient not found');
    }

    return {
      mobilityStatus: patient.mobilityStatus,
      visionStatus: patient.visionStatus,
      hearingStatus: patient.hearingStatus,
      communicationPreference: patient.communicationPreference,
      knownAllergies: patient.knownAllergies || [],
      importantHealthConditions: patient.importantHealthConditions || [],
      dietaryRestrictions: patient.dietaryRestrictions || [],
      bloodGroup: patient.bloodGroup,
      specialCareNotes: patient.specialCareNotes || patient.medicalNotes,
      updatedAt: patient.updatedAt
    };
  }

  public async updateHealthCondition(
    patientId: string,
    actorUserId: string,
    actorRole: 'CAREGIVER' | 'SENIOR' = 'CAREGIVER',
    healthData: {
      mobilityStatus?: string;
      visionStatus?: string;
      hearingStatus?: string;
      communicationPreference?: string;
      knownAllergies?: string[];
      importantHealthConditions?: string[];
      dietaryRestrictions?: string[];
      bloodGroup?: string;
      specialCareNotes?: string;
    }
  ) {
    const existing = await Patient.findById(patientId);
    if (!existing || !existing.isActive) {
      throw new Error('Patient not found');
    }

    const previousValues = {
      mobilityStatus: existing.mobilityStatus,
      visionStatus: existing.visionStatus,
      hearingStatus: existing.hearingStatus,
      communicationPreference: existing.communicationPreference,
      knownAllergies: existing.knownAllergies,
      importantHealthConditions: existing.importantHealthConditions,
      dietaryRestrictions: existing.dietaryRestrictions,
      bloodGroup: existing.bloodGroup,
      specialCareNotes: existing.specialCareNotes
    };

    const updateFields: any = {};
    if (healthData.mobilityStatus !== undefined) updateFields.mobilityStatus = healthData.mobilityStatus;
    if (healthData.visionStatus !== undefined) updateFields.visionStatus = healthData.visionStatus;
    if (healthData.hearingStatus !== undefined) updateFields.hearingStatus = healthData.hearingStatus;
    if (healthData.communicationPreference !== undefined) updateFields.communicationPreference = healthData.communicationPreference;
    if (healthData.knownAllergies !== undefined) updateFields.knownAllergies = healthData.knownAllergies;
    if (healthData.importantHealthConditions !== undefined) updateFields.importantHealthConditions = healthData.importantHealthConditions;
    if (healthData.dietaryRestrictions !== undefined) updateFields.dietaryRestrictions = healthData.dietaryRestrictions;
    if (healthData.bloodGroup !== undefined) updateFields.bloodGroup = healthData.bloodGroup;
    if (healthData.specialCareNotes !== undefined) updateFields.specialCareNotes = healthData.specialCareNotes;

    const updated = await Patient.findByIdAndUpdate(
      patientId,
      { $set: updateFields },
      { new: true }
    );

    // Record previous and new values in audit history
    await AuditLog.create({
      actorUserId: new mongoose.Types.ObjectId(actorUserId),
      actorRole,
      patientId: existing._id,
      action: 'HEALTH_CONDITION_UPDATED',
      resourceType: 'HealthCondition',
      resourceId: patientId,
      success: true,
      metadata: {
        previous: previousValues,
        newValues: updateFields
      }
    });

    return {
      mobilityStatus: updated!.mobilityStatus,
      visionStatus: updated!.visionStatus,
      hearingStatus: updated!.hearingStatus,
      communicationPreference: updated!.communicationPreference,
      knownAllergies: updated!.knownAllergies,
      importantHealthConditions: updated!.importantHealthConditions,
      dietaryRestrictions: updated!.dietaryRestrictions,
      bloodGroup: updated!.bloodGroup,
      specialCareNotes: updated!.specialCareNotes,
      updatedAt: updated!.updatedAt
    };
  }
}

export const patientService = new PatientService();

