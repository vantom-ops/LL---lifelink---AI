import mongoose, { Schema, Document } from 'mongoose';

export interface IAssistanceEvent extends Document {
  requestId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  fromStatus: string;
  toStatus: string;
  actorId?: mongoose.Types.ObjectId;
  actorRole: string; // 'senior' | 'primary_caregiver' | 'trusted_contact' | 'professional_caregiver' | 'system'
  note?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const AssistanceEventSchema = new Schema<IAssistanceEvent>(
  {
    requestId: { type: Schema.Types.ObjectId, ref: 'AssistanceRequest', required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    fromStatus: { type: String, required: true },
    toStatus: { type: String, required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User' },
    actorRole: { type: String, required: true, default: 'system' },
    note: { type: String },
    metadata: { type: Schema.Types.Mixed }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

AssistanceEventSchema.index({ requestId: 1, createdAt: 1 });

export const AssistanceEvent = mongoose.model<IAssistanceEvent>(
  'AssistanceEvent',
  AssistanceEventSchema
);
