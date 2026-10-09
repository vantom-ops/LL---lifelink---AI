import mongoose from 'mongoose';
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { professionalCaregiverService } from '../services/professionalCaregiver.service';
import { AssistanceRequest } from '../models/AssistanceRequest';
import { CaregiverMessage } from '../models/CaregiverMessage';
import { User } from '../models/User';
import { authService } from '../services/auth.service';
import { notificationService } from '../services/notification.service';

export class ProfessionalCaregiverController {
  public async register(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      let userId = req.user?.userId;
      if (!userId) {
        const email = req.body.email ? req.body.email.trim().toLowerCase() : undefined;
        const phone = req.body.phone ? req.body.phone.trim() : undefined;
        let u = null;
        if (email || phone) {
          const conditions: any[] = [];
          if (email) conditions.push({ email });
          if (phone) conditions.push({ phone });
          u = await User.findOne({ $or: conditions });
        }
        if (!u) {
          const pwHash = await authService.hashPassword('Password123!');
          u = await User.create({
            name: req.body.fullName || 'Professional Caregiver',
            email: email || `caregiver-${Date.now()}@lifelink.com`,
            phone: phone || '+91 98400 99999',
            passwordHash: pwHash,
            role: 'caregiver',
            isActive: true
          });
        }
        userId = u._id.toString();
      }

      const profile = await professionalCaregiverService.register(userId, req.body);
      res.status(201).json({
        success: true,
        message: 'Professional caregiver profile submitted. Status: PENDING_VERIFICATION.',
        data: { profile, caregiver: profile }
      });
    } catch (err) {
      next(err);
    }
  }

  public async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const profile = await professionalCaregiverService.getByUserId(userId);
      res.json({ success: true, data: { profile } });
    } catch (err) {
      next(err);
    }
  }

  public async updateAvailability(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { isAvailable, coordinates } = req.body;
      const updated = await professionalCaregiverService.updateAvailability(userId, isAvailable, coordinates);
      res.json({ success: true, message: 'Availability updated.', data: { profile: updated } });
    } catch (err) {
      next(err);
    }
  }

  public async getNearbyRequests(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const caregiverId = (req.query.caregiverId as string) || req.user?.userId;

      // Find active requests open for offers or assistance
      const availableRequests = await AssistanceRequest.find({
        status: {
          $in: [
            'PRIMARY_CAREGIVER_ALERTED',
            'ALTERNATIVE_CONTACTS_ALERTED',
            'PROFESSIONAL_SEARCH',
            'PROFESSIONAL_ALERTED'
          ]
        }
      })
        .populate('patientId', 'preferredName age gender condition primaryLanguage')
        .sort({ createdAt: -1 });

      // Find requests accepted by this caregiver
      let myDispatches: any[] = [];
      if (caregiverId) {
        myDispatches = await AssistanceRequest.find({
          status: { $in: ['ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'ASSISTANCE_STARTED'] },
          $or: [
            { 'acceptedBy.helperId': caregiverId },
            { 'offers': { $elemMatch: { caregiverId: caregiverId, status: 'ACCEPTED' } } }
          ]
        })
          .populate('patientId')
          .populate('primaryCaregiverId', 'name phone email')
          .sort({ acceptedAt: -1 });
      }

      res.json({
        success: true,
        data: {
          requests: availableRequests,
          availableRequests,
          myDispatches
        }
      });
    } catch (err) {
      next(err);
    }
  }

  public async adminListAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const statusFilter = req.query.status as string;
      const caregivers = await professionalCaregiverService.listAll(statusFilter);
      res.json({ success: true, data: { caregivers } });
    } catch (err) {
      next(err);
    }
  }

  public async adminReview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const adminUserId = req.user?.userId || 'system-admin';
      const caregiverId = req.params.id;
      const rawAction = req.body.action || (req.body.status === 'VERIFIED' ? 'APPROVE' : req.body.status === 'REJECTED' ? 'REJECT' : 'SUSPEND');
      const action = rawAction.toUpperCase() as 'APPROVE' | 'REJECT' | 'SUSPEND';
      const notes = req.body.notes || req.body.verificationNotes;

      const reviewed = await professionalCaregiverService.reviewVerification(adminUserId, caregiverId, action, notes);
      res.json({
        success: true,
        message: `Professional caregiver verification ${action}D.`,
        data: { profile: reviewed, caregiver: reviewed }
      });
    } catch (err) {
      next(err);
    }
  }

  public async getMessages(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const caregiverId = req.params.id;
      const messages = await CaregiverMessage.find({
        caregiverId: new mongoose.Types.ObjectId(caregiverId)
      }).sort({ createdAt: 1 });
      res.json({ success: true, data: { messages } });
    } catch (err) {
      next(err);
    }
  }

  public async sendMessage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const caregiverId = req.params.id;
      const { text, senderRole, senderName, senderPhone } = req.body;
      const msg = await CaregiverMessage.create({
        caregiverId: new mongoose.Types.ObjectId(caregiverId),
        senderRole: senderRole || 'family_monitor',
        senderName: senderName || req.user?.name || 'Family Monitor',
        senderPhone: senderPhone || req.user?.phone || '+91 98400 12345',
        text: text.trim()
      });

      try {
        const io = notificationService.getSocketIO();
        if (io) {
          io.emit('caregiver_message', {
            caregiverId,
            message: msg
          });
        }
      } catch (e) {
        console.warn('Socket emit warning:', e);
      }

      res.status(201).json({ success: true, message: 'Message sent.', data: { message: msg } });
    } catch (err) {
      next(err);
    }
  }
}

export const professionalCaregiverController = new ProfessionalCaregiverController();
