import { api, USER_ID } from './client';
import type { Goal, GoalDetail, GoalPeriodType } from '../types';

export function listGoals(): Promise<Goal[]> {
  return api.get<Goal[]>(`/reading_goals?user_id=${USER_ID}`);
}

export function getGoal(id: number): Promise<GoalDetail> {
  return api.get<GoalDetail>(`/reading_goals/${id}`);
}

export interface GoalInput {
  period_type: GoalPeriodType;
  /** First day of the goal period; the backend derives the end. */
  period_start: string;
  target_books: number;
}

export function createGoal(input: GoalInput): Promise<Goal> {
  return api.post<Goal>('/reading_goals', { goal: { user_id: USER_ID, ...input } });
}

/** Only the target can change; type and period are fixed once created. */
export function updateGoal(id: number, targetBooks: number): Promise<Goal> {
  return api.put<Goal>(`/reading_goals/${id}`, { goal: { target_books: targetBooks } });
}

export function deleteGoal(id: number): Promise<void> {
  return api.delete<void>(`/reading_goals/${id}`);
}
