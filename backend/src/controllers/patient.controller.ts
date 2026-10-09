import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { patientService } from '../services/patient.service';

export class PatientController {
  public async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const caregiverId = req.user!.userId;
      const patient = await patientService.createPatient(caregiverId, req.body);
      res.status(201).json({
        success: true,
        message: 'Senior profile created successfully.',
        data: { patient }
      });
    } catch (err) {
      next(err);
    }
  }

  public async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const caregiverId = req.user!.userId;
      const patients = await patientService.getPatientsForCaregiver(caregiverId);
      res.json({
        success: true,
        data: { patients }
      });
    } catch (err) {
      next(err);
    }
  }

  public async getOne(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const patientId = req.params.patientId || req.params.id;
      const caregiverId = req.user?.role === 'caregiver' ? req.user.userId : undefined;
      const patient = await patientService.getPatientById(patientId, caregiverId);
      if (!patient) {
        return res.status(404).json({ success: false, message: 'Patient not found' });
      }
      res.json({ success: true, data: { patient } });
    } catch (err) {
      next(err);
    }
  }

  public async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const patientId = req.params.patientId || req.params.id;
      const actorUserId = req.user!.userId;
      const actorRole = req.user?.role === 'senior' ? 'SENIOR' : 'CAREGIVER';

      const updated = await patientService.updatePatient(patientId, actorUserId, req.body, actorRole);
      res.json({
        success: true,
        message: 'Patient profile updated.',
        data: { patient: updated }
      });
    } catch (err) {
      next(err);
    }
  }

  public async getHealthCondition(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const patientId = req.params.patientId || req.params.id;
      const condition = await patientService.getHealthCondition(patientId);
      res.json({
        success: true,
        data: { healthCondition: condition }
      });
    } catch (err) {
      next(err);
    }
  }

  public async updateHealthCondition(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const patientId = req.params.patientId || req.params.id;
      const actorUserId = req.user!.userId;
      const actorRole = req.user?.role === 'senior' ? 'SENIOR' : 'CAREGIVER';

      const updated = await patientService.updateHealthCondition(
        patientId,
        actorUserId,
        actorRole,
        req.body
      );

      res.json({
        success: true,
        message: 'Health condition profile updated successfully.',
        data: { healthCondition: updated }
      });
    } catch (err) {
      next(err);
    }
  }
}

export const patientController = new PatientController();
