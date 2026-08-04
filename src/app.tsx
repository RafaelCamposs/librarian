import { useEffect } from 'preact/hooks';
import { initApp, lastFetchFailed, screen } from './state/store';
import { TabBar } from './components/TabBar';
import { Toast } from './components/Toast';
import { ModalRoot } from './components/modal/ModalRoot';
import { Dashboard } from './components/screens/Dashboard';
import { ReadingList } from './components/screens/ReadingList';
import { AddBook } from './components/screens/AddBook';
import { BookDetail } from './components/screens/BookDetail';
import { Goals } from './components/screens/Goals';

export function App() {
  useEffect(() => {
    void initApp();
  }, []);

  const current = screen.value;

  return (
    <div class="app-shell">
      <div class="app-header">
        <div class="app-title">READING://TRACKER</div>
        <div class="user-chip">
          <div class="status-dot" />
          <div class="user-label">user_1</div>
        </div>
      </div>

      <div class="app-main">
        {lastFetchFailed.value && <div class="offline-banner">showing last cached data</div>}
        {current === 'dashboard' && <Dashboard />}
        {current === 'list' && <ReadingList />}
        {current === 'add' && <AddBook />}
        {current === 'goals' && <Goals />}
        {current === 'detail' && <BookDetail />}
      </div>

      <TabBar />
      <Toast />
      <ModalRoot />
    </div>
  );
}
