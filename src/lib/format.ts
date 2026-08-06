export function addDays(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  return Math.max(0, Math.round((new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime()) / 86400000));
}

export function weekday(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`)
    .toLocaleDateString('en-US', { weekday: 'short' })
    .slice(0, 3)
    .toUpperCase();
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Formats an ISO timestamp as "YYYY-MM-DD HH:MM" in the device's local timezone. */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Formats an ISO timestamp as "HH:MM" in the device's local timezone. */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
