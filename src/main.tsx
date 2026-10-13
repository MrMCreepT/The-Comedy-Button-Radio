import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

// Safely register PWA service worker asynchronously after React is active
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    import('virtual:pwa-register')
      .then(({ registerSW }) => {
        registerSW({
          immediate: true,
          onNeedRefresh() {
            console.log('[TCB PWA] New update available, refreshing cache');
          },
          onOfflineReady() {
            console.log('[TCB PWA] Ready for offline playback & browsing');
          },
        });
      })
      .catch((swErr) => {
        console.warn('[TCB PWA] Service worker registration deferred or unavailable:', swErr);
      });
  } catch (err) {
    console.warn('[TCB PWA] Service worker initialization bypassed:', err);
  }
}

