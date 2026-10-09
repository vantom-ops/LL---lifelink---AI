import mongoose from 'mongoose';
import { AuditLog, IAuditLog } from '../models/AuditLog';

export class AuditService {
  public async log(params: {
    actorUserId?: string | mongoose.Types.ObjectId;
    actorId?: string | mongoose.Types.ObjectId;
    actorRole?: 'SENIOR' | 'CAREGIVER' | 'DOCTOR' | 'SYSTEM' | 'ADMIN';
    patientId?: string | mongoose.Types.ObjectId;
    action: string;
    resource?: string;
    resourceType?: string;
    resourceId?: string | mongoose.Types.ObjectId;
    success?: boolean;
    metadata?: Record<string, any>;
    entityType?: string;
    entityId?: string | mongoose.Types.ObjectId;
    details?: Record<string, any>;
    ipAddress?: string;
  }): Promise<IAuditLog> {
    try {
      const uid = params.actorUserId || params.actorId;
      const entry = await AuditLog.create({
        actorUserId: uid ? new mongoose.Types.ObjectId(uid.toString()) : undefined,
        actorRole: params.actorRole === 'ADMIN' ? 'CAREGIVER' : (params.actorRole || 'SYSTEM'),
        patientId: params.patientId ? new mongoose.Types.ObjectId(params.patientId.toString()) : undefined,
        action: params.action,
        resourceType: params.resourceType || params.resource || params.entityType,
        resourceId: params.resourceId ? params.resourceId.toString() : (params.entityId ? params.entityId.toString() : undefined),
        success: params.success !== undefined ? params.success : true,
        metadata: params.metadata || params.details,
        timestamp: new Date()
      });
      return entry;
    } catch (err) {
      console.error('[AuditService] Failed to record audit log:', err);
      // Fail safely without throwing so business flow continues
      return {} as IAuditLog;
    }
  }

  public async getLogsForPatient(patientId: string, limit: number = 50): Promise<IAuditLog[]> {
    return AuditLog.find({ patientId: new mongoose.Types.ObjectId(patientId) })
      .sort({ timestamp: -1 })
      .limit(limit);
  }
}

export const auditService = new AuditService();
