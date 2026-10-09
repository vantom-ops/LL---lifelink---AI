import QRCode from 'qrcode';
import mongoose from 'mongoose';
import { PairingCode, IPairingCode } from '../models/PairingCode';
import { Patient } from '../models/Patient';
import { User, IUser } from '../models/User';
import { CaregiverPatientLink } from '../models/CaregiverPatientLink';
import { authService } from './auth.service';

export class PairingService {
  /**
   * Generates a 6-digit numeric pairing code and QR code data URL for a senior patient
   */
  public async generatePairingCode(
    patientId: string,
    caregiverId: string
  ): Promise<{ code: string; qrCodeDataUrl: string; expiresAt: Date }> {
    // Generate a clean 6-digit code
    const rawNumber = Math.floor(100000 + Math.random() * 900000).toString();
    const code = `LL-${rawNumber}`;

    // 24 hour expiration
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Payload for QR Code
    const qrPayload = JSON.stringify({
      code,
      patientId,
      caregiverId,
      app: 'LL_LifeLink',
      timestamp: Date.now()
    });

    const qrCodeDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'H',
      margin: 2,
      color: {
        dark: '#FF7A00',
        light: '#FFFFFF'
      }
    });

    // Invalidate any previously unconsumed pairing codes for this patient
    await PairingCode.updateMany(
      { patientId: new mongoose.Types.ObjectId(patientId), isUsed: false },
      { isUsed: true }
    );

    const record = new PairingCode({
      patientId: new mongoose.Types.ObjectId(patientId),
      caregiverId: new mongoose.Types.ObjectId(caregiverId),
      code,
      qrCodeDataUrl,
      expiresAt,
      isUsed: false
    });
    await record.save();

    return { code, qrCodeDataUrl, expiresAt };
  }

  /**
   * Validates pairing code entered by Senior on mobile app,
   * creates/links the senior User, and returns JWT tokens and patient profile.
   */
  public async pairSeniorDevice(
    code: string,
    deviceInfo?: { deviceName?: string; fcmToken?: string }
  ): Promise<{
    user: IUser;
    patient: any;
    tokens: { accessToken: string; refreshToken: string };
  }> {
    // Normalize code: remove all whitespace, uppercase, ensure LL- prefix
    const cleaned = code.replace(/\s+/g, '').toUpperCase();
    const cleanWithPrefix = cleaned.startsWith('LL-')
      ? cleaned
      : (cleaned.startsWith('LL') ? `LL-${cleaned.slice(2)}` : `LL-${cleaned}`);

    const pairing = await PairingCode.findOne({
      code: cleanWithPrefix,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!pairing) {
      const existing = await PairingCode.findOne({ code: cleanWithPrefix });
      if (existing?.isUsed) {
        throw new Error('This pairing code was already used. Each code is one-time use for security. Please click "Pair Phone" on the Caregiver Web Dashboard to generate a new live code.');
      } else if (existing && existing.expiresAt <= new Date()) {
        throw new Error('This pairing code has expired. Please click "Pair Phone" on the Caregiver Web Dashboard to generate a fresh code.');
      }
      throw new Error(`Pairing code "${cleanWithPrefix}" was not found. Please verify the code on your Caregiver Web Dashboard.`);
    }

    const patient = await Patient.findById(pairing.patientId);
    if (!patient) {
      throw new Error('Associated patient profile was not found.');
    }

    // Check if senior User already exists or create one
    let seniorUser: IUser | null = null;
    if (patient.linkedUserId) {
      seniorUser = await User.findById(patient.linkedUserId);
    }

    if (!seniorUser) {
      // Create a senior User account
      const uniqueSuffix = Date.now().toString().slice(-4);
      seniorUser = new User({
        name: patient.preferredName || patient.fullName,
        role: 'senior',
        isActive: true,
        phone: patient.emergencyContactPhone ? `senior-${patient.emergencyContactPhone}-${uniqueSuffix}` : undefined,
        fcmToken: deviceInfo?.fcmToken
      });
      await seniorUser.save();

      patient.linkedUserId = seniorUser._id as mongoose.Types.ObjectId;
      await patient.save();
    } else if (deviceInfo?.fcmToken) {
      seniorUser.fcmToken = deviceInfo.fcmToken;
      await seniorUser.save();
    }

    // Mark pairing code as used for security (one-time use)
    pairing.isUsed = true;
    pairing.usedAt = new Date();
    pairing.usedByUserId = seniorUser._id as mongoose.Types.ObjectId;
    await pairing.save();

    // Ensure Caregiver-Patient link is active
    await CaregiverPatientLink.findOneAndUpdate(
      { caregiverId: pairing.caregiverId, patientId: patient._id },
      { status: 'active', isPrimary: true },
      { upsert: true }
    );

    const tokens = authService.generateTokens({
      userId: seniorUser._id.toString(),
      role: 'senior',
      name: seniorUser.name,
      email: seniorUser.email
    });

    return {
      user: seniorUser,
      patient,
      tokens
    };
  }
}

export const pairingService = new PairingService();
