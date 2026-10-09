import mongoose, { Schema, Document } from 'mongoose';

export interface IDoctorAccessSession extends Document {
  sessionId: string;
  patientId: mongoose.Types.ObjectId;
  doctorIdentifier: string; // e.g. "Dr. Anand Kumar" or badge/clinic ID
  qrTokenId: mongoose.Types.ObjectId;
  permissions: {
    allowMedicationAccess: boolean;
    allowHealthConditionAccess: boolean;
    allowPrescriptionAccess: boolean;
    allowDocumentMetadataAccess: boolean;
    allowDocumentPreview: boolean;
    allowEmergencyContactAccess: boolean;
  };
  startedAt: Date;
  expiresAt: Date;
  endedAt?: Date;
  ipHash?: string;
  userAgentSummary?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DoctorAccessSessionSchema = new Schema<IDoctorAccessSession>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    doctorIdentifier: { type: String, required: true, trim: true },
    qrTokenId: { type: Schema.Types.ObjectId, ref: 'DoctorQrToken', required: true },
    permissions: {
      allowMedicationAccess: { type: Boolean, default: true },
      allowHealthConditionAccess: { type: Boolean, default: true },
      allowPrescriptionAccess: { type: Boolean, default: true },
      allowDocumentMetadataAccess: { type: Boolean, default: true },
      allowDocumentPreview: { type: Boolean, default: false },
      allowEmergencyContactAccess: { type: Boolean, default: true }
    },
    startedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    endedAt: { type: Date },
    ipHash: { type: String },
    userAgentSummary: { type: String }
  },
  {
    timestamps: true
  }
);

export const DoctorAccessSession = mongoose.model<IDoctorAccessSession>(
  'DoctorAccessSession',
  DoctorAccessSessionSchema
);
