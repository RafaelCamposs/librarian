import type { ReadingStatus } from '../types';
import { today } from './format';

export const STATUS_LABEL: Record<ReadingStatus, string> = {
  want_to: 'BACKLOG',
  reading: 'READING',
  read: 'READ',
  stopped: 'ON HOLD',
  unfinished: 'DID NOT FINISH',
};

export const STATUS_COLOR: Record<ReadingStatus, string> = {
  want_to: '#8a7660',
  reading: '#b5651d',
  read: '#4f7461',
  stopped: '#a8453a',
  unfinished: '#c9a24a',
};

export interface StatusPatch {
  status: ReadingStatus;
  started_at: string | null;
  finished_at: string | null;
}

/**
 * Mirrors the prototype's changeStatus business rule (README §66):
 * moving to `reading` sets started_at if unset; moving to `read` sets finished_at;
 * moving away from `read` clears it; moving to `want_to` clears started_at.
 */
export function nextStatusPatch(
  newStatus: ReadingStatus,
  current: { started_at: string | null; finished_at: string | null },
): StatusPatch {
  return {
    status: newStatus,
    started_at: newStatus === 'reading' && !current.started_at ? today() : newStatus === 'want_to' ? null : current.started_at,
    finished_at: newStatus === 'read' ? current.finished_at || today() : null,
  };
}
