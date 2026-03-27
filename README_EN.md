<div align="center">

# KUAS Reception

**Open Campus Reception Management System — Kyoto University of Advanced Science, Faculty of Engineering**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Firebase](https://img.shields.io/badge/Firebase-Functions%20%2B%20Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-KUAS_OC_Committee-green)](#license)

[🇯🇵 日本語 README](README.md) | [📋 Overview](#overview) | [🚀 Setup](#setup) | [📖 Docs](#directory-guide)

</div>

---

## Overview

A modern web application that unifies open campus reception operations for **visitors, reception staff, and administrators** under a single UI.

- **Visitors** complete registration and program selection from any tablet or smartphone
- **Reception staff** manage real-time seat assignments and waitlist promotions
- **Administrators** monitor statistics, manage programs, and control reception via an authenticated panel

Built as a React 19 + TypeScript SPA paired with Firebase Cloud Functions (Node.js 20), featuring **thread-safe seat assignment** via Firestore transactions.

---

## Audience & Value

| User | Value |
|------|-------|
| **Visitors** | Select up to 3 program preferences and receive instant assignment results, for both pre-registered and walk-in guests |
| **Reception Staff** | Manage the waitlist, manual assignments, and cancellations from a single screen |
| **Administrators** | Operate a KPI dashboard, program editor, and reception controls through a secured admin panel |

---

## Key Features

### Visitor Reception Flow

```
[Start] → [Reserved / Walk-in] → [Enter Info] → [Select Programs (up to 3)] → [Review & Submit] → [Result]
```

- Preferences are evaluated in order; the highest-priority program with available seats is assigned automatically
- If all preferences are full, the visitor is placed on a waitlist automatically
- Companion count is factored into seat calculation (up to 10 companions)
- Japanese / English UI switching

### Admin Dashboard

| Feature | Description |
|---------|-------------|
| **KPI Widgets** | Live counts of total visitors, assigned, waiting, completed, and cancelled |
| **Assignment Board** | Manually assign waiting guests to programs; cancelled seats auto-promote the next in queue |
| **Program Management** | Create, edit, and delete programs with capacity settings |
| **Reception Settings** | Open/close reception, set max selections, event name, date, and welcome message |
| **Reservation Manager** | Browse and filter all reception records by status |

### Backend Capabilities

- **Firestore transactions** for atomic seat assignment (zero overbooking)
- **Firebase Authentication** + Bearer Token protection on admin endpoints
- **DeepL API** translation (rule-based fallback when no key is configured)
- **Firestore Security Rules** enforcing collection-level access control

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Firebase Hosting                       │
│              React 19 SPA (Vite 7 + TypeScript)          │
│  ┌─────────────────┐    ┌──────────────────────────────┐ │
│  │  Reception Flow  │    │     Admin Dashboard          │ │
│  │  - Attendee form │    │  - KPI / Stats              │ │
│  │  - Program pick  │    │  - Assignment board          │ │
│  │  - Confirmation  │    │  - Program management        │ │
│  └────────┬─────────┘    └─────────┬────────────────────┘ │
└───────────┼───────────────────────┼──────────────────────┘
            │ HTTP (Bearer Token)   │ Firestore onSnapshot
            ▼                       ▼
┌────────────────────────────────────────────────────────────┐
│              Firebase Cloud Functions (Node.js 20)          │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────────┐  │
│  │  /programs   │  │  /receptions  │  │  /assignments   │  │
│  │  GET (public)│  │  POST (public)│  │  POST (admin)   │  │
│  └──────────────┘  └───────────────┘  └─────────────────┘  │
│              ┌──────────────────────┐                       │
│              │  Firestore Transaction                        │
│              │  (thread-safe assign) │                       │
│              └──────────────────────┘                       │
└────────────────────────────┬───────────────────────────────┘
                             │
                             ▼
             ┌───────────────────────────┐
             │     Cloud Firestore        │
             │  programs / receptions     │
             │  assignments / settings    │
             └───────────────────────────┘
```

### Directory Layout

```
KUAS-reception/
├── apps/
│   └── reception-web/              # React SPA
│       ├── public/                 # Static assets & logos
│       └── src/
│           ├── components/
│           │   ├── layout/         # AppShell · Sidebar · TopStatusBar
│           │   └── ui/             # Button · Card · Badge · GlassField
│           ├── features/
│           │   ├── reception/      # Full visitor reception flow
│           │   │   ├── components/ # Step-by-step components
│           │   │   ├── hooks/      # usePrograms etc.
│           │   │   └── types.ts    # Zod schema definitions
│           │   └── admin/          # Admin dashboard
│           │       ├── components/ # Panel components
│           │       └── hooks/      # useAdmin · useReservations etc.
│           ├── services/
│           │   ├── api.ts          # HTTP client (Bearer Token injection)
│           │   └── firebase.ts     # Firestore / Auth wrappers
│           └── i18n/
│               └── locales/        # ja.json / en.json / id.json
├── functions/                      # Cloud Functions
│   ├── app.js                      # Express routing
│   ├── db.js                       # Firestore transaction logic
│   ├── schemas.js                  # Zod validation schemas
│   └── middleware/auth.js          # Firebase Token verification
├── firestore.rules                 # Firestore Security Rules
├── firestore.indexes.json          # Composite index definitions
└── firebase.json                   # Firebase configuration
```

---

## Data Model (Firestore)

```
programs/{id}
  ├── title: string
  ├── description: string
  ├── capacity: number        # Total seat count
  ├── remaining: number       # Available seats (updated via transaction)
  ├── startTime / endTime: string
  ├── location: string
  ├── isActive: boolean
  └── order: number           # Display order

receptions/{id}
  ├── attendee
  │   ├── name / furigana / school / grade
  │   ├── companions: number  # Number of companions
  │   └── reserved: boolean   # Pre-registered flag
  ├── selections: [{id, title}]   # 1st–3rd preferences
  ├── assignedProgram: {id, title, priority, assignedBy}
  ├── status: "waiting" | "assigned" | "completed" | "cancelled"
  └── createdAt: string

assignments/{id}
  ├── receptionId / programId
  ├── attendeeName / priority
  ├── status: "confirmed" | "cancelled"
  └── assignedAt / cancelledAt: string

settings/reception-settings
  ├── isOpen: boolean
  ├── maxSelections: number
  ├── eventName / eventDate / welcomeMessage: string
  └── openTime / closeTime: string
```

---

## Technology Stack

### Frontend

| Category | Library |
|----------|---------|
| UI Framework | React 19, React Router 6 |
| Data Fetching | TanStack Query 5 |
| Forms | React Hook Form 7 + Zod |
| Styling | Tailwind CSS 3, Lucide Icons |
| i18n | i18next 24, react-i18next 15 |
| Firebase | Firebase SDK 12 (Firestore + Auth) |
| Build | Vite 7, TypeScript 5 |

### Backend

| Category | Library |
|----------|---------|
| HTTP Server | Express 5 |
| Firebase | firebase-admin 12, firebase-functions 6 |
| Validation | Zod 3 |
| Translation | deepl-node 1 |

### Infrastructure

| Service | Purpose |
|---------|---------|
| Firebase Hosting | Static SPA hosting |
| Cloud Functions | API server (asia-northeast1) |
| Cloud Firestore | Real-time database |
| Firebase Authentication | Admin authentication |
| GitHub Actions | CI/CD (auto-deploy on main) |

---

## API Reference

### Public Endpoints (no authentication required)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/programs` | List all programs |
| `POST` | `/receptions` | Submit reception & auto-assign |
| `GET` | `/receptions/stats` | Fetch live statistics |
| `GET` | `/system/settings` | Get reception settings |
| `POST` | `/translate` | Translate text via DeepL |

### Admin-Only Endpoints (Firebase ID Token required)

| Method | Path | Description |
|--------|------|-------------|
| `PATCH` | `/programs/:id` | Update program capacity |
| `POST` | `/assignments/manual` | Manually assign a waiting guest |
| `POST` | `/assignments/:id/cancel` | Cancel assignment & auto-promote next |

---

## Setup

### Prerequisites

- **Node.js** 20 LTS or later, **npm** 10 or later
- **Firebase CLI**: `npm install -g firebase-tools`
- A Firebase project with Firestore, Authentication, and Hosting enabled
- DeepL API key (optional — for translation feature)

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd KUAS-reception
npm install
cd apps/reception-web && npm install
cd ../../functions && npm install
```

### 2. Configure Environment Variables

Create a `.env` file inside `apps/reception-web/`:

```bash
cp apps/reception-web/.env.example apps/reception-web/.env
```

**Required** (find these in Firebase Console → Project Settings → General → Your Apps):

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=your-app-id
```

**Optional**:

```env
# Cloud Functions URL (use the emulator URL during development)
VITE_API_BASE_URL=http://localhost:5001/your-project-id/asia-northeast1/api

# Set to true when using the Firebase Emulator
VITE_USE_FIREBASE_EMULATOR=true
```

> **Note**: If any `VITE_FIREBASE_*` variable is missing, a clear error appears in the browser console and admin login will be unavailable.

### 3. Create an Admin Account

In the Firebase Console → **Authentication** → **Sign-in method**, enable **Email/Password**.
Then go to the **Users** tab → **Add user** and create your admin credentials.

### 4. Configure DeepL (optional)

```bash
firebase functions:config:set deepl.apikey="YOUR_DEEPL_API_KEY"
```

For the emulator, add the same key to `functions/.runtimeconfig.json`:

```json
{
  "deepl": {
    "apikey": "YOUR_DEEPL_API_KEY"
  }
}
```

---

## Development Workflow

### Start the Dev Server

```bash
# From the project root
npm run dev
# → http://localhost:5173

# To reach from other devices on the same LAN
cd apps/reception-web && npm run dev -- --host
```

### Start the Firebase Emulator

```bash
npm run emulators
# Emulator UI: http://localhost:4000
```

Running the emulator alongside the dev server gives you a fully local environment with no Firebase cloud calls.

### Build & Deploy

```bash
# Build only
npm run build

# Deploy Hosting only
npm run deploy

# Deploy Functions only
npm run deploy:functions

# Deploy everything (Hosting + Functions)
npm run deploy:all

# Preview the built output locally
npm run preview
```

---

## Quality Checks

```bash
# Static analysis (ESLint)
npm run lint

# Type checking (TypeScript)
npm run typecheck

# Unit tests
cd apps/reception-web && npm run test
cd functions && npm test

# E2E tests (Playwright)
cd apps/reception-web && npm run test:e2e
```

Pull Requests automatically trigger the validation workflow defined in `.github/workflows/firebase-deploy.yml`.

---

## Multilingual Support

| Language | File | Status |
|----------|------|--------|
| Japanese | `src/i18n/locales/ja.json` | ✅ Full |
| English | `src/i18n/locales/en.json` | ✅ Full |
| Indonesian | `src/i18n/locales/id.json` | ✅ Basic |

- The browser language is detected automatically and the UI switches accordingly
- Translation is handled via the DeepL API; a phrase dictionary is used as fallback
- Adding a new language only requires placing a new JSON file in the `locales/` directory

---

## Directory Guide

| Path | Role |
|------|------|
| `apps/reception-web/src/components/layout/` | AppShell · Sidebar · TopStatusBar · FlowStepper |
| `apps/reception-web/src/components/ui/` | Button · Card · Badge · GlassField · EmptyState |
| `apps/reception-web/src/features/reception/` | Visitor-facing reception flow |
| `apps/reception-web/src/features/admin/` | Admin dashboard and analytics |
| `apps/reception-web/src/services/api.ts` | HTTP client with Bearer Token injection |
| `apps/reception-web/src/services/firebase.ts` | Firestore / Auth utilities |
| `functions/app.js` | Express routing (all API endpoints) |
| `functions/db.js` | Firestore transaction logic |
| `functions/schemas.js` | Zod validation schemas |
| `firestore.rules` | Firestore Security Rules |

---

## Release Notes

| Version | Date | Highlights |
|---------|------|------------|
| **v0.8.0** | 2026-03-27 | Security fixes: removed client-injectable `status` field, added backend validation (`selections` min, `companions` max), removed mock data fallback, fixed stats double-counting bug |
| v0.7.0 | 2025-10-28 | Hardened Firebase deploy workflow, refreshed documentation, configuration cleanup |
| v0.6.0 | 2025-10-09 | DeepL integration improvements, stabilized deployment pipeline, enhanced language switching |
| v0.5.0 | 2025-10-02 | Mobile experience updates, iPad bug fixes, Functions adjustments |
| v0.4.0 | 2025-09-30 | Liquid Glass theme refinements, extended multilingual support, deployment experiments |
| v0.3.0 | 2025-09-07 | Smartphone/tablet optimization, Firebase configuration updates, assorted bug fixes |
| v0.2.0 | 2025-08-23 | Expanded reception flow, companion tracking, waitlist views, improved success screens |
| v0.1.0 | 2025-08-16 | Initial SPA release with offline readiness and security hardening |

---

## License

© KUAS OC improvement committee
This repository is maintained by the KUAS Open Campus Improvement Committee.
