# KUAS Reception App

[日本語 README](README.md)

## Concept
- Browser-based single-page app that handles reception and seating for KUAS Faculty of Engineering Open Campus
- Runs locally end-to-end: roster import, reception, program assignment, progress tracking, and export
- Optional Firebase integration (Auth / Firestore / Data Connect beta) when an internet connection is available

## Core Features
- Reception flow for reserved and walk-in attendees (name, school, grade, companions)
- Program selection UI for 1st–3rd choices with capacity-aware validation
- Auto-assignment, waiting list management, and color strap guidance screens
- Admin panel for program editing, roster preview, and status visualization
- Excel (`reception_status.xlsx`) and PDF export of final assignments
- Japanese/English UI toggle, light/dark theme switch, automatic persistence via IndexedDB and localStorage
- **Mobile-first visitor journey** (`mobile/index.html`): smartphone-optimized UI that guides attendees from entry type to confirmation, integrates with Firestore (programs/reservations/participants), surfaces offline detection, toast feedback, and auto resume

## Requirements
- Browsers: Latest Microsoft Edge or Google Chrome (verified on Windows)
- OS: Windows 10/11 recommended; macOS supported
- Network: Online recommended (fonts, icons, major libraries retrieved from CDNs)
- Optional: Enable relevant Firebase services when using online features

## Setup
### Local Usage
1. Place the repository anywhere on your machine
2. Open `index.html` directly or start a lightweight local server
   - PowerShell: `py -m http.server 8080`
   - Node.js: `npx serve -l 8080`
3. On first launch, you will see a notice about missing rosters; import them via the Admin panel

### Firebase Integration (Optional)
1. Create a Firebase project and enable Authentication (Email/Password) and Cloud Firestore
2. Create `firebase-config.js` at the project root and define `window.firebaseConfig = { ... }`
3. Serve or open `index.html`, then sign in via the gear icon using a Firebase Auth account
4. Adjust security rules based on `firestore.rules`; update the contents under `dataconnect/` if using Data Connect beta

### Using the smartphone reception flow
1. Complete the Firebase setup above (Firestore enabled and `firebase-config.js` available)
2. Host or open `mobile/index.html`
3. Seed the `programs` collection with documents containing `id`, `title`, `description`, `capacity`, and `order`
4. Populate the `reservations` collection with `name`, `furigana`, `school`, `grade`, `companions`, `choices[]` for reserved guests
5. Field staff launch the mobile UI so visitors can choose “Reserved” or “Walk-in”, enter minimal details, pick programs, review, and confirm
   - Each submission writes to the `participants` collection with a `status` (`waiting`, `registered`, or `briefing_only`)
   - Form progress persists in localStorage to resume after accidental refreshes or app switching
6. Connectivity feedback appears in the top banner; sync failures display toast messages with recovery prompts

## Event-Day Workflow
1. **Preparation**: Update OS/browser, gather the latest roster files, allow pop-ups
2. **Import Rosters**: Admin → File Load; import the reservation roster and briefing roster (xlsx) and complete column mapping
3. **Reception**
   - Reserved: match by name → confirm details → finalize with companions count
   - Walk-in: input name/school/grade/companions → choose preferences → confirm
4. **Auto Assignment**: Configure “Prioritize Reserved” and “Prioritize Grade (Walk-ins)” in Settings; run batch assignment for waiting attendees
5. **Status Monitoring**: Use the Status tab (cards/table) to review program enrollment and waiting list
6. **Export**: Generate Excel/PDF outputs and archive final results

## Data Specification
### Excel Rosters
| File | Required Columns (example) | Parsed Fields |
| --- | --- | --- |
| Capstone Reservation Roster | No, FamilyName, GivenName, Furigana, 1st–3rd, (opt) Companions | `name`, `furigana`, `choices[]`, `companions` |
| Briefing Session Roster | No, Time, FamilyName, GivenName, Furigana, (opt) Companions | `name`, `furigana`, `time`, `companions` |

### Local Persistence
- IndexedDB: stores form inputs, reception status, roster data, and program settings
- localStorage: stores theme, language, and lightweight preferences
- Use “Reset Reception Data” in the Admin panel to clear both stores

## Directory Highlights
- `index.html` / `script.js` / `style.css`: main app shell and UI logic
- `language-loader.js` & `locales/*.json`: lazy-loaded multilingual assets
- `public/`: static images and sample Firebase Hosting assets
- `register_of_names/`: sample roster spreadsheets
- `firebase-init.js`, `firebase-config.js`: Firebase setup files (optional)
- `dataconnect/`, `dataconnect-generated/`: Firebase Data Connect beta templates

## Troubleshooting
- **Reservation not found**: Re-import rosters and verify name spacing/notation
- **Program full**: Move attendee to waiting list and run batch assignment later
- **Layout issues / need reset**: Use the admin reset action and reload the page
- **Icons missing**: Check internet connectivity and confirm CDN requests succeed
- **Firebase write errors**: Confirm authentication status and security rule settings

## Developer Notes
- Program definitions and reception logic live in `script.js`
- UI strings are managed in `locales/ja.json` and `locales/en.json`; add new languages with matching keys
- Section navigation is controlled by `showSection()` to avoid relying on browser history
- SheetJS handles Excel parsing; SortableJS powers drag-and-drop; Phosphor Icons supply iconography

---

© KUAS Reception App Team. All rights reserved.

