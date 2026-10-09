import mongoose, { Schema, Document } from 'mongoose';
import { NotificationType, NotificationChannel } from '../types';

export interface INotification extends Document {
  recipientUserId: mongoose.Types.ObjectId;
  patientId?: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  payload?: Record<string, any>;
  read: boolean;
  readAt?: Date;
  channel: NotificationChannel;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', index: true },
    type: {
      type: String,
      enum: [
        'MEDICATION_DUE',
        'PENDING_CONFIRMATION',
        'MEDICATION_TAKEN',
        'MEDICATION_MISSED',
        'MEDICATION_LATE',
        'SENIOR_REQUESTED_CONTACT',
        'MEDICATION_ESCALATION',
        'SYSTEM_ALERT'
      ],
      required: true,
      index: true
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    payload: { type: Schema.Types.Mixed },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    channel: {
      type: String,
      enum: ['PUSH', 'SMS', 'IN_APP', 'VOICE'],
      default: 'IN_APP'
    }
  },
  {
    timestamps: true
  }
);

NotificationSchema.index({ recipientUserId: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
