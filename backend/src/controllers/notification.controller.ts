import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { notificationService } from '../services/notification.service';
import { Patient } from '../models/Patient';

export class NotificationController {
  public async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const limit = parseInt(req.query.limit as string, 10) || 30;
      const data = await notificationService.getNotificationsForUser(userId, limit);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public async markRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const updated = await notificationService.markAsRead(id, userId);
      res.json({ success: true, message: 'Notification marked as read.', updated });
    } catch (err) {
      next(err);
    }
  }

  public async markAllRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const count = await notificationService.markAllAsRead(userId);
      res.json({ success: true, message: `${count} notifications marked as read.` });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Senior triggers a direct "Request Caregiver Contact" call-back request
   */
  public async requestCaregiverContact(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { patientId } = req.body;
      const patient = await Patient.findById(patientId);
      if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

      await notificationService.notifyCaregiversForPatient(
        patientId,
        'SENIOR_REQUESTED_CONTACT',
        `Urgent: ${patient.preferredName || patient.fullName} requested contact`,
        `${patient.preferredName || patient.fullName} tapped "Call Caregiver" on their LL LifeLink mobile app. Please check on them.`,
        { patientId, emergencyPhone: patient.emergencyContactPhone }
      );

      res.json({
        success: true,
        message: 'Your caregiver has been notified to call you immediately.'
      });
    } catch (err) {
      next(err);
    }
  }
}

export const notificationController = new NotificationController();
