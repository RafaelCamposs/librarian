import { goTo, screen, type Screen } from '../state/store';

const TABS: { key: Screen; label: string }[] = [
  { key: 'dashboard', label: 'DASH' },
  { key: 'list', label: 'LIST' },
  { key: 'add', label: 'ADD' },
  { key: 'goals', label: 'GOALS' },
];

export function TabBar() {
  const current = screen.value;
  return (
    <div class="tab-bar">
      {TABS.map((tab) => {
        const active = current === tab.key || (tab.key === 'list' && current === 'detail');
        return (
          <div
            key={tab.key}
            class={`tab-bar-item${active ? ' active' : ''}`}
            onClick={() => goTo(tab.key)}
          >
            {tab.label}
          </div>
        );
      })}
    </div>
  );
}
