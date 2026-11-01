import { api, USER_ID } from './client';
import type { BookLookupResult, ReadingListEntry, ReadingSession, ReadingStatus } from '../types';

export function listEntries(): Promise<ReadingListEntry[]> {
  return api.get<ReadingListEntry[]>(`/reading_list_entries?user_id=${USER_ID}`);
}

export function createEntry(book: BookLookupResult, entry?: { status: ReadingStatus }): Promise<ReadingListEntry> {
  return api.post<ReadingListEntry>('/reading_list_entries', { user_id: USER_ID, book, entry });
}

export function updateEntry(
  id: number,
  patch: Partial<Pick<ReadingListEntry, 'status' | 'started_at' | 'finished_at'>>,
): Promise<ReadingListEntry> {
  return api.put<ReadingListEntry>(`/reading_list_entries/${id}`, { reading_list_entry: patch });
}

export function deleteEntry(id: number): Promise<void> {
  return api.delete<void>(`/reading_list_entries/${id}`);
}

export function updateEntryPages(id: number, totalPages: number): Promise<ReadingListEntry> {
  return api.patch<ReadingListEntry>(`/reading_list_entries/${id}/pages`, {
    reading_list_entry: { total_pages: totalPages },
  });
}

export function listSessions(entryId: number): Promise<ReadingSession[]> {
  return api.get<ReadingSession[]>(`/reading_list_entries/${entryId}/reading_sessions`);
}

export function startSession(entryId: number, startPage: number): Promise<ReadingSession> {
  return api.post<ReadingSession>(`/reading_list_entries/${entryId}/reading_sessions`, {
    session: { start_page: startPage, started_at: new Date().toISOString() },
  });
}

export function finishSession(sessionId: number, endPage: number): Promise<ReadingSession> {
  return api.patch<ReadingSession>(`/reading_sessions/${sessionId}/finish`, {
    session: { end_page: endPage, ended_at: new Date().toISOString() },
  });
}

export function updateSessionHighlight(sessionId: number, highlight: string | null): Promise<ReadingSession> {
  return api.patch<ReadingSession>(`/reading_sessions/${sessionId}/highlight`, {
    session: { highlight },
  });
}
