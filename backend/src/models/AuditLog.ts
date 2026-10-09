import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  // Enhanced schema fields
  actorUserId?: mongoose.Types.ObjectId;
  actorRole?: 'SENIOR' | 'CAREGIVER' | 'DOCTOR' | 'SYSTEM';
  patientId?: mongoose.Types.ObjectId;
  action: string;
  resourceType?: string;
  resourceId?: string;
  success?: boolean;
  metadata?: Record<string, any>;
  timestamp?: Date;

  // Backward compatibility fields
  userId?: mongoose.Types.ObjectId;
  entityType?: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorUserId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    actorRole: { type: String, enum: ['SENIOR', 'CAREGIVER', 'DOCTOR', 'SYSTEM'], default: 'SYSTEM' },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', index: true },
    action: { type: String, required: true, index: true },
    resourceType: { type: String, index: true },
    resourceId: { type: String },
    success: { type: Boolean, default: true },
    metadata: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now, index: true },

    // Backward compat
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    entityType: { type: String },
    entityId: { type: String },
    details: { type: Schema.Types.Mixed },
    ipAddress: { type: String }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

AuditLogSchema.index({ patientId: 1, timestamp: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
