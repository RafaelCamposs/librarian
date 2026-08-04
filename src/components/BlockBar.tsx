import { bar } from '../lib/bar';

export function BlockBar({ percent, width, fontSize }: { percent: number | null; width: number; fontSize: number }) {
  const b = bar(percent, width);
  return (
    <div class="block-bar" style={{ fontSize }}>
      <span class="filled">{b.filled}</span>
      <span class="empty">{b.empty}</span>
    </div>
  );
}
