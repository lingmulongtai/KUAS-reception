<!-- Language: JA | EN -->
[日本語 (JA)](README.md) | [English (EN)](README_ENG.md)

## KUAS Reception App (Online/CDN)

### Overview
This is a browser-based reception app for the Faculty of Engineering Open Campus at Kyoto University of Advanced Science. It covers reception for reserved and walk-in attendees, preference selection, admin-side editing/assignment/roster preview, status visualization, and export — all locally in the browser.

This project loads fonts/icons/libs from CDNs, while images are served locally from the `public/` folder.

## Table of Contents
- [Environment](#environment)
- [How to Run](#how-to-run)
- [Operational Flow (Event Day)](#operational-flow-event-day)
- [UI and Flow](#ui-and-flow)
- [Admin Panel](#admin-panel)
- [Roster Excel Format](#roster-excel-format)
- [Local Data Storage](#local-data-storage)
- [Security and Privacy](#security-and-privacy)
- [Offline Operation](#offline-operation)
- [Export](#export)
- [Directory Structure](#directory-structure)
- [Notes](#notes)
- [Libraries](#libraries)
- [Troubleshooting](#troubleshooting)

### Main Features
- **Reception**: Switch between reserved and walk-in. Name-based matching for reservations; for walk-ins, also enter school and grade.
- **Program Selection**: Choose up to three preferences with duplicate selection prevention. Full programs are disabled.
- **Auto Assignment / Waiting**: Assign according to settings (prioritize reserved; prioritize grade for walk-ins). Put on waiting list when full.
- **Admin Panel**: Edit programs (reorder/add/capacity/JP-EN titles & descriptions, JSON editor), preview rosters, and view status (cards/table).
- **Roster Import**: Load reservation list (xlsx) and briefing session list (xlsx); search and visualize statuses.
- **Export**: Output confirmed assignments to Excel (`reception_status.xlsx`).
- **Multilingual / Theme**: Switch between Japanese/English and Light/Dark theme.
- **Persistence**: Automatically save and restore form inputs, reception data, roster data, and settings locally.

## Environment
- Recommended browsers: Latest Chrome / Edge
- OS: Windows / macOS (tested on Windows)
- Network: Online (fonts/icons/libs loaded from CDN)

## How to Run
1. Place this folder anywhere locally.
2. Open `index.html` in your browser.
3. On first run, a notice may appear for missing rosters. Import rosters from the Admin panel.

## Operational Flow (Event Day)
1) Preparation
- Windows 10/11 with latest Edge/Chrome.
- Keep the folder structure intact (`index.html`, `script.js`, `style.css`, `assets/`, `vendor/`, ...).
- Optionally start via a simple local server:
  - Python: `py -m http.server 8080` → `http://localhost:8080/`
  - Node: `npm -g i serve && serve -l 8080`
- Allow popups in the browser (for Excel/PDF export).

2) Import Rosters (Admin → File Load)
- Reservation roster (xlsx): map columns for Name/Furigana/1st–3rd choices/Companions.
- Briefing roster (xlsx): map columns for Name/Furigana/Time/Companions.
- Data is saved locally and persists across reloads (IndexedDB).

3) Reception Flow
- Reserved: Match by name → Confirmation shows Companions → Confirm.
  - If preferences missing, navigate to selection. The selection page has a Companions (0–5) dropdown.
- Walk-in: Enter name/school/grade/companions (0–5) → Select → Confirm.
- No capstone experience: A dedicated completion screen shows a check icon, briefing guidance, and time (if present).

4) Color Strap Guidance
- Success screen shows “Your color is red.” with explanation.
- For waiting (walk-ins prioritized), the same message is shown and “Your program will be assigned later.” is emphasized.

5) Admin Panel Operations
- Roster Preview: show Furigana and Companions for both reservation/briefing rosters (Companions column appears only if >0 exists; empty cell for 0).
- Status: supports card/table view. In table view, the confirmed list column order is “Attendees → Status (Count)”.
- Batch-assign waiting: assigns according to settings (prioritize reserved/grade).

6) Persistence
- Auto-saves in-progress form (including companions), roster, reception data, and settings. Restores on reload.
- Use “Reset Reception Data” to clear (IndexedDB/localStorage).

7) Export
- Export Excel/PDF of confirmed status. Adds per-attendee “Companions” columns and outputs the numbers (blank for 0).

## UI and Flow
### Top (Reception) Buttons (top-right)
- **? (Help)**: Show the schedule image.
- **Moon/Sun (Theme)**: Toggle light/dark theme.
- **Aあ (Language)**: Toggle Japanese/English.
- **Gear (Admin)**: Open admin login (default password: `admin`).

### Reception Flow
- **Reserved**
  - Enter name as "FamilyName GivenName" (half-width space separated) to match your reservation.
  - If no preferences were provided during reservation, the app navigates to the selection screen.
  - Review the details and confirm. Depending on settings, assignment or waiting will be applied.
- **Walk-in**
  - Enter name (space separated) / school / grade.
  - Go to selection, set up to three preferences, and confirm.
  - Or choose not to participate in the capstone experience; the app shows briefing-only guidance (with time if present in the roster).

### Program Selection
- Each card provides buttons for 1st/2nd/3rd choice. Duplicates are not allowed.
- Full programs are marked "Full" and cannot be selected.

## Admin Panel (gear icon → password `admin`)
### Tab: Program Edit
- Reorder (drag the list icon), edit title/description/capacity, add programs.
- Toggle "Show English Translation" to display `Title (EN) / Desc (EN)` fields. Missing English values are complemented by defaults.
- Use the JSON viewer/editor to edit the program array directly.
- Press "Save Changes" to apply. A confirmation appears if you navigate away with unsaved changes.

### Tab: File Load
- Import reservation roster (xlsx).
- Import briefing session roster (xlsx).
- After import, roster data is saved locally and used by roster preview and reception.

### Tab: Roster Preview
- Show reservation and briefing rosters. Search by name/kana.
- Left color dot indicates status (green=confirmed, yellow=waiting, red=not registered).
- Column mapping (detected) is shown at the top.
  - Furigana column is auto-shown if data contains furigana even when mapping is absent.
  - Companions column is shown only when any row has companions > 0 (0 is blank per row).

### Tab: Status
- View confirmed counts/capacity and attendees per program as cards or table.
- "Assign All Waiting" assigns waiting attendees according to settings.
- "Export to Excel" outputs confirmed assignments.

### Tab: Settings
- **Prioritize Reserved**: When ON, walk-ins are placed on waiting list. After reception ends, assign them in batch.
- **Prioritize Grade (Walk-ins)**: When ON, prioritize HS3→HS2→HS1→Others for waiting list assignment.
- **Reset Reception Data**: Clear all reception/roster/saved states and reload.

## Roster Excel Format
Import expects the following fixed columns (see samples in `register_of_names/`).
- **Capstone Reservation Roster**
  - A=No, B=FamilyName, C=GivenName, D=Furigana(FN), E=Furigana(GN), …, O=1st, P=2nd, Q=3rd, (optional) Companions
  - Internal data: `name` (family + given joined with a half-width space), `furigana`, `choices` (array for 1st–3rd), `companions`
- **Briefing Session Roster**
  - A=No, B=Time, C=FamilyName, D=GivenName, E=Furigana(FN), F=Furigana(GN), (optional) Companions
  - Internal data: `name`, `furigana`, `time`, `companions`

## Local Data Storage
- Uses **IndexedDB** and **localStorage**.
- Automatically saved/restored:
  - In-progress form (name/school/grade, current choices, visible section)
  - Reception data (confirmed/waiting, per-program enrollments)
  - Roster data (reservation/briefing)
  - Settings (prioritize reserved, prioritize grade, language, theme)
- To clear: use "Reset Reception Data" in the admin panel.

## Security and Privacy
- **CSP (Content-Security-Policy)**: Updated to allow required CDNs.
  - Allowed domains include `fonts.googleapis.com`, `fonts.gstatic.com`, `cdn.jsdelivr.net`, Firebase endpoints, etc.
  - Demo images use `images.unsplash.com`, placeholders from `placehold.co`.
- **Input Hardening**: `autocomplete="off"`, `autocapitalize="off"`, `spellcheck="false"` are set on inputs to avoid residual data and auto-correction.
- **XSS Mitigation**: Dynamic HTML is sanitized with `escapeHTML()` (rosters/status/confirmation, etc.).
- **PII Minimization**: Logs are minimal and exclude personally identifiable information. All data stays locally; nothing is sent externally.
- **Reset**: Use the admin panel to clear IndexedDB/localStorage.

## Offline Operation
- Fonts/icons/libs are fetched from CDNs (requires internet).
- Images are read from `public/` locally.

## Export
- Press "Export to Excel" to generate `reception_status.xlsx`.
  - Columns: `Program`, `Attendees/Capacity`, `Attendee1..n`, `Attendee1..n (Companions)`
  - PDF export similarly shows additional `Companions` columns.

## Directory Structure
- `index.html`: Entry page (CDN loading, images from `public/`)
- `style.css`: Styles (light/dark, animations)
- `script.js`: Logic (reception, roster import, persistence, i18n, admin, etc.)
- `firebase-init.js`: Firebase initialization
- `public/`: Local images and optional `public/index.html`
- `register_of_names/`: Sample rosters (xlsx)

(Note) Local fonts/vendor folders are no longer necessary. You may delete `assets/fonts/` and `vendor/` to reduce size.

## Notes
- The app is fully local. If something is missing, verify the `assets/` and `vendor/` folders are intact.
- Admin password default is `admin`. To change, update the corresponding part in `script.js`.
- Names are matched using half-width space between family and given names. Full-width spaces are normalized to half-width.

## Firebase Setup (optional online mode)
If you want to run with Firebase (Email/Password admin login and Firestore persistence), follow:

1) Create a Firebase project. Enable Authentication (Email/Password) and Cloud Firestore.

2) Create `firebase-config.js` in project root:

```html
// Define before firebase-init.js
window.firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_APP.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};
```

3) Serve or open `index.html`. Use the gear icon → login with an email/password account created in Firebase Auth.

4) Minimal Firestore security rules (example; harden for production):

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isStaff() { return request.auth != null; }

    match /participants/{id} {
      allow create: if true;           // Consider App Check for abuse prevention
      allow read, update, delete: if isStaff();
    }
    match /programs/{id} { allow read: if true; allow write: if isStaff(); }
    match /sessions/{id} { allow read: if true; allow write: if isStaff(); }
  }
}
```

## Libraries
- SortableJS (drag & drop)
- SheetJS (Excel read/write)
- Phosphor Icons (icons)
- Fonts: Inter / Noto Sans JP / Zen Maru Gothic (all bundled locally)

## Troubleshooting
- "Reservation not found": Rosters not imported yet or spacing/notation mismatch. Re-check the name input.
- "Program full": Guide the attendee to choose another program; later you can use batch assignment for waitlist.
- Layout broken / want to reset: Use "Reset Reception Data" and reload the page.
- Icons not showing: Ensure `vendor/phosphor-icons/Fonts/regular/style.css` and `fill/style.css` are loaded and icon elements use `<i class="ph ph-*>`.


