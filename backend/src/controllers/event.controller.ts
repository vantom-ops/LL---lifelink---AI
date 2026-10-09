import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { eventService } from '../services/event.service';

export class EventController {
  public async getToday(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { patientId } = req.params;
      const events = await eventService.getOrCreateTodayEvents(patientId);
      res.json({ success: true, data: { events } });
    } catch (err) {
      next(err);
    }
  }

  public async confirmTaken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { notes, clientTimestamp } = req.body;
      const event = await eventService.confirmMedicationTaken(
        id,
        notes,
        clientTimestamp ? new Date(clientTimestamp) : undefined
      );
      res.json({ success: true, message: 'Medication recorded as TAKEN.', data: { event } });
    } catch (err) {
      next(err);
    }
  }

  public async markNotTaken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const event = await eventService.markMedicationNotTaken(id, reason);
      res.json({ success: true, message: 'Medication recorded as NOT TAKEN.', data: { event } });
    } catch (err) {
      next(err);
    }
  }

  public async resendReminder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const caregiverId = req.user!.userId;
      const { id } = req.params;
      const event = await eventService.resendReminder(caregiverId, id);
      res.json({ success: true, message: 'Reminder resent to senior phone.', data: { event } });
    } catch (err) {
      next(err);
    }
  }

  public async syncOffline(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { patientId, events } = req.body;
      if (!patientId || !Array.isArray(events)) {
        return res.status(400).json({ success: false, message: 'patientId and events array required.' });
      }

      const result = await eventService.syncOfflineQueue(patientId, events);
      res.json({
        success: true,
        message: `Offline events synced: ${result.syncedCount} updated.`,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}

export const eventController = new EventController();
