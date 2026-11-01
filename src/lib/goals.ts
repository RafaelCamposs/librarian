import type { Goal, GoalAlsoReadLabel, GoalPeriodType } from '../types';
import { STATUS_COLOR, STATUS_LABEL } from './status';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/** How many periods the new-goal picker offers, counting the current one. */
const PICKER_PERIODS: Record<GoalPeriodType, number> = { annual: 2, monthly: 12 };

/** A goal's label is its period: "2026" or "NOV 2026". */
export function goalLabel(g: Pick<Goal, 'period_type' | 'period_start'>): string {
  const year = g.period_start.slice(0, 4);
  if (g.period_type === 'annual') return year;
  const month = parseInt(g.period_start.slice(5, 7), 10);
  return `${MONTHS[month - 1] ?? '???'} ${year}`;
}

export function goalTypeLabel(type: GoalPeriodType): string {
  return type === 'annual' ? 'ANNUAL' : 'MONTHLY';
}

/** ACHIEVED / MISSED for a closed goal, otherwise CURRENT / UPCOMING. */
export function goalStateLabel(g: Pick<Goal, 'state' | 'outcome'>): string {
  if (g.state === 'closed') return g.outcome === 'achieved' ? 'ACHIEVED' : 'MISSED';
  return g.state === 'current' ? 'CURRENT' : 'UPCOMING';
}

export function goalStateColor(g: Pick<Goal, 'state' | 'outcome'>): string {
  if (g.state === 'closed') return g.outcome === 'achieved' ? 'var(--color-status-read)' : 'var(--color-muted)';
  return g.state === 'current' ? 'var(--color-accent)' : 'var(--color-muted)';
}

export const ALSO_READ_LABEL: Record<GoalAlsoReadLabel, string> = {
  carried_over: 'CARRIED OVER',
  ...STATUS_LABEL,
};

export const ALSO_READ_COLOR: Record<GoalAlsoReadLabel, string> = {
  carried_over: 'var(--color-muted)',
  ...STATUS_COLOR,
};

/**
 * Newest period first. A year sorts at its last day, so 2026 lists before DEC 2026
 * (same period_end; annual wins the tie).
 */
export function compareGoalsNewestFirst(a: Goal, b: Goal): number {
  if (a.period_end !== b.period_end) return a.period_end < b.period_end ? 1 : -1;
  if (a.period_type !== b.period_type) return a.period_type === 'annual' ? -1 : 1;
  return 0;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Period starts a new goal of this type can be created for: the current period and the
 * next few, minus those that already have a goal of this type. `todayStr` is YYYY-MM-DD.
 */
export function freeGoalPeriods(type: GoalPeriodType, existing: Goal[], todayStr: string): string[] {
  const taken = new Set(existing.filter((g) => g.period_type === type).map((g) => g.period_start));
  const year = parseInt(todayStr.slice(0, 4), 10);
  const month = parseInt(todayStr.slice(5, 7), 10) - 1;
  const starts: string[] = [];
  for (let i = 0; i < PICKER_PERIODS[type]; i++) {
    if (type === 'annual') {
      starts.push(`${year + i}-01-01`);
    } else {
      const m = month + i;
      starts.push(`${year + Math.floor(m / 12)}-${pad((m % 12) + 1)}-01`);
    }
  }
  return starts.filter((s) => !taken.has(s));
}
