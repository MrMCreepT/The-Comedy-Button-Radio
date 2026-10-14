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

// Unregister any active service workers in preview/iframe/dev environments to avoid intercepting dev requests or causing white screens
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const isPreviewOrIframe = window.self !== window.top ||
    Boolean(import.meta.env?.DEV) ||
    /localhost|127\.0\.0\.1|run\.app|google|aistudio|web\.app|firebaseapp/.test(window.location.hostname);

  if (isPreviewOrIframe) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });
    if ('caches' in window) {
      caches.keys().then((names) => {
        for (const name of names) {
          caches.delete(name);
        }
      });
    }
  } else {
    // Production standalone deployment (e.g. GitHub Pages, git.io, custom domains)
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
}

