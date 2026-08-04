import type { ReadingSession } from '../types';

export interface EntryView {
  sessions: ReadingSession[];
  openSession: ReadingSession | null;
  currentPage: number;
}

export function buildEntryView(sessions: ReadingSession[]): EntryView {
  const sorted = [...sessions].sort((a, b) => a.started_at.localeCompare(b.started_at));
  const open = sorted.find((s) => !s.ended_at) ?? null;
  const lastClosed = [...sorted].reverse().find((s) => s.end_page != null) ?? null;
  const currentPage = open ? open.start_page : lastClosed ? (lastClosed.end_page as number) : 0;
  return { sessions: sorted, openSession: open, currentPage };
}
