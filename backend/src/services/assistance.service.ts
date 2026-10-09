import mongoose from 'mongoose';
import { AssistanceRequest, IAssistanceRequest, AssistanceStatus } from '../models/AssistanceRequest';
import { AssistanceEvent } from '../models/AssistanceEvent';
import { Patient } from '../models/Patient';
import { User } from '../models/User';
import { CareCircleContact } from '../models/CareCircleContact';
import { ProfessionalCaregiver } from '../models/ProfessionalCaregiver';
import { MedicationEvent } from '../models/MedicationEvent';
import { notificationService } from './notification.service';
import { auditService } from './audit.service';
import { paymentService } from './payment.service';

export class AssistanceService {
  /**
   * Senior or caregiver creates a physical assistance request
   */
  public async createRequest(data: {
    patientId: string;
    medicationEventId?: string;
    reason?: string;
    medicineLocationNotes?: string;
    priority?: 'HIGH' | 'NORMAL';
    patientCoordinates?: [number, number];
    approximateArea?: string;
  }): Promise<IAssistanceRequest> {
    const patient = await Patient.findById(data.patientId);
    if (!patient) throw new Error('Patient not found');

    // Check if an active assistance request already exists for this patient
    const active = await AssistanceRequest.findOne({
      patientId: new mongoose.Types.ObjectId(data.patientId),
      status: {
        $in: [
          'PRIMARY_CAREGIVER_ALERTED',
          'ALTERNATIVE_CONTACTS_ALERTED',
          'PROFESSIONAL_SEARCH',
          'PROFESSIONAL_ALERTED',
          'ACCEPTED',
          'EN_ROUTE',
          'ARRIVED',
          'ASSISTANCE_STARTED'
        ]
      }
    });

    if (active) {
      return active; // Return existing active request idempotently
    }

    // Find primary caregiver
    const caregiverUser = await User.findOne({ role: 'caregiver' });
    const primaryCaregiverId = caregiverUser?._id || patient.linkedUserId;

    const request = new AssistanceRequest({
      patientId: patient._id,
      medicationEventId: data.medicationEventId ? new mongoose.Types.ObjectId(data.medicationEventId) : undefined,
      primaryCaregiverId,
      currentEscalationStage: 'PRIMARY_CAREGIVER_ALERTED',
      status: 'PRIMARY_CAREGIVER_ALERTED',
      reason: data.reason || 'Physical disability - difficulty handling scheduled medication',
      medicineLocationNotes: data.medicineLocationNotes || 'Bedside medicine organizer',
      priority: data.priority || 'HIGH',
      dueAt: new Date(),
      location: {
        type: 'Point',
        coordinates: data.patientCoordinates || [80.2707, 13.0827]
      },
      approximateArea: data.approximateArea || patient.address || 'T. Nagar, Chennai',
      paymentRequired: false,
      fee: 0
    });

    await request.save();

    // Log immutable audit event
    await this.logEvent(request._id.toString(), patient._id.toString(), 'CREATED', 'PRIMARY_CAREGIVER_ALERTED', 'senior', 'Senior requested physical medication assistance');

    // Notify primary caregiver via socket and notifications
    await this.dispatchStageNotification(request, 'PRIMARY_CAREGIVER_ALERTED');

    return request;
  }

  /**
   * Helper or caregiver responds to an assistance request (Accept or Decline)
   */
  public async respondToRequest(
    requestId: string,
    responder: {
      userId: string;
      role: 'primary_caregiver' | 'trusted_contact' | 'professional_caregiver';
      name: string;
      phone: string;
    },
    action: 'ACCEPT' | 'DECLINE',
    declineReason?: string
  ): Promise<IAssistanceRequest> {
    const request = await AssistanceRequest.findById(requestId);
    if (!request) throw new Error('Assistance request not found');

    if (request.status === 'ACCEPTED' || request.status === 'COMPLETED' || request.status === 'CANCELLED') {
      throw new Error(`Cannot respond: Request is already ${request.status}`);
    }

    if (action === 'ACCEPT') {
      const fromStatus = request.status;
      request.status = 'ACCEPTED';
      request.currentEscalationStage = 'ACCEPTED';
      request.acceptedAt = new Date();
      request.acceptedBy = {
        helperId: new mongoose.Types.ObjectId(responder.userId),
        helperType: responder.role,
        helperName: responder.name,
        helperPhone: responder.phone
      };

      // If accepted by professional caregiver, fee applies
      if (responder.role === 'professional_caregiver') {
        request.paymentRequired = true;
        request.fee = 350; // Standard authorized service fee (₹350)
        await paymentService.createAssistanceOrder(
          request._id.toString(),
          request.patientId.toString(),
          request.primaryCaregiverId.toString(),
          350,
          responder.userId
        );
      }

      await request.save();

      await this.logEvent(
        requestId,
        request.patientId.toString(),
        fromStatus,
        'ACCEPTED',
        responder.role,
        `Assistance accepted by ${responder.name} (${responder.role})`,
        new mongoose.Types.ObjectId(responder.userId)
      );

      // Notify senior & primary caregiver that help is on the way!
      await this.dispatchStageNotification(request, 'ACCEPTED');

      return request;
    } else {
      // DECLINE: Advance escalation to next care-circle stage!
      await this.logEvent(
        requestId,
        request.patientId.toString(),
        request.status,
        request.status,
        responder.role,
        `Assistance declined by ${responder.name}: ${declineReason || 'Unavailable'}`,
        new mongoose.Types.ObjectId(responder.userId)
      );

      return this.advanceEscalation(request);
    }
  }

  /**
   * Advance the request to the next progressive escalation stage
   */
  public async advanceEscalation(request: IAssistanceRequest): Promise<IAssistanceRequest> {
    const current = request.status;

    if (current === 'PRIMARY_CAREGIVER_ALERTED') {
      // Check if trusted contacts exist
      const contactsCount = await CareCircleContact.countDocuments({
        patientId: request.patientId,
        available: true,
        consentStatus: 'ACCEPTED'
      });

      if (contactsCount > 0) {
        request.status = 'ALTERNATIVE_CONTACTS_ALERTED';
        request.currentEscalationStage = 'ALTERNATIVE_CONTACTS_ALERTED';
      } else {
        request.status = 'PROFESSIONAL_SEARCH';
        request.currentEscalationStage = 'PROFESSIONAL_SEARCH';
      }
    } else if (current === 'ALTERNATIVE_CONTACTS_ALERTED') {
      request.status = 'PROFESSIONAL_SEARCH';
      request.currentEscalationStage = 'PROFESSIONAL_SEARCH';
    } else if (current === 'PROFESSIONAL_SEARCH') {
      // Find eligible nearby verified professionals
      request.status = 'PROFESSIONAL_ALERTED';
      request.currentEscalationStage = 'PROFESSIONAL_ALERTED';
    }

    await request.save();

    await this.logEvent(
      request._id.toString(),
      request.patientId.toString(),
      current,
      request.status,
      'system',
      `Escalation auto-progressed to ${request.status}`
    );

    await this.dispatchStageNotification(request, request.status);

    return request;
  }

  /**
   * Helper marks ARRIVED at senior's home
   */
  public async markArrived(requestId: string, helperUserId: string): Promise<IAssistanceRequest> {
    const request = await AssistanceRequest.findById(requestId);
    if (!request) throw new Error('Request not found');

    const fromStatus = request.status;
    request.status = 'ARRIVED';
    request.currentEscalationStage = 'ARRIVED';
    request.arrivedAt = new Date();
    await request.save();

    await this.logEvent(requestId, request.patientId.toString(), fromStatus, 'ARRIVED', 'helper', 'Helper arrived at senior patient location', new mongoose.Types.ObjectId(helperUserId));
    await this.dispatchStageNotification(request, 'ARRIVED');
    return request;
  }

  /**
   * Helper marks ASSISTANCE_STARTED
   */
  public async markStarted(requestId: string, helperUserId: string): Promise<IAssistanceRequest> {
    const request = await AssistanceRequest.findById(requestId);
    if (!request) throw new Error('Request not found');

    const fromStatus = request.status;
    request.status = 'ASSISTANCE_STARTED';
    request.currentEscalationStage = 'ASSISTANCE_STARTED';
    request.startedAt = new Date();
    await request.save();

    await this.logEvent(requestId, request.patientId.toString(), fromStatus, 'ASSISTANCE_STARTED', 'helper', 'Physical medication assistance started with senior', new mongoose.Types.ObjectId(helperUserId));
    await this.dispatchStageNotification(request, 'ASSISTANCE_STARTED');
    return request;
  }

  /**
   * Helper marks COMPLETED
   */
  public async markCompleted(
    requestId: string,
    helperUserId: string,
    data: {
      completionMethod?: 'ASSISTED_HANDOFF' | 'ASSISTED_OPENED' | 'DIRECT_SUPERVISION';
      notes?: string;
    }
  ): Promise<IAssistanceRequest> {
    const request = await AssistanceRequest.findById(requestId);
    if (!request) throw new Error('Request not found');

    const fromStatus = request.status;
    request.status = 'COMPLETED';
    request.currentEscalationStage = 'COMPLETED';
    request.completedAt = new Date();
    request.completionMethod = data.completionMethod || 'ASSISTED_OPENED';
    if (data.notes) request.notes = data.notes;
    await request.save();

    await this.logEvent(requestId, request.patientId.toString(), fromStatus, 'COMPLETED', 'helper', `Assistance completed via ${request.completionMethod}. Note: ${data.notes || 'None'}`, new mongoose.Types.ObjectId(helperUserId));

    // Also mark associated medication event as taken if linked
    if (request.medicationEventId) {
      await MedicationEvent.findByIdAndUpdate(request.medicationEventId, {
        status: 'TAKEN',
        takenAt: new Date(),
        confirmedBy: 'CAREGIVER'
      });
    }

    await this.dispatchStageNotification(request, 'COMPLETED');
    return request;
  }

  /**
   * Senior or primary caregiver confirms completed assistance
   */
  public async confirmAssistance(
    requestId: string,
    actorRole: 'senior' | 'primary_caregiver'
  ): Promise<IAssistanceRequest> {
    const request = await AssistanceRequest.findById(requestId);
    if (!request) throw new Error('Request not found');

    if (actorRole === 'senior') {
      request.patientConfirmation = true;
    } else {
      request.caregiverConfirmation = true;
    }
    await request.save();

    await this.logEvent(requestId, request.patientId.toString(), 'COMPLETED', 'COMPLETED', actorRole, `Assistance verified and confirmed by ${actorRole}`);
    return request;
  }

  /**
   * Cancel assistance request
   */
  public async cancelRequest(requestId: string, cancelledByRole: string, reason?: string): Promise<IAssistanceRequest> {
    const request = await AssistanceRequest.findById(requestId);
    if (!request) throw new Error('Request not found');

    const fromStatus = request.status;
    request.status = 'CANCELLED';
    request.currentEscalationStage = 'CANCELLED';
    request.cancelledAt = new Date();
    request.notes = reason || 'Cancelled by user';
    await request.save();

    await this.logEvent(requestId, request.patientId.toString(), fromStatus, 'CANCELLED', cancelledByRole, `Request cancelled: ${reason || 'User cancelled'}`);
    await this.dispatchStageNotification(request, 'CANCELLED');
    return request;
  }

  /**
   * Get active request for a patient
   */
  public async getActiveRequest(patientId: string): Promise<IAssistanceRequest | null> {
    return AssistanceRequest.findOne({
      patientId: new mongoose.Types.ObjectId(patientId),
      status: {
        $in: [
          'PRIMARY_CAREGIVER_ALERTED',
          'ALTERNATIVE_CONTACTS_ALERTED',
          'PROFESSIONAL_SEARCH',
          'PROFESSIONAL_ALERTED',
          'ACCEPTED',
          'EN_ROUTE',
          'ARRIVED',
          'ASSISTANCE_STARTED'
        ]
      }
    });
  }

  /**
   * Get complete historical assistance records
   */
  public async getHistory(patientId: string): Promise<IAssistanceRequest[]> {
    return AssistanceRequest.find({ patientId: new mongoose.Types.ObjectId(patientId) })
      .sort({ createdAt: -1 })
      .limit(30);
  }

  /**
   * Get audit events for a request
   */
  public async getRequestEvents(requestId: string): Promise<any[]> {
    return AssistanceEvent.find({ requestId: new mongoose.Types.ObjectId(requestId) })
      .sort({ createdAt: 1 });
  }

  /**
   * Professional caregiver submits an assistance offer/bid
   */
  public async submitOffer(
    requestId: string,
    data: {
      caregiverId: string;
      caregiverName: string;
      caregiverPhone: string;
      hospital?: string;
      department?: string;
      experienceYears?: number;
      rating?: number;
      offeredFee: number;
      estimatedArrival?: string;
      notes?: string;
    }
  ): Promise<IAssistanceRequest> {
    const request = await AssistanceRequest.findById(requestId);
    if (!request) throw new Error('Assistance request not found');

    if (request.status === 'COMPLETED' || request.status === 'CANCELLED') {
      throw new Error(`Cannot submit offer: Request is ${request.status}`);
    }

    const offerObj = {
      caregiverId: new mongoose.Types.ObjectId(data.caregiverId),
      caregiverName: data.caregiverName,
      caregiverPhone: data.caregiverPhone,
      hospital: data.hospital || 'Apollo Hospitals, Greams Road',
      department: data.department || 'Geriatric Care & Critical Nursing',
      experienceYears: data.experienceYears ?? 3,
      rating: data.rating ?? 4.9,
      offeredFee: data.offeredFee || 350,
      estimatedArrival: data.estimatedArrival || '15 mins',
      notes: data.notes || '',
      status: 'PENDING' as const,
      offeredAt: new Date()
    };

    if (!request.offers) request.offers = [];
    const existingIndex = request.offers.findIndex(
      o => o.caregiverId?.toString() === data.caregiverId
    );

    if (existingIndex >= 0) {
      request.offers[existingIndex] = offerObj as any;
    } else {
      request.offers.push(offerObj as any);
    }

    if (
      request.status === 'PRIMARY_CAREGIVER_ALERTED' ||
      request.status === 'ALTERNATIVE_CONTACTS_ALERTED' ||
      request.status === 'PROFESSIONAL_SEARCH'
    ) {
      request.status = 'PROFESSIONAL_ALERTED';
      request.currentEscalationStage = 'PROFESSIONAL_ALERTED';
    }

    await request.save();

    await this.logEvent(
      requestId,
      request.patientId.toString(),
      request.status,
      request.status,
      'professional_caregiver',
      `Offer received from ${data.caregiverName} (${data.hospital}) for ₹${data.offeredFee}`,
      new mongoose.Types.ObjectId(data.caregiverId)
    );

    try {
      const io = notificationService.getSocketIO();
      if (io) {
        io.to(`patient:${request.patientId}`).emit('assistance_offer', {
          requestId: request._id,
          offer: offerObj,
          offers: request.offers
        });
        io.emit('new_assistance_offer', {
          requestId: request._id,
          offer: offerObj,
          offers: request.offers
        });
      }
      await notificationService.createNotification({
        recipientUserId: request.primaryCaregiverId.toString(),
        patientId: request.patientId.toString(),
        type: 'SYSTEM_ALERT',
        title: `🩺 Caregiver Offer: ${data.caregiverName}`,
        body: `${data.caregiverName} from ${data.hospital} offered to assist for ₹${data.offeredFee}. Click to review and accept.`,
        payload: {
          actionUrl: `/dashboard?tab=disability&requestId=${request._id}`
        }
      });
    } catch (e) {
      console.warn('[AssistanceService] Socket/notification warning:', e);
    }

    return request;
  }

  /**
   * Primary caregiver / Family monitor accepts a specific professional offer
   */
  public async acceptOffer(
    requestId: string,
    offerId: string
  ): Promise<{ request: IAssistanceRequest; patientDetails: any }> {
    const request = await AssistanceRequest.findById(requestId).populate('patientId');
    if (!request) throw new Error('Assistance request not found');

    const offer = request.offers?.find(
      o => o._id?.toString() === offerId || o.caregiverId?.toString() === offerId
    );
    if (!offer) throw new Error('Offer not found');

    const fromStatus = request.status;
    request.status = 'ACCEPTED';
    request.currentEscalationStage = 'ACCEPTED';
    request.acceptedAt = new Date();
    request.fee = offer.offeredFee;
    request.paymentRequired = true;
    request.acceptedBy = {
      helperId: offer.caregiverId,
      helperType: 'professional_caregiver',
      helperName: offer.caregiverName,
      helperPhone: offer.caregiverPhone
    };

    request.offers.forEach(o => {
      if (o._id?.toString() === offer._id?.toString() || o.caregiverId?.toString() === offer.caregiverId?.toString()) {
        o.status = 'ACCEPTED';
      } else {
        o.status = 'REJECTED';
      }
    });

    await request.save();

    await this.logEvent(
      requestId,
      request.patientId.toString(),
      fromStatus,
      'ACCEPTED',
      'primary_caregiver',
      `Family caregiver accepted offer from ${offer.caregiverName} (Fee: ₹${offer.offeredFee})`,
      request.primaryCaregiverId
    );

    try {
      const io = notificationService.getSocketIO();
      if (io) {
        io.emit('offer_accepted', {
          requestId: request._id,
          acceptedOffer: offer,
          request
        });
        io.to(`patient:${request.patientId}`).emit('assistance_status', {
          requestId: request._id,
          stage: 'ACCEPTED',
          status: 'ACCEPTED',
          acceptedBy: request.acceptedBy
        });
      }
    } catch (e) {
      console.warn('[AssistanceService] Socket broadcast warning:', e);
    }

    const patient: any = request.patientId;
    const caregiverUser = await User.findById(request.primaryCaregiverId);

    const patientDetails = {
      patientName: patient?.preferredName || patient?.fullName || 'Senior Patient',
      fullAddress: patient?.address || 'Flat 4B, Shanthi Apts, 14th Cross St, T. Nagar, Chennai - 600017',
      primaryCaregiverName: caregiverUser?.name || 'Primary Family Caregiver',
      primaryCaregiverPhone: caregiverUser?.phone || '+91 98400 12345',
      medicineLocationNotes: request.medicineLocationNotes || 'Bedside organizer',
      reason: request.reason
    };

    return { request, patientDetails };
  }

  /**
   * Primary caregiver declines/rejects a professional offer
   */
  public async rejectOffer(requestId: string, offerId: string): Promise<IAssistanceRequest> {
    const request = await AssistanceRequest.findById(requestId);
    if (!request) throw new Error('Assistance request not found');

    const offer = request.offers?.find(
      o => o._id?.toString() === offerId || o.caregiverId?.toString() === offerId
    );
    if (offer) {
      offer.status = 'REJECTED';
      await request.save();
    }
    return request;
  }

  /**
   * Get minimum necessary medication info for an authorized helper with two-step privacy
   */
  public async getAuthorizedHelperMedicationView(requestId: string, caregiverUserId?: string): Promise<any> {
    const request = await AssistanceRequest.findById(requestId).populate('patientId');
    if (!request) throw new Error('Request not found');

    const patient: any = request.patientId;
    const isAccepted = ['ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'ASSISTANCE_STARTED', 'COMPLETED'].includes(request.status);
    const caregiverUser = await User.findById(request.primaryCaregiverId);

    return {
      requestId: request._id,
      patientPreferredName: patient?.preferredName || 'Senior Patient',
      reason: request.reason,
      medicineLocationNotes: isAccepted ? (request.medicineLocationNotes || 'Bedside organizer') : 'Hidden until offer accepted by family',
      scheduledTime: request.dueAt,
      status: request.status,
      helperAccepted: request.acceptedBy,
      offers: request.offers || [],
      isUnlocked: isAccepted,
      approximateArea: request.approximateArea || 'T. Nagar, Chennai',
      fullAddress: isAccepted ? (patient?.address || 'Flat 4B, Shanthi Apts, 14th Cross St, T. Nagar, Chennai - 600017') : 'Hidden until family accepts offer',
      contactPhone: isAccepted ? (caregiverUser?.phone || '+91 98400 12345') : 'Hidden until family accepts offer',
      primaryCaregiverName: caregiverUser?.name || 'Family Caregiver'
    };
  }

  private async logEvent(
    requestId: string,
    patientId: string,
    fromStatus: string,
    toStatus: string,
    actorRole: string,
    note?: string,
    actorId?: mongoose.Types.ObjectId
  ): Promise<void> {
    const event = new AssistanceEvent({
      requestId: new mongoose.Types.ObjectId(requestId),
      patientId: new mongoose.Types.ObjectId(patientId),
      fromStatus,
      toStatus,
      actorId,
      actorRole,
      note
    });
    await event.save();
  }

  private async dispatchStageNotification(request: IAssistanceRequest, stage: AssistanceStatus): Promise<void> {
    try {
      const io = notificationService.getSocketIO();
      if (io) {
        io.to(`patient:${request.patientId}`).emit('assistance_status', {
          requestId: request._id,
          stage,
          status: request.status,
          acceptedBy: request.acceptedBy
        });
      }

      // Notification titles and messages per stage
      const stageMessages: Record<string, { title: string; body: string }> = {
        PRIMARY_CAREGIVER_ALERTED: {
          title: '🚨 Senior Needs Assistance',
          body: `Your registered senior needs physical assistance: ${request.reason}. Please respond if you are available.`
        },
        ALTERNATIVE_CONTACTS_ALERTED: {
          title: 'Care Circle Alert',
          body: 'Senior needs physical medication help. Escalating to Care Circle trusted contacts.'
        },
        PROFESSIONAL_SEARCH: {
          title: 'Professional Care Search Active',
          body: 'Searching verified professional caregivers serving the senior\'s area.'
        },
        ACCEPTED: {
          title: '✅ Helper Accepted Assistance!',
          body: `${request.acceptedBy?.helperName || 'Helper'} accepted the request and is preparing to assist.`
        },
        ARRIVED: {
          title: '📍 Helper Arrived',
          body: `${request.acceptedBy?.helperName || 'Helper'} has arrived at the senior's residence.`
        },
        ASSISTANCE_STARTED: {
          title: '🤝 Medication Assistance Started',
          body: 'Helper is assisting senior according to authorized medication plan.'
        },
        COMPLETED: {
          title: '🎉 Assistance Completed',
          body: 'Helper recorded completion of scheduled medication assistance.'
        },
        CANCELLED: {
          title: 'Assistance Request Cancelled',
          body: 'The assistance request has been cancelled.'
        }
      };

      const msg = stageMessages[stage];
      if (msg) {
        await notificationService.createNotification({
          recipientUserId: request.primaryCaregiverId.toString(),
          patientId: request.patientId.toString(),
          type: 'MEDICATION_ESCALATION' as any,
          title: msg.title,
          body: msg.body,
          payload: { requestId: request._id.toString(), stage }
        });
      }
    } catch (err: any) {
      console.warn('[AssistanceService] Socket/Notification dispatch error:', err.message);
    }
  }
}

export const assistanceService = new AssistanceService();
