import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { caregiverService } from '../services/caregiver.service';

export class CaregiverController {
  public async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const data = await caregiverService.getCaregiverProfile(userId);
      res.json({
        success: true,
        data
      });
    } catch (err) {
      next(err);
    }
  }

  public async updateMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const updated = await caregiverService.updateCaregiverProfile(userId, req.body);
      res.json({
        success: true,
        message: 'Caregiver profile updated successfully.',
        data: { caregiver: updated }
      });
    } catch (err) {
      next(err);
    }
  }
}

export const caregiverController = new CaregiverController();
