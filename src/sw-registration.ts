import { registerSW } from 'virtual:pwa-register';

export function registerServiceWorker(): void {
  const updateSW = registerSW({
    onNeedRefresh() {
      updateSW(true);
    },
    onOfflineReady() {
      console.info('App ready to work offline.');
    },
  });
}
