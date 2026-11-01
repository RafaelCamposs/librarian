import type { ActivityDay } from '../types';
import { addDays } from './format';

export const ACTIVITY_DAYS = 84;
const HEAT = ['░', '▒', '▓', '█'];

export interface ActivityColumn {
  date: string;
  pages: number;
  minutes: number;
}

/** One entry per calendar day of the `days`-long window ending on `end`, oldest first, zero-filled. */
export function denseDays(activity: ActivityDay[], end: string, days: number): ActivityColumn[] {
  const byDate = new Map(activity.map((a) => [a.date, a]));
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(end, i - days + 1);
    const day = byDate.get(date);
    return { date, pages: day?.pages_read ?? 0, minutes: day?.minutes ?? 0 };
  });
}

/**
 * Heatmap character for each day: blank for no reading, then ░▒▓█ by the day's
 * quartile among the window's non-zero days (provisional default, see the PRD).
 */
export function heatChars(pages: number[]): string[] {
  const nonZero = pages.filter((p) => p > 0).sort((a, b) => a - b);
  return pages.map((p) => {
    if (p <= 0) return ' ';
    // share of reading days at or below this one → 1..4
    let atOrBelow = 0;
    while (atOrBelow < nonZero.length && nonZero[atOrBelow] <= p) atOrBelow++;
    const level = Math.min(4, Math.max(1, Math.ceil((atOrBelow / nonZero.length) * 4)));
    return HEAT[level - 1];
  });
}
