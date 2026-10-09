import crypto from 'crypto';
import QRCode from 'qrcode';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { DoctorQrToken, IDoctorQrToken } from '../models/DoctorQrToken';
import { DoctorAccessSession, IDoctorAccessSession } from '../models/DoctorAccessSession';
import { PrivacySettings, IPrivacySettings } from '../models/PrivacySettings';
import { Patient } from '../models/Patient';
import { Medication } from '../models/Medication';
import { MedicationSchedule } from '../models/MedicationSchedule';
import { Prescription } from '../models/Prescription';
import { MedicalDocument } from '../models/MedicalDocument';
import { MedicationEvent } from '../models/MedicationEvent';
import { AuditLog } from '../models/AuditLog';
import { config } from '../config/env';

export class DoctorQrService {
  /**
   * Hashes a raw token with SHA-256 for secure storage
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token.trim()).digest('hex');
  }

  /**
   * Generates a new cryptographically secure Doctor QR token
   */
  public async generateDoctorQr(
    patientId: string,
    actorUserId?: string,
    actorRole: 'CAREGIVER' | 'SENIOR' | 'SYSTEM' = 'CAREGIVER'
  ): Promise<{
    token: string;
    tokenRecord: IDoctorQrToken;
    qrDataUrl: string;
    qrUrl: string;
  }> {
    const patient = await Patient.findById(patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }

    // Invalidate existing active tokens
    await DoctorQrToken.updateMany(
      { patientId: new mongoose.Types.ObjectId(patientId), status: 'ACTIVE' },
      { $set: { status: 'REVOKED', revokedAt: new Date() } }
    );

    // Generate random 256-bit token
    const rawRandom = crypto.randomBytes(24).toString('hex');
    const rawToken = `llqr_${rawRandom}`;
    const tokenHash = this.hashToken(rawToken);

    // Default expiry: 30 days
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Determine target web URL for QR scanning
    const clientBaseUrl = config.clientOrigin || 'http://localhost:3000';
    const qrUrl = `${clientBaseUrl}/doctor-access?token=${rawToken}`;

    // Generate QR Code data URL (encodes the secure URL, containing ONLY the opaque token)
    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 400,
      color: {
        dark: '#1F2937',
        light: '#FFFFFF'
      }
    });

    // Count previous versions for version increment
    const prevCount = await DoctorQrToken.countDocuments({ patientId: new mongoose.Types.ObjectId(patientId) });

    const tokenRecord = await DoctorQrToken.create({
      patientId: new mongoose.Types.ObjectId(patientId),
      tokenHash,
      status: 'ACTIVE',
      expiresAt,
      version: prevCount + 1,
      qrPayload: qrUrl
    });

    // Ensure privacy settings exist
    await PrivacySettings.findOneAndUpdate(
      { patientId: new mongoose.Types.ObjectId(patientId) },
      { $setOnInsert: { patientId: new mongoose.Types.ObjectId(patientId) } },
      { upsert: true, new: true }
    );

    await AuditLog.create({
      actorUserId: actorUserId ? new mongoose.Types.ObjectId(actorUserId) : undefined,
      actorRole,
      patientId: patient._id,
      action: 'DOCTOR_QR_GENERATED',
      resourceType: 'DoctorQrToken',
      resourceId: tokenRecord._id.toString(),
      success: true,
      metadata: { version: tokenRecord.version, expiresAt }
    });

    return {
      token: rawToken,
      tokenRecord,
      qrDataUrl,
      qrUrl
    };
  }

  /**
   * Retrieves active Doctor QR token details for a senior
   */
  public async getActiveDoctorQr(patientId: string): Promise<{
    hasActiveToken: boolean;
    tokenRecord?: IDoctorQrToken;
    qrDataUrl?: string;
    qrUrl?: string;
  }> {
    const activeToken = await DoctorQrToken.findOne({
      patientId: new mongoose.Types.ObjectId(patientId),
      status: 'ACTIVE'
    }).sort({ createdAt: -1 });

    if (!activeToken) {
      return { hasActiveToken: false };
    }

    // Check if expired
    if (activeToken.expiresAt < new Date()) {
      activeToken.status = 'EXPIRED';
      await activeToken.save();
      return { hasActiveToken: false };
    }

    const qrUrl = activeToken.qrPayload || `${config.clientOrigin || 'http://localhost:3000'}/doctor-access`;
    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 400,
      color: {
        dark: '#1F2937',
        light: '#FFFFFF'
      }
    });

    return {
      hasActiveToken: true,
      tokenRecord: activeToken,
      qrDataUrl,
      qrUrl
    };
  }

  /**
   * Regenerates Doctor QR code: Revokes previous token and creates fresh one
   */
  public async regenerateDoctorQr(
    patientId: string,
    actorUserId?: string,
    actorRole: 'CAREGIVER' | 'SENIOR' = 'CAREGIVER'
  ) {
    const res = await this.generateDoctorQr(patientId, actorUserId, actorRole);
    await AuditLog.create({
      actorUserId: actorUserId ? new mongoose.Types.ObjectId(actorUserId) : undefined,
      actorRole,
      patientId: new mongoose.Types.ObjectId(patientId),
      action: 'DOCTOR_QR_REGENERATED',
      resourceType: 'DoctorQrToken',
      resourceId: res.tokenRecord._id.toString(),
      success: true,
      metadata: { newVersion: res.tokenRecord.version }
    });
    return res;
  }

  /**
   * Validates a scanned QR token without initiating the doctor session yet
   */
  public async validateQrToken(tokenString: string): Promise<{
    valid: boolean;
    patientId?: string;
    patientPreview?: {
      fullName: string;
      preferredName?: string;
      age: number;
      gender?: string;
    };
    expiresAt?: Date;
    error?: string;
  }> {
    const cleanToken = tokenString.trim();
    // Support either raw token string ("llqr_...") or full scanned URL (".../doctor-access?token=llqr_...")
    let extractedToken = cleanToken;
    if (cleanToken.includes('token=')) {
      const match = cleanToken.match(/token=([a-zA-Z0-9_-]+)/);
      if (match) extractedToken = match[1];
    }

    const tokenHash = this.hashToken(extractedToken);
    const tokenRecord = await DoctorQrToken.findOne({ tokenHash });

    if (!tokenRecord) {
      return { valid: false, error: 'Invalid QR code. This token does not match any LL LifeLink profile.' };
    }

    if (tokenRecord.status === 'REVOKED') {
      return { valid: false, error: 'This QR code has been revoked or replaced by the family. Please request an updated QR.' };
    }

    if (tokenRecord.status === 'EXPIRED' || tokenRecord.expiresAt < new Date()) {
      if (tokenRecord.status !== 'EXPIRED') {
        tokenRecord.status = 'EXPIRED';
        await tokenRecord.save();
      }
      return { valid: false, error: 'This Doctor QR has expired. Please ask the patient or caregiver to regenerate it.' };
    }

    const patient = await Patient.findById(tokenRecord.patientId);
    if (!patient || !patient.isActive) {
      return { valid: false, error: 'Associated patient profile is inactive or not found.' };
    }

    // Verify privacy allows doctor access
    const privacy = await PrivacySettings.findOne({ patientId: patient._id });
    if (privacy && privacy.allowDoctorAccess === false) {
      return { valid: false, error: 'Doctor QR access is currently disabled in the patient’s privacy preferences.' };
    }

    return {
      valid: true,
      patientId: patient._id.toString(),
      patientPreview: {
        fullName: patient.fullName,
        preferredName: patient.preferredName,
        age: patient.age,
        gender: patient.gender
      },
      expiresAt: tokenRecord.expiresAt
    };
  }

  /**
   * Starts a temporary read-only Doctor Access session
   */
  public async createDoctorSession(
    tokenString: string,
    doctorIdentifier: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    session: IDoctorAccessSession;
    patientSummary: any;
  }> {
    if (!doctorIdentifier || doctorIdentifier.trim().length < 2) {
      throw new Error('Please enter your Doctor or Healthcare Professional Name / ID.');
    }

    const validation = await this.validateQrToken(tokenString);
    if (!validation.valid || !validation.patientId) {
      throw new Error(validation.error || 'Invalid or expired QR token.');
    }

    let cleanToken = tokenString.trim();
    if (cleanToken.includes('token=')) {
      const match = cleanToken.match(/token=([a-zA-Z0-9_-]+)/);
      if (match) cleanToken = match[1];
    }
    const tokenHash = this.hashToken(cleanToken);
    const tokenRecord = await DoctorQrToken.findOne({ tokenHash });
    if (!tokenRecord) throw new Error('Token record missing.');

    const patient = await Patient.findById(validation.patientId);
    if (!patient) throw new Error('Patient not found.');

    // Fetch privacy settings
    let privacy = await PrivacySettings.findOne({ patientId: patient._id });
    if (!privacy) {
      privacy = await PrivacySettings.create({ patientId: patient._id });
    }

    if (!privacy.allowDoctorAccess) {
      throw new Error('Doctor QR access has been disabled by the patient or family caregiver.');
    }

    const sessionId = uuidv4();
    const sessionExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1-hour session

    const ipHash = ipAddress ? crypto.createHash('sha256').update(ipAddress).digest('hex').substring(0, 16) : undefined;
    const userAgentSummary = userAgent ? userAgent.substring(0, 120) : undefined;

    const session = await DoctorAccessSession.create({
      sessionId,
      patientId: patient._id,
      doctorIdentifier: doctorIdentifier.trim(),
      qrTokenId: tokenRecord._id,
      permissions: {
        allowMedicationAccess: privacy.allowMedicationAccess,
        allowHealthConditionAccess: privacy.allowHealthConditionAccess,
        allowPrescriptionAccess: privacy.allowPrescriptionAccess,
        allowDocumentMetadataAccess: privacy.allowDocumentMetadataAccess,
        allowDocumentPreview: privacy.allowDocumentPreview,
        allowEmergencyContactAccess: privacy.allowEmergencyContactAccess
      },
      startedAt: new Date(),
      expiresAt: sessionExpiry,
      ipHash,
      userAgentSummary
    });

    // Update lastAccessedAt
    tokenRecord.lastAccessedAt = new Date();
    await tokenRecord.save();

    // Log audit event
    await AuditLog.create({
      actorRole: 'DOCTOR',
      patientId: patient._id,
      action: 'DOCTOR_QR_SESSION_STARTED',
      resourceType: 'DoctorAccessSession',
      resourceId: sessionId,
      success: true,
      metadata: {
        doctorIdentifier: doctorIdentifier.trim(),
        ipHash,
        expiresAt: sessionExpiry
      }
    });

    return {
      session,
      patientSummary: {
        id: patient._id,
        fullName: patient.fullName,
        preferredName: patient.preferredName,
        age: patient.age,
        gender: patient.gender
      }
    };
  }

  /**
   * Retrieves authorized patient clinical details for a doctor session, strictly filtered by privacy
   */
  public async getDoctorSessionData(sessionId: string) {
    const session = await DoctorAccessSession.findOne({ sessionId });
    if (!session) {
      throw new Error('Doctor access session not found.');
    }

    if (session.endedAt) {
      throw new Error('This doctor session has been closed.');
    }

    if (session.expiresAt < new Date()) {
      session.endedAt = new Date();
      await session.save();
      throw new Error('This temporary doctor session has expired.');
    }

    const patient = await Patient.findById(session.patientId);
    if (!patient || !patient.isActive) {
      throw new Error('Patient record is no longer active.');
    }

    // 1. Basic Profile
    const basicProfile: any = {
      fullName: patient.fullName,
      preferredName: patient.preferredName,
      age: patient.age,
      gender: patient.gender,
      bloodGroup: patient.bloodGroup,
      profilePhotoUrl: patient.profilePhotoUrl
    };

    if (session.permissions.allowEmergencyContactAccess) {
      basicProfile.emergencyContact = {
        name: patient.emergencyContactName,
        relationship: patient.relationship || 'Primary Caregiver'
      };
      if (patient.secondaryContactName) {
        basicProfile.secondaryEmergencyContact = {
          name: patient.secondaryContactName,
          relationship: patient.secondaryRelationship || 'Secondary Contact'
        };
      }
    }

    // 2. Health Condition (descriptive only)
    let healthCondition: any = null;
    if (session.permissions.allowHealthConditionAccess) {
      healthCondition = {
        mobilityStatus: patient.mobilityStatus,
        visionStatus: patient.visionStatus,
        hearingStatus: patient.hearingStatus,
        communicationPreference: patient.communicationPreference,
        knownAllergies: patient.knownAllergies || [],
        importantHealthConditions: patient.importantHealthConditions || [],
        dietaryRestrictions: patient.dietaryRestrictions || [],
        specialCareNotes: patient.specialCareNotes || patient.medicalNotes
      };
    }

    // 3. Medications
    let activeMedications: any[] = [];
    if (session.permissions.allowMedicationAccess) {
      const meds = await Medication.find({ patientId: patient._id, active: true, isArchived: false }).sort({ name: 1 });
      const schedules = await MedicationSchedule.find({ patientId: patient._id, enabled: true });
      const scheduleMap = new Map<string, any[]>();
      schedules.forEach(s => {
        const key = s.medicationId.toString();
        if (!scheduleMap.has(key)) scheduleMap.set(key, []);
        scheduleMap.get(key)!.push(s);
      });

      activeMedications = meds.map(m => {
        const schedList = scheduleMap.get(m._id.toString()) || [];
        const times = schedList.map(s => s.time);
        const freq = schedList.length > 0 ? schedList[0].frequency : 'DAILY';
        return {
          id: m._id,
          name: m.name,
          genericName: m.genericName,
          dosage: `${m.dose} ${m.unit || ''}`.trim(),
          form: m.form,
          frequency: freq,
          foodInstruction: m.foodRelation || 'AFTER_MEAL',
          scheduledTimes: times,
          startDate: m.startDate,
          instructions: m.instructions,
          status: m.active ? 'Active' : 'Discontinued'
        };
      });
    }

    // 4. Medical History / Prescriptions / Documents
    let prescriptions: any[] = [];
    if (session.permissions.allowPrescriptionAccess) {
      const rxList = await Prescription.find({ patientId: patient._id }).sort({ prescriptionDate: -1 }).limit(10);
      prescriptions = rxList.map(rx => ({
        id: rx._id,
        doctorName: rx.doctorName,
        hospitalName: rx.hospitalName,
        prescriptionDate: rx.prescriptionDate,
        verifiedStatus: rx.verificationStatus,
        medicationCount: rx.extractedMedications?.length || 0,
        notes: rx.notes
      }));
    }

    let medicalReports: any[] = [];
    if (session.permissions.allowDocumentMetadataAccess) {
      const query: any = { patientId: patient._id };
      // If document preview is allowed, only show those specifically shared or all if permitted
      const docs = await MedicalDocument.find(query).sort({ documentDate: -1 }).limit(15);
      medicalReports = docs.map(d => ({
        id: d._id,
        type: d.type,
        fileName: d.fileName,
        hospitalName: d.hospitalName,
        doctorName: d.doctorName,
        documentDate: d.documentDate,
        notes: d.notes,
        aiSummary: d.aiSummary?.summary,
        previewAvailable: session.permissions.allowDocumentPreview && (d.shareWithDoctor || false),
        fileUrl: (session.permissions.allowDocumentPreview && d.shareWithDoctor) ? d.fileUrl : undefined
      }));
    }

    // 5. Alerts & Clinical Warnings
    const alerts: Array<{ type: 'warning' | 'alert' | 'info'; title: string; message: string }> = [];
    if (patient.knownAllergies && patient.knownAllergies.length > 0) {
      alerts.push({
        type: 'alert',
        title: 'Known Allergies Warning',
        message: `Patient has reported allergies to: ${patient.knownAllergies.join(', ')}.`
      });
    }

    if (patient.specialCareNotes) {
      alerts.push({
        type: 'warning',
        title: 'Special Care Note',
        message: patient.specialCareNotes
      });
    }

    // Recent adherence insight
    const recentEvents = await MedicationEvent.find({ patientId: patient._id }).sort({ scheduledTime: -1 }).limit(20);
    if (recentEvents.length > 0) {
      const taken = recentEvents.filter(e => e.status === 'TAKEN').length;
      const rate = Math.round((taken / recentEvents.length) * 100);
      alerts.push({
        type: rate >= 80 ? 'info' : 'warning',
        title: 'Recent Adherence Rate',
        message: `${rate}% adherence over recent scheduled doses (${taken}/${recentEvents.length} doses confirmed).`
      });
    }

    return {
      sessionInfo: {
        sessionId: session.sessionId,
        doctorIdentifier: session.doctorIdentifier,
        startedAt: session.startedAt,
        expiresAt: session.expiresAt,
        permissions: session.permissions
      },
      patient: basicProfile,
      healthCondition,
      activeMedications,
      prescriptions,
      medicalReports,
      alerts
    };
  }

  /**
   * Ends a doctor access session immediately
   */
  public async endDoctorSession(sessionId: string) {
    const session = await DoctorAccessSession.findOne({ sessionId });
    if (!session) return { success: false, message: 'Session not found' };

    session.endedAt = new Date();
    await session.save();

    await AuditLog.create({
      actorRole: 'DOCTOR',
      patientId: session.patientId,
      action: 'DOCTOR_QR_SESSION_ENDED',
      resourceType: 'DoctorAccessSession',
      resourceId: sessionId,
      success: true,
      metadata: { doctorIdentifier: session.doctorIdentifier }
    });

    return { success: true, message: 'Doctor session successfully closed.' };
  }
}

export const doctorQrService = new DoctorQrService();
