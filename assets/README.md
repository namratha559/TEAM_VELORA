# SIH — AI-Assisted Osteoarthritis (OA) Screening Platform

## 1. Description
A frontend prototype platform for early, community-level screening of
Osteoarthritis (OA) in underserved and North-East Region (NER) settings.
Health workers register patients, run a guided clinical + camera + wearable
sensor assessment, and receive an AI-assisted risk indication that doctors
can review, confirm, and refer onward.

## 2. Problem Addressed
OA is under-diagnosed in rural/remote areas due to limited access to
specialists and imaging. This platform equips frontline health workers with
a low-cost, offline-capable, multi-modal (questionnaire + camera + wearable)
screening tool that flags patients who need further clinical evaluation —
it does **not** replace a doctor's diagnosis.

## 3. Key Features
- Role-based login: Healthcare Worker, Doctor, Administrator, Patient
- Patient registration with auto-generated unique Patient ID
- QR code generation per patient + camera-based QR scanning
- Multi-step clinical questionnaire (pain, stiffness, function, history)
- Camera-based movement assessment (knee angle, gait, posture, sit-to-stand)
- Wearable sensor structure: Flex Sensor + dual MPU6050 IMUs (thigh + shank)
  over ESP32 / BLE
- Sensor + camera data fusion for a combined mobility signal
- AI-assisted risk scoring with explainable indicators
- Screening result, digital report, doctor review & referral workflow
- Follow-up scheduling and tracking
- Health Camp mode for field screening drives
- Offline-first local storage with pending sync status
- Multilingual UI (English + Hindi, extensible) with voice guidance
- Responsive layout for mobile field use
- Admin analytics: risk distribution, district table, weekly trend
- Patient self-service dashboard: history, QR, follow-ups, guidance

## 4. Technology Stack
- HTML5, CSS3, Vanilla JavaScript (no framework, no build step)
- [qrcode.js](https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js) — QR generation
- [jsQR](https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.js) — QR scanning from camera frames
- Browser `localStorage` — offline data persistence
- `navigator.mediaDevices.getUserMedia()` — real camera access
- Web Speech API (`speechSynthesis`) — voice guidance

## 5. Project Architecture
Single-page application pattern: one root `<div id="app">`, a central
`DB` state object, a `render()` dispatcher that re-renders the active view,
and per-feature modules attached as classic (non-module) global-scope
scripts so inline event handlers keep working exactly as in the original
prototype. Scripts are loaded in a dependency-safe order, with `app.js`
(state, shell, dispatcher, event wiring, init) loaded last.

## 6. Folder Structure
```
SIH-OA-Screening/
├── index.html
├── README.md
├── assets/
│   ├── css/style.css
│   ├── js/  (17 modules — see docs/PROJECT_STRUCTURE.md)
│   ├── images/   (reserved — no static images used; icons are emoji/CSS)
│   └── icons/    (reserved — no static icon files used)
└── docs/
    └── PROJECT_STRUCTURE.md
```

## 7. How to Run
1. Download/unzip the project.
2. Serve the folder with any static file server (double-clicking
   `index.html` also works for most features, but camera access requires
   a server — see below).
   ```
   npx serve .
   # or
   python3 -m http.server 8080
   ```
3. Open the served URL in a browser.
4. Log in with a demo account (below) or register a new patient.

## 8. How to Deploy
Deploy as static files to any static host: GitHub Pages, Netlify, Vercel,
Firebase Hosting, or an S3 bucket + CDN. No server/build process is
required — upload the folder as-is.

## 9. Browser Requirements
- A modern evergreen browser (Chrome, Edge, Firefox, Safari — recent
  versions) with support for `localStorage`, Canvas 2D, and the Web Speech
  API (voice guidance degrades gracefully if unsupported).

## 10. Camera HTTPS Requirement
`getUserMedia()` requires a **secure context**: `https://` in production,
or `http://localhost` during local development. Camera features (movement
assessment, QR scanning) will not prompt for permission on a plain `http://`
non-localhost origin — deploy behind HTTPS.

## 11. Offline Functionality
All patient, screening, camp, and follow-up data is persisted to
`localStorage`. The app works fully offline after first load; a sync-status
pill and Sync page show pending records and let a worker simulate pushing
them once connectivity returns.

## 12. Wearable Architecture
```
ESP32 (BLE peripheral)
 ├── Flex Sensor          → knee flexion angle
 ├── MPU6050 #1 (IMU)     → mounted on THIGH
 └── MPU6050 #2 (IMU)     → mounted on SHANK
        │  BLE
        ▼
 Mobile/Web Application (this platform)
   → receives streamed angle/ROM/stability values
   → fuses with camera-derived knee angle
   → feeds combined signal into AI risk scoring
```
The current prototype models this pipeline in `wearable.js` (connect,
demo/live data intake, ROM + stability computation, fusion with camera
data) as an integration-ready structure; a real ESP32/BLE bridge can be
wired into the same functions.

## 13. AI Screening Workflow
1. Clinical questionnaire responses are scored (`screening.js`).
2. Camera-based movement test produces a knee-angle/gait/posture signal
   (`camera.js`).
3. Wearable sensor data (or demo data) supplies ROM/stability values
   (`wearable.js`).
4. Camera + sensor values are fused into a single mobility indicator.
5. `computeAI()` (`ai.js`) combines questionnaire + fused mobility signal
   into a risk score with explainable indicators and a data-quality note.
6. Result is presented as a **Screening Assessment / Risk Assessment**
   with a **decision-support** recommendation — never a final diagnosis.
7. A doctor reviews the case, adds clinical notes, and can refer the
   patient for further clinical evaluation.

## 14. Demo Accounts
| Role     | Email               | Password |
|----------|---------------------|----------|
| Worker   | worker@sih.demo      | demo123  |
| Doctor   | doctor@sih.demo      | demo123  |
| Admin    | admin@sih.demo       | demo123  |
| Patient  | patient@sih.demo     | demo123  |

## 15. Medical Disclaimer
This platform performs **AI-assisted screening and risk indication only**.
It is a **decision-support tool** for frontline health workers and does
**not** provide an autonomous medical diagnosis. All flagged/high-risk
results require **further clinical evaluation** and confirmation by a
qualified doctor.

## 16. Future Improvements
- Real ESP32/BLE Web Bluetooth integration in `wearable.js`
- On-device pose-estimation model upgrade for camera assessment
- Backend sync service (currently simulated client-side)
- Additional regional languages
- PDF export of the digital report
- Role-based audit logging for admin
