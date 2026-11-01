# PRD: Goals History

Status: draft
Owner: Rafael Campos
Scope: Reading Tracker PWA (frontend: this repo; backend: `fun_library`)
Vocabulary: `CONTEXT.md` (this repo) and `fun_library/docs/adr/CONTEXT.md`
Decision record: `fun_library/docs/adr/0006-goals-use-calendar-periods-and-close-by-the-calendar.md`

## Context

A goal today is a free-form date range with a book target. `period_type` is only a
label, so a "monthly" goal can cover 47 days. Goals never end: there is no closed
state, no history and no outcome. The Goals screen and the Dashboard list every goal
ever made side by side. You can't open a goal to see which books it covered. Progress
is computed twice (backend `Stats.goal_progress/1`, frontend `Goals.tsx`), goal names
live only in `localStorage`, and `GET /reading_goals` ignores `user_id`.

## Goal

Make goals **calendar commitments with a history**: an annual or monthly goal covers
exactly its year or month, closes on its own when the period ends, and can be opened
to see what was read during it.

## Rules

1. **Goal period** = one calendar year (annual) or calendar month (monthly), app
   timezone. Stored as type + first day of the period.
2. **At most one goal per type per period.**
3. **Current / upcoming / closed** are derived from today versus the period. Nothing
   is stored and no job runs.
4. **Books finished** and **achieved / missed** are always derived from the reading
   list as it is now. Backfilling a finish date can change a closed goal.
5. Goals can be created only for **current or upcoming** periods.
6. Until a goal closes, only its **target** can change, and it can be deleted.
   Type and period never change.
7. A **closed goal is locked**: no target change, no delete.
8. Goals have **no name**. The label is the period: `2026`, `NOV 2026`.

## Screens

### Goals screen

```
── GOALS ──────────────────
+ NEW GOAL

CURRENT
  2026          9 / 12 books        →
  NOV 2026      1 / 2 books         →

UPCOMING
  2027          0 / 15 books        →

HISTORY
  OCT 2026      3 / 4   MISSED      →
  SEP 2026      4 / 4   ACHIEVED    →
  2025         14 / 12  ACHIEVED    →
```

- Three sections, empty ones hidden.
- **History** is one list of closed goals, newest period first. Annual and monthly
  are mixed, and a year sorts at its last day, i.e. after its December. Periods with
  no goal don't appear.
- Every row opens the goal page. EDIT and DELETE are removed from the cards.

### New goal form

- Fields: **type** (annual / monthly), **period** (a year or month picker),
  **target books**.
- The picker offers only free periods: current or upcoming, with no goal of that
  type yet. If none are free for the chosen type, it says so and the form can't
  submit.
- The name field and the start/end date inputs are removed.

### Goal page

```
← GOALS
OCT 2026 · MONTHLY
3 / 4 books · MISSED

FINISHED
  Dune                      Oct 4
  Piranesi                  Oct 12
  The Hobbit                Oct 28

ALSO READ
  Middlemarch               CARRIED OVER
  Blindsight                DID NOT FINISH
```

- **Header**: period label, type, `books_finished / target_books`, then the state:
  `ACHIEVED` / `MISSED` for a closed goal, `CURRENT` or `UPCOMING` otherwise.
- **FINISHED**: the books finished, ordered by finish date, showing the date.
- **ALSO READ**: entries with at least one **reading day** in the period that weren't
  finished in it, ordered by their last reading day in the period. Each has one label:
  - `CARRIED OVER`: the book has a reading day after the period, or was finished
    after it.
  - Otherwise its status label: `READING`, `ON HOLD` (`stopped`),
    `DID NOT FINISH` (`unfinished`).
- Tapping any book opens Book Detail.
- **EDIT TARGET** and **DELETE** appear only on current and upcoming goals.
- Labels are live. October's `READING` book becomes `CARRIED OVER` once it's read
  in November.
- Hidden when empty: the FINISHED section shows "no books finished yet", and ALSO
  READ is hidden when it has no books.

### Dashboard

- The GOALS section shows **current goals only** (at most two). Each card opens its
  goal page. Bar and counts are unchanged.

---

## Backend work (`fun_library`)

1. **Schema + migration** (`mix ecto.gen.migration ...`):
   - Snap every goal's `period_start` to the first day of its year or month (by
     type).
   - Within each (user, type, period_start), keep the goal with the latest
     `updated_at` and delete the rest.
   - Drop `period_end`. Add a unique index on `(user_id, period_type, period_start)`.
2. **`Goal` changeset**:
   - Create casts `period_type`, `period_start` and `target_books`. `user_id` is set
     programmatically, not cast.
   - `period_start` must be the first day of a year or month matching the type.
   - The period must not have ended.
   - `target_books` must be > 0.
   - The unique constraint is surfaced as a changeset error.
   - Update casts **only** `target_books`.
3. **Lock**: `update_goal` and `delete_goal` refuse a closed goal with
   `{:error, :goal_closed}`, rendered as 409.
4. **Goal state in one place**: a module function that, given a goal and today, gives
   `state` (`current | upcoming | closed`), `period_end`, `books_finished` and
   `outcome` (`achieved | missed | nil`). Both `Stats.summary/1` and the goal
   endpoints use it, so nothing restates the rules.
5. **Goal books**: for one goal, the finished entries plus the also-read entries with
   their label. "Reading day" reuses the existing `Stats` rule (finished session that
   advanced pages, bucketed by `ended_at` in app time). Do not restate it.
6. **`list_reading_goals(user_id)`**: filter by user (fixes the current bug). Order
   current → upcoming → closed, newest period first within each.
7. **`Stats.summary/1`**: `goals` contains current goals only.

### API contract

All responses keep the `{"data": ...}` envelope.

```jsonc
// GET /api/reading_goals?user_id=1
{ "data": [ {
  "id": 4, "user_id": 1, "period_type": "monthly",
  "period_start": "2026-10-01", "period_end": "2026-10-31",   // end is derived
  "target_books": 4,
  "state": "closed",                // current | upcoming | closed
  "books_finished": 3,
  "outcome": "missed"               // achieved | missed | null (not closed)
} ] }

// GET /api/reading_goals/4
{ "data": {
  /* everything above, plus: */
  "finished": [
    { "entry_id": 3, "book_id": 7, "title": "Dune", "cover_url": "...",
      "finished_at": "2026-10-04" }
  ],
  "also_read": [
    { "entry_id": 5, "book_id": 9, "title": "Middlemarch", "cover_url": "...",
      "label": "carried_over",      // carried_over | reading | stopped | unfinished
      "last_reading_day": "2026-10-30" }
  ]
} }

// POST /api/reading_goals
{ "goal": { "user_id": 1, "period_type": "monthly",
            "period_start": "2026-12-01", "target_books": 3 } }
// 201 on success; 422 for a duplicate, past or misaligned period

// PUT /api/reading_goals/4   { "goal": { "target_books": 5 } }
// DELETE /api/reading_goals/4
// both → 409 when the goal is closed
{ "errors": { "detail": "Conflict" }, "reason": "goal_closed" }

// GET /api/stats?user_id=1 — "goals" now holds current goals only, same shape as today
```

## Frontend work (this repo)

- **Types / API**:
  - `Goal` gains `state`, `books_finished` and `outcome`, and loses `name`.
  - New `GoalDetail` type and `getGoal(id)`.
  - `GoalInput` drops `period_end`.
  - `updateGoal` sends only `target_books`.
- **Remove names**: delete `state/goalNames.ts` and the merge logic in the store.
  `goalLabel` derives from the period only.
- **Goals screen**: CURRENT / UPCOMING / HISTORY sections with tappable rows. Drop the
  client-side progress computation and use `books_finished` from the API.
- **Goal form**: type + year/month picker restricted to free periods, plus target.
  Editing shows only the target.
- **Goal page**: a new `goal` screen (the store's `Screen` union) with header,
  FINISHED and ALSO READ, plus EDIT TARGET / DELETE for unclosed goals. The back
  arrow returns to Goals, or to the Dashboard when opened from there.
- **Dashboard**: goal cards open the goal page.
- Handle the 409 `goal_closed` from a stale client: show a toast, then reload goals.

## Edge cases

- **Annual and monthly overlap**: a book finished on Nov 5 counts toward both 2026
  and NOV 2026.
- **Book spanning a period boundary**: CARRIED OVER in the earlier period, its
  outcome in the later one. Applies to Dec→Jan across annual goals too.
- **Hand-logged `read` book with no sessions**: shows under FINISHED by its finish
  date, and never under ALSO READ (it has no reading days).
- **Finish date backfilled into a closed period**: that goal's count and outcome
  update. This is intended (ADR 0006).
- **Session crossing midnight**: belongs to the day it ended, as everywhere else.
- **Period closes while the screen is open**: the next load moves the goal to
  history. A stale EDIT gets 409.
- **Entry with reading days but status `want_to` or `read` with a finish date
  before the period** (only possible through hand edits): shown under ALSO READ with
  its status label, never counted.

## Out of scope

- Goal names, custom-range or sprint goals, page-count or genre goals.
- Pace / on-track indicators on goals.
- A reading log for periods without a goal.
- A monthly breakdown on the annual goal page.
- Backfilling goals for past periods.

## Suggested build order

1. Backend: migration, changeset rules, lock, user filter, goal state function,
   `Stats.summary` current-only. Frontend: types, name removal, sectioned Goals
   screen, new form.
2. Backend: `GET /reading_goals/:id` with finished and also-read books. Frontend:
   goal page and Dashboard links.
