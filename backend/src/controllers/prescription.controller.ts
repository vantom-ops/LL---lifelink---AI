import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { prescriptionService } from '../services/prescription.service';
import { storageService } from '../services/storage.service';

export class PrescriptionController {
  public async upload(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Please upload a prescription image or document.' });
      }

      const caregiverId = req.user!.userId;
      const { patientId } = req.body;
      if (!patientId) {
        return res.status(400).json({ success: false, message: 'patientId is required.' });
      }

      // Save file securely
      const stored = await storageService.saveBuffer(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      // Process OCR and candidate extraction
      const prescription = await prescriptionService.uploadAndProcessPrescription(
        caregiverId,
        patientId,
        req.file.buffer,
        req.file.originalname,
        stored.url
      );

      res.status(201).json({
        success: true,
        message: 'Prescription uploaded and scanned. Review extracted medications before activation.',
        data: { prescription }
      });
    } catch (err) {
      next(err);
    }
  }

  public async verifyAndActivate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const caregiverId = req.user!.userId;
      const { id } = req.params;
      const { confirmedMedications } = req.body;

      if (!Array.isArray(confirmedMedications) || confirmedMedications.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one confirmed medication is required to activate schedule.'
        });
      }

      const result = await prescriptionService.verifyAndActivatePrescription(
        caregiverId,
        id,
        confirmedMedications
      );

      res.json({
        success: true,
        message: 'Medications successfully verified and scheduled!',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  public async listForPatient(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { patientId } = req.params;
      const prescriptions = await prescriptionService.getPrescriptionsForPatient(patientId);
      res.json({ success: true, data: { prescriptions } });
    } catch (err) {
      next(err);
    }
  }

  public async getOne(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const prescription = await prescriptionService.getPrescriptionById(id);
      if (!prescription) {
        return res.status(404).json({ success: false, message: 'Prescription not found.' });
      }
      res.json({ success: true, data: { prescription } });
    } catch (err) {
      next(err);
    }
  }
}

export const prescriptionController = new PrescriptionController();
