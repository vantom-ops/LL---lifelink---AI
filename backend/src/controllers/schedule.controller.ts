import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { scheduleService } from '../services/schedule.service';

export class ScheduleController {
  public async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const caregiverId = req.user!.userId;
      const schedule = await scheduleService.createSchedule(caregiverId, req.body);
      res.status(201).json({ success: true, message: 'Schedule created.', data: { schedule } });
    } catch (err) {
      next(err);
    }
  }

  public async listForPatient(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { patientId } = req.params;
      const schedules = await scheduleService.getSchedulesForPatient(patientId);
      res.json({ success: true, data: { schedules } });
    } catch (err) {
      next(err);
    }
  }

  public async toggle(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const caregiverId = req.user!.userId;
      const { id } = req.params;
      const { enabled } = req.body;
      const updated = await scheduleService.toggleSchedule(caregiverId, id, enabled);
      res.json({ success: true, message: 'Schedule status updated.', data: { schedule: updated } });
    } catch (err) {
      next(err);
    }
  }

  public async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const caregiverId = req.user!.userId;
      const { id } = req.params;
      await scheduleService.deleteSchedule(caregiverId, id);
      res.json({ success: true, message: 'Schedule removed.' });
    } catch (err) {
      next(err);
    }
  }
}

export const scheduleController = new ScheduleController();
