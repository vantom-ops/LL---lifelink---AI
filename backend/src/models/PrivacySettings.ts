import mongoose, { Schema, Document } from 'mongoose';

export interface IPrivacySettings extends Document {
  patientId: mongoose.Types.ObjectId;
  allowDoctorAccess: boolean;
  allowMedicationAccess: boolean;
  allowHealthConditionAccess: boolean;
  allowPrescriptionAccess: boolean;
  allowDocumentMetadataAccess: boolean;
  allowDocumentPreview: boolean;
  allowEmergencyContactAccess: boolean;
  updatedAt: Date;
  createdAt: Date;
}

const PrivacySettingsSchema = new Schema<IPrivacySettings>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, unique: true, index: true },
    allowDoctorAccess: { type: Boolean, default: true },
    allowMedicationAccess: { type: Boolean, default: true },
    allowHealthConditionAccess: { type: Boolean, default: true },
    allowPrescriptionAccess: { type: Boolean, default: true },
    allowDocumentMetadataAccess: { type: Boolean, default: true },
    allowDocumentPreview: { type: Boolean, default: false }, // document preview restricted by default
    allowEmergencyContactAccess: { type: Boolean, default: true }
  },
  {
    timestamps: true
  }
);

export const PrivacySettings = mongoose.model<IPrivacySettings>(
  'PrivacySettings',
  PrivacySettingsSchema
);
