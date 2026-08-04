const STORAGE_KEY = 'reading-tracker:goal-names';

function readMap(): Record<number, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeMap(map: Record<number, string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* storage unavailable — client-side name is a nice-to-have, safe to drop */
  }
}

export function getGoalName(id: number): string | null {
  return readMap()[id] ?? null;
}

export function setGoalName(id: number, name: string): void {
  const map = readMap();
  if (name) map[id] = name;
  else delete map[id];
  writeMap(map);
}

export function removeGoalName(id: number): void {
  const map = readMap();
  delete map[id];
  writeMap(map);
}
