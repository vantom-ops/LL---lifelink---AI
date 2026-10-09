import mongoose, { Schema, Document } from 'mongoose';
import { MedicationEventStatus } from '../types';

export interface IMedicationEvent extends Document {
  scheduleId?: mongoose.Types.ObjectId;
  medicationId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  scheduledTime: Date;
  status: MedicationEventStatus;
  takenAt?: Date;
  markedNotTakenAt?: Date;
  responseNotes?: string;
  reminderSentAt?: Date;
  escalationDueAt?: Date; // scheduledTime + 5 minutes
  caregiverAlertSentAt?: Date;
  resendCount: number;
  lastResentAt?: Date;
  offlineQueued: boolean;
  clientTimestamp?: Date;
  syncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MedicationEventSchema = new Schema<IMedicationEvent>(
  {
    scheduleId: { type: Schema.Types.ObjectId, ref: 'MedicationSchedule', index: true },
    medicationId: { type: Schema.Types.ObjectId, ref: 'Medication', required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    scheduledTime: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['UPCOMING', 'DUE', 'PENDING_CONFIRMATION', 'TAKEN', 'LATE', 'MISSED', 'NOT_TAKEN'],
      default: 'UPCOMING',
      index: true
    },
    takenAt: { type: Date },
    markedNotTakenAt: { type: Date },
    responseNotes: { type: String },
    reminderSentAt: { type: Date },
    escalationDueAt: { type: Date, index: true },
    caregiverAlertSentAt: { type: Date },
    resendCount: { type: Number, default: 0 },
    lastResentAt: { type: Date },
    offlineQueued: { type: Boolean, default: false },
    clientTimestamp: { type: Date },
    syncedAt: { type: Date }
  },
  {
    timestamps: true
  }
);

MedicationEventSchema.index({ patientId: 1, scheduledTime: -1 });
MedicationEventSchema.index({ status: 1, escalationDueAt: 1 });

export const MedicationEvent = mongoose.model<IMedicationEvent>(
  'MedicationEvent',
  MedicationEventSchema
);
