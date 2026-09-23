import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAudio } from '../context/AudioContext';
import { useCast } from '../context/CastContext';
import { formatSeconds } from '../utils/format';
import { getArtworkUrl, handleImageError } from '../utils/assets';
import { downloadEpisodeForOffline } from '../utils/offlineStorage';
import { triggerHaptic } from '../utils/haptics';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Download,
  Heart,
  ChevronDown,
  ChevronUp,
  FileText,
  X,
  Maximize2,
  Cast,
  SkipBack,
  SkipForward,
  CheckCircle2,
  HardDriveDownload,
  Loader2,
  Moon,
  Sparkles,
  Tv,
  BarChart3
} from 'lucide-react';
import { SleepTimerPopover } from './SleepTimerPopover';
import { PlaybackSpeedPopover } from './PlaybackSpeedPopover';

export const AudioPlayer: React.FC<{ onOpenEpisode?: (episode: any) => void }> = ({ onOpenEpisode }) => {
  const {
    currentEpisode,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    volume,
    isMuted,
    playMode,
    togglePlay,
    seek,
    skip,
    playNextEpisode,
    playPreviousEpisode,
    setPlaybackRate,
    setVolume,
    toggleMute,
    toggleFavorite,
    isFavorite,
    isOfflineSaved,
    refreshOfflineIds,
    removeOfflineEpisode,
    sleepTimerMinutes,
    sleepTimerRemaining,
    setSleepTimer,
    voiceBoostEnabled,
    toggleVoiceBoost,
    openCastReceiver,
    openStatsModal,
  } = useAudio();

  const [isDownloadingCurrent, setIsDownloadingCurrent] = useState(false);
  const [currentDownloadProgress, setCurrentDownloadProgress] = useState(0);

  const handleToggleOfflineCurrent = async () => {
    if (!currentEpisode || isDownloadingCurrent) return;
    triggerHaptic(10);

    if (isOfflineSaved(currentEpisode.id)) {
      await removeOfflineEpisode(currentEpisode.id);
      return;
    }

    try {
      setIsDownloadingCurrent(true);
      setCurrentDownloadProgress(0);
      await downloadEpisodeForOffline(currentEpisode, (pct) => {
        setCurrentDownloadProgress(pct);
      });
      await refreshOfflineIds();
    } catch (e) {
      console.warn('Failed to cache current episode:', e);
    } finally {
      setIsDownloadingCurrent(false);
    }
  };

  const {
    isCasting,
    castDeviceName,
    openCastModal
  } = useCast();

  const [isMinimized, setIsMinimized] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSleepTimerMenu, setShowSleepTimerMenu] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  if (!currentEpisode) return null;

  const isCurrentOffline = isOfflineSaved(currentEpisode.id);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const favorited = isFavorite(currentEpisode.id);
  const speedOptions = [0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.5, 1.75, 2.0];
  const sleepTimerOptions = [
    { label: 'Off', val: null },
    { label: '15m', val: 15 },
    { label: '30m', val: 30 },
    { label: '45m', val: 45 },
    { label: '60m', val: 60 },
  ];

  return (
    <>
      {/* ========================================================================= */}
      {/* MOBILE FULL-SCREEN / BOTTOM SHEET NOW PLAYING DRAWER (< sm breakpoint)   */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isMobileExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 sm:hidden bg-black/85 backdrop-blur-xl flex flex-col justify-end"
            onClick={() => setIsMobileExpanded(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0.05, bottom: 0.6 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100 || info.velocity.y > 350) {
                  triggerHaptic(8);
                  setIsMobileExpanded(false);
                }
              }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#121520] border-t border-zinc-700/80 rounded-t-3xl p-6 flex flex-col max-h-[92vh] overflow-y-auto text-zinc-100 shadow-2xl space-y-5 select-none"
              style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
            >
              {/* Sheet Drag Handle & Unified Header (Resolved conflicting controls: standardized single pull-down handle & chevron) */}
              <div
                className="w-full flex flex-col items-center cursor-grab active:cursor-grabbing pb-1"
                onClick={() => setIsMobileExpanded(false)}
              >
                <div className="w-12 h-1.5 bg-zinc-600 hover:bg-zinc-500 rounded-full mb-2 transition-colors" />
                <button
                  type="button"
                  aria-label="Collapse player sheet"
                  className="w-12 h-7 min-w-[48px] min-h-[48px] -my-2 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>

              {/* Large Mobile Artwork */}
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 mx-auto rounded-2xl overflow-hidden shadow-2xl border border-zinc-700/70 shrink-0">
                <img
                  src={getArtworkUrl(currentEpisode.imageUrl)}
                  alt={currentEpisode.title}
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                  referrerPolicy="no-referrer"
                />
                {isPlaying && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="flex items-end gap-1 h-6">
                      <span className="w-1 bg-red-500 rounded-full eq-bar-1" />
                      <span className="w-1 bg-red-500 rounded-full eq-bar-2" />
                      <span className="w-1 bg-red-500 rounded-full eq-bar-3" />
                      <span className="w-1 bg-red-500 rounded-full eq-bar-4" />
                    </div>
                  </div>
                )}
              </div>

              {/* Episode Details */}
              <div className="text-center space-y-1">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                    playMode === 'radio'
                      ? 'bg-red-950 text-red-300 border border-red-700'
                      : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                  }`}>
                    {playMode === 'radio' ? '24/7 Live Radio' : 'On-Demand Episode'}
                  </span>
                  {currentEpisode.episodeNumber && (
                    <span className="text-[10px] font-bold uppercase bg-red-950 text-red-300 border border-red-800/60 px-2 py-0.5 rounded-md">
                      EP {currentEpisode.episodeNumber}
                    </span>
                  )}
                  {currentEpisode.isBonus && (
                    <span className="text-[10px] font-medium bg-zinc-800 text-zinc-200 px-2 py-0.5 rounded-md">
                      Special
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-zinc-100 line-clamp-2 px-2">
                  {currentEpisode.title}
                </h3>
                <p className="text-xs text-zinc-300">The Comedy Button Podcast</p>
              </div>

              {/* Scrubber Progress Bar & Timestamps (Accessible role="slider") */}
              <div className="space-y-1.5 px-2">
                <div className="relative flex items-center">
                  <input
                    type="range"
                    role="slider"
                    aria-label="Seek audio timestamp"
                    aria-valuemin={0}
                    aria-valuemax={duration || 100}
                    aria-valuenow={currentTime}
                    aria-valuetext={`${formatSeconds(currentTime)} of ${formatSeconds(duration || 0)}`}
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={(e) => seek(Number(e.target.value))}
                    className="w-full h-2.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-red-600 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    style={{
                      background: `linear-gradient(to right, #dc2626 ${progressPercent}%, #27272a ${progressPercent}%)`
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs font-mono text-zinc-300">
                  <span>{formatSeconds(currentTime)}</span>
                  <span>{duration > 0 ? `-${formatSeconds(Math.max(0, duration - currentTime))}` : '00:00'}</span>
                </div>
              </div>

              {/* Tactile Mobile Playback Controls with 48px Touch Targets & Explicit Skip Intervals */}
              <div className="flex items-center justify-center gap-2 xs:gap-3 py-2">
                {/* Previous Track (48px Touch Target) */}
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => {
                    triggerHaptic(8);
                    playPreviousEpisode();
                  }}
                  className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-zinc-900 border border-zinc-700/80 text-zinc-200 flex items-center justify-center cursor-pointer active:bg-zinc-700 shadow-sm"
                  title="Previous Episode"
                  aria-label="Previous Episode"
                >
                  <SkipBack className="w-5 h-5" />
                </motion.button>

                {/* Skip -15s with Interval Indicator (48px Touch Target) */}
                <motion.button
                  whileTap={{ scale: 0.88, rotate: -15 }}
                  onClick={() => skip(-15)}
                  className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-zinc-800/90 text-zinc-200 flex items-center justify-center cursor-pointer active:bg-zinc-700 shadow-md relative"
                  title="Rewind 15 seconds"
                  aria-label="Rewind 15 seconds"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-black text-white pointer-events-none mt-0.5">
                    15
                  </span>
                </motion.button>

                {/* Main Play/Pause Button (64px Bounding Box with aria-pressed) */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.88 }}
                  onClick={togglePlay}
                  aria-pressed={isPlaying}
                  className="relative overflow-hidden w-16 h-16 min-w-[64px] min-h-[64px] rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-colors shadow-xl shadow-red-950/60 cursor-pointer"
                  title={isPlaying ? 'Pause' : 'Play'}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {isPlaying ? (
                      <motion.div
                        key="pause"
                        initial={{ scale: 0.5, rotate: -45, opacity: 0 }}
                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                        exit={{ scale: 0.5, rotate: 45, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Pause className="w-7 h-7 fill-current" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="play"
                        initial={{ scale: 0.5, rotate: 45, opacity: 0 }}
                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                        exit={{ scale: 0.5, rotate: -45, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Play className="w-7 h-7 fill-current ml-1" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>

                {/* Skip +30s with Interval Indicator (48px Touch Target) */}
                <motion.button
                  whileTap={{ scale: 0.88, rotate: 15 }}
                  onClick={() => skip(30)}
                  className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-zinc-800/90 text-zinc-200 flex items-center justify-center cursor-pointer active:bg-zinc-700 shadow-md relative"
                  title="Fast forward 30 seconds"
                  aria-label="Fast forward 30 seconds"
                >
                  <RotateCw className="w-5 h-5" />
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-black text-white pointer-events-none mt-0.5">
                    30
                  </span>
                </motion.button>

                {/* Next Track (48px Touch Target) */}
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => {
                    triggerHaptic(8);
                    playNextEpisode();
                  }}
                  className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-zinc-900 border border-zinc-700/80 text-zinc-200 flex items-center justify-center cursor-pointer active:bg-zinc-700 shadow-sm"
                  title="Next Episode"
                  aria-label="Next Episode"
                >
                  <SkipForward className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Secondary Utility Controls (All ≥ 48px touch targets) */}
              <div className="flex items-center justify-around gap-2 pt-2 border-t border-zinc-800/80 text-xs flex-wrap">
                {/* Speed Toggle */}
                <div className="relative">
                  <button
                    onClick={() => {
                      triggerHaptic(8);
                      setShowSpeedMenu(!showSpeedMenu);
                      setShowSleepTimerMenu(false);
                    }}
                    className="min-h-[48px] min-w-[48px] px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700/80 font-mono font-bold text-zinc-200 flex items-center gap-1 cursor-pointer active:bg-zinc-800"
                    aria-label={`Playback speed ${playbackRate}x`}
                  >
                    <span>{playbackRate}x</span>
                  </button>
                  {showSpeedMenu && (
                    <div className="absolute bottom-full mb-2 left-0 bg-zinc-900 border border-zinc-700 rounded-xl py-1 shadow-2xl z-50 flex flex-col w-24">
                      {speedOptions.map((rate) => (
                        <button
                          key={rate}
                          onClick={() => {
                            triggerHaptic(8);
                            setPlaybackRate(rate);
                            setShowSpeedMenu(false);
                          }}
                          className={`min-h-[44px] px-3 py-2 text-xs text-left font-mono font-semibold ${
                            playbackRate === rate ? 'bg-red-600 text-white' : 'text-zinc-200 hover:bg-zinc-800'
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sleep Timer Menu Toggle */}
                <div className="relative">
                  <button
                    onClick={() => {
                      triggerHaptic(8);
                      setShowSleepTimerMenu(!showSleepTimerMenu);
                      setShowSpeedMenu(false);
                    }}
                    className={`min-h-[48px] min-w-[48px] px-3.5 py-2.5 rounded-xl border flex items-center gap-1.5 cursor-pointer font-semibold transition-colors active:bg-zinc-800 ${
                      sleepTimerRemaining !== null
                        ? 'bg-red-950/80 border-red-700 text-red-300'
                        : 'bg-zinc-900 border-zinc-700/80 text-zinc-200'
                    }`}
                    aria-label="Sleep timer"
                  >
                    <Moon className="w-4 h-4 text-zinc-300" />
                    <span>{sleepTimerRemaining !== null ? formatSeconds(sleepTimerRemaining) : 'Timer'}</span>
                  </button>
                  {showSleepTimerMenu && (
                    <div className="absolute bottom-full mb-2 left-0 bg-zinc-900 border border-zinc-700 rounded-xl py-1 shadow-2xl z-50 flex flex-col w-28">
                      {sleepTimerOptions.map((opt) => (
                        <button
                          key={opt.label}
                          onClick={() => {
                            setSleepTimer(opt.val);
                            setShowSleepTimerMenu(false);
                          }}
                          className={`min-h-[44px] px-3 py-2 text-xs text-left font-semibold ${
                            sleepTimerMinutes === opt.val ? 'bg-red-600 text-white' : 'text-zinc-200 hover:bg-zinc-800'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cast / Output Device Button (≥ 48px Target) */}
                <button
                  onClick={() => {
                    triggerHaptic(8);
                    openCastModal();
                  }}
                  className={`min-h-[48px] min-w-[48px] px-3.5 py-2.5 rounded-xl border flex items-center justify-center gap-1.5 cursor-pointer font-semibold transition-colors active:bg-zinc-800 ${
                    isCasting
                      ? 'bg-emerald-950/80 border-emerald-600/80 text-emerald-400 shadow-sm shadow-emerald-950/40'
                      : 'bg-zinc-900 border-zinc-700/80 text-zinc-200 hover:text-white'
                  }`}
                  title={isCasting ? `Casting to ${castDeviceName || 'Device'}` : 'Cast to TV or Speakers'}
                  aria-label="Cast to TV or Speakers"
                >
                  <Cast className={`w-4 h-4 ${isCasting ? 'animate-pulse' : ''}`} />
                  <span>{isCasting ? 'Casting' : 'Cast'}</span>
                </button>

                {/* Voice Boost & Dynamic Range Compressor Toggle (≥ 48px Target) */}
                <button
                  onClick={toggleVoiceBoost}
                  className={`min-h-[48px] min-w-[48px] px-3.5 py-2.5 rounded-xl border flex items-center justify-center gap-1.5 cursor-pointer font-semibold transition-all active:bg-zinc-800 ${
                    voiceBoostEnabled
                      ? 'bg-amber-950/80 border-amber-600/80 text-amber-300 shadow-sm shadow-amber-950/50'
                      : 'bg-zinc-900 border-zinc-700/80 text-zinc-200 hover:text-white'
                  }`}
                  title={voiceBoostEnabled ? 'Voice Boost Active (Tap to disable)' : 'Enable Speech Vocal Boost & Compressor'}
                  aria-label="Voice Boost and Equalizer"
                  aria-pressed={voiceBoostEnabled}
                >
                  <Sparkles className={`w-4 h-4 ${voiceBoostEnabled ? 'text-amber-400' : 'text-zinc-400'}`} />
                  <span>Boost</span>
                </button>

                {/* TV Receiver Mode Screen (≥ 48px Target) */}
                <button
                  onClick={() => {
                    triggerHaptic(8);
                    setIsMobileExpanded(false);
                    openCastReceiver();
                  }}
                  className="min-h-[48px] min-w-[48px] px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-200 hover:text-white flex items-center justify-center gap-1.5 font-semibold cursor-pointer active:bg-zinc-800"
                  title="Open Dedicated TV Receiver Screen"
                  aria-label="Open Dedicated TV Receiver Screen"
                >
                  <Tv className="w-4 h-4 text-purple-400" />
                  <span>TV</span>
                </button>

                {/* View Show Notes Button (≥ 48px Target) */}
                <button
                  onClick={() => {
                    triggerHaptic(8);
                    setIsMobileExpanded(false);
                    onOpenEpisode?.(currentEpisode);
                  }}
                  className="min-h-[48px] min-w-[48px] px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-200 hover:text-white flex items-center gap-1.5 font-semibold cursor-pointer active:bg-zinc-800"
                  aria-label="View Show Notes"
                >
                  <FileText className="w-4 h-4 text-red-400" />
                  <span>Notes</span>
                </button>

                {/* Favorite Toggle (≥ 48px Target) */}
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  animate={{ scale: favorited ? [1, 1.3, 1] : 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  onClick={() => {
                    triggerHaptic(10);
                    toggleFavorite(currentEpisode.id);
                  }}
                  className={`min-h-[48px] min-w-[48px] p-3 rounded-xl border flex items-center justify-center cursor-pointer active:bg-zinc-800 ${
                    favorited
                      ? 'bg-red-950/80 border-red-800 text-red-400'
                      : 'bg-zinc-900 border-zinc-700/80 text-zinc-300'
                  }`}
                  title={favorited ? 'Favorited' : 'Add to favorites'}
                  aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
                  aria-pressed={favorited}
                >
                  <Heart className={`w-5 h-5 ${favorited ? 'fill-current text-red-500' : ''}`} />
                </motion.button>

                {/* Offline IndexedDB Save (≥ 48px Target) */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleToggleOfflineCurrent}
                  className={`min-h-[48px] px-3.5 py-2.5 rounded-xl border flex items-center justify-center gap-1.5 cursor-pointer font-semibold transition-colors active:bg-zinc-800 ${
                    isCurrentOffline
                      ? 'bg-emerald-950/80 border-emerald-600/80 text-emerald-300 shadow-sm'
                      : isDownloadingCurrent
                      ? 'bg-zinc-800 border-yellow-600/80 text-yellow-300'
                      : 'bg-zinc-900 border-zinc-700/80 text-zinc-200 hover:text-white'
                  }`}
                  title={
                    isCurrentOffline
                      ? 'Saved offline in IndexedDB (tap to remove)'
                      : isDownloadingCurrent
                      ? `Saving offline ${currentDownloadProgress}%`
                      : 'Save offline for PWA listening'
                  }
                  aria-label="Save offline for PWA listening"
                >
                  {isDownloadingCurrent ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
                      <span className="font-mono text-xs">{currentDownloadProgress}%</span>
                    </>
                  ) : isCurrentOffline ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Offline</span>
                    </>
                  ) : (
                    <>
                      <HardDriveDownload className="w-4 h-4" />
                      <span>Save</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* DOCKED BOTTOM BAR (Responsive for both Mobile and Desktop)                */}
      {/* ========================================================================= */}
      <aside
        aria-label="Audio playback bar"
        className="fixed bottom-0 left-0 right-0 z-40 bg-[#0e111a]/95 backdrop-blur-xl border-t border-zinc-800 text-zinc-100 shadow-2xl transition-all duration-200"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Top micro progress accent line */}
        <div className="relative w-full h-1 bg-zinc-800/80">
          <div
            className="absolute top-0 left-0 bottom-0 bg-red-600 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* MOBILE COMPACT VIEW (< sm)                                              */}
        {/* ----------------------------------------------------------------------- */}
        <div className="sm:hidden px-3 py-2 flex items-center justify-between gap-2.5">
          {/* Thumbnail & Title (Tapping opens the full mobile Now Playing sheet) */}
          <div
            className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer select-none"
            onClick={() => setIsMobileExpanded(true)}
          >
            <div className="relative shrink-0 w-11 h-11 rounded-lg overflow-hidden border border-zinc-700 shadow-sm">
              <img
                src={getArtworkUrl(currentEpisode.imageUrl)}
                alt={currentEpisode.title}
                className="w-full h-full object-cover"
                onError={handleImageError}
                referrerPolicy="no-referrer"
              />
              {isPlaying && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="flex items-end gap-0.5 h-2.5">
                    <span className="w-0.5 bg-red-500 rounded-full eq-bar-1" />
                    <span className="w-0.5 bg-red-500 rounded-full eq-bar-2" />
                    <span className="w-0.5 bg-red-500 rounded-full eq-bar-3" />
                  </div>
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                  playMode === 'radio'
                    ? 'bg-red-950 text-red-300 border border-red-800/60'
                    : 'bg-zinc-800 text-zinc-300'
                }`}>
                  {playMode === 'radio' ? 'Live' : 'Ep'}
                </span>
                <span className="text-[11px] font-mono text-zinc-300">
                  {formatSeconds(currentTime)} / {formatSeconds(duration || 0)}
                </span>
              </div>
              <p className="text-xs font-semibold text-zinc-100 truncate">
                {currentEpisode.title}
              </p>
            </div>
          </div>

          {/* Quick Mobile Tap Actions with 48px Minimum Touch Targets */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Cast Quick Button (48px Touch Target) */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => {
                triggerHaptic(8);
                openCastModal();
              }}
              className={`w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl flex items-center justify-center cursor-pointer transition-colors ${
                isCasting ? 'text-emerald-400 bg-emerald-950/50' : 'text-zinc-300 active:text-white active:bg-zinc-800'
              }`}
              title={isCasting ? `Casting to ${castDeviceName || 'Device'}` : 'Cast to TV or Speakers'}
              aria-label="Cast to TV or Speakers"
            >
              <Cast className={`w-5 h-5 ${isCasting ? 'animate-pulse' : ''}`} />
            </motion.button>

            {/* Rewind 15s with number inside arrow (48px Touch Target) */}
            <motion.button
              whileTap={{ scale: 0.88, rotate: -15 }}
              onClick={() => skip(-15)}
              className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full text-zinc-200 active:text-white flex items-center justify-center cursor-pointer relative active:bg-zinc-800"
              title="Rewind 15s"
              aria-label="Rewind 15 seconds"
            >
              <RotateCcw className="w-5 h-5" />
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-black text-white pointer-events-none mt-0.5">
                15
              </span>
            </motion.button>

            {/* Play / Pause (48px Touch Target with aria-pressed) */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={togglePlay}
              aria-pressed={isPlaying}
              className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-red-600 active:bg-red-500 text-white flex items-center justify-center cursor-pointer shadow-md shadow-red-950/50"
              title={isPlaying ? 'Pause' : 'Play'}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isPlaying ? (
                  <motion.div
                    key="pause"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Pause className="w-5 h-5 fill-current" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="play"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Expand Sheet (48px Touch Target) */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => {
                triggerHaptic(8);
                setIsMobileExpanded(true);
              }}
              className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl text-zinc-300 active:text-white flex items-center justify-center cursor-pointer active:bg-zinc-800"
              title="Expand player"
              aria-label="Expand player"
            >
              <ChevronUp className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* DESKTOP VIEW (>= sm)                                                    */}
        {/* ----------------------------------------------------------------------- */}
        <div className="hidden sm:block">
          {isMinimized ? (
            <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={togglePlay}
                  aria-pressed={isPlaying}
                  className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center cursor-pointer shadow-md shadow-red-950/40"
                  title={isPlaying ? 'Pause' : 'Play'}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </motion.button>
                <div
                  className="min-w-0 cursor-pointer"
                  onClick={() => onOpenEpisode?.(currentEpisode)}
                >
                  <p className="text-sm font-semibold truncate text-zinc-100 hover:text-red-400 transition-colors">
                    {currentEpisode.title}
                  </p>
                  <p className="text-xs text-zinc-300 font-mono">
                    {formatSeconds(currentTime)} / {formatSeconds(duration || 0)}
                  </p>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => {
                  triggerHaptic(8);
                  setIsMinimized(false);
                }}
                className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl bg-zinc-800/80 text-zinc-200 hover:text-white flex items-center justify-center cursor-pointer"
                title="Expand player"
                aria-label="Expand player"
              >
                <ChevronUp className="w-5 h-5" />
              </motion.button>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
              {/* Main Controls Grid */}
              <div className="flex items-center justify-between gap-3 sm:gap-6">
                {/* Left: Artwork + Episode Info */}
                <div className="flex items-center gap-3 min-w-0 w-1/4 max-w-xs">
                  <div
                    className="relative shrink-0 cursor-pointer group"
                    onClick={() => onOpenEpisode?.(currentEpisode)}
                  >
                    <img
                      src={getArtworkUrl(currentEpisode.imageUrl)}
                      alt={currentEpisode.title}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border border-zinc-700/80 shadow-md group-hover:opacity-90 transition-opacity"
                      onError={handleImageError}
                      referrerPolicy="no-referrer"
                    />
                    {isPlaying && (
                      <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                        <div className="flex items-end gap-0.5 h-3">
                          <span className="w-0.5 bg-red-500 rounded-full eq-bar-1" />
                          <span className="w-0.5 bg-red-500 rounded-full eq-bar-2" />
                          <span className="w-0.5 bg-red-500 rounded-full eq-bar-3" />
                          <span className="w-0.5 bg-red-500 rounded-full eq-bar-4" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded-md ${
                        playMode === 'radio'
                          ? 'bg-red-950/90 text-red-300 border border-red-700/80'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}>
                        {playMode === 'radio' ? '24/7 Live' : 'Archive'}
                      </span>
                      {currentEpisode.episodeNumber && (
                        <span className="text-[10px] font-bold uppercase bg-red-950/80 text-red-300 border border-red-800/60 px-1.5 py-0.2 rounded-md">
                          EP {currentEpisode.episodeNumber}
                        </span>
                      )}
                    </div>
                    <h4
                      onClick={() => onOpenEpisode?.(currentEpisode)}
                      className="text-xs sm:text-sm font-semibold text-zinc-100 truncate cursor-pointer hover:text-red-400 transition-colors"
                      title={currentEpisode.title}
                    >
                      {currentEpisode.title}
                    </h4>
                    <p className="text-[11px] text-zinc-300 truncate">
                      The Comedy Button
                    </p>
                  </div>
                </div>

                {/* Center: Playback Controls & Progress Bar */}
                <div className="flex-1 max-w-xl flex flex-col items-center gap-1">
                  {/* Button Controls with 48px Interactive Bounding Boxes */}
                  <div className="flex items-center gap-1 sm:gap-2">
                    {/* Previous Episode (48px Touch Target) */}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        triggerHaptic(8);
                        playPreviousEpisode();
                      }}
                      className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-colors flex items-center justify-center cursor-pointer"
                      title="Previous Episode"
                      aria-label="Previous Episode"
                    >
                      <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
                    </motion.button>

                    {/* Skip -15s with explicit "15" label inside arrow (48px Touch Target) */}
                    <motion.button
                      whileTap={{ scale: 0.9, rotate: -15 }}
                      onClick={() => skip(-15)}
                      className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-colors flex items-center justify-center cursor-pointer relative"
                      title="Rewind 15 seconds"
                      aria-label="Rewind 15 seconds"
                    >
                      <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] sm:text-[10px] font-mono font-black text-white pointer-events-none mt-0.5">
                        15
                      </span>
                    </motion.button>

                    {/* Primary Play/Pause Button (52px Box with aria-pressed) */}
                    <motion.button
                      whileHover={{ scale: 1.06 }}
                      whileTap={{ scale: 0.88 }}
                      onClick={togglePlay}
                      aria-pressed={isPlaying}
                      className="relative overflow-hidden w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-colors shadow-lg shadow-red-950/60 cursor-pointer group"
                      title={isPlaying ? 'Pause' : 'Play'}
                      aria-label={isPlaying ? 'Pause' : 'Play'}
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        {isPlaying ? (
                          <motion.div
                            key="pause"
                            initial={{ scale: 0.5, rotate: -45, opacity: 0 }}
                            animate={{ scale: 1, rotate: 0, opacity: 1 }}
                            exit={{ scale: 0.5, rotate: 45, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Pause className="w-5 h-5 fill-current" />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="play"
                            initial={{ scale: 0.5, rotate: 45, opacity: 0 }}
                            animate={{ scale: 1, rotate: 0, opacity: 1 }}
                            exit={{ scale: 0.5, rotate: -45, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Play className="w-5 h-5 fill-current ml-0.5" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>

                    {/* Skip +30s with explicit "30" label inside arrow (48px Touch Target) */}
                    <motion.button
                      whileTap={{ scale: 0.9, rotate: 15 }}
                      onClick={() => skip(30)}
                      className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-colors flex items-center justify-center cursor-pointer relative"
                      title="Fast forward 30 seconds"
                      aria-label="Fast forward 30 seconds"
                    >
                      <RotateCw className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] sm:text-[10px] font-mono font-black text-white pointer-events-none mt-0.5">
                        30
                      </span>
                    </motion.button>

                    {/* Next Episode (48px Touch Target) */}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        triggerHaptic(8);
                        playNextEpisode();
                      }}
                      className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-colors flex items-center justify-center cursor-pointer"
                      title="Next Episode"
                      aria-label="Next Episode"
                    >
                      <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
                    </motion.button>

                    {/* Playback Rate Selector */}
                    <div className="hidden md:block ml-0.5">
                      <PlaybackSpeedPopover
                        playbackRate={playbackRate}
                        onSelectRate={(rate) => {
                          triggerHaptic(8);
                          setPlaybackRate(rate);
                        }}
                        isOpen={showSpeedMenu}
                        onToggle={() => {
                          setShowSpeedMenu(!showSpeedMenu);
                          setShowSleepTimerMenu(false);
                        }}
                        onClose={() => setShowSpeedMenu(false)}
                      />
                    </div>

                    {/* Desktop Sleep Timer Selector */}
                    <div className="hidden md:block">
                      <SleepTimerPopover
                        sleepTimerMinutes={sleepTimerMinutes}
                        sleepTimerRemaining={sleepTimerRemaining}
                        onSelectTimer={(minutes) => setSleepTimer(minutes)}
                        isOpen={showSleepTimerMenu}
                        onToggle={() => {
                          setShowSleepTimerMenu(!showSleepTimerMenu);
                          setShowSpeedMenu(false);
                        }}
                        onClose={() => setShowSleepTimerMenu(false)}
                      />
                    </div>
                  </div>

                  {/* Scrubber Progress Bar & Timestamps (Accessible role="slider" with AA contrast text) */}
                  <div className="w-full flex items-center gap-2 text-xs font-mono text-zinc-300">
                    <span className="w-12 text-right">{formatSeconds(currentTime)}</span>
                    <div className="relative flex-1 group flex items-center">
                      <input
                        type="range"
                        role="slider"
                        aria-label="Seek audio timestamp"
                        aria-valuemin={0}
                        aria-valuemax={duration || 100}
                        aria-valuenow={currentTime}
                        aria-valuetext={`${formatSeconds(currentTime)} of ${formatSeconds(duration || 0)}`}
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={(e) => seek(Number(e.target.value))}
                        className="w-full h-1.5 bg-zinc-800 group-hover:h-2.5 rounded-full appearance-none cursor-pointer accent-red-600 focus:outline-none transition-all"
                        style={{
                          background: `linear-gradient(to right, #dc2626 ${progressPercent}%, #27272a ${progressPercent}%)`
                        }}
                      />
                    </div>
                    <span className="w-12">
                      {duration > 0 ? `-${formatSeconds(Math.max(0, duration - currentTime))}` : '00:00'}
                    </span>
                  </div>
                </div>

                {/* Right: Actions & Volume (All buttons expanded to ≥ 48px touch targets) */}
                <div className="flex items-center gap-1 sm:gap-1.5 w-1/4 justify-end">
                  {/* Cast to External Device (48px Touch Target) */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      triggerHaptic(8);
                      openCastModal();
                    }}
                    className={`w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl flex items-center justify-center transition-colors cursor-pointer relative ${
                      isCasting
                        ? 'text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 border border-emerald-700/50 shadow-sm'
                        : 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
                    }`}
                    title={isCasting ? `Casting to ${castDeviceName || 'Device'}` : 'Cast to TV or Speakers'}
                    aria-label="Cast to TV or Speakers"
                  >
                    <Cast className={`w-4 h-4 ${isCasting ? 'animate-pulse' : ''}`} />
                    {isCasting && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#0e111a]" />
                    )}
                  </motion.button>

                  {/* Voice Boost Toggle (48px Touch Target) */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleVoiceBoost}
                    className={`w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl flex items-center justify-center transition-colors cursor-pointer relative ${
                      voiceBoostEnabled
                        ? 'text-amber-300 bg-amber-950/60 border border-amber-600/60 shadow-sm'
                        : 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
                    }`}
                    title={voiceBoostEnabled ? 'Voice Boost & EQ Active (Click to disable)' : 'Enable Speech Vocal Boost & Compressor'}
                    aria-label="Voice Boost and Equalizer"
                    aria-pressed={voiceBoostEnabled}
                  >
                    <Sparkles className={`w-4 h-4 ${voiceBoostEnabled ? 'text-amber-400' : ''}`} />
                  </motion.button>

                  {/* TV Receiver Mode Screen (48px Touch Target) */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      triggerHaptic(8);
                      openCastReceiver();
                    }}
                    className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-colors flex items-center justify-center cursor-pointer"
                    title="Open Dedicated TV Receiver Screen"
                    aria-label="Open Dedicated TV Receiver Screen"
                  >
                    <Tv className="w-4 h-4 text-purple-400" />
                  </motion.button>

                  {/* Listening Stats & Highlights (48px Touch Target) */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      triggerHaptic(8);
                      openStatsModal();
                    }}
                    className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-colors flex items-center justify-center cursor-pointer"
                    title="Listening Statistics & Year-in-Review Highlights"
                    aria-label="Listening Statistics & Year-in-Review Highlights"
                  >
                    <BarChart3 className="w-4 h-4 text-red-400" />
                  </motion.button>

                  {/* Show Notes shortcut button (48px Touch Target) */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      triggerHaptic(8);
                      onOpenEpisode?.(currentEpisode);
                    }}
                    className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-colors flex items-center justify-center cursor-pointer"
                    title="View Show Notes"
                    aria-label="View Show Notes"
                  >
                    <FileText className="w-4 h-4" />
                  </motion.button>

                  {/* Favorite (48px Touch Target) */}
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    animate={{ scale: favorited ? [1, 1.3, 1] : 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    onClick={() => {
                      triggerHaptic(10);
                      toggleFavorite(currentEpisode.id);
                    }}
                    className={`w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                      favorited
                        ? 'text-red-500 hover:text-red-400 bg-red-950/40 border border-red-800/40'
                        : 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
                    }`}
                    title={favorited ? 'Remove from favorites' : 'Favorite'}
                    aria-label={favorited ? 'Remove from favorites' : 'Favorite'}
                    aria-pressed={favorited}
                  >
                    <Heart className={`w-4 h-4 ${favorited ? 'fill-current text-red-500' : ''}`} />
                  </motion.button>

                  {/* Offline IndexedDB Save (48px Touch Target) */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleToggleOfflineCurrent}
                    className={`min-h-[48px] px-2.5 rounded-xl transition-colors cursor-pointer hidden sm:flex items-center gap-1.5 text-xs ${
                      isCurrentOffline
                        ? 'text-emerald-300 bg-emerald-950/60 border border-emerald-700/50'
                        : isDownloadingCurrent
                        ? 'text-yellow-300 bg-zinc-800'
                        : 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
                    }`}
                    title={
                      isCurrentOffline
                        ? 'Cached in Offline Storage (Tap to remove)'
                        : isDownloadingCurrent
                        ? `Downloading offline ${currentDownloadProgress}%`
                        : 'Save episode for Offline PWA playback'
                    }
                    aria-label="Save for offline listening"
                  >
                    {isDownloadingCurrent ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
                        <span className="font-mono text-[10px] hidden xl:inline">{currentDownloadProgress}%</span>
                      </>
                    ) : isCurrentOffline ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-[11px] hidden xl:inline font-semibold">Saved</span>
                      </>
                    ) : (
                      <>
                        <HardDriveDownload className="w-4 h-4" />
                        <span className="text-[11px] hidden xl:inline">Save</span>
                      </>
                    )}
                  </motion.button>

                  {/* Volume Slider */}
                  <div className="items-center gap-1 hidden lg:flex">
                    <button
                      onClick={toggleMute}
                      className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-lg text-zinc-300 hover:text-white flex items-center justify-center cursor-pointer"
                      title={isMuted ? 'Unmute' : 'Mute'}
                      aria-label={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-4 h-4 text-zinc-400" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                    <input
                      type="range"
                      role="slider"
                      aria-label="Playback volume"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round((isMuted ? 0 : volume) * 100)}
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="w-16 h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-red-600"
                    />
                  </div>

                  {/* Minimize Player (48px Touch Target) */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      triggerHaptic(8);
                      setIsMinimized(true);
                    }}
                    className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl text-zinc-300 hover:text-white flex items-center justify-center cursor-pointer hover:bg-zinc-800/80"
                    title="Minimize player"
                    aria-label="Minimize player"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

