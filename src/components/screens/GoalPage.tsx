import {
  backFromGoal,
  deleteGoal,
  goalDetail,
  goalDetailFailed,
  goalOrigin,
  openConfirm,
  openGoalForm,
  selectEntry,
} from '../../state/store';
import {
  ALSO_READ_COLOR,
  ALSO_READ_LABEL,
  goalLabel,
  goalStateColor,
  goalStateLabel,
  goalTypeLabel,
} from '../../lib/goals';
import { dayMonth } from '../../lib/format';
import { CoverImage } from '../CoverImage';

export function GoalPage() {
  const goal = goalDetail.value;
  const backLabel = goalOrigin.value === 'dashboard' ? '‹ DASHBOARD' : '‹ GOALS';

  const back = (
    <div class="back-link" onClick={backFromGoal}>
      {backLabel}
    </div>
  );

  if (!goal) {
    return (
      <>
        {back}
        <div class="empty-state">{goalDetailFailed.value ? "couldn't load this goal" : 'loading goal…'}</div>
      </>
    );
  }

  const finished = [...goal.finished].sort((a, b) => (a.finished_at < b.finished_at ? -1 : a.finished_at > b.finished_at ? 1 : 0));
  const alsoRead = [...goal.also_read].sort((a, b) =>
    a.last_reading_day < b.last_reading_day ? -1 : a.last_reading_day > b.last_reading_day ? 1 : 0,
  );
  const unclosed = goal.state !== 'closed';

  return (
    <>
      {back}

      <div class="goal-header">
        <div class="goal-header-title">
          {goalLabel(goal)} · {goalTypeLabel(goal.period_type)}
        </div>
        <div class="goal-header-progress">
          {goal.books_finished} / {goal.target_books} books ·{' '}
          <span style={{ color: goalStateColor(goal) }}>{goalStateLabel(goal)}</span>
        </div>
      </div>

      <div class="section-label">FINISHED</div>
      {finished.length > 0 ? (
        finished.map((b) => (
          <div class="list-row" key={b.entry_id} onClick={() => selectEntry(b.entry_id)}>
            <CoverImage coverUrl={b.cover_url} width={32} height={46} />
            <div class="list-row-text truncate" style={{ fontSize: 13, fontWeight: 600 }}>
              {b.title}
            </div>
            <span class="goal-book-meta">{dayMonth(b.finished_at)}</span>
          </div>
        ))
      ) : (
        <div class="empty-state">no books finished yet</div>
      )}

      {alsoRead.length > 0 && (
        <>
          <div class="section-label" style={{ marginTop: 20 }}>
            ALSO READ
          </div>
          {alsoRead.map((b) => (
            <div class="list-row" key={b.entry_id} onClick={() => selectEntry(b.entry_id)}>
              <CoverImage coverUrl={b.cover_url} width={32} height={46} />
              <div class="list-row-text truncate" style={{ fontSize: 13, fontWeight: 600 }}>
                {b.title}
              </div>
              <div class="badge" style={{ color: ALSO_READ_COLOR[b.label] }}>
                {ALSO_READ_LABEL[b.label]}
              </div>
            </div>
          ))}
        </>
      )}

      {unclosed && (
        <div class="btn-row" style={{ marginTop: 20 }}>
          <div class="goal-edit-btn" onClick={() => openGoalForm(goal)}>
            EDIT TARGET
          </div>
          <div
            class="goal-delete-btn"
            onClick={() => openConfirm('Delete this goal? This cannot be undone.', () => void deleteGoal(goal.id), 'DELETE')}
          >
            DELETE
          </div>
        </div>
      )}
    </>
  );
}
