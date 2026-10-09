import mongoose from 'mongoose';
import { MedicationEvent } from '../models/MedicationEvent';
import { CaregiverPatientLink } from '../models/CaregiverPatientLink';

export interface AdherenceStats {
  period: 'day' | 'week' | 'month';
  totalScheduled: number;
  takenCount: number;
  lateCount: number;
  missedCount: number;
  pendingCount: number;
  notTakenCount: number;
  takenPercentage: number;
  latePercentage: number;
  missedPercentage: number;
  dailyBreakdown: Array<{
    date: string;
    taken: number;
    late: number;
    missed: number;
    pending: number;
  }>;
}

export class ReportService {
  public async getAdherenceReport(
    patientId: string,
    period: 'day' | 'week' | 'month' = 'week'
  ): Promise<AdherenceStats> {
    const now = new Date();
    let startDate = new Date();

    if (period === 'day') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    } else if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
      startDate.setDate(now.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    }

    const events = await MedicationEvent.find({
      patientId: new mongoose.Types.ObjectId(patientId),
      scheduledTime: { $gte: startDate, $lte: now }
    }).sort({ scheduledTime: 1 });

    const totalScheduled = events.length;
    let takenCount = 0;
    let lateCount = 0;
    let missedCount = 0;
    let pendingCount = 0;
    let notTakenCount = 0;

    const breakdownMap: Record<string, { taken: number; late: number; missed: number; pending: number }> = {};

    for (const ev of events) {
      const dateKey = ev.scheduledTime.toISOString().split('T')[0];
      if (!breakdownMap[dateKey]) {
        breakdownMap[dateKey] = { taken: 0, late: 0, missed: 0, pending: 0 };
      }

      switch (ev.status) {
        case 'TAKEN':
          takenCount++;
          breakdownMap[dateKey].taken++;
          break;
        case 'LATE':
          lateCount++;
          breakdownMap[dateKey].late++;
          break;
        case 'MISSED':
          missedCount++;
          breakdownMap[dateKey].missed++;
          break;
        case 'NOT_TAKEN':
          notTakenCount++;
          breakdownMap[dateKey].missed++;
          break;
        case 'PENDING_CONFIRMATION':
        case 'DUE':
        case 'UPCOMING':
          pendingCount++;
          breakdownMap[dateKey].pending++;
          break;
      }
    }

    const totalResponded = takenCount + lateCount + missedCount + notTakenCount;
    const takenPercentage = totalScheduled > 0 ? Math.round((takenCount / totalScheduled) * 100) : 100;
    const latePercentage = totalScheduled > 0 ? Math.round((lateCount / totalScheduled) * 100) : 0;
    const missedPercentage = totalScheduled > 0 ? Math.round(((missedCount + notTakenCount) / totalScheduled) * 100) : 0;

    const dailyBreakdown = Object.keys(breakdownMap).map(date => ({
      date,
      ...breakdownMap[date]
    }));

    return {
      period,
      totalScheduled,
      takenCount,
      lateCount,
      missedCount,
      pendingCount,
      notTakenCount,
      takenPercentage,
      latePercentage,
      missedPercentage,
      dailyBreakdown
    };
  }
}

export const reportService = new ReportService();
