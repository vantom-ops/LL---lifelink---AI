# LL LifeLink 🧡
> **Connected care. Clear medication. Peace of mind.**

Production-ready medication management and caregiver support platform for older adults. LL LifeLink enables family caregivers (such as a son or daughter) to securely manage an elderly person's medication schedules, prescriptions, and health records, while the elderly person receives clear visual cards and friendly voice reminders on their phone and confirms each dose with large, accessible buttons.

---

## 🌟 Key Features (Phase 1)

1. **Senior-First Mobile App (Flutter):**
   - High-contrast, warm senior-friendly design with large touch targets (minimum 48dp, 60–68dp primary action buttons).
   - Prominent **Next Medication Card** showing medicine name, dose, food timing ("After Breakfast"), and pill visual.
   - **Friendly Multilingual Voice Reminders:** Speaks instructions in English, Tamil, Tanglish, Hindi, and Telugu with respectful phrasing.
   - **Offline Resilience:** Local caching of today's schedule and offline confirmation queue (synced without duplicate events when connection returns).
   - Emergency contact button to call caregiver directly.

2. **Caregiver Web Dashboard (Next.js):**
   - Real-time dashboard showing today's adherence progress, upcoming doses, and live status updates via WebSockets.
   - **5-Minute Timeout Escalation Engine:** Automatically alerts caregivers if an elderly parent hasn't confirmed a scheduled dose within 5 minutes.
   - **Quick Actions:** Resend reminder to senior's phone, call senior directly, and simulate escalation instantly for demo.
   - **Prescription OCR & Candidate Verification:** Scans prescriptions, extracts candidate pills and doses with confidence scores. **Critical Safety Guardrail:** OCR never automatically activates schedules without caregiver review.
   - **Medical Document Repository:** Secure long-term storage for Prescriptions, Blood Reports, ECGs, X-Rays, CT Scans, and MRIs with plain-language AI explanations.
   - **Adherence Analytics:** Daily, weekly, and monthly adherence statistics and breakdown charts.

3. **Secure Backend Engine (Node.js + Express + TypeScript + MongoDB):**
   - REST API with service and repository layers.
   - 12 Mongoose schemas with data validation, indexes, audit logs, and soft archiving.
   - One-time 6-digit pairing code and high-resolution QR code generator.
   - Resilient database layer with automatic embedded fallback if local MongoDB is not running.
   - Provider abstractions for Storage, OCR (Tesseract), AI (Gemini), SMS (Twilio), and Push Notifications (FCM) with safe local dev simulation modes.

---

## 🏛️ Architecture Overview

```
                      ┌───────────────────────────────────────┐
                      │    Caregiver Web Dashboard (Next.js)   │
                      │       http://localhost:3000           │
                      └──────────────────┬────────────────────┘
                                         │  REST + WebSockets (Socket.IO)
                                         ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   LL LifeLink Backend API (Express + TS)               │
│                        http://localhost:5000                           │
│                                                                        │
│   ├── Auth & RBAC (Caregiver / Senior)                                 │
│   ├── Pairing Engine (6-digit code & QR)                               │
│   ├── OCR Service (Tesseract + Candidate Parser)                       │
│   ├── AI Service (Gemini + Clinical Plain Explainer)                   │
│   ├── 5-Min Timeout Escalation Worker & Scheduler                      │
│   ├── Medical Document Vault (Private Storage)                         │
│   └── Multi-channel Notifications (WebSocket / FCM / SMS)              │
└──────────────────┬───────────────────────────────────┬─────────────────┘
                   │ Mongoose Schemas                  │ REST + FCM
                   ▼                                   ▼
        ┌──────────────────────┐      ┌──────────────────────────────────┐
        │  MongoDB (12 Models) │      │  Senior Mobile App (Flutter)     │
        │  Local / Memory / DB │      │  - High contrast senior UI       │
        └──────────────────────┘      │  - Multilingual voice prompts    │
                                      │  - Offline cached schedule       │
                                      │  - One-tap TAKEN confirmation    │
                                      └──────────────────────────────────┘
```

---

## 📋 Prerequisites

- **Node.js:** v18.0.0 or higher (v24+ tested)
- **npm:** v9.0.0 or higher
- **Flutter SDK:** 3.16+ (Dart 3.0+)
- **MongoDB:** *(Optional)* If MongoDB is not installed locally, the backend automatically boots an embedded in-memory MongoDB server with pre-seeded demo data for instant zero-setup execution!

---

## ⚙️ Environment Variables

Create a `.env` file in `backend/` and `.env.local` in `web/` using [.env.example](file:///.env.example):

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/ll-lifelink
JWT_SECRET=ll-lifelink-super-secret-jwt-key-2026-phase1
JWT_REFRESH_SECRET=ll-lifelink-super-secret-refresh-key-2026-phase1
STORAGE_PROVIDER=local
STORAGE_BUCKET=lifelink-storage
UPLOAD_DIR=./uploads
SMS_PROVIDER=dev-logger
AI_PROVIDER=gemini
AI_API_KEY=
CLIENT_ORIGIN=http://localhost:3000
```

*Note: All external keys (Firebase, Twilio, Gemini) include built-in zero-crash development fallbacks.*

---

## 🚀 Quick Start (Run Locally)

### 1. Start the Backend API
```bash
cd backend
npm install
npm run dev
```
- API starts at: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`
- *Automatically seeds demo accounts on first run!*

### 2. Start the Caregiver Web Dashboard
```bash
cd web
npm install
npm run dev
```
- Open browser at: `http://localhost:3000`
- Click **"One-Click Demo Caregiver Login"** to immediately explore the live dashboard!

### 3. Start the Senior Mobile App
```bash
cd mobile
flutter pub get
flutter run
```
- Tap **"Use Demo Code: LL-882200"** on the pairing screen to link to Paati's profile instantly.

---

## 🔑 Demo Credentials

| Role | Username / Identifier | Password | Description |
|---|---|---|---|
| **Caregiver** | `caregiver@lifelink.com` | `Password123!` | Ananya Raman (Daughter & Family Caregiver) |
| **Senior Phone** | Pairing Code: `LL-882200` | N/A | Kalyani Ammal ("Paati", Age 78) |

---

## 🧪 Running Tests

### Backend Unit & Integration Tests (16 Tests)
```bash
cd backend
npm test
```
*Tests registration, login, senior pairing, medication CRUD, 5-minute escalation timeout, offline queue sync duplicate prevention, OCR parsing, AI summaries, and adherence calculations.*

### Web Production Compilation Test
```bash
cd web
npm run build
```

### Mobile Dart Static Analysis & Widget Tests
```bash
cd mobile
flutter analyze
flutter test
```

---

## 🎯 Hackathon Presentation Script

1. **Log in to Web Dashboard:** Go to `http://localhost:3000` and click "One-Click Demo Caregiver Login".
2. **Observe Today's Schedule:** Paati has Morning Pantoprazole & Metformin taken, and Amlodipine due.
3. **Simulate 5-Minute Escalation:** Click **"Simulate 5-Min Escalation"** in the top navbar. Notice the red urgent attention alert banner appears immediately on screen.
4. **Resend Reminder:** Click **"Resend Reminder"** to dispatch an alert to Paati's phone.
5. **Open Mobile App:** Observe the prominent **Next Medication Card** for Amlodipine.
6. **Hear Voice Reminder:** Tap **"Hear Voice Reminder"** to hear friendly speech in Tanglish/Tamil/English.
7. **One-Tap Confirmation:** Tap the huge green **"I HAVE TAKEN THIS"** button.
8. **Live Sync:** Notice the Web Caregiver Dashboard updates to **100% Adherence** in real time via WebSockets!

---

## 📚 Detailed Documentation

- [API Reference](file:///docs/API.md): Full endpoint specifications and WebSocket schemas.
- [Database Schema](file:///docs/DATABASE.md): Detailed 12-collection Mongoose schema documentation & Phase 2 extension points.
- [Setup Guide](file:///docs/SETUP.md): Step-by-step local installation and run guide.
- [Testing Guide](file:///docs/TESTING.md): Verification strategies, test cases, and commands.

---

## 🛡️ Safety & Medical Disclaimer

LL LifeLink is designed for medication organization, caregiver support, and adherence tracking. The system does not diagnose diseases, recommend alterations to drug dosages, or substitute licensed medical consultation. All extracted prescriptions require caregiver and healthcare provider verification.
