import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Share, PlusSquare, Smartphone, Download, Radio, Check } from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInstallable: boolean;
  isIOS: boolean;
  onInstall: () => Promise<boolean>;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  isInstallable,
  isIOS,
  onInstall,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
          {/* Backdrop click */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-md bg-[#121520] border border-zinc-700/80 rounded-3xl p-6 shadow-2xl z-10 space-y-5"
          >
            {/* Header with App Icon */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <img
                  src="/pwa-192x192.png"
                  alt="The Comedy Button"
                  className="w-14 h-14 rounded-2xl shadow-lg border border-red-500/30 object-cover"
                />
                <div>
                  <h3 className="text-lg font-bold text-white leading-tight">
                    The Comedy Button
                  </h3>
                  <p className="text-xs text-red-400 font-semibold flex items-center gap-1.5 mt-0.5">
                    <Radio className="w-3.5 h-3.5" />
                    <span>Mobile Web App (PWA)</span>
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* PWA Benefits */}
            <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Full-Screen Player</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Offline Caching</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>One-Tap Radio</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Instant Home Access</span>
              </div>
            </div>

            {/* Platform instructions */}
            {isInstallable ? (
              <div className="space-y-3 pt-2">
                <p className="text-xs text-zinc-400 text-center">
                  Install directly onto your device for standalone audio playback and instant launch.
                </p>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={async () => {
                    const ok = await onInstall();
                    if (ok) onClose();
                  }}
                  className="w-full py-3.5 px-5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-950/60 transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Install App Now</span>
                </motion.button>
              </div>
            ) : isIOS ? (
              /* iOS Safari Walkthrough */
              <div className="space-y-3 pt-1">
                <p className="text-xs text-zinc-300 font-semibold">
                  To install on your iPhone or iPad:
                </p>
                <div className="space-y-2 text-xs text-zinc-300 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3.5">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-red-950 text-red-400 font-bold text-xs flex items-center justify-center shrink-0">
                      1
                    </span>
                    <span className="flex items-center gap-1.5">
                      Tap the <Share className="w-4 h-4 text-sky-400 inline" /> <strong>Share</strong> button in Safari toolbar
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-red-950 text-red-400 font-bold text-xs flex items-center justify-center shrink-0">
                      2
                    </span>
                    <span className="flex items-center gap-1.5">
                      Scroll down and tap <PlusSquare className="w-4 h-4 text-zinc-200 inline" /> <strong>Add to Home Screen</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-red-950 text-red-400 font-bold text-xs flex items-center justify-center shrink-0">
                      3
                    </span>
                    <span>
                      Tap <strong>Add</strong> in top right to complete installation
                    </span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition cursor-pointer"
                >
                  Got It
                </button>
              </div>
            ) : (
              /* Generic browser or already installed */
              <div className="space-y-3 pt-2">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Open this page in Chrome, Edge, or Safari on your mobile device, then select <strong>Install App</strong> or <strong>Add to Home Screen</strong> from your browser menu.
                </p>
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
