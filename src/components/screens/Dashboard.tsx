import { bookById, overviewStats, selectEntry } from '../../state/store';
import { goalLabel } from '../../lib/goals';
import { BlockBar } from '../BlockBar';
import { CoverImage } from '../CoverImage';

export function Dashboard() {
  const stats = overviewStats.value;
  const goals = stats?.goals ?? [];
  const currentlyReading = stats?.currently_reading ?? [];

  return (
    <>
      <div class="section-label">GOALS</div>
      {goals.length > 0 ? (
        goals.map((g) => {
          const pct = g.target_books ? Math.min(100, Math.round((g.books_finished / g.target_books) * 100)) : 0;
          return (
            <div class="card" style={{ marginBottom: 10 }} key={g.goal_id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
                <span>{goalLabel(g)}</span>
                <span style={{ color: 'var(--color-muted)' }}>
                  {g.books_finished} / {g.target_books}
                </span>
              </div>
              <BlockBar percent={pct} width={20} fontSize={16} />
            </div>
          );
        })
      ) : (
        <div class="empty-state" style={{ marginBottom: 16 }}>no goals set — add one in GOALS</div>
      )}

      <div class="section-label" style={{ margin: '20px 0 8px' }}>CURRENTLY READING</div>
      {currentlyReading.length > 0 ? (
        currentlyReading.map((item) => {
          const book = bookById.value.get(item.book_id);
          const percent = item.percent_complete != null ? Math.round(item.percent_complete) : null;
          return (
            <div
              class="card"
              style={{ marginBottom: 10, cursor: 'pointer', display: 'flex', gap: 10 }}
              key={item.entry_id}
              onClick={() => selectEntry(item.entry_id)}
            >
              <CoverImage coverUrl={book?.cover_url} width={56} height={80} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{item.title}</div>
                <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 8 }}>
                  {book?.authors.join(', ') ?? ''}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <BlockBar percent={percent} width={16} fontSize={14} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-accent)', width: 34, textAlign: 'right' }}>
                    {percent == null ? '—' : `${percent}%`}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div class="empty-state">nothing in progress — start a session from a book</div>
      )}
    </>
  );
}
