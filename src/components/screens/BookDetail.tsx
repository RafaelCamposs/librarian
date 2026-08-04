import {
  backToList,
  bookById,
  deleteEntry,
  detailSessions,
  entryStats,
  openConfirm,
  openFinishSessionModal,
  selectedEntry,
  startSession,
  changeStatus,
} from '../../state/store';
import type { ReadingStatus } from '../../types';
import { buildEntryView } from '../../lib/entryView';
import { bar } from '../../lib/bar';
import { sparkChar } from '../../lib/sparkline';
import { addDays, today, weekday } from '../../lib/format';
import { STATUS_COLOR, STATUS_LABEL } from '../../lib/status';
import { CoverImage } from '../CoverImage';

const STATUS_OPTIONS: ReadingStatus[] = ['want_to', 'stopped', 'unfinished'];

export function BookDetail() {
  const entry = selectedEntry.value;
  if (!entry) return null;
  const book = bookById.value.get(entry.book_id);

  const view = buildEntryView(detailSessions.value);
  const stats = entryStats.value[entry.id];
  const percent = stats?.percent_complete != null ? Math.round(stats.percent_complete) : null;
  const daysElapsed = stats?.days_elapsed ?? null;
  const pbar = bar(percent, 24);

  const perDay = new Map((stats?.pages_per_day ?? []).map((p) => [p.date, p.pages_read]));
  const chart = [];
  for (let i = 6; i >= 0; i--) {
    const date = addDays(today(), -i);
    const pages = perDay.get(date) ?? 0;
    chart.push({ date, label: weekday(date), pages });
  }
  const maxPages = Math.max(1, ...chart.map((c) => c.pages));

  const sessionRows = [...view.sessions].reverse();

  return (
    <>
      <div class="back-link" onClick={backToList}>
        ‹ BACK TO LIST
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <CoverImage coverUrl={book?.cover_url} width={64} height={92} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{book?.title}</div>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 4 }}>
            {book?.authors.join(', ')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-faint)' }}>
            {book?.total_pages ?? '—'} pages · {book?.published_year ?? '—'} · ISBN {book?.isbn}
          </div>
        </div>
      </div>

      <div class="card status-row" style={{ marginBottom: 14 }}>
        <div class="badge" style={{ color: STATUS_COLOR[entry.status], padding: '4px 8px' }}>
          {STATUS_LABEL[entry.status]}
        </div>
        {entry.status !== 'read' && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {STATUS_OPTIONS.filter((s) => s !== entry.status).map((s) => (
              <div
                key={s}
                class="status-chip"
                onClick={() =>
                  openConfirm(`Change status to "${STATUS_LABEL[s]}"?`, () => void changeStatus(entry.id, s))
                }
              >
                {STATUS_LABEL[s]}
              </div>
            ))}
          </div>
        )}
      </div>

      {book?.total_pages != null && (
        <>
          <div class="section-label">PROGRESS — {percent != null ? `${percent}%` : '—'}</div>
          <div class="block-bar" style={{ fontSize: 18, marginBottom: 6 }}>
            <span class="filled">{pbar.filled}</span>
            <span class="empty">{pbar.empty}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-faint)', marginBottom: 18 }}>
            {daysElapsed != null ? `${daysElapsed} days since start` : 'not started'}
          </div>

          <div class="section-label">PAGES / DAY (LAST 7 DAYS)</div>
          <div class="card chart-card" style={{ marginBottom: 18 }}>
            {chart.map((d) => (
              <div class="chart-col" key={d.date}>
                <div class="chart-pages">{d.pages > 0 ? d.pages : ''}</div>
                <div class="chart-spark">{sparkChar(d.pages, maxPages)}</div>
                <div class="chart-weekday">{d.label}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div class="section-label" style={{ marginBottom: 0 }}>SESSIONS</div>
        {!view.openSession && entry.status !== 'read' && (
          <div class="start-session-btn" onClick={() => void startSession(entry.id, view.currentPage)}>
            START SESSION
          </div>
        )}
      </div>
      {sessionRows.map((s) => (
        <div class="card session-row" key={s.id}>
          <div>
            <div class="session-range">
              p.{s.start_page} → {s.end_page != null ? s.end_page : '…'}
            </div>
            <div class="session-dates">
              {s.started_at.replace('T', ' ').slice(0, 16)}
              {s.ended_at ? ` → ${s.ended_at.replace('T', ' ').slice(11, 16)}` : ' (in progress)'}
            </div>
          </div>
          {!s.ended_at && (
            <div
              class="finish-btn"
              onClick={() => openFinishSessionModal(s.id, view.currentPage, book?.total_pages ?? null)}
            >
              FINISH
            </div>
          )}
        </div>
      ))}

      {!entry.started_at && (
        <div
          class="remove-btn"
          onClick={() =>
            openConfirm(`Remove "${book?.title}" from your reading list?`, () => void deleteEntry(entry.id), 'DELETE')
          }
        >
          REMOVE FROM READING LIST
        </div>
      )}
    </>
  );
}
