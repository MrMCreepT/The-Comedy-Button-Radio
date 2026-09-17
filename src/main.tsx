import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker with automatic updates
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[TCB PWA] New update available, refreshing cache');
  },
  onOfflineReady() {
    console.log('[TCB PWA] Ready for offline playback & browsing');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
