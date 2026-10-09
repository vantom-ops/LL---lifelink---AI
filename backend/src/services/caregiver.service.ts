import mongoose from 'mongoose';
import { User, IUser } from '../models/User';
import { Patient } from '../models/Patient';
import { CaregiverPatientLink } from '../models/CaregiverPatientLink';
import { Medication } from '../models/Medication';
import { MedicationSchedule } from '../models/MedicationSchedule';
import { MedicationEvent } from '../models/MedicationEvent';
import { PairingCode } from '../models/PairingCode';

export class CaregiverService {
  /**
   * Retrieves caregiver profile along with rich status of all linked seniors
   */
  public async getCaregiverProfile(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Caregiver profile not found');
    }

    const links = await CaregiverPatientLink.find({
      caregiverId: new mongoose.Types.ObjectId(userId),
      status: 'active'
    });

    const patientIds = links.map(l => l.patientId);
    const patients = await Patient.find({ _id: { $in: patientIds } });

    const linkedSeniorsWithStatus = await Promise.all(
      patients.map(async p => {
        const link = links.find(l => l.patientId.toString() === p._id.toString());
        
        // Active medications count
        const activeMedsCount = await Medication.countDocuments({ patientId: p._id, active: true, isArchived: false });

        // Adherence stats (last 7 days or last 30 events)
        const recentEvents = await MedicationEvent.find({ patientId: p._id }).sort({ scheduledTime: -1 }).limit(30);
        let adherenceRate = 100;
        if (recentEvents.length > 0) {
          const confirmed = recentEvents.filter(e => e.status === 'TAKEN').length;
          adherenceRate = Math.round((confirmed / recentEvents.length) * 100);
        }

        // Next medication
        const now = new Date();
        const upcomingEvent = await MedicationEvent.findOne({
          patientId: p._id,
          status: 'PENDING',
          scheduledTime: { $gte: new Date(now.getTime() - 30 * 60 * 1000) }
        }).populate('medicationId', 'name dosage').sort({ scheduledTime: 1 });

        // Pairing status
        const pairing = await PairingCode.findOne({ patientId: p._id, status: 'USED' });
        const devicePairingStatus = p.linkedUserId || pairing ? 'PAIRED' : 'AWAITING_PAIRING';

        return {
          id: p._id,
          fullName: p.fullName,
          preferredName: p.preferredName || p.fullName,
          age: p.age,
          gender: p.gender,
          profilePhotoUrl: p.profilePhotoUrl,
          relationship: link?.relationship || user.relationshipToSenior || 'Family Caregiver',
          connectionStatus: 'Connected',
          devicePairingStatus,
          medicationStatus: {
            activeMedicationsCount: activeMedsCount,
            adherenceRate: `${adherenceRate}%`,
            nextMedication: upcomingEvent ? {
              medicationName: (upcomingEvent.medicationId as any)?.name || 'Scheduled Dose',
              time: upcomingEvent.scheduledTime
            } : null
          },
          careStatus: p.mobilityStatus ? `${p.mobilityStatus} • ${p.visionStatus}` : 'Active Care'
        };
      })
    );

    return {
      caregiver: {
        id: user._id,
        fullName: user.name,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        address: user.address,
        relationshipToSenior: user.relationshipToSenior || 'Son / Family Caregiver',
        preferredLanguage: user.preferredLanguage || 'English',
        notificationPreference: user.notificationPreference || 'all',
        role: user.role
      },
      linkedSeniors: linkedSeniorsWithStatus
    };
  }

  /**
   * Updates caregiver profile details
   */
  public async updateCaregiverProfile(
    userId: string,
    updates: {
      fullName?: string;
      phone?: string;
      address?: string;
      relationshipToSenior?: string;
      preferredLanguage?: string;
      notificationPreference?: string;
      avatarUrl?: string;
    }
  ) {
    const updateFields: any = {};
    if (updates.fullName !== undefined) updateFields.name = updates.fullName;
    if (updates.phone !== undefined) updateFields.phone = updates.phone;
    if (updates.address !== undefined) updateFields.address = updates.address;
    if (updates.relationshipToSenior !== undefined) updateFields.relationshipToSenior = updates.relationshipToSenior;
    if (updates.preferredLanguage !== undefined) updateFields.preferredLanguage = updates.preferredLanguage;
    if (updates.notificationPreference !== undefined) updateFields.notificationPreference = updates.notificationPreference;
    if (updates.avatarUrl !== undefined) updateFields.avatarUrl = updates.avatarUrl;

    const updated = await User.findByIdAndUpdate(userId, { $set: updateFields }, { new: true });
    if (!updated) {
      throw new Error('Caregiver not found');
    }

    return {
      id: updated._id,
      fullName: updated.name,
      email: updated.email,
      phone: updated.phone,
      avatarUrl: updated.avatarUrl,
      address: updated.address,
      relationshipToSenior: updated.relationshipToSenior,
      preferredLanguage: updated.preferredLanguage,
      notificationPreference: updated.notificationPreference
    };
  }
}

export const caregiverService = new CaregiverService();
