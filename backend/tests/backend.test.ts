import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../src/app';
import { User } from '../src/models/User';
import { Patient } from '../src/models/Patient';
import { Medication } from '../src/models/Medication';
import { MedicationSchedule } from '../src/models/MedicationSchedule';
import { MedicationEvent } from '../src/models/MedicationEvent';
import { PairingCode } from '../src/models/PairingCode';
import { eventService } from '../src/services/event.service';
import { schedulerService } from '../src/services/scheduler.service';
import { ocrService } from '../src/services/ocr.service';
import { aiService } from '../src/services/ai.service';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('LL LifeLink Backend Comprehensive Test Suite', () => {
  let caregiverToken: string;
  let caregiverId: string;
  let patientId: string;
  let medicationId: string;
  let scheduleId: string;
  let eventId: string;
  let generatedPairingCode: string;
  let seniorToken: string;

  // 1. Authentication & Registration
  test('1. Caregiver Registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Dr. Ramesh Kumar',
        email: 'ramesh@caregiver.test',
        password: 'Password123!',
        phone: '+919840112233'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens.accessToken).toBeDefined();
    caregiverToken = res.body.data.tokens.accessToken;
    caregiverId = res.body.data.user.id;
  });

  test('2. Caregiver Login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'ramesh@caregiver.test',
        password: 'Password123!'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('caregiver');
  });

  // 2. Patient Creation & Authorization
  test('3. Create Senior Patient Profile', async () => {
    const res = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${caregiverToken}`)
      .send({
        fullName: 'Sundaram Iyer',
        preferredName: 'Thatha',
        age: 82,
        emergencyContactName: 'Dr. Ramesh Kumar',
        emergencyContactPhone: '+919840112233',
        languagePreference: 'Tamil'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.patient.fullName).toBe('Sundaram Iyer');
    patientId = res.body.data.patient._id;
  });

  test('4. Fetch Patients List for Caregiver', async () => {
    const res = await request(app)
      .get('/api/patients')
      .set('Authorization', `Bearer ${caregiverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.patients.length).toBeGreaterThanOrEqual(1);
  });

  // 3. Pairing Code Generation & Senior Linkage
  test('5. Generate Pairing Code & QR', async () => {
    const res = await request(app)
      .post('/api/pairing/generate')
      .set('Authorization', `Bearer ${caregiverToken}`)
      .send({ patientId });

    expect(res.status).toBe(200);
    expect(res.body.data.code).toBeDefined();
    expect(res.body.data.qrCodeDataUrl).toContain('data:image/png;base64');
    generatedPairingCode = res.body.data.code;
  });

  test('6. Senior Pairs Device with Code', async () => {
    const res = await request(app)
      .post('/api/pairing/pair')
      .send({
        code: generatedPairingCode,
        deviceInfo: { deviceName: 'Samsung Galaxy A14' }
      });

    expect(res.status).toBe(200);
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.user.role).toBe('senior');
    seniorToken = res.body.data.tokens.accessToken;
  });

  // 4. Medication Management CRUD
  test('7. Add Medication', async () => {
    const res = await request(app)
      .post('/api/medications')
      .set('Authorization', `Bearer ${caregiverToken}`)
      .send({
        patientId,
        name: 'Metformin 500mg',
        genericName: 'Metformin HCl',
        dose: '500',
        unit: 'mg',
        form: 'Tablet',
        foodRelation: 'AFTER_MEAL',
        instructions: 'Take after food with water'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.medication.name).toBe('Metformin 500mg');
    medicationId = res.body.data.medication._id;
  });

  test('8. Create Medication Schedule', async () => {
    const res = await request(app)
      .post('/api/schedules')
      .set('Authorization', `Bearer ${caregiverToken}`)
      .send({
        patientId,
        medicationId,
        time: '08:00',
        frequency: 'DAILY',
        label: 'Morning Breakfast'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.schedule.time).toBe('08:00');
    scheduleId = res.body.data.schedule._id;
  });

  // 5. Today Events & Confirmation
  test('9. Fetch Today Events for Senior', async () => {
    const res = await request(app)
      .get(`/api/medication-events/today/${patientId}`)
      .set('Authorization', `Bearer ${seniorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.events.length).toBeGreaterThanOrEqual(1);
    eventId = res.body.data.events[0]._id;
  });

  test('10. Senior Confirms TAKEN', async () => {
    const res = await request(app)
      .post(`/api/medication-events/${eventId}/confirm-taken`)
      .set('Authorization', `Bearer ${seniorToken}`)
      .send({ notes: 'Taken with warm water' });

    expect(res.status).toBe(200);
    expect(['TAKEN', 'LATE']).toContain(res.body.data.event.status);
    expect(res.body.data.event.takenAt).toBeDefined();
  });

  // 6. Caregiver Resend Reminder
  test('11. Caregiver Resends Reminder', async () => {
    const res = await request(app)
      .post(`/api/medication-events/${eventId}/resend-reminder`)
      .set('Authorization', `Bearer ${caregiverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.event.resendCount).toBe(1);
  });

  // 7. 5-Minute Timeout Escalation Test
  test('12. Five-Minute No-Response Escalation', async () => {
    // Create an unconfirmed due event in past
    const unconfirmed = new MedicationEvent({
      patientId: new mongoose.Types.ObjectId(patientId),
      medicationId: new mongoose.Types.ObjectId(medicationId),
      scheduledTime: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      escalationDueAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      status: 'DUE',
      resendCount: 0
    });
    await unconfirmed.save();

    const count = await eventService.processEscalations();
    expect(count).toBeGreaterThanOrEqual(1);

    const reloaded = await MedicationEvent.findById(unconfirmed._id);
    expect(reloaded?.status).toBe('PENDING_CONFIRMATION');
    expect(reloaded?.caregiverAlertSentAt).toBeDefined();
  });

  // 8. Offline Queue Sync without Duplicates
  test('13. Offline Queue Sync Duplicate Prevention', async () => {
    const res = await request(app)
      .post('/api/medication-events/sync-offline')
      .set('Authorization', `Bearer ${seniorToken}`)
      .send({
        patientId,
        events: [
          {
            eventId,
            status: 'TAKEN',
            clientTimestamp: new Date().toISOString(),
            responseNotes: 'Offline confirmed'
          }
        ]
      });

    expect(res.status).toBe(200);
    expect(res.body.data.results.length).toBe(1);
    // Already taken, so it should not overwrite or duplicate
    expect(res.body.data.results[0].skipped).toBe(true);
  });

  // 9. OCR & AI Services Unit Validation
  test('14. OCR Clinical Text Parsing', () => {
    const text = 'Rx: Tab Amlodipine 5mg 1-0-0 Morning after food\nTab Metformin 500mg 1-0-1 after food';
    const result = ocrService.parsePrescriptionText(text, 90);
    expect(result.candidates.length).toBeGreaterThanOrEqual(2);
    expect(result.candidates[0].medicineName).toBe('Amlodipine');
    expect(result.candidates[0].confidence).toBeGreaterThan(0.7);
  });

  test('15. AI Plain Language Summary and Voice Generation', async () => {
    const voiceScript = aiService.generateFriendlyVoiceScript(
      'Metformin',
      '500mg',
      'Take after breakfast',
      'Tanglish',
      'Paati'
    );
    expect(voiceScript).toContain('Paati');
    expect(voiceScript).toContain('Metformin');

    const summary = await aiService.summarizeMedicalDocument('ECG', 'Sinus rhythm 72 bpm', 'ecg.pdf');
    expect(summary.isInformationalOnly).toBe(true);
    expect(summary.disclaimer).toBeDefined();
  });

  // 10. Adherence Reports
  test('16. Adherence Report Calculation', async () => {
    const res = await request(app)
      .get(`/api/reports/adherence/${patientId}?period=week`)
      .set('Authorization', `Bearer ${caregiverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.stats.totalScheduled).toBeGreaterThanOrEqual(1);
    expect(res.body.data.stats.takenPercentage).toBeDefined();
  });

  // 11. Health Condition Profile
  test('17. Update and Fetch Health Condition Profile', async () => {
    const updateRes = await request(app)
      .put(`/api/patients/${patientId}/health-condition`)
      .set('Authorization', `Bearer ${caregiverToken}`)
      .send({
        mobilityStatus: 'Walks with support',
        visionStatus: 'Uses glasses',
        hearingStatus: 'Normal hearing',
        knownAllergies: ['Penicillin'],
        dietaryRestrictions: ['Low Sodium', 'Diabetic Diet'],
        specialCareNotes: 'Prefers morning walk with walking stick'
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.healthCondition.mobilityStatus).toBe('Walks with support');
    expect(updateRes.body.data.healthCondition.knownAllergies).toContain('Penicillin');

    const getRes = await request(app)
      .get(`/api/patients/${patientId}/health-condition`)
      .set('Authorization', `Bearer ${caregiverToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.healthCondition.visionStatus).toBe('Uses glasses');
  });

  // 12. Doctor QR Generation & Validation
  let doctorToken: string;
  let doctorSessionId: string;

  test('18. Generate Doctor QR Code', async () => {
    const res = await request(app)
      .post(`/api/patients/${patientId}/doctor-qr`)
      .set('Authorization', `Bearer ${caregiverToken}`);

    expect(res.status).toBe(201);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.qrDataUrl).toBeDefined();
    expect(res.body.data.status).toBe('ACTIVE');
    doctorToken = res.body.data.token;
  });

  test('19. Validate Doctor QR Token (Public endpoint)', async () => {
    const res = await request(app)
      .post('/api/doctor-access/validate-qr')
      .send({ token: doctorToken });

    expect(res.status).toBe(200);
    expect(res.body.data.valid).toBe(true);
    expect(res.body.data.patientPreview.fullName).toBe('Sundaram Iyer');
  });

  test('20. Doctor Initiates Read-Only Access Session', async () => {
    const res = await request(app)
      .post('/api/doctor-access/session')
      .send({
        token: doctorToken,
        doctorIdentifier: 'Dr. Anand Kumar, Apollo Clinic'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.sessionId).toBeDefined();
    doctorSessionId = res.body.data.sessionId;
  });

  test('21. Doctor Retrieves Privacy-Filtered Patient Data', async () => {
    const res = await request(app)
      .get(`/api/doctor-access/session/${doctorSessionId}`);

    expect(res.status).toBe(200);
    expect(res.body.data.patient.fullName).toBe('Sundaram Iyer');
    expect(res.body.data.healthCondition.mobilityStatus).toBe('Walks with support');
    expect(res.body.data.activeMedications).toBeDefined();
    expect(res.body.data.alerts).toBeDefined();
  });

  test('22. Privacy Settings Updates and Enforcement', async () => {
    const putRes = await request(app)
      .put(`/api/patients/${patientId}/privacy`)
      .set('Authorization', `Bearer ${caregiverToken}`)
      .send({
        allowMedicationAccess: false,
        allowEmergencyContactAccess: true
      });

    expect(putRes.status).toBe(200);
    expect(putRes.body.data.privacy.allowMedicationAccess).toBe(false);

    // Verify access history is logged
    const histRes = await request(app)
      .get(`/api/patients/${patientId}/access-history`)
      .set('Authorization', `Bearer ${caregiverToken}`);

    expect(histRes.status).toBe(200);
    expect(histRes.body.data.history.length).toBeGreaterThan(0);
  });

  test('23. Caregiver Profile and Linked Seniors Overview', async () => {
    const res = await request(app)
      .get('/api/caregivers/me')
      .set('Authorization', `Bearer ${caregiverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.caregiver.email).toBe('ramesh@caregiver.test');
    expect(res.body.data.linkedSeniors.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.linkedSeniors[0].fullName).toBe('Sundaram Iyer');
  });

  test('24. Doctor Ends Session', async () => {
    const res = await request(app)
      .post(`/api/doctor-access/session/${doctorSessionId}/end`);

    expect(res.status).toBe(200);

    // Trying to get data again should fail
    const getRes = await request(app)
      .get(`/api/doctor-access/session/${doctorSessionId}`);

    expect(getRes.status).toBe(403);
  });
});

