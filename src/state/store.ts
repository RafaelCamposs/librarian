import { signal, computed } from '@preact/signals';
import type {
  ActivityDay,
  DailyHighlight,
  EntryStats,
  Goal,
  GoalDetail,
  GoalPeriodType,
  OpenSession,
  OverviewStats,
  ReadingListEntry,
  ReadingSession,
  ReadingStatus,
  Streak,
  Book,
} from '../types';
import * as entriesApi from '../api/entries';
import * as goalsApi from '../api/goals';
import * as statsApi from '../api/stats';
import * as booksApi from '../api/books';
import { nextStatusPatch } from '../lib/status';
import { freeGoalPeriods } from '../lib/goals';
import { today } from '../lib/format';
import { ApiError } from '../types';

export type Screen = 'dashboard' | 'list' | 'add' | 'goals' | 'detail' | 'goal';

/** Where the goal page was opened from — its back arrow returns there. */
export type GoalOrigin = 'goals' | 'dashboard';

export type ModalState =
  | {
      type: 'finish';
      sessionId: number;
      /** The session's entry — lets a finish started outside Book Detail (the Dashboard hero) reload the right stats. */
      entryId: number | null;
      endPage: string;
      maxPage: number | null;
      highlight: string;
    }
  | { type: 'highlight'; sessionId: number; highlight: string }
  | {
      type: 'goalForm';
      editingId: number | null;
      periodType: GoalPeriodType;
      /** First day of the chosen period; '' when no period of this type is free. */
      periodStart: string;
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
export const selectedGoalId = signal<number | null>(null);
export const goalOrigin = signal<GoalOrigin>('goals');
export const goalDetail = signal<GoalDetail | null>(null);
export const goalDetailLoading = signal(false);
export const goalDetailFailed = signal(false);
export const lastFetchFailed = signal(false);

export const bookById = computed(() => new Map(books.value.map((b) => [b.id, b])));

export const detailSessions = signal<ReadingSession[]>([]);
export const entryStats = signal<Record<number, EntryStats>>({});

export const overviewStats = signal<OverviewStats | null>(null);
export const overviewLoading = signal(false);
export const streak = signal<Streak | null>(null);
/** Last 84 days of reading days; null until loaded or when the endpoint fails — Dashboard hides the 7-day summary and heatmap. */
export const activity = signal<ActivityDay[] | null>(null);
export const dailyHighlight = signal<DailyHighlight | null>(null);
export const startingSession = signal(false);

/** The reader's open session on any entry, from the overview stats. */
export const openSession = computed<OpenSession | null>(() => overviewStats.value?.open_session ?? null);

/** Best-effort title for an entry: the overview's currently-reading row, else the entry's book. */
export function entryTitle(entryId: number): string {
  const item = overviewStats.value?.currently_reading.find((c) => c.entry_id === entryId);
  if (item) return item.title;
  const entry = entries.value.find((e) => e.id === entryId);
  return (entry && bookById.value.get(entry.book_id)?.title) ?? 'the open session';
}

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
    goals.value = await goalsApi.listGoals();
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
    overviewStats.value = { ...stats, open_session: stats.open_session ?? null };
    if (books.value.length === 0) books.value = await booksApi.listBooks();
    lastFetchFailed.value = false;
  } catch {
    lastFetchFailed.value = true;
  } finally {
    overviewLoading.value = false;
  }
  void loadStreak();
  void loadActivity();
  void loadDailyHighlight();
}

export async function loadStreak(): Promise<void> {
  try {
    streak.value = await statsApi.getStreak();
  } catch {
    // leave stale/absent streak — Dashboard just hides the stat
  }
}

export async function loadActivity(): Promise<void> {
  try {
    activity.value = await statsApi.getActivity(84);
  } catch {
    activity.value = null;
  }
}

export async function loadDailyHighlight(): Promise<void> {
  try {
    dailyHighlight.value = (await statsApi.getDailyHighlight()) ?? null;
  } catch {
    dailyHighlight.value = null;
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

export async function loadGoalDetail(id: number): Promise<void> {
  goalDetailLoading.value = true;
  try {
    const detail = await goalsApi.getGoal(id);
    if (selectedGoalId.value === id) {
      goalDetail.value = detail;
      goalDetailFailed.value = false;
    }
  } catch {
    if (selectedGoalId.value === id) goalDetailFailed.value = true;
  } finally {
    if (selectedGoalId.value === id) goalDetailLoading.value = false;
  }
}

export function openGoal(id: number, from: GoalOrigin): void {
  screen.value = 'goal';
  modal.value = null;
  goalOrigin.value = from;
  selectedGoalId.value = id;
  goalDetail.value = null;
  goalDetailFailed.value = false;
  void loadGoalDetail(id);
}

export function backFromGoal(): void {
  const origin = goalOrigin.value;
  selectedGoalId.value = null;
  goalDetail.value = null;
  goTo(origin);
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
  if (startingSession.value) return;
  startingSession.value = true;
  try {
    const session = await entriesApi.startSession(entryId, startPage);
    if (selectedEntryId.value === entryId) detailSessions.value = [...detailSessions.value, session];
    entries.value = entries.value.map((e) =>
      e.id === entryId
        ? { ...e, status: 'reading', started_at: e.started_at || new Date().toISOString().slice(0, 10) }
        : e,
    );
    void loadEntryStats(entryId);
    void loadOverviewStats();
    showToast('SESSION STARTED');
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      // Another entry has the reader's one open session (e.g. opened on another device) — adopt it and reload.
      const open = (err.body as { open_session?: OpenSession | null } | null)?.open_session ?? null;
      if (open && overviewStats.value) overviewStats.value = { ...overviewStats.value, open_session: open };
      showToast(open ? `FINISH ${entryTitle(open.entry_id).toUpperCase()} FIRST` : 'ANOTHER SESSION IS ALREADY OPEN');
      void loadOverviewStats();
    } else {
      showToast(err instanceof ApiError ? err.message : 'COULD NOT START SESSION');
    }
  } finally {
    startingSession.value = false;
  }
}

export function openFinishSessionModal(
  sessionId: number,
  currentPage: number,
  maxPage: number | null,
  entryId: number | null = selectedEntryId.value,
): void {
  openModal({ type: 'finish', sessionId, entryId, endPage: String(currentPage), maxPage, highlight: '' });
}

export async function submitFinishSession(): Promise<void> {
  const m = modal.value;
  if (!m || m.type !== 'finish') return;
  const endPage = parseInt(m.endPage, 10) || 0;
  if (m.maxPage != null && endPage > m.maxPage) {
    showToast(`END PAGE CAN'T EXCEED ${m.maxPage}`);
    return;
  }
  const entryId = m.entryId;
  const highlight = m.highlight.trim();
  try {
    const session = await entriesApi.finishSession(m.sessionId, endPage);
    detailSessions.value = detailSessions.value.map((s) => (s.id === session.id ? session : s));
    // the backend may have auto-marked the entry `read` if endPage reached total_pages — reload to pick up the authoritative status
    void loadEntries();
    if (entryId != null) void loadEntryStats(entryId);
    void loadOverviewStats();
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

/** The first free period of this type, or '' when every period on offer already has a goal. */
function firstFreePeriod(periodType: GoalPeriodType): string {
  return freeGoalPeriods(periodType, goals.value, today())[0] ?? '';
}

/** Pass a goal to edit its target; null starts a new goal. */
export function openGoalForm(g: Goal | null): void {
  openModal({
    type: 'goalForm',
    editingId: g ? g.id : null,
    periodType: g ? g.period_type : 'monthly',
    periodStart: g ? g.period_start : firstFreePeriod('monthly'),
    targetBooks: g ? String(g.target_books) : '3',
  });
}

export function setGoalFormType(periodType: GoalPeriodType): void {
  patchModal({ periodType, periodStart: firstFreePeriod(periodType) });
}

/** The backend refuses to change or delete a goal whose period has ended (409, reason goal_closed). */
function isGoalClosedError(err: unknown): boolean {
  if (!(err instanceof ApiError) || err.status !== 409) return false;
  const body = err.body;
  return !!body && typeof body === 'object' && (body as Record<string, unknown>).reason === 'goal_closed';
}

function handleGoalClosed(id: number): void {
  showToast("THIS GOAL HAS CLOSED — IT CAN'T BE CHANGED");
  void loadGoals();
  void loadOverviewStats();
  if (screen.value === 'goal' && selectedGoalId.value === id) void loadGoalDetail(id);
}

export async function submitGoalForm(): Promise<void> {
  const m = modal.value;
  if (!m || m.type !== 'goalForm') return;
  const target = parseInt(m.targetBooks, 10);
  if (Number.isNaN(target) || target < 1) {
    showToast('TARGET MUST BE AT LEAST 1 BOOK');
    return;
  }
  const editingId = m.editingId;
  try {
    if (editingId) {
      const updated = await goalsApi.updateGoal(editingId, target);
      goals.value = goals.value.map((g) => (g.id === editingId ? updated : g));
      if (goalDetail.value?.id === editingId) goalDetail.value = { ...goalDetail.value, ...updated };
    } else {
      if (!m.periodStart) return;
      const created = await goalsApi.createGoal({
        period_type: m.periodType,
        period_start: m.periodStart,
        target_books: target,
      });
      goals.value = [...goals.value, created];
      void loadGoals();
    }
    modal.value = null;
    showToast('GOAL SAVED');
    void loadOverviewStats();
  } catch (err) {
    modal.value = null;
    if (editingId && isGoalClosedError(err)) handleGoalClosed(editingId);
    else showToast(err instanceof ApiError ? err.message : 'COULD NOT SAVE GOAL');
  }
}

export async function deleteGoal(id: number): Promise<void> {
  try {
    await goalsApi.deleteGoal(id);
    goals.value = goals.value.filter((g) => g.id !== id);
    modal.value = null;
    showToast('GOAL DELETED');
    if (screen.value === 'goal' && selectedGoalId.value === id) backFromGoal();
    void loadOverviewStats();
  } catch (err) {
    modal.value = null;
    if (isGoalClosedError(err)) handleGoalClosed(id);
    else showToast(err instanceof ApiError ? err.message : 'COULD NOT DELETE GOAL');
  }
}

export function openConfirm(message: string, onConfirm: () => void, confirmLabel = 'CONFIRM'): void {
  openModal({ type: 'confirm', message, confirmLabel, onConfirm });
}

export async function initApp(): Promise<void> {
  await Promise.all([loadOverviewStats(), loadEntries(), loadGoals()]);
}
