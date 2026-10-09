import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { privacyService } from '../services/privacy.service';

export class PrivacyController {
  public async getPrivacy(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const patientId = req.params.patientId || req.params.id;
      const settings = await privacyService.getPrivacySettings(patientId);
      res.json({
        success: true,
        data: { privacy: settings }
      });
    } catch (err) {
      next(err);
    }
  }

  public async updatePrivacy(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const patientId = req.params.patientId || req.params.id;
      const actorUserId = req.user!.userId;
      const actorRole = req.user?.role === 'senior' ? 'SENIOR' : 'CAREGIVER';

      const updated = await privacyService.updatePrivacySettings(
        patientId,
        actorUserId,
        actorRole,
        req.body
      );

      res.json({
        success: true,
        message: 'Privacy settings updated successfully.',
        data: { privacy: updated }
      });
    } catch (err) {
      next(err);
    }
  }

  public async getAccessHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const patientId = req.params.patientId || req.params.id;
      const history = await privacyService.getAccessHistory(patientId);
      res.json({
        success: true,
        data: { history }
      });
    } catch (err) {
      next(err);
    }
  }
}

export const privacyController = new PrivacyController();
