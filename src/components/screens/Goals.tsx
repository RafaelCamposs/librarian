import { deleteGoal, entries, goals, openConfirm, openGoalForm } from '../../state/store';
import { goalLabel } from '../../lib/goals';

export function Goals() {
  return (
    <>
      <div class="divider-header">── GOALS ──────────────────</div>
      <div class="btn btn-dashed-accent" style={{ marginBottom: 14 }} onClick={() => openGoalForm(null)}>
        + NEW GOAL
      </div>
      {goals.value.map((g) => {
        const finished = entries.value.filter(
          (e) => e.status === 'read' && e.finished_at && e.finished_at >= g.period_start && e.finished_at <= g.period_end,
        ).length;
        return (
          <div class="card" style={{ marginBottom: 10 }} key={g.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{goalLabel(g)}</span>
              <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                {g.period_start} → {g.period_end}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 10 }}>
              {finished} / {g.target_books} books
            </div>
            <div class="btn-row">
              <div class="goal-edit-btn" onClick={() => openGoalForm(g)}>
                EDIT
              </div>
              <div
                class="goal-delete-btn"
                onClick={() =>
                  openConfirm('Delete this goal? This cannot be undone.', () => void deleteGoal(g.id), 'DELETE')
                }
              >
                DELETE
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
