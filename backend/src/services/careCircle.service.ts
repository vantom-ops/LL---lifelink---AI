import mongoose from 'mongoose';
import { CareCircleContact, ICareCircleContact } from '../models/CareCircleContact';
import { Patient } from '../models/Patient';
import { auditService } from './audit.service';

export class CareCircleService {
  /**
   * Get all Care Circle contacts for a specific senior patient
   */
  public async getContactsForPatient(patientId: string): Promise<ICareCircleContact[]> {
    return CareCircleContact.find({ patientId: new mongoose.Types.ObjectId(patientId) })
      .sort({ priority: 1, createdAt: 1 });
  }

  /**
   * Add a trusted contact to the senior's Care Circle
   */
  public async addContact(
    caregiverId: string,
    patientId: string,
    data: {
      name: string;
      phone: string;
      email?: string;
      relationship: 'relative' | 'neighbour' | 'friend' | 'family_member';
      priority?: number;
      available?: boolean;
      notes?: string;
      permissions?: string[];
    }
  ): Promise<ICareCircleContact> {
    const patient = await Patient.findById(patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }

    const rawRel = (data.relationship || 'neighbour').toString().toLowerCase().trim();
    let relationship = rawRel;
    if (!['relative', 'neighbour', 'friend', 'family_member'].includes(relationship)) {
      if (relationship.includes('neigh')) relationship = 'neighbour';
      else if (relationship.includes('fam') || relationship.includes('rel')) relationship = 'relative';
      else relationship = 'friend';
    }

    // Check if phone already in care circle
    const existing = await CareCircleContact.findOne({
      patientId: new mongoose.Types.ObjectId(patientId),
      phone: data.phone.trim()
    });

    if (existing) {
      existing.name = data.name.trim();
      existing.relationship = relationship as any;
      if (data.priority) existing.priority = data.priority;
      if (data.notes) existing.notes = data.notes;
      existing.available = data.available !== false;
      await existing.save();
      return existing;
    }

    const count = await CareCircleContact.countDocuments({
      patientId: new mongoose.Types.ObjectId(patientId)
    });

    const contact = new CareCircleContact({
      patientId: new mongoose.Types.ObjectId(patientId),
      caregiverId: new mongoose.Types.ObjectId(caregiverId),
      name: data.name.trim(),
      phone: data.phone.trim(),
      email: data.email?.trim().toLowerCase(),
      relationship,
      priority: data.priority || count + 1,
      available: data.available !== false,
      notes: data.notes,
      permissions: data.permissions || [
        'receive_assistance_alert',
        'view_medicine_name',
        'view_dosage',
        'mark_completion'
      ],
      consentStatus: 'ACCEPTED' // Active upon addition by primary caregiver
    });

    await contact.save();

    await auditService.log({
      patientId: new mongoose.Types.ObjectId(patientId),
      action: 'CARE_CIRCLE_CONTACT_ADDED',
      actorRole: 'CAREGIVER',
      actorId: new mongoose.Types.ObjectId(caregiverId),
      resource: 'CareCircleContact',
      resourceId: contact._id as mongoose.Types.ObjectId,
      details: {
        contactName: contact.name,
        relationship: contact.relationship,
        priority: contact.priority
      }
    });

    return contact;
  }

  /**
   * Update an existing Care Circle contact
   */
  public async updateContact(
    caregiverId: string,
    contactId: string,
    data: Partial<ICareCircleContact>
  ): Promise<ICareCircleContact | null> {
    const contact = await CareCircleContact.findById(contactId);
    if (!contact) {
      throw new Error('Contact not found');
    }

    if (data.name) contact.name = data.name.trim();
    if (data.phone) contact.phone = data.phone.trim();
    if (data.email !== undefined) contact.email = data.email?.trim().toLowerCase();
    if (data.relationship) contact.relationship = data.relationship;
    if (data.priority !== undefined) contact.priority = data.priority;
    if (data.available !== undefined) contact.available = data.available;
    if (data.notes !== undefined) contact.notes = data.notes;
    if (data.permissions) contact.permissions = data.permissions;

    await contact.save();

    await auditService.log({
      patientId: contact.patientId,
      action: 'CARE_CIRCLE_CONTACT_UPDATED',
      actorRole: 'CAREGIVER',
      actorId: new mongoose.Types.ObjectId(caregiverId),
      resource: 'CareCircleContact',
      resourceId: contact._id as mongoose.Types.ObjectId,
      details: { updatedFields: Object.keys(data) }
    });

    return contact;
  }

  /**
   * Toggle live availability of a trusted contact
   */
  public async toggleAvailability(contactId: string, available: boolean): Promise<ICareCircleContact | null> {
    const contact = await CareCircleContact.findById(contactId);
    if (!contact) throw new Error('Contact not found');

    contact.available = available;
    await contact.save();
    return contact;
  }

  /**
   * Remove a contact from the senior's Care Circle
   */
  public async removeContact(caregiverId: string, contactId: string): Promise<boolean> {
    const contact = await CareCircleContact.findById(contactId);
    if (!contact) return false;

    const patientId = contact.patientId;
    await CareCircleContact.findByIdAndDelete(contactId);

    await auditService.log({
      patientId,
      action: 'CARE_CIRCLE_CONTACT_REMOVED',
      actorRole: 'CAREGIVER',
      actorId: new mongoose.Types.ObjectId(caregiverId),
      resource: 'CareCircleContact',
      resourceId: new mongoose.Types.ObjectId(contactId),
      details: { name: contact.name, phone: contact.phone }
    });

    return true;
  }
}

export const careCircleService = new CareCircleService();
