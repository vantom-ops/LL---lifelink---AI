import mongoose, { Schema, Document } from 'mongoose';

export interface IMedication extends Document {
  patientId: mongoose.Types.ObjectId;
  name: string;
  genericName?: string;
  dose: string;
  unit: string; // mg, ml, drops, tablets, puffs
  form?: string; // tablet, capsule, syrup, injection, inhaler
  instructions?: string;
  foodRelation: 'BEFORE_MEAL' | 'AFTER_MEAL' | 'WITH_MEAL' | 'EMPTY_STOMACH' | 'NO_RESTRICTION';
  imageUrl?: string;
  sourcePrescriptionId?: mongoose.Types.ObjectId;
  startDate?: Date;
  endDate?: Date;
  active: boolean;
  isArchived: boolean;
  archivedAt?: Date;
  archivedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MedicationSchema = new Schema<IMedication>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    name: { type: String, required: true, trim: true },
    genericName: { type: String, trim: true },
    dose: { type: String, required: true },
    unit: { type: String, required: true, default: 'tablet' },
    form: { type: String, default: 'Tablet' },
    instructions: { type: String },
    foodRelation: { 
      type: String, 
      enum: ['BEFORE_MEAL', 'AFTER_MEAL', 'WITH_MEAL', 'EMPTY_STOMACH', 'NO_RESTRICTION'], 
      default: 'AFTER_MEAL' 
    },
    imageUrl: { type: String },
    sourcePrescriptionId: { type: Schema.Types.ObjectId, ref: 'Prescription', sparse: true },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    active: { type: Boolean, default: true, index: true },
    isArchived: { type: Boolean, default: false, index: true },
    archivedAt: { type: Date },
    archivedReason: { type: String }
  },
  {
    timestamps: true
  }
);

export const Medication = mongoose.model<IMedication>('Medication', MedicationSchema);
