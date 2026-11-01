import { api, USER_ID } from './client';
import type { EntryStats, OverviewStats, Streak } from '../types';

export function getOverviewStats(): Promise<OverviewStats> {
  return api.get<OverviewStats>(`/stats?user_id=${USER_ID}`);
}

export function getEntryStats(entryId: number): Promise<EntryStats> {
  return api.get<EntryStats>(`/reading_list_entries/${entryId}/stats`);
}

export function getStreak(): Promise<Streak> {
  return api.get<Streak>(`/stats/${USER_ID}/streak`);
}
