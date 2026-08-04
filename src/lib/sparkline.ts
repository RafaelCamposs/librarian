const SPARK = ' ▁▂▃▄▅▆▇█';

export function sparkChar(value: number, max: number): string {
  if (!max) return SPARK[0];
  const idx = Math.round((value / max) * (SPARK.length - 1));
  return SPARK[Math.max(0, Math.min(SPARK.length - 1, idx))];
}
