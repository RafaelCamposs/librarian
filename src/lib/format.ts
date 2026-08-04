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
