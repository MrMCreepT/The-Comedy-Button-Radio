import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Smartphone, Download } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

const BANNER_STORAGE_KEY = 'tcb_pwa_banner_dismissed';

export const PWABanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isMobile, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Check if dismissed previously within 3 days
    const saved = localStorage.getItem(BANNER_STORAGE_KEY);
    if (saved) {
      const timestamp = parseInt(saved, 10);
      if (Date.now() - timestamp < 1000 * 60 * 60 * 24 * 3) {
        setDismissed(true);
        return;
      }
    }
    // Only show if not installed
    if (!isInstalled) {
      setDismissed(false);
    }
  }, [isInstalled]);

  if (isInstalled || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(BANNER_STORAGE_KEY, Date.now().toString());
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (!outcome) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <AnimatePresence>
        {!dismissed && !isInstalled && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed bottom-24 sm:bottom-20 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-[#151926]/95 backdrop-blur-md border border-red-500/30 rounded-2xl p-3 shadow-2xl shadow-black/80 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <img
                src="/pwa-192x192.png"
                alt="Comedy Button"
                className="w-10 h-10 rounded-xl object-cover border border-red-500/40 shrink-0 shadow"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">Install The Comedy Button</p>
                <p className="text-[11px] text-zinc-400 truncate">Add to home screen for full app mode</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={handleInstallClick}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-950/40 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install</span>
              </motion.button>
              <button
                onClick={handleDismiss}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PWAInstallModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        isInstallable={isInstallable}
        isIOS={isIOS}
        onInstall={install}
      />
    </>
  );
};
