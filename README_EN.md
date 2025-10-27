# KUAS Reception App

[日本語 README](README.md)

## Table of Contents
- [Project Overview](#project-overview)
- [Audience & Value Proposition](#audience--value-proposition)
- [System Architecture](#system-architecture)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Setup Guide](#setup-guide)
- [Development Workflow](#development-workflow)
- [Quality Checks](#quality-checks)
- [Translations & Multilingual Support](#translations--multilingual-support)
- [Directory Guide](#directory-guide)
- [Release Notes](#release-notes)
- [License](#license)

## Project Overview
- A modern web application that unifies reception operations for KUAS Faculty of Engineering Open Campus across staff, visitors, and administrators.
- Built as a React 19 + TypeScript + Vite SPA (`apps/reception-web/`) paired with Firebase Functions (Node.js 20) to support both offline-first and cloud-connected modes.
- Keeps the reception usable during network outages via local storage and cache, then syncs seamlessly with Firestore / Cloud Functions once reconnected.
- Provides light/dark themes enhanced with liquid glass styling and multilingual UI (Japanese, English, Indonesian, and more).

## Audience & Value Proposition
- **Reception Staff**: Rapid attendee check-in, seat management, and program assignment from a single console.
- **Visitors**: Smooth registration flow for both pre-registered and walk-in guests, including program preference selection.
- **Administrators**: Real-time dashboards for attendance status, translation management, and content updates.

## System Architecture
```
KUAS-reception/
├─ apps/
│  └─ reception-web/        # SPA client (React + Vite)
│     ├─ public/            # Static assets & manifests
│     ├─ src/
│     │  ├─ components/     # Layouts and UI patterns
│     │  ├─ features/       # Modules for reception/admin flows
│     │  ├─ services/       # API client & Firebase wrappers
│     │  ├─ hooks/          # Shared custom hooks
│     │  ├─ i18n/           # i18next config and locale data
│     │  ├─ theme/          # Light/Dark + Liquid Glass tokens
│     │  └─ types/          # Shared TypeScript definitions
│     └─ vite.config.ts     # Vite 7 configuration (alias `@` → `src`)
├─ functions/               # Firebase Functions (Node.js 20)
│  ├─ index.js              # Cloud Functions entrypoint
│  └─ package.json
└─ legacy/                  # Archived HTML/JS implementation & docs
```

## Key Features
- **Reception Flow**: Choose reservation or walk-in → capture attendee profile → pick 1st–3rd program choices → review and finalize.
- **Program Management**: Real-time seat availability, waitlist promotion, and allocation visibility powered by Firestore.
- **Multilingual UI**: Japanese, English, and Indonesian out of the box; additional locales reside in `apps/reception-web/src/i18n/locales/`.
- **Theme Preferences**: Persisted light/dark/liquid-glass themes per device, with OS-level sync handled by a dedicated hook.
- **Translation API**: `/translateText` Cloud Function leveraging DeepL; when no API key is configured, a rule-based fallback is used.
- **Offline Support**: Service Worker and local caching keep the app functional without connectivity and reconcile changes once online.

## Technology Stack
- **Frontend**: React 19, React Router 6, TanStack Query 5, React Hook Form 7, Zod, Tailwind CSS 3, Lucide Icons.
- **State & Data**: TanStack Query for fetching/caching, Firestore SDK streams for live updates.
- **Localization**: i18next, react-i18next, i18next-browser-languagedetector.
- **Tooling**: Vite 7, TypeScript 5, ESLint 9, PostCSS + Autoprefixer.
- **Backend**: Firebase Cloud Functions with node-fetch, deepl-node, firebase-admin, langchain, and assorted utilities.
- **Hosting**: Firebase Hosting + Emulator Suite with automated deployment workflows.

## Setup Guide
### Prerequisites
- Node.js 20 and npm 10 recommended.
- Firebase CLI (`firebase-tools`) installed globally.
- DeepL API key for production-grade translations.

### 1. Install root workspace dependencies
```bash
npm install
```
- The root `package.json` manages workspace scripts and emulator tooling.

### 2. Prepare the web client
```bash
cd apps/reception-web
npm install
```
- Installs Tailwind, TanStack Query, Firebase SDK, and other SPA dependencies.

### 3. Configure SPA environment variables
Create `apps/reception-web/.env` with the following values as needed:
```
VITE_API_BASE_URL=http://localhost:5001/kuas-reception/us-central1
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
VITE_USE_FIREBASE_EMULATOR=true
```
- For emulator-only testing, keep `VITE_API_BASE_URL` pointed at the local Functions endpoint above.

### 4. Install Firebase Functions dependencies
```bash
cd functions
npm install
```
- Register the DeepL key when needed:
```bash
firebase functions:config:set deepl.apikey="YOUR_API_KEY"
```
- When running the emulator, replicate the same key inside `.runtimeconfig.json`.

## Development Workflow
### Web app (Vite)
```bash
cd apps/reception-web
npm run dev -- --host
```
- The `--host` flag makes the dev server reachable from other devices on the same LAN.

### Firebase Emulator Suite
```bash
firebase emulators:start --only functions
```
- Add services as needed, for example `--only functions,firestore,auth`.
- Key endpoints:
	- `GET http://localhost:5001/kuas-reception/us-central1/getPrograms`
	- `POST http://localhost:5001/kuas-reception/us-central1/addReceptionRecord`
	- `GET http://localhost:5001/kuas-reception/us-central1/getReceptionStats`
	- `POST http://localhost:5001/kuas-reception/us-central1/translateText`

### Deploying to Firebase Hosting
```bash
npx firebase login
npm run deploy:reception-web
```
- To create a preview channel:
```bash
npm run build:reception-web
npx firebase hosting:channel:deploy preview --only hosting:reception-web
```

## Quality Checks
- `npm run lint` (inside `apps/reception-web`) runs ESLint for static analysis.
- `npm run typecheck` validates TypeScript project references.
- E2E coverage with Cypress is under consideration for core flows (not yet adopted).
- Pull Requests go through the Firebase deploy validation workflow defined in `.github/workflows/firebase-deploy.yml`.

## Translations & Multilingual Support
- Default locale is `ja`; browser detection switches automatically to `en` or `id`. Locale files live under `apps/reception-web/src/i18n/locales/`.
- The `/translateText` Function acts as the gateway to DeepL; without an API key it falls back to a lightweight phrase dictionary.
- Department-specific terms can be curated through a custom glossary to ensure consistent translations.

## Directory Guide
- `apps/reception-web/src/components/layout`: Shared layouts such as AppShell, Sidebar, and Status Bar.
- `apps/reception-web/src/components/ui`: UI primitives including Button, Card, and GlassField.
- `apps/reception-web/src/features/reception`: Reception workflow screens and state management.
- `apps/reception-web/src/features/admin`: Admin dashboard and analytics views.
- `apps/reception-web/src/services/api.ts`: Cloud Functions client wrapper.
- `apps/reception-web/src/services/firebase.ts`: Firestore/Auth utilities.
- `functions/index.js`: HTTP Cloud Functions entrypoint with CORS and auth headers handled.
- `legacy/`: Archived HTML/JS app, DataConnect setup, migration documents.

## Release Notes
| Version | Date | Highlights |
|---------|------|------------|
| v0.7.0 | 2025-10-28 | Hardened Firebase deploy workflow, refreshed documentation, configuration cleanup |
| v0.6.0 | 2025-10-09 | DeepL integration improvements, stabilized deployment pipeline, enhanced language switching |
| v0.5.0 | 2025-10-02 | Mobile experience updates, iPad bug fixes, Functions adjustments |
| v0.4.0 | 2025-09-30 | Liquid glass theme refinements, extended multilingual support (Arabic), deployment experiments |
| v0.3.0 | 2025-09-07 | Smartphone/tablet optimization, Firebase configuration updates, assorted bug fixes |
| v0.2.0 | 2025-08-23 | Expanded reception flow, added companion tracking and waitlist views, improved success screens |
| v0.1.0 | 2025-08-16 | Initial SPA release with offline readiness, security hardening, and initial documentation |

## License
© KUAS OC improvement committee

