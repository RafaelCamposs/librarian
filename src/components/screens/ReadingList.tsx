import { bookById, entries, filterStatus, selectEntry, setFilter } from '../../state/store';
import type { ReadingStatus } from '../../types';
import { CoverImage } from '../CoverImage';
import { StatusBadge } from '../StatusBadge';

const CHIPS: { key: 'all' | ReadingStatus; label: string }[] = [
  { key: 'all', label: 'ALL' },
  { key: 'want_to', label: 'BACKLOG' },
  { key: 'reading', label: 'READING' },
  { key: 'read', label: 'READ' },
  { key: 'stopped', label: 'ON HOLD' },
  { key: 'unfinished', label: 'DID NOT FINISH' },
];

export function ReadingList() {
  const status = filterStatus.value;
  const filtered = entries.value.filter((e) => status === 'all' || e.status === status);

  return (
    <>
      <div class="divider-header">── READING LIST ───────────</div>
      <div class="filter-chips">
        {CHIPS.map((chip) => (
          <div
            key={chip.key}
            class={`filter-chip${chip.key === status ? ' active' : ''}`}
            onClick={() => setFilter(chip.key)}
          >
            {chip.label}
          </div>
        ))}
      </div>
      {filtered.length > 0 ? (
        filtered.map((entry) => {
          const book = bookById.value.get(entry.book_id);
          return (
            <div class="list-row" key={entry.id} onClick={() => selectEntry(entry.id)}>
              <CoverImage coverUrl={book?.cover_url} width={50} height={70} />
              <div class="list-row-text">
                <div class="truncate" style={{ fontSize: 13, fontWeight: 600 }}>{book?.title ?? ''}</div>
                <div class="truncate" style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                  {book?.authors.join(', ') ?? ''}
                </div>
              </div>
              <StatusBadge status={entry.status} />
            </div>
          );
        })
      ) : (
        <div class="empty-state" style={{ padding: 24 }}>no books match this filter</div>
      )}
    </>
  );
}
