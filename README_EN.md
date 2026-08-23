# KUAS Reception App

[日本語 README](README.md)

## Concept
- Browser-based single-page app that handles reception and seating for KUAS Faculty of Engineering Open Campus
- Runs **fully locally** end-to-end: roster import, reception, program assignment, progress tracking, and export
- Makes no requests to any external service — it works in a venue with no connectivity

> **About the online version**
> The Firebase build (Auth / Firestore / Cloud Functions) is preserved on the
> `backup/firebase-main` branch. This branch is that build with the cloud
> dependencies removed.

## Core Features
- **Fuzzy name matching** — family name or given name alone, kana, romaji, email address, or
  a missed dakuten all surface candidates as you type (`name-match.js`)
- Program selection UI for 1st–3rd choices, with a capacity bar (open / nearly full / full)
- Four assignment methods (first-come / reservation holders / school year / repeat visitors)
  and waiting list management
- Color strap guidance screens
- Admin panel for program editing, roster preview, and status visualization
- Excel (`reception_status.xlsx`) and PDF export of final assignments
- Multilingual UI (日本語 / English / 한국어 / 中文 / español / हिन्दी / नेपाली / العربية / Indonesia)
- Light / Dark / Liquid Glass themes, automatic persistence via IndexedDB and localStorage

## Requirements
- Browsers: Latest Microsoft Edge, Google Chrome, or Safari
- OS: Windows 10/11, macOS, iPadOS
- Node.js 18+ (only if you use the bundled local server)
- Network: **not required**. Fonts, icons, and libraries are all vendored in the repository

## Setup

```bash
npm start
```

Open `http://127.0.0.1:5173`. To reach it from iPads or other devices on the same LAN:

```bash
npm run start:lan
```

Then browse to the LAN address printed in the console.

> Double-clicking `index.html` will not work. The app fetches its language
> resources at runtime, and browsers block that over `file://`. Use `npm start`
> or any local server (e.g. `py -m http.server 8080`).

Enter the admin panel from the icon in the top right. The default password is
`admin` (the `ADMIN_PASSWORD` constant in `script.js`).

## Event-Day Workflow
1. **Preparation**: Update OS/browser, gather the latest roster files, allow pop-ups
2. **Import Rosters**: Admin → File Load; import the reservation roster and briefing roster (xlsx) and complete column mapping
3. **Reception**
   - Reserved: match by name → confirm details → finalize with companions count
   - Walk-in: input name/school/grade/companions → choose preferences → confirm
4. **Auto Assignment**: Configure "Prioritize Reserved" and "Prioritize Grade (Walk-ins)" in Settings; run batch assignment for waiting attendees
5. **Status Monitoring**: Use the Status tab (cards/table) to review program enrollment and waiting list
6. **Export**: Generate Excel/PDF outputs and archive final results

## Data Specification
### Excel Rosters
| File | Required Columns (example) | Parsed Fields |
| --- | --- | --- |
| Capstone Reservation Roster | No, FamilyName, GivenName, Furigana, 1st–3rd, (opt) Companions | `name`, `furigana`, `choices[]`, `companions` |
| Briefing Session Roster | No, Time, FamilyName, GivenName, Furigana, (opt) Companions | `name`, `furigana`, `time`, `companions` |

### Local Persistence
Everything is written to localStorage through `local-store.js` (`window.LocalStore`),
namespaced under `kuas.reception.v1.*`.

| Key | Contents |
| --- | --- |
| `kuas.reception.v1.programs` | Program definitions |
| `kuas.reception.v1.reservations` | Reservation roster |
| `kuas.reception.v1.briefings` | Briefing session roster |
| `kuas.reception.v1.participants` | Checked-in attendees |

- Multiple tabs in the same browser stay in sync via the `storage` event
- IndexedDB holds in-progress form input
- "Reset Reception Data" in the admin panel clears every store

> **Note:** data is tied to the browser profile. It is not shared across machines
> or browsers. If several devices handle reception in parallel, export each one to
> Excel and merge manually.

## Directory Highlights
- `index.html` / `script.js` / `style.css`: main app shell and UI logic
- `local-store.js`: localStorage-backed data layer
- `name-match.js`: attendee matching engine (kana, romaji, email)
- `tests/name-match.test.js`: matching tests, run with `npm test`
- `serve.js`: dependency-free local static server
- `language-loader.js` & `locales/*.json`: lazy-loaded multilingual assets
- `assets/fonts/`: bundled fonts (Inter / Noto Sans JP / Zen Maru Gothic)
- `vendor/`: bundled libraries (Phosphor Icons / SortableJS / SheetJS)
- `public/`: static images
- `public/programs/`: program card thumbnails (see the README in that directory)
- `register_of_names/`: sample roster spreadsheets
- `docs/design-proposal.html`: UI and feature design proposal

## Troubleshooting
- **Reservation not found**: Re-import rosters and verify name spacing/notation
- **Program full**: Move attendee to waiting list and run batch assignment later
- **Layout issues / need reset**: Use the admin reset action and reload the page
- **Blank screen or missing labels**: Check you are not opening it via `file://`; use `npm start`
- **Data disappeared**: Private browsing and clearing history both wipe it. Always export to Excel before the event ends

## Developer Notes

```bash
npm test
```

- When matching misses something, add the case to `tests/name-match.test.js` before fixing it
- Program definitions and reception logic live in `script.js`
- `confirmedAttendees` / `waitingList` / `programEnrollment` are derived from
  `allParticipants` — update them through `syncDerivedLists()`, never directly
- UI strings live in `locales/*.json`; add new languages with matching keys.
  Missing keys fall back to English automatically
- Section navigation goes through `navigateTo()` to avoid relying on browser history
- SheetJS handles Excel parsing; SortableJS powers drag-and-drop; Phosphor Icons supply iconography

---

© KUAS Reception App Team. All rights reserved.
