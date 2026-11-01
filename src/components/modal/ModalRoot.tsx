import { closeModal, modal, submitFinishSession, submitGoalForm, submitHighlightModal } from '../../state/store';
import { FinishSessionModal } from './FinishSessionModal';
import { HighlightModal } from './HighlightModal';
import { GoalFormModal } from './GoalFormModal';
import { ConfirmModal } from './ConfirmModal';

export function ModalRoot() {
  const m = modal.value;
  if (!m) return null;

  let title = '';
  let confirmLabel = 'CONFIRM';
  let onConfirm = () => {};
  let body = null;

  if (m.type === 'finish') {
    title = 'FINISH SESSION';
    confirmLabel = 'SAVE';
    onConfirm = () => void submitFinishSession();
    body = <FinishSessionModal />;
  } else if (m.type === 'highlight') {
    title = 'HIGHLIGHT';
    confirmLabel = 'SAVE';
    onConfirm = () => void submitHighlightModal();
    body = <HighlightModal />;
  } else if (m.type === 'goalForm') {
    title = m.editingId ? 'EDIT GOAL' : 'NEW GOAL';
    confirmLabel = 'SAVE';
    onConfirm = () => void submitGoalForm();
    body = <GoalFormModal />;
  } else if (m.type === 'confirm') {
    title = 'CONFIRM';
    confirmLabel = m.confirmLabel;
    onConfirm = m.onConfirm;
    body = <ConfirmModal />;
  }

  return (
    <div class="modal-backdrop">
      <div class="modal-sheet">
        <div class="modal-title">{title}</div>
        {body}
        <div class="btn-row">
          <div class="btn btn-primary" onClick={onConfirm}>
            {confirmLabel}
          </div>
          <div class="btn btn-outline" onClick={closeModal}>
            CANCEL
          </div>
        </div>
      </div>
    </div>
  );
}
