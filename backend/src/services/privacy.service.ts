import mongoose from 'mongoose';
import { PrivacySettings, IPrivacySettings } from '../models/PrivacySettings';
import { AuditLog } from '../models/AuditLog';

export class PrivacyService {
  /**
   * Retrieves or creates default privacy settings for a senior
   */
  public async getPrivacySettings(patientId: string): Promise<IPrivacySettings> {
    let settings = await PrivacySettings.findOne({
      patientId: new mongoose.Types.ObjectId(patientId)
    });

    if (!settings) {
      settings = await PrivacySettings.create({
        patientId: new mongoose.Types.ObjectId(patientId),
        allowDoctorAccess: true,
        allowMedicationAccess: true,
        allowHealthConditionAccess: true,
        allowPrescriptionAccess: true,
        allowDocumentMetadataAccess: true,
        allowDocumentPreview: false,
        allowEmergencyContactAccess: true
      });
    }

    return settings;
  }

  /**
   * Updates privacy settings and records an audit log
   */
  public async updatePrivacySettings(
    patientId: string,
    actorUserId: string,
    actorRole: 'CAREGIVER' | 'SENIOR' = 'CAREGIVER',
    updates: Partial<IPrivacySettings>
  ): Promise<IPrivacySettings> {
    const existing = await this.getPrivacySettings(patientId);

    const updated = await PrivacySettings.findOneAndUpdate(
      { patientId: new mongoose.Types.ObjectId(patientId) },
      { $set: updates },
      { new: true, upsert: true }
    );

    await AuditLog.create({
      actorUserId: new mongoose.Types.ObjectId(actorUserId),
      actorRole,
      patientId: new mongoose.Types.ObjectId(patientId),
      action: 'PRIVACY_SETTINGS_UPDATED',
      resourceType: 'PrivacySettings',
      resourceId: updated._id.toString(),
      success: true,
      metadata: {
        previous: {
          allowDoctorAccess: existing.allowDoctorAccess,
          allowMedicationAccess: existing.allowMedicationAccess,
          allowHealthConditionAccess: existing.allowHealthConditionAccess,
          allowPrescriptionAccess: existing.allowPrescriptionAccess,
          allowDocumentMetadataAccess: existing.allowDocumentMetadataAccess,
          allowDocumentPreview: existing.allowDocumentPreview,
          allowEmergencyContactAccess: existing.allowEmergencyContactAccess
        },
        newValues: updates
      }
    });

    return updated;
  }

  /**
   * Retrieves access history / audit logs for a patient
   */
  public async getAccessHistory(patientId: string) {
    const logs = await AuditLog.find({
      patientId: new mongoose.Types.ObjectId(patientId)
    })
      .sort({ timestamp: -1, createdAt: -1 })
      .limit(50);

    return logs.map(l => ({
      id: l._id,
      action: l.action,
      actorRole: l.actorRole || 'SYSTEM',
      resourceType: l.resourceType || l.entityType,
      timestamp: l.timestamp || l.createdAt,
      success: l.success !== false,
      metadata: l.metadata || l.details
    }));
  }
}

export const privacyService = new PrivacyService();
