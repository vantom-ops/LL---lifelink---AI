# LL LifeLink API Documentation

Comprehensive REST API reference for **LL LifeLink (Phase 1 - Senior Medication Management)**.

- **Base URL:** `http://localhost:5000/api`
- **Authentication:** Bearer token in `Authorization: Bearer <token>` header
- **Formats:** `application/json` (or `multipart/form-data` for file uploads)

---

## 1. Authentication (`/api/auth`)

### Register Caregiver
- **POST** `/auth/register`
- **Body:**
  ```json
  {
    "name": "Ananya Raman",
    "email": "caregiver@lifelink.com",
    "phone": "+91 98400 12345",
    "password": "Password123!"
  }
  ```
- **Response `201`:**
  ```json
  {
    "success": true,
    "message": "Caregiver account registered successfully.",
    "data": {
      "user": { "id": "...", "name": "Ananya Raman", "role": "caregiver" },
      "tokens": { "accessToken": "...", "refreshToken": "..." }
    }
  }
  ```

### Login
- **POST** `/auth/login`
- **Body:**
  ```json
  {
    "emailOrPhone": "caregiver@lifelink.com",
    "password": "Password123!"
  }
  ```

### Get Current User Profile
- **GET** `/auth/me`
- **Headers:** `Authorization: Bearer <token>`

---

## 2. Senior Patients (`/api/patients`)

### Create Senior Profile
- **POST** `/patients`
- **Body:**
  ```json
  {
    "fullName": "Kalyani Ammal",
    "preferredName": "Paati",
    "age": 78,
    "gender": "female",
    "bloodGroup": "B+",
    "emergencyContactName": "Ananya Raman",
    "emergencyContactPhone": "+91 98400 12345",
    "languagePreference": "Tanglish"
  }
  ```

### List Seniors for Caregiver
- **GET** `/patients`
- **Headers:** `Authorization: Bearer <token>`

### Get Senior Details
- **GET** `/patients/:id`

---

## 3. Smartphone Pairing (`/api/pairing`)

### Generate 6-Digit Code & QR Code
- **POST** `/pairing/generate`
- **Body:** `{ "patientId": "<patient_id>" }`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "code": "LL-882200",
      "qrCodeDataUrl": "data:image/png;base64,...",
      "expiresAt": "2026-10-09T18:00:00.000Z"
    }
  }
  ```

### Pair Phone (Senior App)
- **POST** `/pairing/pair`
- **Body:**
  ```json
  {
    "code": "LL-882200",
    "deviceInfo": { "deviceName": "Senior Android Phone" }
  }
  ```

---

## 4. Prescriptions & OCR Extraction (`/api/prescriptions`)

### Upload Prescription Document
- **POST** `/prescriptions/upload`
- **Form Data:** `file: <image/pdf>`, `patientId: "<patient_id>"`
- **Response:** Runs OCR with candidate pill extraction, returning confidence values and `PENDING_REVIEW` status.

### Caregiver Verify & Activate
- **POST** `/prescriptions/:id/verify`
- **Critical Safety Guardrail:** OCR never activates schedules automatically. Caregiver must review and verify before active schedules are generated.
- **Body:**
  ```json
  {
    "confirmedMedications": [
      {
        "name": "Metformin",
        "dose": "500",
        "unit": "mg",
        "foodRelation": "AFTER_MEAL",
        "schedules": [{ "time": "08:00", "frequency": "DAILY" }]
      }
    ]
  }
  ```

---

## 5. Medications & Schedules (`/api/medications`, `/api/schedules`)

### Create Medication
- **POST** `/medications`
- **Body:** `{ "patientId": "...", "name": "Amlodipine", "dose": "5", "unit": "mg", "foodRelation": "AFTER_MEAL" }`

### Archive Medication
- **POST** `/medications/:id/archive`
- **Body:** `{ "reason": "Completed treatment course" }`

### Create Schedule
- **POST** `/schedules`
- **Body:** `{ "patientId": "...", "medicationId": "...", "time": "08:30", "frequency": "DAILY" }`

### Toggle Schedule Enabled/Disabled
- **PATCH** `/schedules/:id/toggle`
- **Body:** `{ "enabled": true }`

---

## 6. Medication Events & Confirmations (`/api/medication-events`)

### Get Today's Scheduled Events
- **GET** `/medication-events/today/:patientId`

### Confirm TAKEN
- **POST** `/medication-events/:id/confirm-taken`
- **Body:** `{ "notes": "Taken with water", "clientTimestamp": "2026-10-08T08:32:00.000Z" }`

### Mark NOT TAKEN
- **POST** `/medication-events/:id/mark-not-taken`
- **Body:** `{ "reason": "Feeling nauseous" }`

### Resend Reminder (Caregiver Action)
- **POST** `/medication-events/:id/resend-reminder`

### Sync Offline Queue
- **POST** `/medication-events/sync-offline`
- **Duplicate Prevention:** Existing TAKEN events are never duplicated or overwritten with older timestamps.

---

## 7. Long-Term Medical Records (`/api/documents`)

### Upload Medical Scan
- **POST** `/documents/upload`
- **Form Data:** `file`, `patientId`, `type` (`Blood Report`, `ECG`, `X-Ray`, `CT Scan`, `MRI`, `Ultrasound`, `Prescription`), `hospitalName`, `doctorName`, `notes`
- **AI Integration:** Automatically attaches non-diagnostic plain-language summary and clinical observations.

### List Documents
- **GET** `/documents/patient/:patientId?type=Blood Report&search=Apollo`

### Download Private File
- **GET** `/documents/files/:fileName`

---

## 8. Adherence Analytics (`/api/reports`)

### Get Adherence Report
- **GET** `/reports/adherence/:patientId?period=week`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "stats": {
        "period": "week",
        "totalScheduled": 21,
        "takenCount": 19,
        "lateCount": 1,
        "missedCount": 1,
        "takenPercentage": 90,
        "dailyBreakdown": [...]
      }
    }
  }
  ```

---

## 9. Demo Controls (`/api/demo`)

### Seed Demo Database
- **POST** `/demo/seed`
- Seeds realistic demo accounts: `caregiver@lifelink.com` / `Password123!`, Senior: `Paati`, Pairing code: `LL-882200`.

### Fast-Forward 5-Minute Escalation Simulator
- **POST** `/demo/simulate-timeout`
- **Body:** `{ "patientId": "<patient_id>" }`
- Immediately marks overdue medications as `PENDING_CONFIRMATION` and triggers caregiver alerts.

---

## 10. Real-Time WebSockets (Socket.IO)

- **Connection URL:** `http://localhost:5000`
- **Rooms:**
  - `user:<userId>`: Personal alerts (caregiver & senior)
  - `patient:<patientId>`: Patient medication updates
- **Client Emitted Events:**
  - `subscribe_patient`: `{ patientId }`
- **Server Broadcast Events:**
  - `notification`: New alert payload
  - `patient_update`: Live schedule status transition
