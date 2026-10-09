import mongoose, { Schema, Document } from 'mongoose';

export interface IDispute extends Document {
  requestId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  raisedBy: mongoose.Types.ObjectId;
  reason: string;
  status: 'OPEN' | 'RESOLVED' | 'DISMISSED';
  resolutionNotes?: string;
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DisputeSchema = new Schema<IDispute>(
  {
    requestId: { type: Schema.Types.ObjectId, ref: 'AssistanceRequest', required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    raisedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['OPEN', 'RESOLVED', 'DISMISSED'], default: 'OPEN', index: true },
    resolutionNotes: { type: String },
    resolvedAt: { type: Date },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  {
    timestamps: true
  }
);

export const Dispute = mongoose.model<IDispute>('Dispute', DisputeSchema);
