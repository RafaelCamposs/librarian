import { api, USER_ID } from './client';
import type { ActivityDay, DailyHighlight, EntryStats, OverviewStats, Streak } from '../types';

export function getOverviewStats(): Promise<OverviewStats> {
  return api.get<OverviewStats>(`/stats?user_id=${USER_ID}`);
}

export function getEntryStats(entryId: number): Promise<EntryStats> {
  return api.get<EntryStats>(`/reading_list_entries/${entryId}/stats`);
}

export function getStreak(): Promise<Streak> {
  return api.get<Streak>(`/stats/${USER_ID}/streak`);
}

export function getActivity(days = 84): Promise<ActivityDay[]> {
  return api.get<ActivityDay[]>(`/stats/${USER_ID}/activity?days=${days}`);
}

export function getDailyHighlight(): Promise<DailyHighlight | null> {
  return api.get<DailyHighlight | null>(`/stats/${USER_ID}/daily_highlight`);
}
