import { toast } from '../state/store';

export function Toast() {
  if (!toast.value) return null;
  return <div class="toast">{toast.value}</div>;
}
