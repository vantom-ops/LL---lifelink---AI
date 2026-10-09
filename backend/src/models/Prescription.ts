import mongoose, { Schema, Document } from 'mongoose';
import { ExtractedMedicationCandidate } from '../types';

export interface IPrescription extends Document {
  patientId: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  fileUrl: string;
  originalFileName: string;
  ocrRawText?: string;
  extractedMedications: ExtractedMedicationCandidate[];
  doctorName?: string;
  hospitalName?: string;
  prescriptionDate?: Date;
  verificationStatus: 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';
  verifiedAt?: Date;
  verifiedBy?: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PrescriptionSchema = new Schema<IPrescription>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fileUrl: { type: String, required: true },
    originalFileName: { type: String, required: true },
    ocrRawText: { type: String },
    extractedMedications: [
      {
        medicineName: { type: String, required: true },
        genericName: { type: String },
        dose: { type: String, required: true },
        unit: { type: String, default: 'mg' },
        form: { type: String, default: 'Tablet' },
        frequency: { type: String, default: 'Once Daily' },
        timing: { type: String, default: 'Morning' },
        foodInstruction: { type: String, default: 'After food' },
        duration: { type: String },
        confidence: { type: Number, default: 0.85 }
      }
    ],
    doctorName: { type: String },
    hospitalName: { type: String },
    prescriptionDate: { type: Date, default: Date.now },
    verificationStatus: { 
      type: String, 
      enum: ['PENDING_REVIEW', 'VERIFIED', 'REJECTED'], 
      default: 'PENDING_REVIEW',
      index: true
    },
    verifiedAt: { type: Date },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String }
  },
  {
    timestamps: true
  }
);

export const Prescription = mongoose.model<IPrescription>('Prescription', PrescriptionSchema);
