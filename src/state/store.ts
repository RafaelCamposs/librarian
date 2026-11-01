import { signal, computed } from '@preact/signals';
import type { EntryStats, Goal, OverviewStats, ReadingListEntry, ReadingSession, ReadingStatus, Streak, Book } from '../types';
import * as entriesApi from '../api/entries';
import * as goalsApi from '../api/goals';
import * as statsApi from '../api/stats';
import * as booksApi from '../api/books';
import { getGoalName, setGoalName, removeGoalName } from './goalNames';
import { nextStatusPatch } from '../lib/status';
import { ApiError } from '../types';

export type Screen = 'dashboard' | 'list' | 'add' | 'goals' | 'detail';

export type ModalState =
  | { type: 'finish'; sessionId: number; endPage: string; maxPage: number | null; highlight: string }
  | { type: 'highlight'; sessionId: number; highlight: string }
  | {
      type: 'goalForm';
      editingId: number | null;
      name: string;
      periodType: 'annual' | 'monthly';
      periodStart: string;
      periodEnd: string;
      targetBooks: string;
    }
  | { type: 'confirm'; message: string; confirmLabel: string; onConfirm: () => void }
  | null;

export const screen = signal<Screen>('dashboard');
export const selectedEntryId = signal<number | null>(null);
export const filterStatus = signal<'all' | ReadingStatus>('all');

export const entries = signal<ReadingListEntry[]>([]);
export const books = signal<Book[]>([]);
export const goals = signal<Goal[]>([]);
export const entriesLoading = signal(false);
export const goalsLoading = signal(false);
export const lastFetchFailed = signal(false);

export const bookById = computed(() => new Map(books.value.map((b) => [b.id, b])));

export const detailSessions = signal<ReadingSession[]>([]);
export const entryStats = signal<Record<number, EntryStats>>({});

export const overviewStats = signal<OverviewStats | null>(null);
export const overviewLoading = signal(false);
export const streak = signal<Streak | null>(null);

export const modal = signal<ModalState>(null);
export const toast = signal<string | null>(null);

export const isbnInput = signal('');
export const lookupLoading = signal(false);
export const lookupError = signal<string | null>(null);
export const lookupResult = signal<import('../types').BookLookupResult | null>(null);

export const manualEntryOpen = signal(false);
export const manualTitle = signal('');
export const manualAuthors = signal('');
export const manualTotalPages = signal('');
export const manualPublishedYear = signal('');

let toastTimer: ReturnType<typeof setTimeout> | undefined;
export function showToast(message: string): void {
  toast.value = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.value = null;
  }, 2200);
}

function withGoalNames(list: Goal[]): Goal[] {
  return list.map((g) => ({ ...g, name: getGoalName(g.id) ?? g.name ?? '' }));
}

export async function loadEntries(): Promise<void> {
  entriesLoading.value = true;
  try {
    const [entryList, bookList] = await Promise.all([entriesApi.listEntries(), booksApi.listBooks()]);
    entries.value = entryList;
    books.value = bookList;
    lastFetchFailed.value = false;
  } catch {
    lastFetchFailed.value = true;
  } finally {
    entriesLoading.value = false;
  }
}

export async function loadGoals(): Promise<void> {
  goalsLoading.value = true;
  try {
    goals.value = withGoalNames(await goalsApi.listGoals());
    lastFetchFailed.value = false;
  } catch {
    lastFetchFailed.value = true;
  } finally {
    goalsLoading.value = false;
  }
}

export async function loadOverviewStats(): Promise<void> {
  overviewLoading.value = true;
  try {
    const stats = await statsApi.getOverviewStats();
    overviewStats.value = {
      ...stats,
      goals: stats.goals.map((g) => ({ ...g, name: getGoalName(g.goal_id) ?? g.name ?? '' })),
    };
    if (books.value.length === 0) books.value = await booksApi.listBooks();
    lastFetchFailed.value = false;
  } catch {
    lastFetchFailed.value = true;
  } finally {
    overviewLoading.value = false;
  }
  void loadStreak();
}

export async function loadStreak(): Promise<void> {
  try {
    streak.value = await statsApi.getStreak();
  } catch {
    // leave stale/absent streak — Dashboard just hides the stat
  }
}

export async function loadEntryStats(entryId: number): Promise<void> {
  try {
    const stats = await statsApi.getEntryStats(entryId);
    entryStats.value = { ...entryStats.value, [entryId]: stats };
  } catch {
    // leave stale/absent stats — screen renders "—" placeholders
  }
}

export async function loadDetailSessions(entryId: number): Promise<void> {
  try {
    detailSessions.value = await entriesApi.listSessions(entryId);
  } catch {
    detailSessions.value = [];
  }
}

export function goTo(next: Screen): void {
  screen.value = next;
  modal.value = null;
  if (next === 'dashboard') void loadOverviewStats();
  else if (next === 'list') void loadEntries();
  else if (next === 'goals') void loadGoals();
}

export function selectEntry(id: number): void {
  screen.value = 'detail';
  selectedEntryId.value = id;
  void loadEntryStats(id);
  void loadDetailSessions(id);
}

export function backToList(): void {
  screen.value = 'list';
  selectedEntryId.value = null;
  detailSessions.value = [];
}

export function setFilter(status: 'all' | ReadingStatus): void {
  filterStatus.value = status;
}

export const selectedEntry = computed(() => entries.value.find((e) => e.id === selectedEntryId.value) ?? null);

export function onIsbnChange(value: string): void {
  isbnInput.value = value;
}

export async function doLookup(): Promise<void> {
  const isbn = isbnInput.value.trim();
  if (!isbn) {
    lookupError.value = 'ENTER AN ISBN';
    lookupResult.value = null;
    return;
  }
  lookupLoading.value = true;
  lookupError.value = null;
  lookupResult.value = null;
  try {
    const result = await booksApi.lookupBook(isbn);
    lookupResult.value = result;
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 422) lookupError.value = 'INVALID ISBN FORMAT (422)';
      else if (err.status === 404) lookupError.value = 'NO MATCH FOUND FOR THIS ISBN (404)';
      else if (err.status === 502) lookupError.value = 'UPSTREAM SOURCE UNAVAILABLE (502)';
      else lookupError.value = err.message;
    } else {
      lookupError.value = 'LOOKUP FAILED';
    }
  } finally {
    lookupLoading.value = false;
  }
}

export function cancelLookup(): void {
  lookupResult.value = null;
  lookupError.value = null;
}

export async function confirmAdd(): Promise<void> {
  const result = lookupResult.value;
  if (!result) return;
  try {
    await entriesApi.createEntry(result);
    lookupResult.value = null;
    isbnInput.value = '';
    closeManualEntry();
    filterStatus.value = 'all';
    screen.value = 'list';
    showToast('ADDED TO READING LIST');
    void loadEntries();
    void loadOverviewStats();
  } catch (err) {
    lookupError.value = err instanceof ApiError ? err.message : 'COULD NOT ADD BOOK';
  }
}

/** Shown once a lookup fails (404/502/etc) — lets the user enter bibliographic data by hand instead of being blocked. */
export function openManualEntry(): void {
  manualEntryOpen.value = true;
  lookupError.value = null;
  manualTitle.value = '';
  manualAuthors.value = '';
  manualTotalPages.value = '';
  manualPublishedYear.value = '';
}

export function closeManualEntry(): void {
  manualEntryOpen.value = false;
  manualTitle.value = '';
  manualAuthors.value = '';
  manualTotalPages.value = '';
  manualPublishedYear.value = '';
}

export async function submitManualEntry(): Promise<void> {
  const isbn = isbnInput.value.trim();
  const title = manualTitle.value.trim();
  if (!title) {
    showToast('TITLE IS REQUIRED');
    return;
  }
  const totalPages = manualTotalPages.value.trim() ? parseInt(manualTotalPages.value, 10) : null;
  const publishedYear = manualPublishedYear.value.trim() ? parseInt(manualPublishedYear.value, 10) : null;
  lookupResult.value = {
    external_id: `manual-${isbn || Date.now()}`,
    external_source: 'manual',
    title,
    authors: manualAuthors.value
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean),
    isbn,
    cover_url: null,
    total_pages: totalPages != null && !Number.isNaN(totalPages) ? totalPages : null,
    published_year: publishedYear != null && !Number.isNaN(publishedYear) ? publishedYear : null,
  };
  await confirmAdd();
}

export async function changeStatus(entryId: number, newStatus: ReadingStatus): Promise<void> {
  const entry = entries.value.find((e) => e.id === entryId);
  if (!entry) return;
  const patch = nextStatusPatch(newStatus, entry);
  entries.value = entries.value.map((e) => (e.id === entryId ? { ...e, ...patch } : e));
  try {
    const updated = await entriesApi.updateEntry(entryId, patch);
    entries.value = entries.value.map((e) => (e.id === entryId ? updated : e));
    modal.value = null;
    showToast(newStatus === 'read' ? 'BOOK FINISHED' : 'STATUS UPDATED');
    void loadOverviewStats();
  } catch {
    modal.value = null;
    void loadEntries();
  }
}

export async function updateEntryPages(entryId: number, totalPages: number): Promise<void> {
  const prev = entries.value;
  entries.value = entries.value.map((e) => (e.id === entryId ? { ...e, total_pages: totalPages } : e));
  try {
    const updated = await entriesApi.updateEntryPages(entryId, totalPages);
    entries.value = entries.value.map((e) => (e.id === entryId ? updated : e));
    showToast('PAGES UPDATED');
  } catch (err) {
    entries.value = prev;
    showToast(err instanceof ApiError ? err.message : 'COULD NOT UPDATE PAGES');
  }
}

export async function deleteEntry(id: number): Promise<void> {
  try {
    await entriesApi.deleteEntry(id);
    entries.value = entries.value.filter((e) => e.id !== id);
    modal.value = null;
    screen.value = 'list';
    selectedEntryId.value = null;
    showToast('REMOVED FROM LIST');
    void loadOverviewStats();
  } catch {
    modal.value = null;
  }
}

export function openModal(m: ModalState): void {
  modal.value = m;
}

export function closeModal(): void {
  modal.value = null;
}

export function patchModal(fields: Record<string, unknown>): void {
  if (!modal.value) return;
  modal.value = { ...modal.value, ...fields } as ModalState;
}

/** Starts a session immediately — no input needed, the start page is inferred from where the last session left off. */
export async function startSession(entryId: number, startPage: number): Promise<void> {
  try {
    const session = await entriesApi.startSession(entryId, startPage);
    detailSessions.value = [...detailSessions.value, session];
    entries.value = entries.value.map((e) =>
      e.id === entryId
        ? { ...e, status: 'reading', started_at: e.started_at || new Date().toISOString().slice(0, 10) }
        : e,
    );
    void loadEntryStats(entryId);
    void loadOverviewStats();
    showToast('SESSION STARTED');
  } catch (err) {
    showToast(err instanceof ApiError ? err.message : 'COULD NOT START SESSION');
  }
}

export function openFinishSessionModal(sessionId: number, currentPage: number, maxPage: number | null): void {
  openModal({ type: 'finish', sessionId, endPage: String(currentPage), maxPage, highlight: '' });
}

export async function submitFinishSession(): Promise<void> {
  const m = modal.value;
  if (!m || m.type !== 'finish') return;
  const endPage = parseInt(m.endPage, 10) || 0;
  if (m.maxPage != null && endPage > m.maxPage) {
    showToast(`END PAGE CAN'T EXCEED ${m.maxPage}`);
    return;
  }
  const entryId = selectedEntryId.value;
  const highlight = m.highlight.trim();
  try {
    const session = await entriesApi.finishSession(m.sessionId, endPage);
    detailSessions.value = detailSessions.value.map((s) => (s.id === session.id ? session : s));
    if (entryId != null) {
      // the backend may have auto-marked the entry `read` if endPage reached total_pages — reload to pick up the authoritative status
      void loadEntries();
      void loadEntryStats(entryId);
      void loadOverviewStats();
    }
    modal.value = null;
    showToast('SESSION SAVED');

    if (highlight) {
      try {
        const withHighlight = await entriesApi.updateSessionHighlight(session.id, highlight);
        detailSessions.value = detailSessions.value.map((s) => (s.id === withHighlight.id ? withHighlight : s));
      } catch {
        showToast("SESSION FINISHED, BUT THE HIGHLIGHT COULDN'T BE SAVED — TAP THE SESSION TO TRY AGAIN");
      }
    }
  } catch (err) {
    modal.value = null;
    showToast(err instanceof ApiError ? err.message : 'COULD NOT SAVE SESSION');
  }
}

export function openHighlightModal(sessionId: number, currentHighlight: string | null): void {
  openModal({ type: 'highlight', sessionId, highlight: currentHighlight ?? '' });
}

export async function submitHighlightModal(): Promise<void> {
  const m = modal.value;
  if (!m || m.type !== 'highlight') return;
  const highlight = m.highlight.trim();
  try {
    const session = await entriesApi.updateSessionHighlight(m.sessionId, highlight || null);
    detailSessions.value = detailSessions.value.map((s) => (s.id === session.id ? session : s));
    modal.value = null;
    showToast('HIGHLIGHT SAVED');
  } catch (err) {
    modal.value = null;
    showToast(err instanceof ApiError ? err.message : 'COULD NOT SAVE HIGHLIGHT');
  }
}

/** Full calendar span (YYYY-MM-DD) for a period type, containing today — e.g. so a new "annual" goal defaults to Jan 1–Dec 31, not a single day. */
export function defaultPeriodRange(periodType: 'annual' | 'monthly'): { start: string; end: string } {
  const now = new Date();
  const year = now.getUTCFullYear();
  if (periodType === 'annual') {
    return { start: `${year}-01-01`, end: `${year}-12-31` };
  }
  const month = now.getUTCMonth();
  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 0));
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export function openGoalForm(g: Goal | null): void {
  const defaultRange = defaultPeriodRange('monthly');
  openModal({
    type: 'goalForm',
    editingId: g ? g.id : null,
    name: g ? g.name || '' : '',
    periodType: g ? g.period_type : 'monthly',
    periodStart: g ? g.period_start : defaultRange.start,
    periodEnd: g ? g.period_end : defaultRange.end,
    targetBooks: g ? String(g.target_books) : '3',
  });
}

export async function submitGoalForm(): Promise<void> {
  const m = modal.value;
  if (!m || m.type !== 'goalForm') return;
  const target = parseInt(m.targetBooks, 10) || 1;
  const input = {
    period_type: m.periodType,
    period_start: m.periodStart,
    period_end: m.periodEnd,
    target_books: target,
  };
  try {
    if (m.editingId) {
      const updated = await goalsApi.updateGoal(m.editingId, input);
      setGoalName(m.editingId, m.name || '');
      goals.value = goals.value.map((g) => (g.id === m.editingId ? { ...updated, name: m.name || '' } : g));
    } else {
      const created = await goalsApi.createGoal(input);
      setGoalName(created.id, m.name || '');
      goals.value = [...goals.value, { ...created, name: m.name || '' }];
    }
    modal.value = null;
    showToast('GOAL SAVED');
    void loadOverviewStats();
  } catch (err) {
    modal.value = null;
    showToast(err instanceof ApiError ? err.message : 'COULD NOT SAVE GOAL');
  }
}

export async function deleteGoal(id: number): Promise<void> {
  try {
    await goalsApi.deleteGoal(id);
    removeGoalName(id);
    goals.value = goals.value.filter((g) => g.id !== id);
    modal.value = null;
    showToast('GOAL DELETED');
    void loadOverviewStats();
  } catch (err) {
    modal.value = null;
    showToast(err instanceof ApiError ? err.message : 'COULD NOT DELETE GOAL');
  }
}

export function openConfirm(message: string, onConfirm: () => void, confirmLabel = 'CONFIRM'): void {
  openModal({ type: 'confirm', message, confirmLabel, onConfirm });
}

export async function initApp(): Promise<void> {
  await Promise.all([loadOverviewStats(), loadEntries(), loadGoals()]);
}
