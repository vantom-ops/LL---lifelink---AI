import mongoose, { Schema, Document } from 'mongoose';

export interface IMedicationSchedule extends Document {
  medicationId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  time: string; // "08:00", "13:00", "20:30" (24-hour format)
  frequency: 'DAILY' | 'TWICE_DAILY' | 'THRICE_DAILY' | 'CUSTOM' | 'AS_NEEDED';
  daysOfWeek: number[]; // [0, 1, 2, 3, 4, 5, 6] where 0 = Sunday
  label?: string; // e.g. "Morning Dose", "Afternoon", "Night"
  timezone: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MedicationScheduleSchema = new Schema<IMedicationSchedule>(
  {
    medicationId: { type: Schema.Types.ObjectId, ref: 'Medication', required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    time: { type: String, required: true }, // "HH:mm"
    frequency: { 
      type: String, 
      enum: ['DAILY', 'TWICE_DAILY', 'THRICE_DAILY', 'CUSTOM', 'AS_NEEDED'], 
      default: 'DAILY' 
    },
    daysOfWeek: { type: [Number], default: [0, 1, 2, 3, 4, 5, 6] },
    label: { type: String, default: 'Scheduled Dose' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    enabled: { type: Boolean, default: true, index: true }
  },
  {
    timestamps: true
  }
);

MedicationScheduleSchema.index({ patientId: 1, enabled: 1 });

export const MedicationSchedule = mongoose.model<IMedicationSchedule>(
  'MedicationSchedule',
  MedicationScheduleSchema
);
