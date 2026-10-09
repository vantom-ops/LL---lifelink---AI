import mongoose, { Schema, Document } from 'mongoose';

export interface ILocationShare extends Document {
  requestId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  helperId: mongoose.Types.ObjectId;
  coordinates: number[]; // [longitude, latitude]
  approximateArea: string;
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LocationShareSchema = new Schema<ILocationShare>(
  {
    requestId: { type: Schema.Types.ObjectId, ref: 'AssistanceRequest', required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    helperId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    coordinates: {
      type: [Number],
      required: true
    },
    approximateArea: { type: String, required: true },
    isActive: { type: Boolean, default: true, index: true },
    expiresAt: { type: Date, required: true, index: true }
  },
  {
    timestamps: true
  }
);

LocationShareSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL auto-expiration

export const LocationShare = mongoose.model<ILocationShare>('LocationShare', LocationShareSchema);
