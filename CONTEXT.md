# Librarian

The client for a single-reader reading tracker: which books are on the reading list, how reading sessions progress through them, and how that adds up against goals. Shares its language with the backend (`fun_library/docs/adr/CONTEXT.md`); terms below either mirror it or add to it.

## Language

### Reading

**Book**:
Catalogue data for one ISBN — title, authors, cover, page count. Knows nothing about the reader.
_Avoid_: Title, volume

**Reading list entry**:
The reader's relationship to one Book, carrying its status, start date and finish date.
_Avoid_: Book (when meaning the reader's copy), UserBook

**Reading session**:
One sitting with a book, from a start page and time to an end page and time.
_Avoid_: Read, sitting

**Open session**:
A reading session that has started but not yet been finished; the reader has at most one at a time, across all entries (backend ADR 0005).
_Avoid_: Active session, in-progress session

**Current page**:
The end page of the entry's latest session, or its start page if that session is still open. An entry with no sessions has no current page; starting one begins at page 0.
_Avoid_: Bookmark, last page

**Resume**:
Starting a new reading session at the entry's current page without asking for a start page.
_Avoid_: Continue

**Session highlight**:
An optional short passage or reflection a reader captures from a book against a finished reading session.
_Avoid_: Note, comment, log entry

**Daily highlight**:
One session highlight of at most 120 characters, chosen at random once per calendar day in the app's timezone, cycling through every eligible highlight before any repeats. There is none on a day with no eligible highlights.
_Avoid_: Quote of the day, featured highlight

### Progress

**Reading day**:
A calendar day, in the app's timezone, on which at least one finished session ended having advanced pages. A session belongs to the day it ended, never the day it started.
_Avoid_: Active day, streak day

**Current streak**:
Consecutive reading days ending today, or ending yesterday if today has no reading yet.
_Avoid_: Days streak

**Streak record**:
The longest run of consecutive reading days in the reader's whole history, derived from sessions as they exist now.
_Avoid_: Best streak, max streak

**Pace**:
Pages per day for one entry, averaged over the last 7 days; when that is zero, pages read so far divided by days since the start date. No pace when neither yields a positive number.
_Avoid_: Speed, rate

**Days left**:
The entry's remaining pages divided by its pace, rounded up. Undefined without a page count or a pace.
_Avoid_: ETA, finish estimate

**Reading span**:
The range of calendar days a single book's pages-per-day chart covers, from its start date to its finish date (or today, while reading).
_Avoid_: Chart window, reading period

### Goals

**Goal**:
A target number of books to finish within one goal period. At most one goal of each type (annual, monthly) per goal period. A goal has no name; its period is its label ("2026", "NOV 2026").
_Avoid_: Challenge, target (as the name of the whole thing)

**Goal period**:
One calendar year (annual) or one calendar month (monthly), in the app's timezone. Never arbitrary dates.
_Avoid_: Range, window, timeframe

**Current goal** / **Upcoming goal**:
A goal whose period contains today, or starts after today. Goals can only be created for these, and until they close only their target can change; they can also be deleted. Moving a goal means deleting it and creating another (backend ADR 0006).
_Avoid_: Active goal, open goal (open is reserved for sessions)

**Closed goal**:
A goal whose period has ended. Closed by the calendar alone, never stored. Locked: no target change, no delete.
_Avoid_: Finished goal, expired goal, archived goal

**Books finished** (toward a goal):
Entries with status `read` whose finish date falls within the goal period. Always derived from the reading list as it is now.
_Avoid_: Books read, completed books

**Achieved** / **Missed**:
A closed goal's outcome: achieved when books finished reached the target, otherwise missed. Derived, never frozen.
_Avoid_: Completed / failed

**Carried over** (shown as CARRIED OVER):
A book with reading days in a goal period, not finished there, and read again in a later period. Listed on the goal under ALSO READ, never counted. In the period where its reading ends it shows its outcome instead: FINISHED, or its status label (READING, ON HOLD, DID NOT FINISH).
_Avoid_: Unfinished (the `unfinished` status, shown as DID NOT FINISH, means the reader gave up)

**Goal history**:
The reader's closed goals, newest period first, annual and monthly together. Periods without a goal don't appear.
_Avoid_: Archive, log
