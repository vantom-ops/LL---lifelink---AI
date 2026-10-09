import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { medicationService } from '../services/medication.service';

export class MedicationController {
  public async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const caregiverId = req.user!.userId;
      const medication = await medicationService.createMedication(caregiverId, req.body);
      res.status(201).json({
        success: true,
        message: 'Medication created.',
        data: { medication }
      });
    } catch (err) {
      next(err);
    }
  }

  public async listForPatient(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { patientId } = req.params;
      const includeArchived = req.query.includeArchived === 'true';
      const medications = await medicationService.getMedicationsForPatient(patientId, includeArchived);
      res.json({ success: true, data: { medications } });
    } catch (err) {
      next(err);
    }
  }

  public async getOne(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const medication = await medicationService.getMedicationById(id);
      if (!medication) return res.status(404).json({ success: false, message: 'Medication not found.' });
      res.json({ success: true, data: { medication } });
    } catch (err) {
      next(err);
    }
  }

  public async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const caregiverId = req.user!.userId;
      const { id } = req.params;
      const updated = await medicationService.updateMedication(caregiverId, id, req.body);
      res.json({ success: true, message: 'Medication updated.', data: { medication: updated } });
    } catch (err) {
      next(err);
    }
  }

  public async archive(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const caregiverId = req.user!.userId;
      const { id } = req.params;
      const { reason } = req.body;
      const archived = await medicationService.archiveMedication(caregiverId, id, reason);
      res.json({ success: true, message: 'Medication archived.', data: { medication: archived } });
    } catch (err) {
      next(err);
    }
  }
}

export const medicationController = new MedicationController();
