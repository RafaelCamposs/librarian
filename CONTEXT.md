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
