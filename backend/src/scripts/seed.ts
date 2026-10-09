import mongoose from 'mongoose';
import QRCode from 'qrcode';
import { User } from '../models/User';
import { Patient } from '../models/Patient';
import { CaregiverPatientLink } from '../models/CaregiverPatientLink';
import { PairingCode } from '../models/PairingCode';
import { Medication } from '../models/Medication';
import { MedicationSchedule } from '../models/MedicationSchedule';
import { MedicationEvent } from '../models/MedicationEvent';
import { Prescription } from '../models/Prescription';
import { MedicalDocument } from '../models/MedicalDocument';
import { Notification } from '../models/Notification';
import { VoicePreference } from '../models/VoicePreference';
import { DoctorQrToken } from '../models/DoctorQrToken';
import { DoctorAccessSession } from '../models/DoctorAccessSession';
import { PrivacySettings } from '../models/PrivacySettings';
import { AuditLog } from '../models/AuditLog';
import { CareCircleContact } from '../models/CareCircleContact';
import { AssistanceRequest } from '../models/AssistanceRequest';
import { AssistanceEvent } from '../models/AssistanceEvent';
import { ProfessionalCaregiver } from '../models/ProfessionalCaregiver';
import { PaymentOrder } from '../models/PaymentOrder';
import { doctorQrService } from '../services/doctor-qr.service';
import { authService } from '../services/auth.service';
import { connectDatabase } from '../config/database';

export async function seedDatabase() {
  console.log('[Seed] Seeding LL LifeLink database with real sample data...');

  // Ensure DB connected
  if (mongoose.connection.readyState === 0) {
    await connectDatabase();
  }

  // Clear existing collections
  await Promise.all([
    User.deleteMany({}),
    Patient.deleteMany({}),
    CaregiverPatientLink.deleteMany({}),
    PairingCode.deleteMany({}),
    Medication.deleteMany({}),
    MedicationSchedule.deleteMany({}),
    MedicationEvent.deleteMany({}),
    Prescription.deleteMany({}),
    MedicalDocument.deleteMany({}),
    Notification.deleteMany({}),
    VoicePreference.deleteMany({}),
    DoctorQrToken.deleteMany({}),
    DoctorAccessSession.deleteMany({}),
    PrivacySettings.deleteMany({}),
    AuditLog.deleteMany({}),
    CareCircleContact.deleteMany({}),
    AssistanceRequest.deleteMany({}),
    AssistanceEvent.deleteMany({}),
    ProfessionalCaregiver.deleteMany({}),
    PaymentOrder.deleteMany({})
  ]);

  // 1. Create Caregiver User
  const caregiverPasswordHash = await authService.hashPassword('Password123!');
  const caregiver = new User({
    name: 'Ananya Raman',
    email: 'caregiver@lifelink.com',
    phone: '+91 98400 12345',
    passwordHash: caregiverPasswordHash,
    role: 'caregiver',
    address: 'Tower 4, Green Meadows, Chennai, Tamil Nadu',
    relationshipToSenior: 'Daughter',
    preferredLanguage: 'English',
    notificationPreference: 'all',
    isActive: true
  });
  await caregiver.save();

  // 2. Create Senior Patient Profile
  const patient = new Patient({
    fullName: 'Kalyani Ammal',
    preferredName: 'Paati',
    dateOfBirth: new Date('1948-04-14'),
    age: 78,
    gender: 'female',
    phone: '+91 98400 67890',
    email: 'paati@lifelink.com',
    bloodGroup: 'B+',
    emergencyContactName: 'Ananya Raman',
    emergencyContactPhone: '+91 98400 12345',
    relationship: 'Daughter',
    secondaryContactName: 'Dr. Suresh Raman',
    secondaryContactPhone: '+91 98400 54321',
    secondaryRelationship: 'Son / Family Physician',
    address: '42, Temple View Avenue, Chennai, Tamil Nadu',
    mobilityStatus: 'Walks with support',
    visionStatus: 'Uses glasses',
    hearingStatus: 'Normal hearing',
    communicationPreference: 'Spoken / Friendly',
    knownAllergies: ['Penicillin (causes mild cutaneous rash)'],
    importantHealthConditions: ['Type-2 Diabetes Mellitus', 'Essential Hypertension', 'Osteoarthritis (bilateral knees)'],
    dietaryRestrictions: ['Low Sodium', 'Diabetic Diet', 'Vegetarian'],
    specialCareNotes: 'Uses wooden walking stick when outdoors. Remind to drink warm water with morning pills.',
    medicalNotes: 'Under care of Dr. K. Narayanan (Endocrinologist) and Dr. V. Chandrasekhar (Cardiologist).',
    languagePreference: 'Tanglish',
    voiceSpeed: 0.9,
    fontSizePreference: 'large',
    createdCaregiverId: caregiver._id,
    isActive: true
  });
  await patient.save();

  // 3. Create Senior User account linked to patient
  const seniorPasswordHash = await authService.hashPassword('Password123!');
  const seniorUser = new User({
    name: 'Kalyani Ammal',
    phone: '+91 98400 67890',
    email: 'senior@lifelink.com',
    passwordHash: seniorPasswordHash,
    role: 'senior',
    isActive: true
  });
  await seniorUser.save();

  patient.linkedUserId = seniorUser._id as any;
  await patient.save();

  // 4. Create Caregiver-Patient Link
  await CaregiverPatientLink.create({
    caregiverId: caregiver._id,
    patientId: patient._id,
    relationship: 'Daughter',
    isPrimary: true,
    status: 'active'
  });

  // 5. Create Active Pairing Code & QR
  const demoPairingCode = 'LL-882200';
  const qrDataUrl = await QRCode.toDataURL(
    JSON.stringify({
      code: demoPairingCode,
      patientId: patient._id.toString(),
      caregiverId: caregiver._id.toString(),
      app: 'LL_LifeLink'
    }),
    {
      errorCorrectionLevel: 'H',
      color: { dark: '#FF7A00', light: '#FFFFFF' }
    }
  );

  await PairingCode.create({
    patientId: patient._id,
    caregiverId: caregiver._id,
    code: demoPairingCode,
    qrCodeDataUrl: qrDataUrl,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days for demo
    isUsed: false
  });

  // 6. Create Voice Preferences
  await VoicePreference.create({
    patientId: patient._id,
    language: 'Tanglish',
    voiceSpeed: 0.85,
    voicePitch: 1.0,
    customGreeting: 'Good morning paati. Time for your medicine.',
    repeatPlayback: true,
    isMuted: false
  });

  // 7. Create Prescriptions
  const prescription = new Prescription({
    patientId: patient._id,
    uploadedBy: caregiver._id,
    fileUrl: '/api/documents/files/sample-prescription.pdf',
    originalFileName: 'Apollo_Prescription_DrRamanathan_Oct2026.pdf',
    ocrRawText: 'Apollo Hospitals Chennai\nDr. K. Ramanathan MD (Gen Med)\nRx: Tab Metformin 500mg (1-0-1 After food)\nTab Amlodipine 5mg (1-0-0 Morning)\nTab Atorvastatin 20mg (0-0-1 Night)',
    doctorName: 'Dr. K. Ramanathan, MD (Gen Med)',
    hospitalName: 'Apollo Hospitals Greams Road',
    prescriptionDate: new Date('2026-10-01'),
    verificationStatus: 'VERIFIED',
    verifiedAt: new Date(),
    verifiedBy: caregiver._id,
    extractedMedications: [
      {
        medicineName: 'Metformin',
        genericName: 'Metformin HCl',
        dose: '500',
        unit: 'mg',
        form: 'Tablet',
        frequency: 'Twice Daily',
        timing: 'Morning & Night',
        foodInstruction: 'After food',
        confidence: 0.96
      },
      {
        medicineName: 'Amlodipine',
        genericName: 'Amlodipine Besylate',
        dose: '5',
        unit: 'mg',
        form: 'Tablet',
        frequency: 'Once Daily',
        timing: 'Morning',
        foodInstruction: 'After food',
        confidence: 0.92
      },
      {
        medicineName: 'Pantoprazole',
        genericName: 'Pantoprazole Sodium',
        dose: '40',
        unit: 'mg',
        form: 'Tablet',
        frequency: 'Once Daily',
        timing: 'Morning',
        foodInstruction: 'Empty Stomach (Before food)',
        confidence: 0.94
      }
    ]
  });
  await prescription.save();

  // 8. Create Active Medications
  const medPantoprazole = await Medication.create({
    patientId: patient._id,
    name: 'Pantoprazole',
    genericName: 'Pantoprazole Sodium Gastro-resistant',
    dose: '40',
    unit: 'mg',
    form: 'Tablet',
    instructions: 'Take 30 minutes before morning breakfast with plain water.',
    foodRelation: 'EMPTY_STOMACH',
    sourcePrescriptionId: prescription._id,
    active: true,
    isArchived: false
  });

  const medMetformin = await Medication.create({
    patientId: patient._id,
    name: 'Metformin',
    genericName: 'Metformin Hydrochloride Prolonged-Release',
    dose: '500',
    unit: 'mg',
    form: 'Tablet',
    instructions: 'Take with or immediately after food to prevent stomach upset.',
    foodRelation: 'AFTER_MEAL',
    sourcePrescriptionId: prescription._id,
    active: true,
    isArchived: false
  });

  const medAmlodipine = await Medication.create({
    patientId: patient._id,
    name: 'Amlodipine',
    genericName: 'Amlodipine Besylate',
    dose: '5',
    unit: 'mg',
    form: 'Tablet',
    instructions: 'Take daily in morning after breakfast for blood pressure control.',
    foodRelation: 'AFTER_MEAL',
    sourcePrescriptionId: prescription._id,
    active: true,
    isArchived: false
  });

  const medAtorvastatin = await Medication.create({
    patientId: patient._id,
    name: 'Atorvastatin',
    genericName: 'Atorvastatin Calcium',
    dose: '20',
    unit: 'mg',
    form: 'Tablet',
    instructions: 'Take at bedtime after dinner for lipid control.',
    foodRelation: 'AFTER_MEAL',
    sourcePrescriptionId: prescription._id,
    active: true,
    isArchived: false
  });

  // 9. Create Schedules
  const schedPanto = await MedicationSchedule.create({
    medicationId: medPantoprazole._id,
    patientId: patient._id,
    time: '07:30',
    frequency: 'DAILY',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    label: 'Morning Before Food',
    enabled: true
  });

  const schedMetforminMorn = await MedicationSchedule.create({
    medicationId: medMetformin._id,
    patientId: patient._id,
    time: '08:30',
    frequency: 'TWICE_DAILY',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    label: 'Morning Breakfast Dose',
    enabled: true
  });

  const schedAmlodipine = await MedicationSchedule.create({
    medicationId: medAmlodipine._id,
    patientId: patient._id,
    time: '08:30',
    frequency: 'DAILY',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    label: 'Morning BP Tablet',
    enabled: true
  });

  const schedAtorva = await MedicationSchedule.create({
    medicationId: medAtorvastatin._id,
    patientId: patient._id,
    time: '20:30',
    frequency: 'DAILY',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    label: 'Night Dinner Dose',
    enabled: true
  });

  // 10. Create Today's Medication Events
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];

  // 1. Pantoprazole - TAKEN on time
  await MedicationEvent.create({
    scheduleId: schedPanto._id,
    medicationId: medPantoprazole._id,
    patientId: patient._id,
    scheduledTime: new Date(`${dateStr}T07:30:00`),
    status: 'TAKEN',
    takenAt: new Date(`${dateStr}T07:35:00`),
    responseNotes: 'Confirmed taken by Paati'
  });

  // 2. Metformin - TAKEN
  await MedicationEvent.create({
    scheduleId: schedMetforminMorn._id,
    medicationId: medMetformin._id,
    patientId: patient._id,
    scheduledTime: new Date(`${dateStr}T08:30:00`),
    status: 'TAKEN',
    takenAt: new Date(`${dateStr}T08:32:00`),
    responseNotes: 'Taken with breakfast'
  });

  // 3. Amlodipine - DUE / UPCOMING (Ready for demo confirmation or escalation test!)
  const dueEvent = await MedicationEvent.create({
    scheduleId: schedAmlodipine._id,
    medicationId: medAmlodipine._id,
    patientId: patient._id,
    scheduledTime: new Date(),
    status: 'DUE',
    reminderSentAt: new Date(),
    escalationDueAt: new Date(Date.now() + 5 * 60 * 1000)
  });

  // 4. Atorvastatin - UPCOMING tonight
  await MedicationEvent.create({
    scheduleId: schedAtorva._id,
    medicationId: medAtorvastatin._id,
    patientId: patient._id,
    scheduledTime: new Date(`${dateStr}T20:30:00`),
    status: 'UPCOMING',
    escalationDueAt: new Date(`${dateStr}T20:35:00`)
  });

  // 11. Create Sample Medical Documents
  await MedicalDocument.create({
    patientId: patient._id,
    type: 'Blood Report',
    fileName: 'Comprehensive_Metabolic_Profile_Oct2026.pdf',
    fileUrl: '/api/documents/files/sample-blood-report.pdf',
    fileSizeBytes: 482000,
    mimeType: 'application/pdf',
    hospitalName: 'Apollo Diagnostics Laboratory',
    doctorName: 'Dr. S. Meenakshi, Pathologist',
    documentDate: new Date('2026-10-02'),
    notes: 'Routine 6-month diabetic profile checkup.',
    aiSummary: {
      summary: 'HbA1c level is 6.8% showing fair diabetic management. Lipid panel and renal markers are within expected safe parameters.',
      keyObservations: [
        'Fasting blood sugar: 122 mg/dL',
        'HbA1c: 6.8% (Target < 7.0%)',
        'Kidney function tests (Serum Creatinine 0.9 mg/dL) are normal'
      ],
      isInformationalOnly: true,
      generatedAt: new Date()
    },
    uploadedBy: caregiver._id
  });

  await MedicalDocument.create({
    patientId: patient._id,
    type: 'ECG',
    fileName: 'Resting_12_Lead_ECG_Sep2026.pdf',
    fileUrl: '/api/documents/files/sample-ecg.pdf',
    fileSizeBytes: 310000,
    mimeType: 'application/pdf',
    hospitalName: 'Apollo Heart Centre',
    doctorName: 'Dr. V. Chandrasekhar, Cardiologist',
    documentDate: new Date('2026-09-18'),
    notes: 'Annual cardiac screening for hypertension follow-up.',
    aiSummary: {
      summary: 'Resting 12-lead ECG demonstrates standard normal sinus rhythm at 72 bpm. Conduction intervals are normal.',
      keyObservations: [
        'Normal sinus rhythm with rate 72 bpm',
        'No signs of acute ischemia or arrhythmia'
      ],
      isInformationalOnly: true,
      generatedAt: new Date()
    },
    shareWithDoctor: true,
    uploadedBy: caregiver._id
  });

  // 12. Create Sample Notifications
  await Notification.create({
    recipientUserId: caregiver._id,
    patientId: patient._id,
    type: 'MEDICATION_TAKEN',
    title: 'Medication Taken: Pantoprazole 40mg',
    body: 'Paati took Pantoprazole 40mg at 07:35 AM.',
    channel: 'IN_APP',
    read: true,
    readAt: new Date()
  });

  await Notification.create({
    recipientUserId: caregiver._id,
    patientId: patient._id,
    type: 'MEDICATION_DUE',
    title: 'Reminder Sent: Amlodipine 5mg',
    body: 'Scheduled morning blood pressure dose sent to Paati’s phone.',
    channel: 'IN_APP',
    read: false
  });

  // 13. Create Privacy Settings
  await PrivacySettings.create({
    patientId: patient._id,
    allowDoctorAccess: true,
    allowMedicationAccess: true,
    allowHealthConditionAccess: true,
    allowPrescriptionAccess: true,
    allowDocumentMetadataAccess: true,
    allowDocumentPreview: true,
    allowEmergencyContactAccess: true
  });

  // 14. Seed Care Circle Contacts (Phase 2)
  // 14. Seed Care Circle Contacts (Phase 2)
  const contact1 = await CareCircleContact.create({
    patientId: patient._id,
    caregiverId: caregiver._id,
    name: 'Ramesh Kumar',
    phone: '+91 98400 22334',
    relationship: 'neighbour',
    priority: 1,
    available: true,
    consentStatus: 'ACCEPTED',
    permissions: ['receive_assistance_alert', 'view_medicine_name', 'view_dosage', 'mark_completion']
  });

  const contact2 = await CareCircleContact.create({
    patientId: patient._id,
    caregiverId: caregiver._id,
    name: 'Deepa Sundaram',
    phone: '+91 98400 33445',
    relationship: 'relative',
    priority: 2,
    available: true,
    consentStatus: 'ACCEPTED',
    permissions: ['receive_assistance_alert', 'view_medicine_name', 'view_dosage', 'mark_completion']
  });

  // 15. Seed Professional Caregivers (Phase 2)
  const profPasswordHash = await authService.hashPassword('Password123!');
  const profUser1 = await User.create({
    name: 'Sister Lakshmi Narayanan, RN',
    email: 'sister.lakshmi@lifelink.com',
    phone: '+91 98400 77889',
    passwordHash: profPasswordHash,
    role: 'caregiver',
    isActive: true
  });

  const profUser2 = await User.create({
    name: 'Anand Mohan',
    email: 'anand.m@lifelink.com',
    phone: '+91 98400 88990',
    passwordHash: profPasswordHash,
    role: 'caregiver',
    isActive: true
  });

  const prof1 = await ProfessionalCaregiver.create({
    userId: profUser1._id,
    fullName: 'Sister Lakshmi Narayanan, RN',
    phone: '+91 98400 77889',
    email: 'sister.lakshmi@lifelink.com',
    address: '14, Alwarpet High Road, Chennai, Tamil Nadu',
    serviceArea: 'Central & South Chennai',
    professionalRole: 'Registered Geriatric Nurse',
    experienceYears: 9,
    credentialsSummary: 'Tamil Nadu Nursing Council Certified (TNC-RN-994821). Specialist in elderly post-op & daily medication management.',
    verificationStatus: 'VERIFIED',
    verifiedAt: new Date(),
    isAvailable: true,
    serviceRadiusKm: 10,
    fixedAssistanceFee: 350,
    activeJobsCount: 0,
    location: {
      type: 'Point',
      coordinates: [80.2508, 13.0475] // Chennai Alwarpet
    },
    verificationDocuments: [
      {
        title: 'Tamil Nadu Nursing Council Registration',
        docType: 'nursing_certificate',
        url: '/uploads/cert-lakshmi.pdf',
        uploadedAt: new Date()
      }
    ]
  });

  const prof2 = await ProfessionalCaregiver.create({
    userId: profUser2._id,
    fullName: 'Anand Mohan',
    phone: '+91 98400 88990',
    email: 'anand.m@lifelink.com',
    address: '28, South Mada Street, Mylapore, Chennai, Tamil Nadu',
    serviceArea: 'Mylapore & Mandaveli',
    professionalRole: 'Certified Mobility & Medication Aide',
    experienceYears: 3,
    credentialsSummary: 'Red Cross Certified Home Care Aide. Physical mobility support and elderly assistance specialist.',
    verificationStatus: 'PENDING_VERIFICATION',
    isAvailable: true,
    serviceRadiusKm: 8,
    fixedAssistanceFee: 250,
    activeJobsCount: 0,
    location: {
      type: 'Point',
      coordinates: [80.2450, 13.0380] // Chennai Mylapore
    },
    verificationDocuments: [
      {
        title: 'National Aadhaar Card',
        docType: 'identity_proof',
        url: '/uploads/id-anand.pdf',
        uploadedAt: new Date()
      }
    ]
  });

  // 16. Seed an Assistance Request in PRIMARY_CAREGIVER_ALERTED state for demo/DOE
  const assistanceReq = await AssistanceRequest.create({
    patientId: patient._id,
    medicationEventId: dueEvent._id,
    primaryCaregiverId: caregiver._id,
    currentEscalationStage: 'PRIMARY_CAREGIVER_ALERTED',
    status: 'PRIMARY_CAREGIVER_ALERTED',
    priority: 'HIGH',
    reason: 'Cannot open child-proof medicine bottle cap due to bilateral wrist osteoarthritis pain.',
    medicineLocationNotes: 'Dining table wooden medicine organizer, labeled "MORNING" drawer.',
    location: {
      type: 'Point',
      coordinates: [80.2520, 13.0480]
    },
    approximateArea: 'Temple View Avenue, Chennai (within 1 km)',
    locationPermission: true,
    paymentRequired: false,
    fee: 0,
    patientConfirmation: false,
    caregiverConfirmation: false,
    dueAt: new Date(Date.now() + 20 * 60 * 1000)
  });

  await AssistanceEvent.create({
    requestId: assistanceReq._id,
    patientId: patient._id,
    fromStatus: 'CREATED',
    toStatus: 'PRIMARY_CAREGIVER_ALERTED',
    actorId: seniorUser._id.toString(),
    actorRole: 'SENIOR',
    note: 'Paati pressed "NEED HELP" for Amlodipine 5mg assistance.'
  });

  // 17. Generate Active Doctor QR
  const doctorQr = await doctorQrService.generateDoctorQr(
    patient._id.toString(),
    caregiver._id.toString(),
    'CAREGIVER'
  );

  console.log(`[Seed] Seeded Doctor QR token: ${doctorQr.token}`);
  console.log('[Seed] Seeded Phase 2 CareCircle, Caregivers, and Assistance Request successfully!');
  console.log('[Seed] Seeding completed successfully!');
  return {
    caregiver: {
      email: caregiver.email,
      password: 'Password123!',
      name: caregiver.name
    },
    senior: {
      phone: seniorUser.phone,
      password: 'Password123!',
      patientName: patient.fullName,
      preferredName: patient.preferredName,
      pairingCode: demoPairingCode
    },
    doctorQrToken: doctorQr.token,
    patientId: patient._id.toString(),
    dueEventId: dueEvent._id.toString()
  };
}

if (require.main === module) {
  seedDatabase()
    .then(data => {
      console.log('Seeded data:', JSON.stringify(data, null, 2));
      process.exit(0);
    })
    .catch(err => {
      console.error('Seeding error:', err);
      process.exit(1);
    });
}
