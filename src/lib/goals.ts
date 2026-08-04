import type { Goal } from '../types';

export function goalLabel(g: Pick<Goal, 'name' | 'period_type' | 'period_start'>): string {
  if (g.name) return g.name.toUpperCase();
  return g.period_type === 'annual' ? `ANNUAL ${g.period_start.slice(0, 4)}` : `MONTHLY ${g.period_start.slice(0, 7)}`;
}
