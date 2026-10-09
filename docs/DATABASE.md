# LL LifeLink Database Schema Documentation

LL LifeLink utilizes MongoDB with Mongoose for resilient, senior-first medication records, secure document history, and real-time adherence tracking.

---

## 1. Collections & Schemas

### 1. `users`
Represents caregivers and registered seniors.
- `name` (String, required)
- `email` (String, unique, sparse, lowercase)
- `phone` (String, sparse)
- `passwordHash` (String)
- `role` (Enum: `'caregiver' | 'senior' | 'admin'`, default: `'caregiver'`)
- `fcmToken` (String, optional push notification token)
- `isActive` (Boolean, default: `true`)
- **Indexes:** `email: 1`, `phone: 1`, `role: 1`

### 2. `patients`
Represents the elderly profile being cared for.
- `fullName` (String, required)
- `preferredName` (String, e.g. "Paati", "Dad")
- `age` (Number, required)
- `gender` (Enum: `'male' | 'female' | 'other'`)
- `bloodGroup` (String, e.g. "B+")
- `emergencyContactName` (String, required)
- `emergencyContactPhone` (String, required)
- `languagePreference` (Enum: `'English' | 'Tamil' | 'Tanglish' | 'Hindi' | 'Telugu'`)
- `fontSizePreference` (Enum: `'normal' | 'large' | 'extra-large'`)
- `linkedUserId` (ObjectId ref: `User`, sparse)
- `createdCaregiverId` (ObjectId ref: `User`, required)
- **Indexes:** `createdCaregiverId: 1`, `isActive: 1`

### 3. `caregiverPatientLinks`
Enforces least-privilege relational access between caregivers and seniors.
- `caregiverId` (ObjectId ref: `User`)
- `patientId` (ObjectId ref: `Patient`)
- `relationship` (String, e.g. "Daughter", "Son")
- `isPrimary` (Boolean)
- `permissions` (Array of Strings: `['read', 'write', 'schedule', 'upload_documents']`)
- `status` (Enum: `'active' | 'revoked'`)
- **Unique Compound Index:** `{ caregiverId: 1, patientId: 1 }`

### 4. `pairingCodes`
One-time pairing mechanism for linking elderly phones.
- `patientId` (ObjectId ref: `Patient`)
- `caregiverId` (ObjectId ref: `User`)
- `code` (String, unique, e.g. "LL-882200")
- `qrCodeDataUrl` (String, base64 QR payload)
- `expiresAt` (Date, 24-hour expiration)
- `isUsed` (Boolean, marked true upon pairing)
- `usedAt` (Date)
- **Indexes:** `code: 1 (unique)`, `patientId: 1`, `expiresAt: 1`

### 5. `medications`
Prescribed medications for a senior.
- `patientId` (ObjectId ref: `Patient`)
- `name` (String, required, e.g. "Metformin")
- `genericName` (String, e.g. "Metformin HCl")
- `dose` (String, required, e.g. "500")
- `unit` (String, e.g. "mg", "tablet")
- `form` (String, e.g. "Tablet", "Capsule")
- `instructions` (String)
- `foodRelation` (Enum: `'BEFORE_MEAL' | 'AFTER_MEAL' | 'WITH_MEAL' | 'EMPTY_STOMACH' | 'NO_RESTRICTION'`)
- `sourcePrescriptionId` (ObjectId ref: `Prescription`, optional)
- `active` (Boolean, default: `true`)
- `isArchived` (Boolean, default: `false`)
- `archivedAt` (Date)
- `archivedReason` (String)
- **Indexes:** `patientId: 1`, `active: 1`, `isArchived: 1`

### 6. `medicationSchedules`
Dosing time and recurrence settings for medications.
- `medicationId` (ObjectId ref: `Medication`)
- `patientId` (ObjectId ref: `Patient`)
- `time` (String, HH:mm format, e.g. "08:30")
- `frequency` (Enum: `'DAILY' | 'TWICE_DAILY' | 'THRICE_DAILY' | 'CUSTOM' | 'AS_NEEDED'`)
- `daysOfWeek` (Array of Numbers: `[0..6]`)
- `label` (String, e.g. "Morning Dose")
- `enabled` (Boolean, default: `true`)
- **Indexes:** `{ patientId: 1, enabled: 1 }`, `medicationId: 1`

### 7. `medicationEvents`
Permanent adherence log entries and status tracking.
- `scheduleId` (ObjectId ref: `MedicationSchedule`)
- `medicationId` (ObjectId ref: `Medication`)
- `patientId` (ObjectId ref: `Patient`)
- `scheduledTime` (Date, required)
- `status` (Enum: `'UPCOMING' | 'DUE' | 'PENDING_CONFIRMATION' | 'TAKEN' | 'LATE' | 'MISSED' | 'NOT_TAKEN'`)
- `takenAt` (Date)
- `markedNotTakenAt` (Date)
- `reminderSentAt` (Date)
- `escalationDueAt` (Date, scheduledTime + 5 minutes)
- `caregiverAlertSentAt` (Date)
- `resendCount` (Number, default: 0)
- `offlineQueued` (Boolean, default: false)
- `syncedAt` (Date)
- **Indexes:** `{ patientId: 1, scheduledTime: -1 }`, `{ status: 1, escalationDueAt: 1 }`

### 8. `prescriptions`
Prescription scans, OCR candidate extraction, and caregiver review verification.
- `patientId` (ObjectId ref: `Patient`)
- `uploadedBy` (ObjectId ref: `User`)
- `fileUrl` (String)
- `originalFileName` (String)
- `ocrRawText` (String)
- `extractedMedications` (Array of candidate pills with confidence scores)
- `doctorName` (String)
- `hospitalName` (String)
- `prescriptionDate` (Date)
- `verificationStatus` (Enum: `'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED'`)
- `verifiedAt` (Date)
- `verifiedBy` (ObjectId ref: `User`)
- **Indexes:** `patientId: 1`, `verificationStatus: 1`

### 9. `medicalDocuments`
Long-term health archive for scans and reports.
- `patientId` (ObjectId ref: `Patient`)
- `type` (Enum: `'Prescription' | 'X-Ray' | 'CT Scan' | 'MRI' | 'ECG' | 'Ultrasound' | 'Blood Report' | 'Other Medical Report'`)
- `fileName` (String)
- `fileUrl` (String)
- `fileSizeBytes` (Number)
- `mimeType` (String)
- `hospitalName` (String)
- `doctorName` (String)
- `documentDate` (Date)
- `notes` (String)
- `aiSummary` (Object containing summary, keyObservations, isInformationalOnly)
- **Indexes:** `{ patientId: 1, type: 1, documentDate: -1 }`

### 10. `notifications`
Real-time notification records.
- `recipientUserId` (ObjectId ref: `User`)
- `patientId` (ObjectId ref: `Patient`)
- `type` (Enum: `'MEDICATION_DUE' | 'PENDING_CONFIRMATION' | 'MEDICATION_TAKEN' | 'MEDICATION_MISSED' | 'MEDICATION_LATE' | 'SENIOR_REQUESTED_CONTACT' | 'SYSTEM_ALERT'`)
- `title` (String)
- `body` (String)
- `payload` (Mixed)
- `read` (Boolean, default: `false`)
- `channel` (Enum: `'PUSH' | 'SMS' | 'IN_APP' | 'VOICE'`)
- **Indexes:** `{ recipientUserId: 1, createdAt: -1 }`

### 11. `voicePreferences`
Speech settings for elderly audio reminders.
- `patientId` (ObjectId ref: `Patient`, unique)
- `language` (Enum: `'English' | 'Tamil' | 'Tanglish' | 'Hindi' | 'Telugu'`)
- `voiceSpeed` (Number, default: 0.9)
- `customGreeting` (String)
- `repeatPlayback` (Boolean)

### 12. `auditLogs`
Compliance audit trail for medication modifications and caregiver actions.
- `userId` (ObjectId ref: `User`)
- `action` (String, e.g. `'MEDICATION_CREATED'`, `'MEDICATION_ARCHIVED'`, `'SCHEDULE_CHANGED'`)
- `entityType` (String)
- `entityId` (String)
- `details` (Mixed)
- **Indexes:** `{ entityType: 1, entityId: 1, createdAt: -1 }`

---

## 2. Phase 2 Architecture Extension Points

The backend and database are designed with clean boundaries so that Phase 2 features can be seamlessly layered on without breaking Phase 1 schemas:

1. **Disability Assistance Requests:** Can reference `patientId` and generate escalation tasks.
2. **Alternative Trusted Contacts / Neighbors:** Extends `caregiverPatientLinks` with role `'neighbor'` or `'emergency_escalation'`.
3. **Verified Professional Caregivers:** Re-uses `User` collection with `role: 'professional_caregiver'` and an attached certification schema.
4. **Geolocation Sharing:** Optional GPS fields on `Patient` (`currentLocation: { lat, lng, updatedAt }`).
5. **Payment & Billing Records:** Dedicated `transactions` collection linking `patientId` and service request ID.
