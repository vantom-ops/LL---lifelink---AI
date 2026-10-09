import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { careCircleService } from '../services/careCircle.service';
import { Patient } from '../models/Patient';

export class CareCircleController {
  public async getContacts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      let patientId = req.params.patientId || (req.query.patientId as string);
      if (!patientId) {
        const caregiverId = req.user?.userId;
        const patient = (caregiverId ? await Patient.findOne({ primaryCaregiverId: caregiverId }) : null) || await Patient.findOne();
        if (patient) {
          patientId = patient._id.toString();
        }
      }
      if (!patientId) {
        return res.status(400).json({ success: false, message: 'patientId is required' });
      }
      const contacts = await careCircleService.getContactsForPatient(patientId);
      res.json({ success: true, data: { contacts, patientId } });
    } catch (err) {
      next(err);
    }
  }

  public async addContact(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const caregiverId = req.user!.userId;
      let { patientId, ...contactData } = req.body;
      if (!patientId) {
        const patient = (caregiverId ? await Patient.findOne({ primaryCaregiverId: caregiverId }) : null) || await Patient.findOne();
        if (patient) {
          patientId = patient._id.toString();
        }
      }
      if (!patientId) {
        return res.status(400).json({ success: false, message: 'patientId is required' });
      }
      const contact = await careCircleService.addContact(caregiverId, patientId, contactData);
      res.status(201).json({
        success: true,
        message: 'Care Circle contact added successfully.',
        data: { contact }
      });
    } catch (err) {
      next(err);
    }
  }

  public async updateContact(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const caregiverId = req.user!.userId;
      const contactId = req.params.id;
      const updated = await careCircleService.updateContact(caregiverId, contactId, req.body);
      res.json({
        success: true,
        message: 'Care Circle contact updated.',
        data: { contact: updated }
      });
    } catch (err) {
      next(err);
    }
  }

  public async toggleAvailability(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const contactId = req.params.id;
      const { available } = req.body;
      const updated = await careCircleService.toggleAvailability(contactId, available);
      res.json({ success: true, data: { contact: updated } });
    } catch (err) {
      next(err);
    }
  }

  public async removeContact(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const caregiverId = req.user!.userId;
      const contactId = req.params.id;
      await careCircleService.removeContact(caregiverId, contactId);
      res.json({ success: true, message: 'Contact removed from Care Circle.' });
    } catch (err) {
      next(err);
    }
  }
}

export const careCircleController = new CareCircleController();
