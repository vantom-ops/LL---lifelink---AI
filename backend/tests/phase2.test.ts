import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../src/app';
import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { User } from '../src/models/User';
import { Patient } from '../src/models/Patient';
import { CareCircleContact } from '../src/models/CareCircleContact';
import { ProfessionalCaregiver } from '../src/models/ProfessionalCaregiver';
import { AssistanceRequest } from '../src/models/AssistanceRequest';
import { AssistanceEvent } from '../src/models/AssistanceEvent';
import { authService } from '../src/services/auth.service';

describe('LL LifeLink Phase 2 Disability Assistance & CareChain Test Suite', () => {
  let caregiverToken: string;
  let caregiverUser: any;
  let testPatient: any;
  let testContactId: string;
  let testRequestId: string;
  let testProfCaregiverId: string;

  beforeAll(async () => {
    await connectDatabase();

    // Create test caregiver user
    const pwHash = await authService.hashPassword('Password123!');
    caregiverUser = await User.create({
      name: 'Phase2 Caregiver',
      email: `caregiver-p2-${Date.now()}@lifelink.com`,
      phone: '+91 98400 99001',
      passwordHash: pwHash,
      role: 'caregiver',
      isActive: true
    });

    const tokens = authService.generateTokens({
      userId: caregiverUser._id.toString(),
      role: caregiverUser.role,
      name: caregiverUser.name,
      email: caregiverUser.email,
      phone: caregiverUser.phone
    });
    caregiverToken = tokens.accessToken;

    testPatient = await Patient.create({
      fullName: 'Paati Test P2',
      preferredName: 'Paati P2',
      age: 79,
      gender: 'female',
      phone: '+91 98400 99002',
      address: 'Temple View, Chennai',
      emergencyContactName: 'Ananya Raman',
      emergencyContactPhone: '+91 98400 99001',
      createdCaregiverId: caregiverUser._id,
      isActive: true
    });
  });

  afterAll(async () => {
    if (caregiverUser) await User.deleteOne({ _id: caregiverUser._id });
    if (testPatient) await Patient.deleteOne({ _id: testPatient._id });
    if (testContactId) await CareCircleContact.deleteOne({ _id: testContactId });
    if (testRequestId) {
      await AssistanceRequest.deleteOne({ _id: testRequestId });
      await AssistanceEvent.deleteMany({ requestId: testRequestId });
    }
    if (testProfCaregiverId) await ProfessionalCaregiver.deleteOne({ _id: testProfCaregiverId });
    await disconnectDatabase();
  });

  test('1. Care Circle: Add Trusted Contact', async () => {
    const res = await request(app)
      .post('/api/care-circle')
      .set('Authorization', `Bearer ${caregiverToken}`)
      .send({
        patientId: testPatient._id.toString(),
        name: 'Gopal Mama',
        phone: '+91 98400 55443',
        relationship: 'relative',
        priority: 1,
        notes: 'Has spare key'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.contact.name).toBe('Gopal Mama');
    testContactId = res.body.data.contact._id;
  });

  test('2. Care Circle: Toggle Availability', async () => {
    const res = await request(app)
      .patch(`/api/care-circle/${testContactId}/availability`)
      .set('Authorization', `Bearer ${caregiverToken}`)
      .send({ available: false });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.contact.available).toBe(false);

    // Re-enable availability so contact is available for escalation
    await request(app)
      .patch(`/api/care-circle/${testContactId}/availability`)
      .set('Authorization', `Bearer ${caregiverToken}`)
      .send({ available: true });
  });

  test('3. Assistance: Senior Requests Physical Assistance', async () => {
    const res = await request(app)
      .post('/api/assistance')
      .send({
        patientId: testPatient._id.toString(),
        reason: 'Cannot open child-proof medicine bottle cap due to arthritis pain.',
        medicineLocationNotes: 'Dining table wooden organizer',
        priority: 'HIGH'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.request.status).toBe('PRIMARY_CAREGIVER_ALERTED');
    testRequestId = res.body.data.request._id;
  });

  test('4. Assistance: Primary Caregiver Declines -> Escalates to Care Circle', async () => {
    const res = await request(app)
      .post(`/api/assistance/${testRequestId}/respond`)
      .set('Authorization', `Bearer ${caregiverToken}`)
      .send({
        action: 'DECLINE',
        declineReason: 'Currently stuck in hospital duty'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.request.status).toBe('ALTERNATIVE_CONTACTS_ALERTED');
  });

  test('5. Assistance: Trusted Contact Accepts Request', async () => {
    const res = await request(app)
      .post(`/api/assistance/${testRequestId}/respond`)
      .send({
        action: 'ACCEPT',
        name: 'Gopal Mama',
        phone: '+91 98400 55443',
        role: 'trusted_contact'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.request.status).toBe('ACCEPTED');
    expect(res.body.data.request.acceptedBy.helperName).toBe('Gopal Mama');
  });

  test('6. Assistance: Helper Marks Arrived', async () => {
    const res = await request(app)
      .post(`/api/assistance/${testRequestId}/arrived`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.request.status).toBe('ARRIVED');
  });

  test('7. Assistance: Helper Starts Medication Assistance', async () => {
    const res = await request(app)
      .post(`/api/assistance/${testRequestId}/start`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.request.status).toBe('ASSISTANCE_STARTED');
  });

  test('8. Assistance: Helper Completes Physical Assistance', async () => {
    const res = await request(app)
      .post(`/api/assistance/${testRequestId}/complete`)
      .send({
        completionMethod: 'HANDED_TO_PATIENT',
        helperNotes: 'Unscrewed child-proof cap and poured 1 tablet with fresh water.'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.request.status).toBe('COMPLETED');
  });

  test('9. Professional Caregiver: Register New Candidate', async () => {
    const res = await request(app)
      .post('/api/professional-caregivers/register')
      .send({
        fullName: 'Sister Vani K., RN',
        phone: '+91 98400 44332',
        email: `sister.vani-${Date.now()}@lifelink.com`,
        address: 'Mylapore, Chennai',
        serviceArea: 'Central Chennai',
        serviceRadiusKm: 10,
        professionalRole: 'Registered Geriatric Nurse',
        experienceYears: 7,
        credentialsSummary: 'TNC-RN Certified with Geriatric Diploma',
        fixedAssistanceFee: 300
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.caregiver.verificationStatus).toBe('PENDING_VERIFICATION');
    testProfCaregiverId = res.body.data.caregiver._id;
  });

  test('10. Admin Verification: Review & Approve Caregiver', async () => {
    const res = await request(app)
      .patch(`/api/professional-caregivers/${testProfCaregiverId}/verify`)
      .set('Authorization', `Bearer ${caregiverToken}`)
      .send({
        status: 'VERIFIED',
        verificationNotes: 'Nursing Council certificate validated against state registry.'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.caregiver.verificationStatus).toBe('VERIFIED');
  });

  test('11. Payments: Create Razorpay Order Provider Abstraction', async () => {
    const res = await request(app)
      .post('/api/payments/create-order')
      .set('Authorization', `Bearer ${caregiverToken}`)
      .send({
        requestId: testRequestId,
        patientId: testPatient._id.toString(),
        amount: 300
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.orderId).toBeDefined();
    expect(res.body.data.currency).toBe('INR');
  });

  test('12. Audit Trail: Verify Immutable Event Logging', async () => {
    const res = await request(app)
      .get(`/api/assistance/${testRequestId}/events`)
      .set('Authorization', `Bearer ${caregiverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.events.length).toBeGreaterThanOrEqual(4);
  });
});
