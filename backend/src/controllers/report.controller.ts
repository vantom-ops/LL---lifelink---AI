import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { reportService } from '../services/report.service';

export class ReportController {
  public async getAdherence(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { patientId } = req.params;
      const period = (req.query.period as 'day' | 'week' | 'month') || 'week';
      const stats = await reportService.getAdherenceReport(patientId, period);
      res.json({ success: true, data: { stats } });
    } catch (err) {
      next(err);
    }
  }
}

export const reportController = new ReportController();
