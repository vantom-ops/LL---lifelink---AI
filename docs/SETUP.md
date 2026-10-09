# LL LifeLink Local Setup Guide

Follow this guide to run the complete LL LifeLink platform locally.

---

## 1. Prerequisites

- **Node.js:** v18.0.0 or higher (v24+ supported)
- **npm:** v9.0.0 or higher
- **Flutter SDK:** 3.16+ (Dart 3.0+)
- **MongoDB:** (Optional) If local MongoDB is not installed, the backend automatically boots an embedded in-memory MongoDB instance with pre-seeded demo data for instant zero-setup execution!

---

## 2. Backend Setup

1. Open a terminal in the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` from template:
   ```bash
   cp ../.env.example .env
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The server starts at `http://localhost:5000`.*
   *If the database is empty, it automatically seeds initial sample data for demo presentation!*

5. Run test suite:
   ```bash
   npm test
   ```

---

## 3. Web Caregiver Dashboard Setup

1. Open a new terminal in the `web/` directory:
   ```bash
   cd web
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env.local`:
   ```bash
   echo NEXT_PUBLIC_API_URL=http://localhost:5000/api > .env.local
   ```
4. Start Next.js development server:
   ```bash
   npm run dev
   ```
5. Open your browser at `http://localhost:3000`.
   - Click **"One-Click Demo Caregiver Login"** to immediately access the dashboard as `caregiver@lifelink.com`.

---

## 4. Flutter Mobile Senior App Setup

1. Open a terminal in the `mobile/` directory:
   ```bash
   cd mobile
   ```
2. Fetch Flutter packages:
   ```bash
   flutter pub get
   ```
3. Verify Dart analysis:
   ```bash
   flutter analyze
   ```
4. Run mobile automated tests:
   ```bash
   flutter test
   ```
5. Launch on an Android emulator or connected device:
   ```bash
   flutter run
   ```
   *On the pairing screen, tap "Use Demo Code: LL-882200" or enter the pairing code from the caregiver web dashboard.*

---

## 5. Live Demonstration Workflow

1. Open **Web Dashboard** (`http://localhost:3000`) and log in.
2. Select **Paati (Kalyani Ammal)**.
3. Observe today's scheduled doses.
4. Click **"Simulate 5-Min Escalation"** in the top navbar:
   - Notice the instant red alert banner appearing on the caregiver dashboard.
   - Click **"Resend Reminder"** or **"Call Senior"**.
5. On the **Mobile App**, open the app and observe the scheduled dose.
6. Tap **"Hear Voice Reminder"** to hear friendly multilingual speech.
7. Tap the big green **"I HAVE TAKEN THIS"** button:
   - Notice the status immediately turns to **Confirmed Taken**.
   - Notice the Caregiver web dashboard updates in real time via WebSockets without manual page refresh!
