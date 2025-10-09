# KUAS Reception App

[日本語 README](README.md)

## Overview
- Modern reception platform for KUAS Faculty of Engineering Open Campus rebuilt with a React + TypeScript SPA under `apps/reception-web/`
- Offline-first experience for the reception desk, with optional integration to Firebase (Auth / Firestore / Cloud Functions)
- Includes liquid-glass themed light/dark modes, admin dashboards, and DeepL-powered translations

## Key Capabilities
- **Reception flow**: select reserved vs walk-in → attendee details → program preference (1st–3rd) → confirmation ticket
- **Program management**: real-time remaining capacity, waiting list summary, and admin metrics
- **Translation gateway**: `/api/translate` backed by DeepL API with rule-based fallback when the key is missing
- **Theme & language**: persistent light/dark mode, Japanese/English toggle saved per device

## Architecture
```
KUAS Reception app/
├─ apps/
│  └─ reception-web/        # React + Vite SPA
│     ├─ public/            # Static assets (logos, background images)
│     ├─ src/
│     │  ├─ components/     # Shared layout/UI primitives
│     │  ├─ features/
│     │  │  ├─ reception/   # Reception experience screens & logic
│     │  │  └─ admin/       # Admin dashboard views
│     │  ├─ services/       # API & Firebase helpers
│     │  ├─ theme/ styles/  # Tailwind & design tokens
│     │  └─ hooks/ types/   # Reusable hooks and TS definitions
│     ├─ package.json       # SPA dependencies
│     └─ vite.config.ts     # Vite config (alias `@` → `src`)
├─ functions/               # Firebase Cloud Functions (Node.js)
│  ├─ index.js              # REST-like API endpoints with CORS
│  └─ package.json
└─ legacy/                  # Archived HTML/JS implementation & artifacts
```

## Getting Started
### 1. Clone & install
```bash
npm install
```
- The root `package.json` is preserved under `legacy/`. The modern app lives in `apps/reception-web/`.

### 2. Install SPA dependencies
```bash
cd apps/reception-web
npm install
```

### 3. Configure environment variables
Create `apps/reception-web/.env` if you need to override defaults.
```
VITE_API_BASE_URL=http://localhost:5001/kuas-reception/us-central1
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
VITE_USE_FIREBASE_EMULATOR=true
```
- Set `VITE_API_BASE_URL` to your Functions endpoint (local emulator or production). When running locally, enabling the emulator is recommended.

### 4. Prepare Firebase Functions
```bash
cd functions
npm install
```
- Provide `DEEPL_API_KEY` as a Functions environment variable if you want DeepL translations.

### 5. Run locally
#### Web client (Vite)
```bash
cd apps/reception-web
npm run dev -- --host
```
- Prefer Vite for development. If you need a simple preview, VS Code’s Live Server can open `apps/reception-web/index.html`.

#### Functions emulator
```bash
firebase emulators:start --only functions
```
API endpoints (examples):
- `GET /getPrograms`
- `POST /addReceptionRecord`
- `GET /getReceptionStats`
- `POST /translateText`

## Project Highlights
- `apps/reception-web/src/components`: glass-themed `AppShell`, `Button`, `Badge`, etc.
- `apps/reception-web/src/features/reception`: Landing → AttendeeForm → ProgramSelection → Confirmation
- `apps/reception-web/src/features/admin`: Admin dashboard cards and program table
- `apps/reception-web/src/services/api.ts`: Fetch wrapper pointing to Functions
- `apps/reception-web/src/services/firebase.ts`: Firestore listeners & writers
- `functions/index.js`: API implementation (CORS, DeepL fallback, Firestore access)
- `legacy/`: previous HTML/JS implementation, Firebase hosting configs, Data Connect templates, sample rosters

## Translation Workflow
- `/translateText` uses DeepL when available; otherwise falls back to simple dictionary rules
- You can expand dictionary terms or add other providers as needed

## Future Enhancements
- Sync admin UI with Firestore in real time
- Add admin CRUD for programs and rosters
- Integrate Firebase Auth for staff permissions and audit trails

## License
© KUAS Reception App Team

