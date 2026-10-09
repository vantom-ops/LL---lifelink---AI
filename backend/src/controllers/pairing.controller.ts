import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { pairingService } from '../services/pairing.service';
import { Patient } from '../models/Patient';

export class PairingController {
  public async generateCode(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const caregiverId = req.user!.userId;
      const { patientId } = req.body;
      if (!patientId) {
        return res.status(400).json({ success: false, message: 'patientId is required.' });
      }

      const result = await pairingService.generatePairingCode(patientId, caregiverId);
      res.json({
        success: true,
        message: 'Pairing code and QR code generated.',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  public async pairDevice(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, deviceInfo } = req.body;
      if (!code) {
        return res.status(400).json({ success: false, message: 'Pairing code is required.' });
      }

      const result = await pairingService.pairSeniorDevice(code, deviceInfo);
      res.json({
        success: true,
        message: 'Device successfully paired with caregiver profile.',
        data: {
          user: {
            id: result.user._id,
            name: result.user.name,
            role: result.user.role
          },
          patient: result.patient,
          tokens: result.tokens
        }
      });
    } catch (err) {
      next(err);
    }
  }

  public async getPairingStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { patientId } = req.params;
      const patient = await Patient.findById(patientId);
      if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

      res.json({
        success: true,
        data: {
          isPaired: !!patient.linkedUserId,
          linkedUserId: patient.linkedUserId
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

export const pairingController = new PairingController();
