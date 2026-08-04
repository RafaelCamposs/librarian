import { modal } from '../../state/store';

export function ConfirmModal() {
  const m = modal.value;
  if (!m || m.type !== 'confirm') return null;
  return <div style={{ fontSize: 13, color: 'var(--color-text)', marginBottom: 18 }}>{m.message}</div>;
}
