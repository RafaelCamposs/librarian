export type ReadingStatus = 'want_to' | 'reading' | 'read' | 'stopped' | 'unfinished';

export interface Book {
  id: number;
  external_id: string;
  external_source: string;
  title: string;
  authors: string[];
  isbn: string;
  cover_url: string | null;
  total_pages: number | null;
  published_year: number | null;
}

export interface ReadingListEntry {
  id: number;
  user_id: number;
  book_id: number;
  status: ReadingStatus;
  started_at: string | null;
  finished_at: string | null;
  /** Per-entry override of the book's page count (this edition/printing may differ from the API's lookup). */
  total_pages?: number | null;
}

export interface ReadingSession {
  id: number;
  reading_list_entry_id: number;
  start_page: number;
  end_page: number | null;
  started_at: string;
  ended_at: string | null;
  highlight: string | null;
}

export const HIGHLIGHT_MAX_LENGTH = 500;

export type GoalPeriodType = 'annual' | 'monthly';

export interface Goal {
  id: number;
  user_id: number;
  period_type: GoalPeriodType;
  period_start: string;
  period_end: string;
  target_books: number;
  /** Client-only, merged in from localStorage — not persisted server-side (see state/goalNames.ts). */
  name?: string | null;
}

export interface PagesPerDayPoint {
  date: string;
  pages_read: number;
}

export interface EntryStats {
  percent_complete: number | null;
  days_elapsed: number | null;
  /** Days the chart covers, in the app's timezone; null when the entry has no start date. */
  reading_span: ReadingSpan | null;
  /** Only days with reading, within the reading span. */
  pages_per_day: PagesPerDayPoint[];
}

export interface ReadingSpan {
  start_date: string;
  end_date: string;
}

export interface OverviewCurrentlyReading {
  entry_id: number;
  book_id: number;
  title: string;
  percent_complete: number | null;
  /** Latest session's started_at; null when the entry has no sessions. */
  last_session_at: string | null;
  /** End page of the latest session, or its start page while it is open; null when the entry has no sessions. */
  current_page: number | null;
  /** Pages per day (see CONTEXT.md); null when there is no positive pace. */
  pace: number | null;
  /** Remaining pages / pace, rounded up; null without a page count or a pace. */
  days_left: number | null;
}

/** The reader's single open session across all entries (fun_library ADR 0004). */
export interface OpenSession {
  id: number;
  entry_id: number;
  start_page: number;
  started_at: string;
}

export interface OverviewGoal {
  goal_id: number;
  period_type: GoalPeriodType;
  period_start: string;
  period_end: string;
  target_books: number;
  books_finished: number;
  /** Client-only, merged in from localStorage — not persisted server-side. */
  name?: string | null;
}

export interface OverviewStats {
  currently_reading: OverviewCurrentlyReading[];
  goals: OverviewGoal[];
  open_session: OpenSession | null;
}

/** One reading day (sparse — days without reading are omitted). */
export interface ActivityDay {
  date: string;
  pages_read: number;
  minutes: number;
}

export interface DailyHighlight {
  session_id: number;
  entry_id: number;
  book_id: number;
  book_title: string;
  highlight: string;
}

export interface Streak {
  current: number;
  record: number;
}

export interface BookLookupResult {
  external_id: string;
  external_source: string;
  title: string;
  authors: string[];
  isbn: string;
  cover_url: string | null;
  total_pages: number | null;
  published_year: number | null;
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}
