import mongoose, { Schema, Document } from 'mongoose';

export type ContactRelationship = 'relative' | 'neighbour' | 'friend' | 'family_member';
export type ConsentStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'REVOKED';

export interface ICareCircleContact extends Document {
  patientId: mongoose.Types.ObjectId;
  caregiverId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  email?: string;
  relationship: ContactRelationship;
  priority: number; // 1 = First fallback, 2 = Second fallback, etc.
  available: boolean;
  permissions: string[];
  consentStatus: ConsentStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CareCircleContactSchema = new Schema<ICareCircleContact>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    caregiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    relationship: {
      type: String,
      enum: ['relative', 'neighbour', 'friend', 'family_member'],
      required: true,
      default: 'neighbour'
    },
    priority: { type: Number, required: true, default: 1 },
    available: { type: Boolean, default: true, index: true },
    permissions: {
      type: [String],
      default: ['receive_assistance_alert', 'view_medicine_name', 'view_dosage', 'mark_completion']
    },
    consentStatus: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'DECLINED', 'REVOKED'],
      default: 'ACCEPTED',
      index: true
    },
    notes: { type: String }
  },
  {
    timestamps: true
  }
);

CareCircleContactSchema.index({ patientId: 1, phone: 1 }, { unique: true });

export const CareCircleContact = mongoose.model<ICareCircleContact>(
  'CareCircleContact',
  CareCircleContactSchema
);
