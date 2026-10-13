import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAudio } from '../context/AudioContext';
import {
  getStorageQuotaInfo,
  getAllOfflineEpisodesDetails,
  clearAllOfflineEpisodes,
  formatBytes,
  downloadEpisodeForOffline,
  StorageQuotaInfo,
  DownloadedEpisodeMetadata
} from '../utils/offlineStorage';
import { triggerHaptic } from '../utils/haptics';
import {
  HardDrive,
  Trash2,
  X,
  Play,
  Download,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Database,
  ArrowDownToLine,
  RefreshCw
} from 'lucide-react';
import { useModalA11y } from '../hooks/useModalA11y';

interface StorageManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StorageManagerModal: React.FC<StorageManagerModalProps> = ({ isOpen, onClose }) => {
  const {
    playlist,
    playEpisode,
    refreshOfflineIds,
    removeOfflineEpisode,
    currentEpisode,
    isPlaying
  } = useAudio();

  const [quota, setQuota] = useState<StorageQuotaInfo | null>(null);
  const [downloadedEpisodes, setDownloadedEpisodes] = useState<DownloadedEpisodeMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
  const [bulkDownloadStatus, setBulkDownloadStatus] = useState<string | null>(null);
  const [bulkProgress, setBulkProgress] = useState<number>(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const modalRef = useModalA11y<HTMLDivElement>({
    isOpen,
    onClose
  });

  const loadStorageData = async () => {
    setLoading(true);
    try {
      const [quotaInfo, details] = await Promise.all([
        getStorageQuotaInfo(),
        getAllOfflineEpisodesDetails()
      ]);
      setQuota(quotaInfo);
      setDownloadedEpisodes(details);
    } catch (e) {
      console.warn('Error loading storage details:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStorageData();
      setShowClearConfirm(false);
      setBulkDownloadStatus(null);
    }
  }, [isOpen]);

  const handleDeleteOne = async (id: string) => {
    triggerHaptic(8);
    setDeletingId(id);
    try {
      await removeOfflineEpisode(id);
      await loadStorageData();
    } catch (e) {
      console.warn('Failed to delete episode:', e);
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    triggerHaptic(12);
    try {
      await clearAllOfflineEpisodes();
      await refreshOfflineIds();
      await loadStorageData();
      setShowClearConfirm(false);
    } catch (e) {
      console.warn('Failed to clear all offline storage:', e);
    }
  };

  const handleBulkDownloadRecent = async () => {
    if (isBulkDownloading || playlist.length === 0) return;
    triggerHaptic(10);
    setIsBulkDownloading(true);

    try {
      // Find up to 3 episodes not yet downloaded
      const downloadedIds = new Set(downloadedEpisodes.map((d) => d.id));
      const candidates = playlist.filter((ep) => !downloadedIds.has(ep.id)).slice(0, 3);

      if (candidates.length === 0) {
        setBulkDownloadStatus('All available episodes are already cached!');
        setTimeout(() => setBulkDownloadStatus(null), 3000);
        setIsBulkDownloading(false);
        return;
      }

      for (let i = 0; i < candidates.length; i++) {
        const ep = candidates[i];
        setBulkDownloadStatus(`Downloading (${i + 1}/${candidates.length}): ${ep.title}`);
        await downloadEpisodeForOffline(ep, (pct) => {
          setBulkProgress(Math.round(((i + pct / 100) / candidates.length) * 100));
        });
      }

      await refreshOfflineIds();
      await loadStorageData();
      setBulkDownloadStatus(`Successfully cached ${candidates.length} episodes!`);
      setTimeout(() => setBulkDownloadStatus(null), 3500);
    } catch (err: any) {
      console.error('Bulk download error:', err);
      setBulkDownloadStatus('Some episodes could not be cached.');
      setTimeout(() => setBulkDownloadStatus(null), 3000);
    } finally {
      setIsBulkDownloading(false);
      setBulkProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-xl max-h-[90vh] bg-[#121520] border border-zinc-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-[#0e111a]/80 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-950/80 border border-red-800/60 flex items-center justify-center text-red-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                  <span>Offline Storage & Downloads</span>
                </h2>
                <p className="text-xs text-zinc-400">Device storage and offline episode management</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Storage Quota Card */}
            <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-zinc-300" />
                  <span>Device Headroom</span>
                </span>
                <span className="font-mono font-medium text-zinc-200">
                  {quota ? `${formatBytes(quota.usageBytes)} / ${formatBytes(quota.quotaBytes)}` : 'Estimating...'}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(2, quota?.percentageUsed || 0)}%` }}
                />
              </div>

              {/* Breakdown */}
              <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
                <span>
                  Cached Podcast Audio:{' '}
                  <strong className="text-zinc-100 font-mono font-semibold">
                    {quota ? formatBytes(quota.episodesSizeBytes) : '0 B'}
                  </strong>
                </span>
                <span>
                  Saved Episodes:{' '}
                  <strong className="text-zinc-100 font-mono font-semibold">
                    {quota ? quota.episodesCount : 0}
                  </strong>
                </span>
              </div>
            </div>

            {/* Quick Actions (Bulk Download / Clear) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={handleBulkDownloadRecent}
                disabled={isBulkDownloading}
                className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isBulkDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                    <span>Caching ({bulkProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <ArrowDownToLine className="w-4 h-4 text-red-400" />
                    <span>Download Next 3 Episodes</span>
                  </>
                )}
              </button>

              {showClearConfirm ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClearAll}
                    className="flex-1 px-3 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Confirm Delete All
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-3 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  disabled={downloadedEpisodes.length === 0}
                  className="px-3.5 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-950/70 text-red-300 border border-red-900/40 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-40"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                  <span>Clear All Downloads</span>
                </button>
              )}
            </div>

            {/* Status Toast Notification */}
            {bulkDownloadStatus && (
              <div className="p-2.5 rounded-xl bg-zinc-800/90 border border-zinc-700 text-xs text-zinc-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">{bulkDownloadStatus}</span>
              </div>
            )}

            {/* Cached Episodes List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
                <span>Downloaded Episodes ({downloadedEpisodes.length})</span>
                <button
                  onClick={loadStorageData}
                  className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh</span>
                </button>
              </div>

              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-zinc-500 text-xs">
                  <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                  <span>Scanning local audio store...</span>
                </div>
              ) : downloadedEpisodes.length === 0 ? (
                <div className="p-8 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-center space-y-2">
                  <Download className="w-8 h-8 text-zinc-600 mx-auto" />
                  <p className="text-xs font-medium text-zinc-300">No episodes downloaded yet</p>
                  <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                    Download episodes from the Episode Archive to listen offline on flights, road trips, or without Wi-Fi.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {downloadedEpisodes.map((ep) => {
                    const isCurrentlyActive = currentEpisode?.id === ep.id;
                    const matchedEpisode = playlist.find((p) => p.id === ep.id);

                    return (
                      <div
                        key={ep.id}
                        className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-colors ${
                          isCurrentlyActive
                            ? 'bg-red-950/30 border-red-800/60'
                            : 'bg-zinc-900/80 hover:bg-zinc-900 border-zinc-800/80'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-zinc-100 truncate">
                            {ep.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                            <span className="font-mono text-emerald-400 font-medium">
                              {formatBytes(ep.sizeBytes)}
                            </span>
                            <span>·</span>
                            <span>{new Date(ep.downloadedAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {matchedEpisode && (
                            <button
                              onClick={() => {
                                triggerHaptic(8);
                                playEpisode(matchedEpisode, 0, 'archive');
                              }}
                              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                isCurrentlyActive && isPlaying
                                  ? 'bg-red-600 text-white'
                                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                              }`}
                              title="Play Episode"
                              aria-label={`Play ${ep.title}`}
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteOne(ep.id)}
                            disabled={deletingId === ep.id}
                            className="p-2 rounded-lg bg-zinc-800 hover:bg-red-950/80 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                            title="Delete downloaded audio"
                            aria-label={`Delete ${ep.title}`}
                          >
                            {deletingId === ep.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer note */}
          <div className="px-5 py-3 border-t border-zinc-800/80 bg-[#0c0e14] text-[11px] text-zinc-500 flex items-center justify-between">
            <span>Audio files are stored locally in your browser's IndexedDB.</span>
            <button
              onClick={onClose}
              className="font-semibold text-zinc-300 hover:text-white cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
