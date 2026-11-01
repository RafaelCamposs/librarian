import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import {
  backToList,
  bookById,
  deleteEntry,
  detailSessions,
  entryStats,
  entryTitle,
  openSession,
  openConfirm,
  openFinishSessionModal,
  openHighlightModal,
  selectedEntry,
  startingSession,
  startSession,
  changeStatus,
  updateEntryPages,
} from '../../state/store';
import type { EntryStats, ReadingStatus } from '../../types';
import { buildEntryView } from '../../lib/entryView';
import { bar } from '../../lib/bar';
import { sparkChar } from '../../lib/sparkline';
import { addDays, dayMonth, formatDateTime, formatDuration, formatTime } from '../../lib/format';
import { STATUS_COLOR, STATUS_LABEL } from '../../lib/status';
import { CoverImage } from '../CoverImage';

const STATUS_OPTIONS: ReadingStatus[] = ['read', 'stopped', 'unfinished'];
const CHART_DAYS = 7;

type ChartColumn = { date: string; pages: number } | { date: null; key: string };

/**
 * One column per day of the reading span, padded with blank placeholders
 * before the start date so there are always at least 7 columns
 * (see fun_library ADR 0003).
 */
function buildChart(stats: EntryStats | undefined): ChartColumn[] {
  const span = stats?.reading_span;
  if (!span) return [];
  const perDay = new Map(stats.pages_per_day.map((p) => [p.date, p.pages_read]));
  const days: ChartColumn[] = [];
  for (let date = span.start_date; date <= span.end_date; date = addDays(date, 1)) {
    days.push({ date, pages: perDay.get(date) ?? 0 });
  }
  const placeholders = Array.from({ length: Math.max(0, CHART_DAYS - days.length) }, (_, i) => ({
    date: null,
    key: `pad-${i}`,
  }));
  return [...placeholders, ...days];
}

export function BookDetail() {
  const entry = selectedEntry.value;
  const [editingPages, setEditingPages] = useState(false);
  const [pagesInput, setPagesInput] = useState('');
  const chartRef = useRef<HTMLDivElement>(null);
  const stats = entry ? entryStats.value[entry.id] : undefined;
  const span = stats?.reading_span;

  // Open the chart on the last 7 days of the span; older days are a scroll to the left.
  useLayoutEffect(() => {
    const el = chartRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [entry?.id, span?.start_date, span?.end_date]);

  if (!entry) return null;
  const book = bookById.value.get(entry.book_id);
  const totalPages = entry.total_pages ?? book?.total_pages ?? null;

  const entryId = entry.id;
  function savePages() {
    setEditingPages(false);
    const value = parseInt(pagesInput, 10);
    if (!Number.isNaN(value) && value > 0 && value !== totalPages) {
      void updateEntryPages(entryId, value);
    }
  }

  const view = buildEntryView(detailSessions.value);
  const percent = entry.status === 'read' ? 100 : stats?.percent_complete != null ? Math.round(stats.percent_complete) : null;
  const daysElapsed = stats?.days_elapsed ?? null;
  const pbar = bar(percent, 24);

  const chart = buildChart(stats);
  const maxPages = Math.max(1, ...chart.map((c) => (c.date !== null ? c.pages : 0)));

  const sessionRows = [...view.sessions].reverse();
  // The reader's one open session lives on another entry — starting here would be refused (409).
  const openElsewhere = openSession.value && openSession.value.entry_id !== entry.id ? openSession.value : null;

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
            {editingPages ? (
              <input
                class="text-input"
                type="number"
                autofocus
                value={pagesInput}
                onInput={(e) => setPagesInput((e.target as HTMLInputElement).value)}
                onBlur={savePages}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                  if (e.key === 'Escape') setEditingPages(false);
                }}
                style={{ width: 60, height: 22, padding: '2px 4px', display: 'inline-block' }}
              />
            ) : (
              <span
                onClick={() => {
                  setPagesInput(totalPages != null ? String(totalPages) : '');
                  setEditingPages(true);
                }}
              >
                {totalPages ?? '—'} pages
              </span>
            )}
            {' · '}
            {book?.published_year ?? '—'} · ISBN {book?.isbn}
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

      {totalPages != null && (
        <>
          <div class="section-label">PROGRESS — {percent != null ? `${percent}%` : '—'}</div>
          <div class="block-bar" style={{ fontSize: 18, marginBottom: 6, textAlign: 'center' }}>
            <span class="filled">{pbar.filled}</span>
            <span class="empty">{pbar.empty}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-faint)', marginBottom: 18 }}>
            {daysElapsed != null ? `${daysElapsed} days since start` : 'not started'}
          </div>

          {chart.length > 0 && (
            <>
              <div class="section-label">PAGES / DAY</div>
              <div class="card chart-card" ref={chartRef} style={{ marginBottom: 18 }}>
                {chart.map((d) =>
                  d.date !== null ? (
                    <div class="chart-col" key={d.date}>
                      <div class="chart-pages">{d.pages > 0 ? d.pages : ''}</div>
                      <div class="chart-spark">{sparkChar(d.pages, maxPages)}</div>
                      <div class="chart-date">{dayMonth(d.date)}</div>
                    </div>
                  ) : (
                    <div class="chart-col" key={d.key} />
                  ),
                )}
              </div>
            </>
          )}
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div class="section-label" style={{ marginBottom: 0 }}>SESSIONS</div>
        {!view.openSession && entry.status !== 'read' &&
          (openElsewhere ? (
            <div class="finish-first-hint inline">finish {entryTitle(openElsewhere.entry_id)} first</div>
          ) : (
            <div
              class={startingSession.value ? 'start-session-btn btn-busy' : 'start-session-btn'}
              onClick={() => void startSession(entry.id, view.currentPage)}
            >
              START SESSION
            </div>
          ))}
      </div>
      {sessionRows.map((s) => (
        <div class="card session-row" key={s.id}>
          <div>
            <div class="session-range">
              p.{s.start_page} → {s.end_page != null ? s.end_page : '…'}
            </div>
            <div class="session-dates">
              {formatDateTime(s.started_at)}
              {s.ended_at
                ? ` → ${formatTime(s.ended_at)} (${formatDuration(s.started_at, s.ended_at)})`
                : ' (in progress)'}
            </div>
          </div>
          {!s.ended_at && (
            <div
              class="finish-btn"
              onClick={() => openFinishSessionModal(s.id, view.currentPage, totalPages)}
            >
              FINISH
            </div>
          )}
          {s.ended_at && (
            <div
              class={s.highlight ? 'highlight-chip' : 'highlight-chip empty'}
              onClick={() => openHighlightModal(s.id, s.highlight)}
            >
              {s.highlight ? '❝' : '+'}
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
