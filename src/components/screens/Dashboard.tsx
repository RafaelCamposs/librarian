import { useEffect, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import {
  activity,
  bookById,
  dailyHighlight,
  entries,
  entryTitle,
  goTo,
  openFinishSessionModal,
  openSession,
  overviewStats,
  selectEntry,
  startingSession,
  startSession,
  streak,
} from '../../state/store';
import type { OpenSession, OverviewCurrentlyReading, ReadingListEntry } from '../../types';
import { goalLabel } from '../../lib/goals';
import { ACTIVITY_DAYS, denseDays, heatChars } from '../../lib/activity';
import { sparkChar } from '../../lib/sparkline';
import { dayMonth, formatDuration, formatMinutes, today } from '../../lib/format';
import { BlockBar } from '../BlockBar';
import { CoverImage } from '../CoverImage';

type Hero =
  | { kind: 'open'; session: OpenSession; item: OverviewCurrentlyReading | null }
  | { kind: 'resume'; item: OverviewCurrentlyReading }
  | { kind: 'start'; entry: ReadingListEntry }
  | { kind: 'empty' };

/** Most recent session first; entries without sessions last. */
function byLastSession(a: OverviewCurrentlyReading, b: OverviewCurrentlyReading): number {
  return (b.last_session_at ?? '').localeCompare(a.last_session_at ?? '');
}

/** The hero's state, checked in PRD order: open session → most recent in-progress entry → newest want_to entry → empty. */
function pickHero(reading: OverviewCurrentlyReading[], open: OpenSession | null, list: ReadingListEntry[]): Hero {
  if (open) return { kind: 'open', session: open, item: reading.find((r) => r.entry_id === open.entry_id) ?? null };
  if (reading.length > 0) return { kind: 'resume', item: reading[0] };
  const wantTo = list.filter((e) => e.status === 'want_to');
  if (wantTo.length > 0) return { kind: 'start', entry: wantTo.reduce((a, b) => (b.id > a.id ? b : a)) };
  return { kind: 'empty' };
}

function totalPagesFor(entryId: number): number | null {
  const entry = entries.value.find((e) => e.id === entryId);
  if (!entry) return null;
  return entry.total_pages ?? bookById.value.get(entry.book_id)?.total_pages ?? null;
}

export function Dashboard() {
  const stats = overviewStats.value;
  const goals = stats?.goals ?? [];
  const reading = [...(stats?.currently_reading ?? [])].sort(byLastSession);
  const open = openSession.value;
  const hero = pickHero(reading, open, entries.value);

  const heroEntryId = hero.kind === 'open' ? hero.session.entry_id : hero.kind === 'resume' ? hero.item.entry_id : null;
  const alsoReading = hero.kind === 'open' || hero.kind === 'resume' ? reading.filter((r) => r.entry_id !== heroEntryId) : [];

  return (
    <>
      <HeroCard hero={hero} />

      {alsoReading.length > 0 && (
        <>
          <div class="section-label">ALSO READING</div>
          <div class="covers-row">
            {alsoReading.map((item) => (
              <AlsoReadingCover key={item.entry_id} item={item} open={open} />
            ))}
          </div>
        </>
      )}

      <ActivityCard />

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

      <DailyHighlightBlock />
    </>
  );
}

function HeroCard({ hero }: { hero: Hero }) {
  if (hero.kind === 'empty') {
    return (
      <div class="empty-state hero-empty" onClick={() => goTo('add')}>
        nothing to read yet — <span style={{ color: 'var(--color-accent)' }}>ADD A BOOK</span>
      </div>
    );
  }

  const busy = startingSession.value;

  if (hero.kind === 'open') {
    const { session, item } = hero;
    return (
      <HeroLayout
        label="NOW READING"
        entryId={session.entry_id}
        bookId={item?.book_id ?? null}
        title={item?.title ?? entryTitle(session.entry_id)}
        percent={item?.percent_complete ?? null}
        info={
          <>
            FROM P.{session.start_page} · READING FOR <ElapsedSince iso={session.started_at} />
          </>
        }
        action={
          <div
            class="btn btn-primary"
            onClick={() => openFinishSessionModal(session.id, session.start_page, totalPagesFor(session.entry_id), session.entry_id)}
          >
            FINISH
          </div>
        }
      />
    );
  }

  if (hero.kind === 'resume') {
    const { item } = hero;
    return (
      <HeroLayout
        label="CONTINUE"
        entryId={item.entry_id}
        bookId={item.book_id}
        title={item.title}
        percent={item.percent_complete}
        info={item.days_left != null && item.pace != null ? `~${item.days_left} DAYS LEFT · ${item.pace < 1 ? item.pace.toFixed(1) : Math.round(item.pace)} PG/DAY` : null}
        action={
          <div
            class={busy ? 'btn btn-primary btn-busy' : 'btn btn-primary'}
            onClick={() => void startSession(item.entry_id, item.current_page ?? 0)}
          >
            RESUME
          </div>
        }
      />
    );
  }

  const { entry } = hero;
  const book = bookById.value.get(entry.book_id);
  return (
    <HeroLayout
      label="UP NEXT"
      entryId={entry.id}
      bookId={entry.book_id}
      title={book?.title ?? ''}
      percent={null}
      info={null}
      action={
        // A never-started entry has no current page — its first session begins at page 0.
        <div class={busy ? 'btn btn-primary btn-busy' : 'btn btn-primary'} onClick={() => void startSession(entry.id, 0)}>
          START
        </div>
      }
    />
  );
}

function HeroLayout(props: {
  label: string;
  entryId: number;
  bookId: number | null;
  title: string;
  percent: number | null;
  info: ComponentChildren;
  action: ComponentChildren;
}) {
  const book = props.bookId != null ? bookById.value.get(props.bookId) : undefined;
  const percent = props.percent != null ? Math.round(props.percent) : null;
  return (
    <>
      <div class="section-label">{props.label}</div>
      <div class="card hero-card">
        <div class="hero-book" onClick={() => selectEntry(props.entryId)}>
          <CoverImage coverUrl={book?.cover_url} width={64} height={92} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{props.title}</div>
            <div class="truncate" style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 10 }}>
              {book?.authors.join(', ') ?? ''}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <BlockBar percent={percent} width={16} fontSize={14} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-accent)', width: 34, textAlign: 'right' }}>
                {percent == null ? '—' : `${percent}%`}
              </div>
            </div>
          </div>
        </div>
        {props.info && <div class="hero-info">{props.info}</div>}
        {props.action}
      </div>
    </>
  );
}

/** Live "23m" / "10h04m" since an ISO timestamp — keeps counting however long the session has been open. */
function ElapsedSince({ iso }: { iso: string }) {
  const [now, setNow] = useState(() => new Date().toISOString());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date().toISOString()), 15000);
    return () => clearInterval(id);
  }, []);
  return <>{formatDuration(iso, now)}</>;
}

function AlsoReadingCover({ item, open }: { item: OverviewCurrentlyReading; open: OpenSession | null }) {
  const book = bookById.value.get(item.book_id);
  return (
    <div class="cover-tile">
      <div onClick={() => selectEntry(item.entry_id)} style={{ cursor: 'pointer' }}>
        <CoverImage coverUrl={book?.cover_url} width={72} height={104} />
        <div class="cover-tile-title truncate">{item.title}</div>
      </div>
      {open ? (
        <div class="finish-first-hint">finish {entryTitle(open.entry_id)} first</div>
      ) : (
        <div
          class={startingSession.value ? 'resume-chip btn-busy' : 'resume-chip'}
          onClick={() => void startSession(item.entry_id, item.current_page ?? 0)}
        >
          RESUME
        </div>
      )}
    </div>
  );
}

function ActivityCard() {
  const record = streak.value?.record ?? 0;
  const current = streak.value?.current ?? 0;
  const days = activity.value;
  const hasReadingDays = record > 0 || (days ?? []).some((d) => d.pages_read > 0);

  if (!hasReadingDays) {
    return (
      <>
        <div class="section-label">ACTIVITY</div>
        <div class="empty-state" style={{ marginBottom: 20 }}>
          no reading days yet — finish a session to start a streak
        </div>
      </>
    );
  }

  // "Today" is the device's calendar day, as everywhere else in the app (lib/format.ts).
  const daysWindow = days ? denseDays(days, today(), ACTIVITY_DAYS) : null;
  const week = daysWindow ? daysWindow.slice(-7) : [];
  const weekPages = week.reduce((sum, d) => sum + d.pages, 0);
  const weekMinutes = week.reduce((sum, d) => sum + d.minutes, 0);
  const weekDays = week.filter((d) => d.pages > 0).length;
  const weekMax = Math.max(1, ...week.map((d) => d.pages));
  const heat = daysWindow ? heatChars(daysWindow.map((d) => d.pages)) : [];

  return (
    <>
      <div class="section-label">ACTIVITY</div>
      <div class="card" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, marginBottom: daysWindow ? 14 : 0 }}>
          STREAK <span style={{ color: 'var(--color-accent)' }}>{daysLabel(current)}</span>
          <span style={{ color: 'var(--color-muted)' }}> · RECORD {record}</span>
        </div>

        {daysWindow && (
          <>
            <div class="section-label" style={{ marginBottom: 4 }}>LAST 7 DAYS</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              <span style={{ fontSize: 18, color: 'var(--color-accent)', fontWeight: 700 }}>{weekPages} PG</span>
              <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                {formatMinutes(weekMinutes)} · {weekDays}/7 DAYS
              </span>
            </div>
            <div class="week-chart">
              {week.map((d) => (
                <div class="chart-col" key={d.date}>
                  <div class="chart-pages">{d.pages > 0 ? d.pages : ''}</div>
                  <div class="chart-spark">{sparkChar(d.pages, weekMax)}</div>
                  <div class="chart-date">{dayMonth(d.date)}</div>
                </div>
              ))}
            </div>

            <div class="section-label" style={{ margin: '14px 0 6px' }}>12 WEEKS</div>
            {/* Column-major: each column is 7 consecutive days, oldest top-left, today bottom-right. */}
            <div class="heatmap" aria-hidden="true">
              {daysWindow.map((d, i) => (
                <span key={d.date} title={`${d.date}: ${d.pages} pg`}>
                  {heat[i]}
                </span>
              ))}
            </div>
            <div class="heatmap-range">
              <span>{dayMonth(daysWindow[0].date)}</span>
              <span>TODAY</span>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function daysLabel(n: number): string {
  return `${n} ${n === 1 ? 'DAY' : 'DAYS'}`;
}

/** The day's session highlight, as a book-like quotation; nothing at all when there isn't one. */
function DailyHighlightBlock() {
  const h = dailyHighlight.value;
  if (!h) return null;
  return (
    <div class="daily-highlight" onClick={() => selectEntry(h.entry_id)}>
      <div class="daily-highlight-quote">“{h.highlight}”</div>
      <div class="daily-highlight-title">— {h.book_title}</div>
    </div>
  );
}
