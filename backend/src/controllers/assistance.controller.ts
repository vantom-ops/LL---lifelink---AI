import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { assistanceService } from '../services/assistance.service';
import { escalationEngineService } from '../services/escalationEngine.service';
import { AssistanceRequest } from '../models/AssistanceRequest';
import { AssistanceEvent } from '../models/AssistanceEvent';

export class AssistanceController {
  public async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const requests = await AssistanceRequest.find()
        .populate('patientId')
        .populate('medicationEventId')
        .sort({ createdAt: -1 })
        .limit(50);
      res.json({ success: true, data: { requests } });
    } catch (err) {
      next(err);
    }
  }

  public async getEvents(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const requestId = req.params.requestId;
      const events = await AssistanceEvent.find({ requestId })
        .sort({ timestamp: 1 });
      res.json({ success: true, data: { events } });
    } catch (err) {
      next(err);
    }
  }

  public async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const request = await assistanceService.createRequest(req.body);
      res.status(201).json({
        success: true,
        message: 'Medication assistance request created and escalated.',
        data: { request }
      });
    } catch (err) {
      next(err);
    }
  }

  public async getActive(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const patientId = req.params.patientId;
      const request = await assistanceService.getActiveRequest(patientId);
      res.json({ success: true, data: { request } });
    } catch (err) {
      next(err);
    }
  }

  public async respond(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const requestId = req.params.requestId;
      const { action, declineReason, name, phone, role } = req.body;
      const responder = {
        userId: req.user?.userId || req.body.userId,
        role: role || (req.user?.role === 'caregiver' ? 'primary_caregiver' : 'trusted_contact'),
        name: name || req.user?.name || 'Helper',
        phone: phone || req.user?.phone || '+91 98400 12345'
      };

      const updated = await assistanceService.respondToRequest(requestId, responder, action, declineReason);
      res.json({
        success: true,
        message: action === 'ACCEPT' ? 'Assistance request accepted.' : 'Request declined. Escalated to next care-circle stage.',
        data: { request: updated }
      });
    } catch (err) {
      next(err);
    }
  }

  public async markArrived(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const requestId = req.params.requestId;
      const helperUserId = req.user?.userId || req.body.helperUserId;
      const updated = await assistanceService.markArrived(requestId, helperUserId);
      res.json({ success: true, message: 'Helper arrival recorded.', data: { request: updated } });
    } catch (err) {
      next(err);
    }
  }

  public async markStarted(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const requestId = req.params.requestId;
      const helperUserId = req.user?.userId || req.body.helperUserId;
      const updated = await assistanceService.markStarted(requestId, helperUserId);
      res.json({ success: true, message: 'Assistance started.', data: { request: updated } });
    } catch (err) {
      next(err);
    }
  }

  public async markCompleted(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const requestId = req.params.requestId;
      const helperUserId = req.user?.userId || req.body.helperUserId;
      const updated = await assistanceService.markCompleted(requestId, helperUserId, req.body);
      res.json({ success: true, message: 'Medication assistance completed.', data: { request: updated } });
    } catch (err) {
      next(err);
    }
  }

  public async confirm(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const requestId = req.params.requestId;
      const actorRole = (req.body.actorRole || (req.user?.role === 'senior' ? 'senior' : 'primary_caregiver')) as 'senior' | 'primary_caregiver';
      const updated = await assistanceService.confirmAssistance(requestId, actorRole);
      res.json({ success: true, message: 'Assistance confirmed.', data: { request: updated } });
    } catch (err) {
      next(err);
    }
  }

  public async cancel(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const requestId = req.params.requestId;
      const role = req.user?.role || 'senior';
      const updated = await assistanceService.cancelRequest(requestId, role, req.body.reason);
      res.json({ success: true, message: 'Assistance request cancelled.', data: { request: updated } });
    } catch (err) {
      next(err);
    }
  }

  public async getHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const patientId = req.params.patientId;
      const history = await assistanceService.getHistory(patientId);
      res.json({ success: true, data: { history } });
    } catch (err) {
      next(err);
    }
  }

  public async getHelperView(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const requestId = req.params.requestId;
      const helperView = await assistanceService.getAuthorizedHelperMedicationView(requestId);
      res.json({ success: true, data: { helperView } });
    } catch (err) {
      next(err);
    }
  }

  public async forceAdvance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const requestId = req.params.requestId;
      const updated = await escalationEngineService.forceAdvance(requestId);
      res.json({ success: true, message: 'Escalation stage fast-forwarded.', data: { request: updated } });
    } catch (err) {
      next(err);
    }
  }

  public async getConfig(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const config = escalationEngineService.getConfig();
      res.json({ success: true, data: { config } });
    } catch (err) {
      next(err);
    }
  }

  public async updateConfig(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const updated = escalationEngineService.updateConfig(req.body);
      res.json({ success: true, message: 'Escalation configuration saved.', data: { config: updated } });
    } catch (err) {
      next(err);
    }
  }

  public async submitOffer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const requestId = req.params.requestId;
      const { caregiverId, caregiverName, caregiverPhone, hospital, department, experienceYears, rating, offeredFee, estimatedArrival, notes } = req.body;
      const updated = await assistanceService.submitOffer(requestId, {
        caregiverId: caregiverId || req.user?.userId || 'unknown-caregiver',
        caregiverName: caregiverName || req.user?.name || 'Professional Caregiver',
        caregiverPhone: caregiverPhone || req.user?.phone || '+91 98400 77889',
        hospital,
        department,
        experienceYears,
        rating,
        offeredFee: Number(offeredFee) || 350,
        estimatedArrival,
        notes
      });
      res.json({
        success: true,
        message: 'Assistance offer submitted to family monitor successfully.',
        data: { request: updated, offers: updated.offers }
      });
    } catch (err) {
      next(err);
    }
  }

  public async acceptOffer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const requestId = req.params.requestId;
      const offerId = req.params.offerId;
      const result = await assistanceService.acceptOffer(requestId, offerId);
      res.json({
        success: true,
        message: 'Professional caregiver offer accepted. Address & contact information shared.',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  public async rejectOffer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const requestId = req.params.requestId;
      const offerId = req.params.offerId;
      const updated = await assistanceService.rejectOffer(requestId, offerId);
      res.json({
        success: true,
        message: 'Offer declined.',
        data: { request: updated }
      });
    } catch (err) {
      next(err);
    }
  }
}

export const assistanceController = new AssistanceController();
