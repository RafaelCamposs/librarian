import { modal, patchModal } from '../../state/store';
import { HIGHLIGHT_MAX_LENGTH } from '../../types';

export function FinishSessionModal() {
  const m = modal.value;
  if (!m || m.type !== 'finish') return null;
  return (
    <>
      <div class="field-label">
        END PAGE{m.maxPage != null ? ` (MAX ${m.maxPage})` : ''}
      </div>
      <input
        class="text-input"
        type="number"
        min={0}
        max={m.maxPage ?? undefined}
        value={m.endPage}
        onInput={(e) => {
          let value = (e.target as HTMLInputElement).value;
          if (m.maxPage != null && value !== '' && Number(value) > m.maxPage) {
            value = String(m.maxPage);
          }
          patchModal({ endPage: value });
        }}
        style={{ marginBottom: 16 }}
      />
      <div class="field-label">HIGHLIGHT (OPTIONAL)</div>
      <textarea
        class="text-input textarea-input"
        rows={3}
        maxLength={HIGHLIGHT_MAX_LENGTH}
        placeholder="A passage worth remembering…"
        value={m.highlight}
        onInput={(e) => patchModal({ highlight: (e.target as HTMLTextAreaElement).value })}
      />
      <div class="char-count">
        {m.highlight.length}/{HIGHLIGHT_MAX_LENGTH}
      </div>
    </>
  );
}
