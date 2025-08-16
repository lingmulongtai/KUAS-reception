## KUAS Reception App (Offline-Ready)

### Overview
This is a browser-based reception app for the Faculty of Engineering Open Campus at Kyoto University of Advanced Science. It completes reception for reserved and walk-in attendees, program preference selection, admin-side editing/assignment/roster preview, status visualization, and export — all locally in the browser.

This project is fully offline-ready. No external CDNs are required. All libraries, icons, and fonts are bundled in the repository.

## Table of Contents
- [Environment](#environment)
- [How to Run](#how-to-run)
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
- OS: Windows / macOS (this repository has been tested on Windows)
- Network: Fully offline (no external network access)

## How to Run
1. Place this folder anywhere locally.
2. Open `index.html` in your browser.
3. On first run, a notice may appear for missing rosters. Import rosters from the Admin panel.

## UI and Flow
### Top (Reception) Buttons (top-right)
- **? (Help)**: Show the schedule image.
- **Moon/Sun (Theme)**: Toggle light/dark theme.
- **Aあ (Language)**: Toggle Japanese/English.
- **Gear (Admin)**: Open admin login (default password: `admin`).

### Reception Flow
- **Reserved**
  - Enter name as "FamilyName GivenName" (space separated) to match your reservation.
  - If no preferences were provided during reservation, the app navigates to the selection screen.
  - Confirm the details and press Confirm. Depending on settings, assignment or waiting will be applied.
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
  - A=No, B=FamilyName, C=GivenName, D=Furigana(FN), E=Furigana(GN), …, O=1st, P=2nd, Q=3rd
  - Internal data: `name` (family + given joined with a half-width space), `furigana`, `choices` (array for 1st–3rd)
- **Briefing Session Roster**
  - A=No, B=Time, C=FamilyName, D=GivenName, E=Furigana(FN), F=Furigana(GN)
  - Internal data: `name`, `furigana`, `time`

## Local Data Storage
- Uses **IndexedDB** and **localStorage**.
- Automatically saved/restored:
  - In-progress form (name/school/grade, current choices, visible section)
  - Reception data (confirmed/waiting, per-program enrollments)
  - Roster data (reservation/briefing)
  - Settings (prioritize reserved, prioritize grade, language, theme)
- To clear: use "Reset Reception Data" in the admin panel.

## Security and Privacy
- **CSP (Content-Security-Policy)**: A strict meta CSP is set in `index.html`.
  - All sources are `self` only (fully local).
  - Examples: `style-src 'self' 'unsafe-inline'`, `font-src 'self' data:`, `img-src 'self' data:`.
- **Input Hardening**: `autocomplete="off"`, `autocapitalize="off"`, `spellcheck="false"` are set on inputs to avoid residual data and auto-correction.
- **XSS Mitigation**: Dynamic HTML is sanitized with `escapeHTML()` (rosters/status/confirmation, etc.).
- **PII Minimization**: Logs are minimal and exclude personally identifiable information. All data stays locally; nothing is sent externally.
- **Reset**: Use the admin panel to clear IndexedDB/localStorage.

## Offline Operation
- All external dependencies (fonts/icons/libs) are bundled under `assets/` and `vendor/`.
- `index.html` references only local files; no network is required.

## Export
- Press "Export to Excel" to generate `reception_status.xlsx`.
  - Columns: `Program`, `Name` (program title uses English when language is set to EN)

## Directory Structure
- `index.html`: App shell (views)
- `style.css`: Styles (light/dark, animations)
- `script.js`: Logic (reception, roster import, persistence, i18n, admin, etc.)
- `public/`: Images (logos, schedule)
- `register_of_names/`: Sample rosters (xlsx)
- `assets/fonts/`: Local-hosted fonts (`Inter`, `Noto Sans JP`, `Zen Maru Gothic`) and `fonts.css`
- `vendor/sortable/`: SortableJS (offline)
- `vendor/sheetjs/`: SheetJS (`xlsx.full.min.js`, offline)
- `vendor/phosphor-icons/`: Phosphor Icons (CSS + webfonts, offline)

## Notes
- The app is fully local. If something is missing, verify the `assets/` and `vendor/` folders are intact.
- Admin password default is `admin`. To change, update the corresponding part in `script.js`.
- Names are matched using half-width space between family and given names. Full-width spaces are normalized to half-width.

## Libraries
- SortableJS (drag & drop)
- SheetJS (Excel read/write)
- Phosphor Icons (icons)
- Local-hosted fonts: Inter / Noto Sans JP / Zen Maru Gothic

## Troubleshooting
- "Reservation not found": Rosters not imported yet or spacing/notation mismatch. Re-check the name input.
- "Program full": Guide the attendee to choose another program; later you can use batch assignment for waitlist.
- Layout broken / want to reset: Use "Reset Reception Data" and reload the page.
- Icons not showing: Ensure `vendor/phosphor-icons/Fonts/regular/style.css` and `fill/style.css` are loaded and icon elements use `<i class="ph ph-*>`.


