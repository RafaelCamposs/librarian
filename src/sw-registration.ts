import { registerSW } from 'virtual:pwa-register';

export function registerServiceWorker(): void {
  registerSW({
    onNeedRefresh() {
      console.info('A new version is available — reload to update.');
    },
    onOfflineReady() {
      console.info('App ready to work offline.');
    },
  });
}
