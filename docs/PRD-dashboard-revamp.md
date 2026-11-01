# PRD: Dashboard Revamp

Status: draft
Owner: Rafael Campos
Scope: Reading Tracker PWA (frontend: this repo; backend: `fun_library`)
Vocabulary: `CONTEXT.md` (this repo) and `fun_library/docs/adr/CONTEXT.md`

## Context

The Dashboard today is three read-only stacks — STREAK (current / record), GOALS
(books finished vs target), CURRENTLY READING (cover, bar, %). Its only interaction is
tapping a book to open Book Detail, so starting to read takes two taps and a screen
change (DASH → book → START SESSION). Book Detail already starts sessions at the
current page without a modal; the Dashboard just can't reach that action. It shows nothing about recent
activity beyond the streak number, and none of the qualitative data the app now
collects (session highlights).

## Goal

Make the Dashboard a **launchpad first, scoreboard second**: the top of the screen
gets you reading in one tap; below it, a compact picture of how your reading is
going.

## Layout

```
┌ HERO ─────────────────────────────┐
│ [cover] Oathbringer               │
│ ████████████░░░░ 72%              │
│ ~6 DAYS LEFT · 32 PG/DAY [RESUME] │
└───────────────────────────────────┘
 ALSO READING  [cover][cover][cover]

── ACTIVITY ───────────────────────
 STREAK 4 DAYS · RECORD 12
 LAST 7 DAYS  312 PG · 4h 10m · 5/7
 ▁▃ ▅█▂▆
 ░▒▓█ heatmap (12 weeks)

── GOALS ──────────────────────────
 (unchanged)

  "The most important step a man
   can take…" — Oathbringer
```

Order is fixed: Hero → Also reading → Activity → Goals → Daily highlight.

---

## 1. Hero (launchpad)

The hero has exactly one of three states, checked in this order.

### State 1 — Open session
The reader has an **open session** (at most one, see backend ADR 0005).
- Shows the session's book (cover, title, progress bar), its start page, and a
  running timer since `started_at` ("READING FOR 23m").
- Primary action **FINISH** → the existing finish-session modal.
- Forgotten sessions get no special treatment: the timer simply keeps counting
  ("READING FOR 10h 4m"). No stale threshold, no auto-close.

### State 2 — Books in progress, no open session
- The hero book is the in-progress entry with the **most recent session** — picked
  automatically, never pinned.
- Shows cover, title, progress bar + %, and **days left** with **pace**:
  `~6 DAYS LEFT · 32 PG/DAY`. Hidden (not "∞", not "—") when the entry has no page
  count or no pace.
- Primary action **RESUME**: starts a session at the entry's **current page** in one
  tap, no start-page modal — the same call Book Detail's START SESSION already makes.

### State 3 — Nothing in progress
- Shows the most recently added `want_to` entry with **START** (same one-tap
  behavior as Resume; a never-started entry's current page is 0, as on Book Detail).
- If there are no `want_to` entries either: an empty-state box linking to ADD.

### Also reading
- Below the hero in state 2, the other `reading` entries as a compact horizontal row
  of covers, most recent session first. Each cover opens Book Detail; each has its
  own small RESUME.
- In state 1, the row shows all `reading` entries except the open session's; their
  RESUME is replaced by a disabled hint ("finish *Oathbringer* first").
- Days left is **not** shown here — hero only.

## 2. Activity

One card, all built on **reading days** (the day a finished session *ended*, in the
app's timezone, having advanced pages — identical to the streak's rule, so the three
parts can never disagree).

- **Streak line**: `STREAK 4 DAYS · RECORD 12` (current streak, streak record). The
  existing STREAK card is removed; its "no reading days yet" empty state becomes the
  Activity card's empty state.
- **Last 7 days** (rolling, ending today — never a calendar week):
  - pages read (headline), minutes read (secondary), reading days out of 7.
  - 7-column spark chart using the same `' ▁▂▃▄▅▆▇█'` technique as Book Detail,
    scaled to the window's max, date-labelled.
- **Heatmap**: the last 12 weeks as a grid of block characters, one cell per day,
  shaded by pages read.

**Pages lead, minutes support.** Minutes are derived from session timestamps and can
be inflated by forgotten sessions, so they are never a headline and no derived metric
(pages/hour, reading speed) is computed from them.

## 3. Goals

Unchanged — same cards, same `books_finished / target_books` bar. No pace or
on-track indicator in this revamp.

## 4. Daily highlight

- One **daily highlight**: a randomly chosen highlight of at most 120 characters,
  fixed for the calendar day (app timezone), cycling through every eligible highlight
  before any repeats.
- Rendered at the bottom of the Dashboard in **italic**, as a book-like quotation,
  followed by the book title. Tapping opens that book's detail.
- Hidden entirely when no highlight qualifies — no empty state, no truncated quotes.

---

## Backend work (`fun_library`)

1. **One open session per reader** (ADR 0005). `start_session` refuses when the
   reader has an open session on *any* entry, and the error identifies that session.
   Existing duplicate open sessions must be resolved before any DB-level constraint.
2. **Activity by day** — `GET /api/stats/:user_id/activity?days=84` (default 84),
   returning `[{date, pages_read, minutes}]` for the last N days, sparse (days with
   reading only). Bucketing must reuse the reading-day rule from `reading_dates/1`
   (session's `ended_at`, app timezone, `end_page > start_page`).
3. **`Stats.summary` additions**, per `currently_reading` item:
   - `last_session_at` — for hero selection and also-reading order.
   - `current_page` — for one-tap Resume.
   - `pace` and `days_left` — nullable, per the glossary definitions.
   - and at the top level, `open_session` (`{id, entry_id, start_page, started_at}` or
     `null`).
4. **Daily highlight** — `GET /api/stats/:user_id/daily_highlight`, returning
   `{session_id, entry_id, book_id, book_title, highlight}` or `null`. The pick is
   seeded by the app-timezone date and cycles through all eligible highlights (≤120
   chars) before repeating.

### API contract

All responses keep the existing `{"data": ...}` envelope.

```jsonc
// GET /api/stats?user_id=1  (existing, extended)
{ "data": {
  "goals": [ /* unchanged */ ],
  "open_session": { "id": 9, "entry_id": 3, "start_page": 120,
                    "started_at": "2026-11-01T22:00:00Z" },        // or null
  "currently_reading": [ {
    "entry_id": 3, "book_id": 7, "title": "...", "percent_complete": 72.0,  // unchanged
    "last_session_at": "2026-11-01T22:00:00Z",  // latest session's started_at, or null
    "current_page": 120,                          // per glossary; null if no sessions
    "pace": 32.0,                                 // pages/day, 1 decimal, or null
    "days_left": 6                                // integer, or null
  } ]
} }

// GET /api/stats/1/activity?days=84
{ "data": [ { "date": "2026-11-01", "pages_read": 40, "minutes": 55 } ] }
// minutes = sum of (ended_at - started_at) of the counted sessions, rounded per day

// GET /api/stats/1/daily_highlight
{ "data": { "session_id": 9, "entry_id": 3, "book_id": 7,
            "book_title": "...", "highlight": "..." } }   // or { "data": null }

// POST /api/reading_list_entries/:id/reading_sessions when another entry has an
// open session → 409
{ "errors": { "detail": "Conflict" },
  "open_session": { "id": 9, "entry_id": 3, "start_page": 120,
                    "started_at": "2026-11-01T22:00:00Z" } }
```

The state-3 `want_to` book comes from the client's existing entries list; no new
endpoint.

## Frontend work (this repo)

- Rewrite `Dashboard.tsx` around the four sections above; remove the standalone
  STREAK card.
- Hero state machine + one-tap Resume/Start (reuse the store's `startSession` with the
  current page, as Book Detail does).
- Show the "finish *X* first" hint wherever a session can be started (Dashboard and
  Book Detail) when an open session exists elsewhere.
- Activity card: streak line, 7-day summary + spark chart, 12-week heatmap.
- Daily highlight block (italic, hidden when null).
- New API calls + store signals for activity and daily highlight; extend
  `OverviewStats` types.

## Edge cases

- **`total_pages` unknown** → hero shows % as "—" (current behavior) and no days left.
- **Pace is zero** (paused book, no history) → no days left line.
- **Session crossing midnight** → counts entirely on the day it *ended*.
- **Reader opened a session on another device** → hero state 1 reflects it on next
  load; one-per-reader rule is enforced server-side, so the stale client's RESUME
  fails with the "finish first" error and the Dashboard reloads.
- **No reading history** → Activity shows its empty state; no heatmap of zeros.

## Out of scope

- Terrarium (own PRD, own tab; no Dashboard teaser until it exists).
- Goal pace / on-track indicators.
- Stale-session detection, auto-close, or editable end time on finish.
- Pinning a "main book".
- Selectable activity windows (week/month/year toggle).
- Days left on Book Detail (the backend value makes this a cheap follow-up).

## Provisional defaults (revisit after use)

- **Heatmap shading**: blank for no reading, then `░▒▓█` by quartiles of the
  window's non-zero days.
- **Heatmap interaction**: display-only in v1.

## Suggested build order

1. Backend: one-open-session rule + `Stats.summary` additions → frontend hero and
   also-reading row (the core launchpad).
2. Backend: activity endpoint → Activity card (streak merge, 7-day, heatmap).
3. Backend: daily highlight endpoint → highlight block.
