export interface BlockBarChars {
  filled: string;
  empty: string;
}

export function bar(percent: number | null, width: number): BlockBarChars {
  const pct = percent == null ? 0 : percent;
  const filled = Math.round((width * Math.min(100, pct)) / 100);
  return { filled: '█'.repeat(filled), empty: '░'.repeat(Math.max(0, width - filled)) };
}
