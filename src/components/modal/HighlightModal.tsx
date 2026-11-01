import { modal, patchModal } from '../../state/store';
import { HIGHLIGHT_MAX_LENGTH } from '../../types';

export function HighlightModal() {
  const m = modal.value;
  if (!m || m.type !== 'highlight') return null;
  return (
    <>
      <div class="field-label">HIGHLIGHT</div>
      <textarea
        class="text-input textarea-input"
        rows={4}
        autofocus
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
