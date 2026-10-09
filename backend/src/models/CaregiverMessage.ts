import mongoose, { Schema, Document } from 'mongoose';

export interface ICaregiverMessage extends Document {
  caregiverId: mongoose.Types.ObjectId;
  senderRole: 'family_monitor' | 'professional_caregiver' | 'senior';
  senderName: string;
  senderPhone?: string;
  text: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CaregiverMessageSchema = new Schema<ICaregiverMessage>(
  {
    caregiverId: { type: Schema.Types.ObjectId, ref: 'ProfessionalCaregiver', required: true, index: true },
    senderRole: {
      type: String,
      enum: ['family_monitor', 'professional_caregiver', 'senior'],
      required: true
    },
    senderName: { type: String, required: true },
    senderPhone: { type: String },
    text: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

CaregiverMessageSchema.index({ caregiverId: 1, createdAt: 1 });

export const CaregiverMessage = mongoose.model<ICaregiverMessage>(
  'CaregiverMessage',
  CaregiverMessageSchema
);
