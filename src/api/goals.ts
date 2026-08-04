import { api, USER_ID } from './client';
import type { Goal, GoalPeriodType } from '../types';

export function listGoals(): Promise<Goal[]> {
  return api.get<Goal[]>(`/reading_goals?user_id=${USER_ID}`);
}

export interface GoalInput {
  period_type: GoalPeriodType;
  period_start: string;
  period_end: string;
  target_books: number;
}

export function createGoal(input: GoalInput): Promise<Goal> {
  return api.post<Goal>('/reading_goals', { goal: { user_id: USER_ID, ...input } });
}

export function updateGoal(id: number, input: GoalInput): Promise<Goal> {
  return api.put<Goal>(`/reading_goals/${id}`, { goal: input });
}

export function deleteGoal(id: number): Promise<void> {
  return api.delete<void>(`/reading_goals/${id}`);
}
