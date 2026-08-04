import type { ReadingStatus } from '../types';
import { STATUS_COLOR, STATUS_LABEL } from '../lib/status';

export function StatusBadge({ status }: { status: ReadingStatus }) {
  return (
    <div class="badge" style={{ color: STATUS_COLOR[status] }}>
      {STATUS_LABEL[status]}
    </div>
  );
}
