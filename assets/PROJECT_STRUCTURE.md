# Project Structure

```
SIH-OA-Screening/
├── index.html
├── README.md
├── assets/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── language.js
│   │   ├── storage.js
│   │   ├── auth.js
│   │   ├── patient.js
│   │   ├── camps.js
│   │   ├── followup.js
│   │   ├── qr.js
│   │   ├── camera.js
│   │   ├── wearable.js
│   │   ├── ai.js
│   │   ├── screening.js
│   │   ├── report.js
│   │   ├── dashboard.js
│   │   ├── doctor.js
│   │   ├── admin.js
│   │   ├── voice.js
│   │   └── app.js
│   ├── images/   (reserved for future static images — none required today)
│   └── icons/    (reserved for future icon files — UI currently uses emoji)
└── docs/
    └── PROJECT_STRUCTURE.md
```

All JavaScript files are loaded as classic (non-module) scripts, in the
order listed in `index.html`, and share one global scope — matching the
original single-file prototype's execution model so every inline event
handler and cross-feature function call keeps working unchanged.

## index.html
Main application entry point. Loads Google Fonts, the QR/jsQR CDN
libraries, `assets/css/style.css`, mounts the app into `#app`, and loads
every JS module in dependency-safe order.

## assets/css/style.css
Complete UI styling: design tokens, login screen, sidebar shell, dashboards,
forms, wizard steps, camera overlay, badges, modals, and responsive rules —
moved verbatim from the original inline `<style>` block.

## assets/js/language.js
UI language registry (`LANG_META`), the `STR` translation table, and the
`t()` lookup helper. English is always the fallback.

## assets/js/storage.js
Offline/local-storage layer: demo account seed data (`DEMO_ACCOUNTS`),
`seedIfEmpty()`, `loadDB()`/`saveDB()` (debounced local persistence),
`beforeunload` flush, `pendingSyncCount()`, and the Sync page/`syncNow()`.

## assets/js/auth.js
Login state, `doLogin()`/`logout()`, the login screen renderer, and its
event bindings.

## assets/js/patient.js
Patient ID generation and lookup helpers, patient list/search, patient
registration form + submission, patient detail view, clinical notes, and
the logged-in Patient role's own home/QR/history/follow-up/guidance pages.

## assets/js/camps.js
Health Camp Mode: camp landing page and per-camp stats.

## assets/js/followup.js
Follow-up list/tracking page and the "schedule follow-up" modal.

## assets/js/qr.js
Per-patient QR code generation/download, and camera-based QR scan modal
(uses `jsQR` against live `getUserMedia()` video frames) with routing to
the matched patient record.

## assets/js/camera.js
Real browser camera movement assessment: permission request/start/stop,
pose-angle estimation loop, canvas overlay drawing, and per-test (knee
flexion, gait, posture, sit-to-stand) capture/finish logic, with graceful
error handling for denied/unavailable cameras.

## assets/js/wearable.js
Flex Sensor + dual MPU6050 (thigh/shank) sensor step UI, data-quality
scoring, and fusion of sensor + camera knee-angle signals. Structured as an
ESP32/BLE-ready integration point (`tickSensorValues()` currently
simulates live streaming values for the demo/offline prototype).

## assets/js/ai.js
AI-assisted screening logic: `computeAI()` combines questionnaire +
fused mobility signal into a risk score with explainable indicators, and
renders the AI Assessment step (framed as screening/decision-support, not
autonomous diagnosis).

## assets/js/screening.js
The screening wizard shell: step labels/navigation, risk badge/label
helpers, questionnaire step renderers (checkbox groups, scales, matrix,
yes/no rows), the camera-step and report-step wiring, and
`finishScreening()`.

## assets/js/report.js
Screening result page and the printable digital report page.

## assets/js/dashboard.js
Healthcare Worker dashboard and the shared recent-screenings table.

## assets/js/doctor.js
Doctor dashboard, clinical note modal, and referral modal.

## assets/js/admin.js
Admin dashboard, risk distribution bars, district table, user/camp
management views, and analytics (including weekly trend).

## assets/js/voice.js
Voice guidance: BCP-47 language mapping, `speak()`/`stopSpeak()`/
`replaySpeak()` over the Web Speech API, and the reusable speaker-button
markup used throughout the questionnaire.

## assets/js/app.js
Core state (`DB`), the `render()` dispatcher, `go()` navigation, app
shell/sidebar/topbar/bottom-nav rendering, generic modal open/close,
global event delegation (`attachShellEvents`, `initModalDelegation`), and
the app bootstrap (`initModalDelegation(); loadDB();`) — loaded last so
every other module is defined before the app starts.
