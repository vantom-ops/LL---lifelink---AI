import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { doctorQrService } from '../services/doctor-qr.service';

export class DoctorQrController {
  public async generateQr(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const patientId = req.params.patientId || req.params.id;
      const actorUserId = req.user?.userId;
      const actorRole = req.user?.role === 'senior' ? 'SENIOR' : 'CAREGIVER';

      const result = await doctorQrService.generateDoctorQr(patientId, actorUserId, actorRole);
      res.status(201).json({
        success: true,
        message: 'Doctor QR generated successfully.',
        data: {
          token: result.token,
          qrDataUrl: result.qrDataUrl,
          qrUrl: result.qrUrl,
          expiresAt: result.tokenRecord.expiresAt,
          version: result.tokenRecord.version,
          status: result.tokenRecord.status,
          createdAt: result.tokenRecord.createdAt
        }
      });
    } catch (err) {
      next(err);
    }
  }

  public async getActiveQr(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const patientId = req.params.patientId || req.params.id;
      const result = await doctorQrService.getActiveDoctorQr(patientId);
      
      if (!result.hasActiveToken) {
        // Automatically generate if none active
        const generated = await doctorQrService.generateDoctorQr(
          patientId,
          req.user?.userId,
          req.user?.role === 'senior' ? 'SENIOR' : 'CAREGIVER'
        );
        return res.json({
          success: true,
          data: {
            hasActiveToken: true,
            token: generated.token,
            qrDataUrl: generated.qrDataUrl,
            qrUrl: generated.qrUrl,
            expiresAt: generated.tokenRecord.expiresAt,
            version: generated.tokenRecord.version,
            status: generated.tokenRecord.status,
            createdAt: generated.tokenRecord.createdAt,
            lastAccessedAt: generated.tokenRecord.lastAccessedAt
          }
        });
      }

      res.json({
        success: true,
        data: {
          hasActiveToken: true,
          qrDataUrl: result.qrDataUrl,
          qrUrl: result.qrUrl,
          expiresAt: result.tokenRecord!.expiresAt,
          version: result.tokenRecord!.version,
          status: result.tokenRecord!.status,
          createdAt: result.tokenRecord!.createdAt,
          lastAccessedAt: result.tokenRecord!.lastAccessedAt
        }
      });
    } catch (err) {
      next(err);
    }
  }

  public async regenerateQr(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const patientId = req.params.patientId || req.params.id;
      const actorUserId = req.user?.userId;
      const actorRole = req.user?.role === 'senior' ? 'SENIOR' : 'CAREGIVER';

      const result = await doctorQrService.regenerateDoctorQr(patientId, actorUserId, actorRole);
      res.json({
        success: true,
        message: 'Doctor QR regenerated and previous token invalidated.',
        data: {
          token: result.token,
          qrDataUrl: result.qrDataUrl,
          qrUrl: result.qrUrl,
          expiresAt: result.tokenRecord.expiresAt,
          version: result.tokenRecord.version,
          status: result.tokenRecord.status,
          createdAt: result.tokenRecord.createdAt
        }
      });
    } catch (err) {
      next(err);
    }
  }

  // Doctor Access Public Endpoints (Token-Authenticated)
  public async validateQr(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ success: false, message: 'QR token is required.' });
      }

      const result = await doctorQrService.validateQrToken(token);
      if (!result.valid) {
        return res.status(400).json({ success: false, message: result.error });
      }

      res.json({
        success: true,
        message: 'QR code verified successfully.',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  public async createSession(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, doctorIdentifier } = req.body;
      if (!token) {
        return res.status(400).json({ success: false, message: 'QR token is required.' });
      }
      if (!doctorIdentifier) {
        return res.status(400).json({ success: false, message: 'Doctor / Clinic Name is required.' });
      }

      const ip = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await doctorQrService.createDoctorSession(token, doctorIdentifier, ip, userAgent);
      res.status(201).json({
        success: true,
        message: 'Doctor read-only session authorized.',
        data: {
          sessionId: result.session.sessionId,
          expiresAt: result.session.expiresAt,
          permissions: result.session.permissions,
          patientSummary: result.patientSummary
        }
      });
    } catch (err: any) {
      res.status(403).json({ success: false, message: err.message });
    }
  }

  public async getSessionData(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      const data = await doctorQrService.getDoctorSessionData(sessionId);
      res.json({
        success: true,
        data
      });
    } catch (err: any) {
      res.status(403).json({ success: false, message: err.message });
    }
  }

  public async endSession(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      const result = await doctorQrService.endDoctorSession(sessionId);
      res.json({
        success: true,
        message: result.message
      });
    } catch (err) {
      next(err);
    }
  }
}

export const doctorQrController = new DoctorQrController();
