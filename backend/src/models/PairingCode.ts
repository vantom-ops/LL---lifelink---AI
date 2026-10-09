import mongoose, { Schema, Document } from 'mongoose';

export interface IPairingCode extends Document {
  patientId: mongoose.Types.ObjectId;
  caregiverId: mongoose.Types.ObjectId;
  code: string; // 6-digit alphanumeric code e.g. "LL-8942" or "894210"
  qrCodeDataUrl?: string;
  expiresAt: Date;
  isUsed: boolean;
  usedAt?: Date;
  usedByUserId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PairingCodeSchema = new Schema<IPairingCode>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    caregiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    code: { type: String, required: true, unique: true, index: true },
    qrCodeDataUrl: { type: String },
    expiresAt: { type: Date, required: true, index: true },
    isUsed: { type: Boolean, default: false, index: true },
    usedAt: { type: Date },
    usedByUserId: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  {
    timestamps: true
  }
);

export const PairingCode = mongoose.model<IPairingCode>('PairingCode', PairingCodeSchema);
