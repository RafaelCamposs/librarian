import { goals, openGoal, openGoalForm } from '../../state/store';
import type { Goal } from '../../types';
import { compareGoalsNewestFirst, goalLabel, goalStateColor, goalStateLabel } from '../../lib/goals';

export function Goals() {
  const sorted = [...goals.value].sort(compareGoalsNewestFirst);
  const sections: { label: string; items: Goal[] }[] = [
    { label: 'CURRENT', items: sorted.filter((g) => g.state === 'current') },
    { label: 'UPCOMING', items: sorted.filter((g) => g.state === 'upcoming') },
    { label: 'HISTORY', items: sorted.filter((g) => g.state === 'closed') },
  ];

  return (
    <>
      <div class="divider-header">── GOALS ──────────────────</div>
      <div class="btn btn-dashed-accent" style={{ marginBottom: 20 }} onClick={() => openGoalForm(null)}>
        + NEW GOAL
      </div>
      {sections
        .filter((section) => section.items.length > 0)
        .map((section) => (
          <div class="goal-section" key={section.label}>
            <div class="section-label">{section.label}</div>
            {section.items.map((g) => (
              <div class="list-row goal-row" key={g.id} onClick={() => openGoal(g.id, 'goals')}>
                <span class="goal-row-label">{goalLabel(g)}</span>
                <span class="goal-row-count">
                  {g.books_finished} / {g.target_books}
                  {g.state === 'closed' ? '' : ' books'}
                </span>
                {g.state === 'closed' && (
                  <span class="goal-row-outcome" style={{ color: goalStateColor(g) }}>
                    {goalStateLabel(g)}
                  </span>
                )}
                <span class="goal-row-arrow">→</span>
              </div>
            ))}
          </div>
        ))}
    </>
  );
}
