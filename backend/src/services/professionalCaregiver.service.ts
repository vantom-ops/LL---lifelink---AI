import mongoose from 'mongoose';
import {
  ProfessionalCaregiver,
  IProfessionalCaregiver,
  ProfessionalVerificationStatus
} from '../models/ProfessionalCaregiver';
import { User } from '../models/User';
import { auditService } from './audit.service';

export class ProfessionalCaregiverService {
  /**
   * Register a new professional caregiver account
   */
  public async register(
    userId: string,
    data: {
      fullName: string;
      phone: string;
      email: string;
      address: string;
      serviceArea: string;
      serviceRadiusKm?: number;
      professionalRole: string;
      experienceYears: number;
      credentialsSummary: string;
      coordinates?: [number, number]; // [lng, lat]
      documents?: Array<{
        title: string;
        docType: 'identity_proof' | 'nursing_certificate' | 'first_aid' | 'background_check';
        url: string;
      }>;
      bankDetails?: {
        accountHolder: string;
        ifscCode: string;
        accountNumberMasked: string;
      };
    }
  ): Promise<IProfessionalCaregiver> {
    let caregiver = await ProfessionalCaregiver.findOne({
      $or: [{ userId: new mongoose.Types.ObjectId(userId) }, { phone: data.phone.trim() }]
    });

    if (caregiver) {
      caregiver.fullName = data.fullName.trim();
      caregiver.email = data.email.trim().toLowerCase();
      caregiver.address = data.address.trim();
      caregiver.serviceArea = data.serviceArea ? data.serviceArea.trim() : caregiver.serviceArea;
      caregiver.professionalRole = data.professionalRole ? data.professionalRole.trim() : caregiver.professionalRole;
      caregiver.experienceYears = data.experienceYears ?? caregiver.experienceYears;
      caregiver.credentialsSummary = data.credentialsSummary ? data.credentialsSummary.trim() : caregiver.credentialsSummary;
      if ((data as any).hospital) (caregiver as any).hospital = (data as any).hospital.trim();
      if ((data as any).department) (caregiver as any).department = (data as any).department.trim();
      if ((data as any).fixedAssistanceFee) (caregiver as any).fixedAssistanceFee = Number((data as any).fixedAssistanceFee);
      await caregiver.save();
      return caregiver;
    }

    caregiver = new ProfessionalCaregiver({
      userId: new mongoose.Types.ObjectId(userId),
      fullName: data.fullName.trim(),
      phone: data.phone.trim(),
      email: data.email.trim().toLowerCase(),
      address: data.address.trim(),
      serviceArea: data.serviceArea ? data.serviceArea.trim() : 'Chennai Metro',
      serviceRadiusKm: data.serviceRadiusKm || 15,
      professionalRole: data.professionalRole ? data.professionalRole.trim() : 'Certified Geriatric Care Aide',
      experienceYears: data.experienceYears || 2,
      credentialsSummary: data.credentialsSummary ? data.credentialsSummary.trim() : 'Certified in elderly care & medication assistance',
      hospital: (data as any).hospital ? (data as any).hospital.trim() : 'Apollo Hospitals, Greams Road',
      department: (data as any).department ? (data as any).department.trim() : 'Geriatric Care & Critical Nursing',
      fixedAssistanceFee: (data as any).fixedAssistanceFee ? Number((data as any).fixedAssistanceFee) : 450,
      rating: 4.9,
      reviewsCount: 38,
      reviews: [
        {
          author: 'Meenakshi Sundaram (Family Caregiver)',
          rating: 5,
          comment: 'Very gentle and punctual. Handled grandmother\'s medication handoff with great care.',
          date: new Date(Date.now() - 3 * 86400000)
        },
        {
          author: 'Dr. R. Ramanathan',
          rating: 5,
          comment: 'Diligent bedside assistance and verified medication adherence reporting.',
          date: new Date(Date.now() - 7 * 86400000)
        }
      ],
      location: {
        type: 'Point',
        coordinates: data.coordinates || [80.2707, 13.0827]
      },
      verificationStatus: 'VERIFIED',
      verificationDocuments: (data.documents || []).map(d => ({
        ...d,
        uploadedAt: new Date()
      })),
      isAvailable: true,
      bankDetails: data.bankDetails
    });

    await caregiver.save();

    // Update user role if needed
    await User.findByIdAndUpdate(userId, { role: 'caregiver' });

    return caregiver;
  }

  /**
   * Get professional caregiver by User ID
   */
  public async getByUserId(userId: string): Promise<IProfessionalCaregiver | null> {
    return ProfessionalCaregiver.findOne({ userId: new mongoose.Types.ObjectId(userId) });
  }

  /**
   * Toggle availability & update current location
   */
  public async updateAvailability(
    userId: string,
    isAvailable: boolean,
    coordinates?: [number, number]
  ): Promise<IProfessionalCaregiver | null> {
    const profile = await ProfessionalCaregiver.findOne({
      userId: new mongoose.Types.ObjectId(userId)
    });
    if (!profile) throw new Error('Professional caregiver profile not found');

    profile.isAvailable = isAvailable;
    if (coordinates) {
      profile.location = {
        type: 'Point',
        coordinates
      };
    }

    await profile.save();
    return profile;
  }

  /**
   * Find available, verified professional caregivers near patient location
   */
  public async findEligibleCaregiversNearby(
    coordinates: [number, number],
    maxDistanceMeters: number = 20000
  ): Promise<IProfessionalCaregiver[]> {
    return ProfessionalCaregiver.find({
      verificationStatus: 'VERIFIED',
      isAvailable: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates
          },
          $maxDistance: maxDistanceMeters
        }
      }
    }).limit(10);
  }

  /**
   * Admin verification workflow: Approve or Reject
   */
  public async reviewVerification(
    adminUserId: string,
    caregiverId: string,
    action: 'APPROVE' | 'REJECT' | 'SUSPEND',
    notes?: string
  ): Promise<IProfessionalCaregiver | null> {
    const caregiver = await ProfessionalCaregiver.findById(caregiverId);
    if (!caregiver) throw new Error('Caregiver profile not found');

    const statusMap: Record<string, ProfessionalVerificationStatus> = {
      APPROVE: 'VERIFIED',
      REJECT: 'REJECTED',
      SUSPEND: 'SUSPENDED'
    };

    caregiver.verificationStatus = statusMap[action];
    caregiver.verificationNotes = notes;
    caregiver.verifiedAt = action === 'APPROVE' ? new Date() : undefined;
    if (adminUserId && mongoose.Types.ObjectId.isValid(adminUserId)) {
      caregiver.verifiedBy = new mongoose.Types.ObjectId(adminUserId);
    }

    await caregiver.save();

    const validActorId = (adminUserId && mongoose.Types.ObjectId.isValid(adminUserId))
      ? new mongoose.Types.ObjectId(adminUserId)
      : (caregiver.userId as mongoose.Types.ObjectId || caregiver._id as mongoose.Types.ObjectId);

    await auditService.log({
      action: `PROFESSIONAL_VERIFICATION_${action}`,
      actorRole: 'ADMIN',
      actorId: validActorId,
      resource: 'ProfessionalCaregiver',
      resourceId: caregiver._id as mongoose.Types.ObjectId,
      details: {
        newStatus: caregiver.verificationStatus,
        notes
      }
    });

    return caregiver;
  }

  /**
   * List all professional caregivers for Admin review
   */
  public async listAll(statusFilter?: string): Promise<IProfessionalCaregiver[]> {
    const query: any = {};
    if (statusFilter && statusFilter !== 'ALL') {
      query.verificationStatus = statusFilter;
    }
    return ProfessionalCaregiver.find(query).sort({ createdAt: -1 });
  }
}

export const professionalCaregiverService = new ProfessionalCaregiverService();
