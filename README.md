# Handoff: TUI Reading Tracker PWA

## Overview
A single-user Progressive Web App for tracking personal reading: add books by ISBN lookup, maintain a reading list by status, track reading sessions (start/finish page ranges), view per-book stats with an ASCII/block bar chart, and manage reading goals with progress. Aesthetic is a terminal-UI (TUI) look — monospace type, box-drawing style dividers, block/character progress bars — but touch/mouse-first (no keyboard nav implemented in the prototype; optimize for mobile/touch hit targets).

## About the Design Files
The file in this bundle (`Reading Tracker.dc.html`) is a **design reference built as an interactive HTML/JS prototype** — it demonstrates layout, states, copy, and interaction flow using an in-memory mock data store. It is **not production code to copy directly**. The task is to **recreate this design in the target stack**: TypeScript + Vite (per the project brief), calling the real Phoenix API at `http://localhost:4000/api` (configurable via env var), with a real service worker and manifest for PWA installability. No heavy UI framework is required — plain TypeScript + Web Components, or a lightweight framework (Preact/Svelte) if preferred; justify the choice briefly in the implementing PR.

## Fidelity
**High-fidelity.** Colors, type, spacing, and copy in the prototype are final for this pass. Recreate pixel-close using the tokens below; the ASCII bar-chart rendering technique (character repetition, not a charting library) is part of the spec, not a placeholder.

## Screens / Views

### 1. Dashboard (`isDashboard`)
- Purpose: at-a-glance progress on goals + what's currently being read.
- Layout: single-column stack, 16px side padding. Section header row, then GOALS list, then CURRENTLY READING list.
- **Goal card**: bordered box (see tokens), row of label (goal name, or auto-generated "ANNUAL 2026"/"MONTHLY 2026-07" if unnamed) + "N / target" count, then a block-character progress bar (`█` filled / `░` empty, 20 chars wide, 16px monospace, letter-spacing -1px).
- Empty state: dashed border box, centered muted text, "no goals set — add one in GOALS".
- **Currently-reading card**: 56×80px cover image slot (rounded 3px) + title (13px/600) + authors (11px, muted) + 16-char block bar + percent (11px, accent color, right-aligned). Whole card is tappable → book detail.
- Empty state: "nothing in progress — start a session from a book".

### 2. Reading List (`isList`)
- Header "── READING LIST ───────────" (accent color, letter-spacing 1px).
- Filter chips row (wraps): ALL / WANT TO / READING / READ / STOPPED / UNFINISHED. Active chip: accent bg, cream text, bold. Inactive: card bg, muted text, border. Min-height 36px (touch target).
- List rows: 50×70px cover slot + title/authors (truncate with ellipsis) + status badge (bracket style: colored text + 1px colored border, no fill), min-height 44px, whole row tappable → detail.
- Empty state: dashed border, "no books match this filter".

### 3. Add Book (`isAdd`)
- Header "── ADD BOOK ───────────────".
- ISBN input (44px height) + LOOKUP button (accent fill, bold, full width).
- Loading: "querying upstream source..." muted text.
- Error: red-bordered box with message, inline (not a crash) — covers 422 invalid ISBN, 422 not-found, 502 upstream down.
- Result preview: card with 56×80 cover slot, title (14px/700), authors, "{pages} pages · {year}" meta line, then ADD TO LIST (accent fill) / CANCEL (outline) buttons side by side.

### 4. Book Detail (`isDetail`)
- Back link "‹ BACK TO LIST" (muted, 32px min-height tap target).
- Header block: 64×92 cover + title (16px/700) + authors + meta line "{pages} pages · {year} · ISBN {isbn}".
- Status row: card with status badge (bracket style) + inline status-change buttons (WANT TO / STOPPED / UNFINISHED, whichever ≠ current), hidden once status is `read`.
- Progress section (only when book has `total_pages`): "PROGRESS — {percent}%" label, 24-char block bar (18px), "{n} days since start" / "not started".
- ASCII bar chart: "PAGES / DAY (LAST 7 DAYS)" — bordered card, flex row of 7 columns, each: pages-read number (10px, blank if 0) above a single large (26px) spark character from `' ▁▂▃▄▅▆▇█'` scaled to the week's max, then 3-letter weekday label (9px). This is drawn with plain characters — no chart library.
- Sessions list: "SESSIONS" header + START SESSION button (accent, only when no open session and status ≠ read). Each session row: "p.{start} → {end|…}" + datetime range, and a FINISH button (outline, accent) if the session is open.
- Destructive action: "REMOVE FROM READING LIST" full-width outline button, red, opens a confirm modal.

### 5. Goals (`isGoals`)
- "+ NEW GOAL" dashed accent button opens the goal form modal.
- Goal cards: name (user-given, falls back to auto label), date range (11px muted), "{finished} / {target} books", EDIT (outline) / DELETE (red outline) buttons.

### Modals (bottom sheet, slides up from bottom, full-width, rounded top corners 6px)
Backdrop: `rgba(0,0,0,0.6)`.
- **Start session**: START PAGE number input.
- **Finish session**: END PAGE number input.
- **Goal form**: GOAL NAME text input, PERIOD TYPE select (annual/monthly), START/END date inputs (side by side), TARGET BOOKS number input.
- **Confirm** (delete goal / delete entry): plain message text.
- Footer: primary action button (accent fill, label varies: START/SAVE/DELETE) + CANCEL (outline).

### Toast
Small pill above the tab bar, accent-bordered, auto-dismisses ~2.2s. Used for "ADDED TO READING LIST", "STATUS UPDATED", "SESSION STARTED", "SESSION SAVED", "GOAL SAVED", "GOAL DELETED", "REMOVED FROM LIST".

### Tab bar (bottom nav, always visible, 64px height)
DASH / LIST / ADD / GOALS. Active tab: accent text + 2px accent top border, bold. LIST tab stays active while viewing book Detail.

## Interactions & Behavior
- All primary actions are tap/click driven (mouse and touch have full parity per this pass — no keyboard shortcuts implemented).
- ISBN lookup is simulated client-side in the prototype with a 650ms delay and a `lookupSimulation` dev toggle (`none`/`not_found`/`invalid`/`upstream_down`) standing in for real API states — the real client should call `POST /book_lookups` and branch on 422 (invalid/not-found) and 502 (upstream down) the same way, showing the error inline in the Add Book screen, never as a crash.
- Confirming a lookup result calls (in the real app) `POST /reading_list_entries` with `{user_id, book: <lookup result>, entry?: {status}}`; a duplicate (user, book) pair should surface the API's 422 inline.
- Changing status on the detail screen maps to `PUT /reading_list_entries/:id`. Moving to `reading` sets `started_at` if unset; moving to `read` sets `finished_at`; moving away from `read` clears it (mirror this business rule from the prototype's `changeStatus`).
- Start Session → `POST /reading_list_entries/:id/reading_sessions` with `{session:{start_page, started_at}}`, flips entry to `reading`.
- Finish Session → `PATCH /reading_sessions/:id/finish` with `{session:{end_page, ended_at}}`; if `end_page >= total_pages`, entry flips to `read` (mirror in the client optimistically, but the server response is authoritative).
- Delete entry → `DELETE /reading_list_entries/:id`, returns to Reading List.
- Goals CRUD → standard `GET/POST/PUT/DELETE /reading_goals`. Note: the current backend `Goal` type has no `name` field — this design adds a **client-side-only goal name** (nice-to-have for the user, falls back to an auto label like "ANNUAL 2026" / "MONTHLY 2026-07" when blank). Flag to the backend team if they want to persist it server-side (add a `name: string | null` column), otherwise store it in local storage keyed by goal id.
- The 7-day pages/day chart is derived client-side from `GET /reading_list_entries/:id/stats` → `pages_per_day` (align by date, last 7 entries; the prototype currently derives it from raw sessions since there's no live API — switch to the real `EntryStats.pages_per_day` array).
- Percent complete / days elapsed also come from `EntryStats` in the real app (prototype computes them locally from mock sessions).

## State Management
- Current screen (`dashboard | list | add | detail | goals`), selected entry id, active status filter — simple client-side router/state, no auth/session state needed (hardcoded `user_id: 1` on every request).
- Reading list, books, sessions, goals — should be fetched from the API per screen (`GET /reading_list_entries?user_id=`, `GET /stats?user_id=`, `GET /reading_goals`, `GET /reading_list_entries/:id/stats`) rather than held as one big mock array as in the prototype.
- Modal state: a single "current modal" object (`{type, ...fields}}`) — start/finish/goalForm/confirm — covers all four modal cases in the prototype; keep this shape or equivalent.
- Toast: transient message + auto-clear timer.
- Offline: per the brief, no offline data mutation queueing needed — cache the app shell via service worker, and if desired show a simple "showing last cached data" banner when a fetch fails; this was explicitly descoped for the current visual pass (not implemented in the prototype).

## Design Tokens

**Palette (cozy warm theme):**
- Background: `#f5ede0` (warm parchment)
- Card background: `#ece0cd`
- Border / dividers: `#5c4a38` (warm brown ink)
- Primary text: `#3a2e22`
- Muted text: `#8a7660`
- Faint/placeholder text: `#a3927c`
- Progress-bar empty track: `#d8c9b3`
- Accent (primary actions, active states, headers): `#b5651d` (terracotta)
- Accent hover: `#8f4f16`
- Status — want_to: `#8a7660` · reading: `#b5651d` · read: `#4f7461` (sage green) · stopped: `#a8453a` (rust red) · unfinished: `#c9a24a` (mustard)
- Error banner background: `rgba(255,92,92,0.12)` on `#a8453a` text/border
- Modal backdrop: `rgba(0,0,0,0.6)`

**Typography:** JetBrains Mono (400/500/600/700) throughout, no secondary font. Sizes used: 9, 10, 11, 12, 13, 14, 15, 16, 18, 26px. Letter-spacing 0.5–1px on labels/headers; -1px on block-bar character runs (to pack them tighter).

**Radius:** 2px on cards/buttons/inputs/badges; 3px on cover images; 6px on the modal sheet's top corners.

**Spacing:** 16px page gutters, 8–14px internal card padding, 6–10px gaps between stacked elements, 8px gaps between side-by-side buttons.

**Touch targets:** all interactive rows/buttons are ≥44px tall (36px minimum for compact secondary actions like status-change chips) per the mobile-first requirement.

## Assets
Book covers are `<image-slot>` placeholders (drag-and-drop image slots in the prototype tool) — in the real app, bind to `Book.cover_url`, falling back to a "no cover" placeholder (striped pattern, "no cover" monospace label) when null.

## Files
- `Reading Tracker.dc.html` — the full interactive prototype (template + logic class), single file, opens directly in a browser.
