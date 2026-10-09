import { Request, Response, NextFunction } from 'express';
import { seedDatabase } from '../scripts/seed';
import { schedulerService } from '../services/scheduler.service';

export class DemoController {
  public async seed(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await seedDatabase();
      res.json({
        success: true,
        message: 'Demo database seeded successfully with real models and accounts!',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  public async simulateTimeout(req: Request, res: Response, next: NextFunction) {
    try {
      const { patientId } = req.body;
      const result = await schedulerService.simulateFiveMinuteTimeout(patientId);
      res.json({
        success: true,
        message: `Fast-forward simulated: ${result.escalatedCount} medication(s) escalated to PENDING_CONFIRMATION with caregiver alerts.`,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}

export const demoController = new DemoController();
