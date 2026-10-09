# LL LifeLink Testing Guide

This document describes the testing strategy and commands for backend, web, and mobile components.

---

## 1. Automated Backend Tests

The backend test suite runs with Jest, Supertest, and `mongodb-memory-server` for isolated, hermetic execution.

### Running Backend Tests
```bash
cd backend
npm test
```

### Coverage Areas Verified
1. **Caregiver Registration & Password Hashing** (Bcrypt + JWT)
2. **Caregiver Login & Session Tokens**
3. **Senior Patient Profile Creation** (with role and ownership verification)
4. **Caregiver-Patient Listing & Authorization Check**
5. **6-Digit Pairing Code & QR Generation**
6. **Senior Device Pairing & Token Handshake**
7. **Medication Creation & Audit Logging**
8. **Medication Schedule Timing & Day Frequency**
9. **Today's Scheduled Events Generation (Idempotent)**
10. **Senior Confirms TAKEN (Status Transition)**
11. **Caregiver Resend Reminder Action**
12. **5-Minute No-Response Escalation Engine** (`PENDING_CONFIRMATION` event & alert)
13. **Offline Queue Sync Duplicate Prevention** (no duplicate records generated)
14. **OCR Clinical Prescription Parsing & Candidate Extraction**
15. **AI Plain-Language Summary & Voice Script Generation**
16. **Adherence Report Calculation & Percentage Aggregates**

---

## 2. Web Caregiver Dashboard Verification

### Type Checking & Production Build
```bash
cd web
npm run build
```
Verifies all TypeScript types, React component bindings, Next.js routing, and page optimization.

---

## 3. Mobile Flutter App Verification

### Static Analysis
```bash
cd mobile
flutter analyze
```
Verifies Dart type consistency, null-safety, and senior accessibility properties.

### Mobile Widget Tests
```bash
cd mobile
flutter test
```
Verifies widget tree initialization, splash screen branding, and transition behavior.

---

## 4. End-to-End Hackathon Presentation Flow

To demonstrate the full real-time integration live:

1. **Start Backend:**
   ```bash
   cd backend && npm run dev
   ```
2. **Start Web:**
   ```bash
   cd web && npm run dev
   ```
3. **Log in on Web:**
   - Go to `http://localhost:3000`
   - Click "One-Click Demo Caregiver Login"
4. **Trigger 5-Minute Escalation Simulator:**
   - In the top navigation bar, click **"Simulate 5-Min Escalation"**.
   - Notice the prominent urgent alert card appears on screen.
   - Click **"Resend Reminder"**.
5. **Verify OCR Prescription Scanner:**
   - Navigate to "Prescriptions & OCR".
   - Upload any medical receipt or prescription image.
   - Observe extracted candidate medications with confidence scores.
   - Verify that medications are **NOT** active until you click "Verify & Activate Medications".
6. **On Mobile App:**
   - Launch Flutter app (`flutter run`).
   - Enter `LL-882200` to link to Paati's profile.
   - Tap "Hear Voice Reminder" to hear speech in English, Tamil, Tanglish, Hindi, or Telugu.
   - Tap the huge green "I HAVE TAKEN THIS" button.
   - Watch the Web Caregiver Dashboard update in real-time without refreshing!
