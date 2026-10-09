import mongoose, { Schema, Document } from 'mongoose';

export interface IDoctorQrToken extends Document {
  patientId: mongoose.Types.ObjectId;
  tokenHash: string; // SHA-256 of the opaque random token
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  expiresAt: Date;
  revokedAt?: Date;
  lastAccessedAt?: Date;
  version: number;
  qrPayload?: string; // secure access URL or opaque reference e.g. "ll_qr_<token>"
  createdAt: Date;
  updatedAt: Date;
}

const DoctorQrTokenSchema = new Schema<IDoctorQrToken>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED', 'REVOKED'],
      default: 'ACTIVE',
      index: true
    },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date },
    lastAccessedAt: { type: Date },
    version: { type: Number, default: 1 },
    qrPayload: { type: String }
  },
  {
    timestamps: true
  }
);

DoctorQrTokenSchema.index({ patientId: 1, status: 1 });

export const DoctorQrToken = mongoose.model<IDoctorQrToken>('DoctorQrToken', DoctorQrTokenSchema);
