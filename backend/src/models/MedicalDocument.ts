import mongoose, { Schema, Document } from 'mongoose';
import { MedicalDocumentType } from '../types';

export interface IMedicalDocument extends Document {
  patientId: mongoose.Types.ObjectId;
  type: MedicalDocumentType;
  fileName: string;
  fileUrl: string;
  thumbnailUrl?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  hospitalName?: string;
  doctorName?: string;
  documentDate: Date;
  notes?: string;
  aiSummary?: {
    summary: string;
    keyObservations?: string[];
    isInformationalOnly: boolean;
    generatedAt: Date;
  };
  uploadedBy: mongoose.Types.ObjectId;
  shareWithDoctor?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MedicalDocumentSchema = new Schema<IMedicalDocument>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    type: {
      type: String,
      enum: [
        'Prescription',
        'X-Ray',
        'CT Scan',
        'MRI',
        'ECG',
        'Ultrasound',
        'Blood Report',
        'Other Medical Report'
      ],
      required: true,
      index: true
    },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    thumbnailUrl: { type: String },
    fileSizeBytes: { type: Number },
    mimeType: { type: String },
    hospitalName: { type: String },
    doctorName: { type: String },
    documentDate: { type: Date, default: Date.now, index: true },
    notes: { type: String },
    aiSummary: {
      summary: { type: String },
      keyObservations: [{ type: String }],
      isInformationalOnly: { type: Boolean, default: true },
      generatedAt: { type: Date }
    },
    shareWithDoctor: { type: Boolean, default: false },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  {
    timestamps: true
  }
);

MedicalDocumentSchema.index({ patientId: 1, type: 1, documentDate: -1 });

export const MedicalDocument = mongoose.model<IMedicalDocument>(
  'MedicalDocument',
  MedicalDocumentSchema
);
