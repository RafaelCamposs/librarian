import { goals, modal, patchModal, setGoalFormType } from '../../state/store';
import type { GoalPeriodType } from '../../types';
import { freeGoalPeriods, goalLabel } from '../../lib/goals';
import { today } from '../../lib/format';

export function GoalFormModal() {
  const m = modal.value;
  if (!m || m.type !== 'goalForm') return null;

  const targetField = (
    <>
      <div class="field-label">TARGET BOOKS</div>
      <input
        class="text-input"
        type="number"
        min={1}
        value={m.targetBooks}
        onInput={(e) => patchModal({ targetBooks: (e.target as HTMLInputElement).value })}
        style={{ marginBottom: 16 }}
      />
    </>
  );

  if (m.editingId) return targetField;

  const free = freeGoalPeriods(m.periodType, goals.value, today());

  return (
    <>
      <div class="field-label">TYPE</div>
      <select
        class="select-input"
        value={m.periodType}
        onChange={(e) => setGoalFormType((e.target as HTMLSelectElement).value as GoalPeriodType)}
        style={{ marginBottom: 12 }}
      >
        <option value="annual">annual</option>
        <option value="monthly">monthly</option>
      </select>
      <div class="field-label">{m.periodType === 'annual' ? 'YEAR' : 'MONTH'}</div>
      {free.length > 0 ? (
        <select
          class="select-input"
          value={m.periodStart}
          onChange={(e) => patchModal({ periodStart: (e.target as HTMLSelectElement).value })}
          style={{ marginBottom: 12 }}
        >
          {free.map((start) => (
            <option value={start} key={start}>
              {goalLabel({ period_type: m.periodType, period_start: start })}
            </option>
          ))}
        </select>
      ) : (
        <div class="goal-form-none">
          {m.periodType === 'annual'
            ? 'no free years — this year and next already have an annual goal'
            : 'no free months — this month and the next 11 already have a monthly goal'}
        </div>
      )}
      {targetField}
    </>
  );
}
