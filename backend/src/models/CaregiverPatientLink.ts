import mongoose, { Schema, Document } from 'mongoose';

export interface ICaregiverPatientLink extends Document {
  caregiverId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  relationship: string; // e.g. 'Son', 'Daughter', 'Nurse', 'Spouse'
  isPrimary: boolean;
  permissions: string[];
  status: 'active' | 'revoked';
  createdAt: Date;
  updatedAt: Date;
}

const CaregiverPatientLinkSchema = new Schema<ICaregiverPatientLink>(
  {
    caregiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    relationship: { type: String, required: true, default: 'Family Caregiver' },
    isPrimary: { type: Boolean, default: true },
    permissions: { 
      type: [String], 
      default: ['read', 'write', 'schedule', 'upload_documents', 'emergency_contact'] 
    },
    status: { type: String, enum: ['active', 'revoked'], default: 'active', index: true }
  },
  {
    timestamps: true
  }
);

CaregiverPatientLinkSchema.index({ caregiverId: 1, patientId: 1 }, { unique: true });

export const CaregiverPatientLink = mongoose.model<ICaregiverPatientLink>(
  'CaregiverPatientLink',
  CaregiverPatientLinkSchema
);
