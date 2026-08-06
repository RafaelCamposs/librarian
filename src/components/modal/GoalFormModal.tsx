import { defaultPeriodRange, modal, patchModal } from '../../state/store';

export function GoalFormModal() {
  const m = modal.value;
  if (!m || m.type !== 'goalForm') return null;
  return (
    <>
      <div class="field-label">GOAL NAME</div>
      <input
        class="text-input"
        placeholder="e.g. Summer reading sprint"
        value={m.name}
        onInput={(e) => patchModal({ name: (e.target as HTMLInputElement).value })}
        style={{ marginBottom: 12 }}
      />
      <div class="field-label">PERIOD TYPE</div>
      <select
        class="select-input"
        value={m.periodType}
        onChange={(e) => {
          const periodType = (e.target as HTMLSelectElement).value as 'annual' | 'monthly';
          if (m.editingId) {
            patchModal({ periodType });
          } else {
            const range = defaultPeriodRange(periodType);
            patchModal({ periodType, periodStart: range.start, periodEnd: range.end });
          }
        }}
        style={{ marginBottom: 12 }}
      >
        <option value="annual">annual</option>
        <option value="monthly">monthly</option>
      </select>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div class="field-label">START</div>
          <input
            class="text-input"
            type="date"
            value={m.periodStart}
            onInput={(e) => patchModal({ periodStart: (e.target as HTMLInputElement).value })}
            style={{ fontSize: 16, padding: 10 }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div class="field-label">END</div>
          <input
            class="text-input"
            type="date"
            value={m.periodEnd}
            onInput={(e) => patchModal({ periodEnd: (e.target as HTMLInputElement).value })}
            style={{ fontSize: 16, padding: 10 }}
          />
        </div>
      </div>
      <div class="field-label">TARGET BOOKS</div>
      <input
        class="text-input"
        type="number"
        value={m.targetBooks}
        onInput={(e) => patchModal({ targetBooks: (e.target as HTMLInputElement).value })}
        style={{ marginBottom: 16 }}
      />
    </>
  );
}
