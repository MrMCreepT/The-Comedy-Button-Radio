import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Episode, LiveTimelineStatus } from '../types';
import { useAudio } from '../context/AudioContext';
import { useCast } from '../context/CastContext';
import { getStreamTimeline } from '../services/api';
import { formatSeconds } from '../utils/format';
import { getArtworkUrl, handleImageError } from '../utils/assets';
import { OfficialLinksBar } from './OfficialLinksBar';
import { triggerHaptic } from '../utils/haptics';
import {
  Radio,
  Play,
  Pause,
  Clock,
  Calendar,
  Volume2,
  VolumeX,
  Share2,
  Check,
  Moon,
  Info,
  Users,
  Timer,
  Cast,
  Loader2,
  RadioTower,
  Sparkles,
  Heart,
  Bell,
  FileText
} from 'lucide-react';

interface RadioStreamStationProps {
  onOpenEpisode?: (episode: Episode) => void;
}

export const RadioStreamStation: React.FC<RadioStreamStationProps> = ({
  onOpenEpisode
}) => {
  const {
    currentEpisode,
    isPlaying,
    currentTime,
    playEpisode,
    togglePlay,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    seek,
    setOnEndedCallback,
    toggleFavorite,
    isFavorite,
    sleepTimerMinutes,
    sleepTimerRemaining,
    setSleepTimer,
  } = useAudio();

  const {
    isCasting,
    castDeviceName,
    openCastModal
  } = useCast();

  const [timeline, setTimeline] = useState<LiveTimelineStatus | null>(null);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [liveOffsetSeconds, setLiveOffsetSeconds] = useState(0);
  const [liveRemainingSeconds, setLiveRemainingSeconds] = useState(0);

  const [copiedLink, setCopiedLink] = useState(false);
  const [alertEpisodeTitle, setAlertEpisodeTitle] = useState<string | null>(null);

  // Animated states for Sync to Live
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncSuccess, setSyncSuccess] = useState(false);

  // Fetch synchronized timeline from server
  const loadTimeline = async () => {
    setLoadingTimeline(true);
    try {
      const data = await getStreamTimeline();
      setTimeline(data);
      if (data?.onAir) {
        setLiveOffsetSeconds(data.onAir.currentOffsetSeconds);
        setLiveRemainingSeconds(data.onAir.remainingSeconds);
      }
    } catch (err) {
      console.error('Failed to load live broadcast schedule:', err);
    } finally {
      setLoadingTimeline(false);
    }
  };

  useEffect(() => {
    loadTimeline();
  }, []);

  // Synchronized second ticker
  useEffect(() => {
    const ticker = setInterval(() => {
      setLiveOffsetSeconds(prev => prev + 1);

      setLiveRemainingSeconds(prev => {
        if (prev <= 1) {
          // Transition to next scheduled broadcast episode
          loadTimeline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(ticker);
  }, []);

  // Seamless continuous play on ended: refresh schedule display when episode finishes
  useEffect(() => {
    setOnEndedCallback(() => {
      loadTimeline();
    });

    return () => {
      setOnEndedCallback(null);
    };
  }, []);

  const onAirEpisode = timeline?.onAir?.episode;
  const isPlayingCurrentBroadcast = Boolean(
    onAirEpisode && currentEpisode?.id === onAirEpisode.id && isPlaying
  );

  const handleTuneInLive = () => {
    if (!onAirEpisode) return;
    triggerHaptic(14);

    const validOffset = typeof liveOffsetSeconds === 'number' && !isNaN(liveOffsetSeconds) && isFinite(liveOffsetSeconds)
      ? Math.max(0, liveOffsetSeconds)
      : 0;

    if (isPlayingCurrentBroadcast) {
      togglePlay();
    } else {
      playEpisode(onAirEpisode, validOffset, 'radio');
    }
  };

  const handleResyncToExactLive = () => {
    if (!onAirEpisode || isSyncing) return;
    triggerHaptic(10);

    setIsSyncing(true);
    setSyncProgress(0);
    setSyncSuccess(false);

    // Rapid, smooth progress bar fill over ~550ms
    const startTime = performance.now();
    const duration = 550; // ms

    const animateProgress = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(100, Math.round((elapsed / duration) * 100));
      setSyncProgress(progress);

      if (elapsed < duration) {
        requestAnimationFrame(animateProgress);
      } else {
        // Complete sync
        seek(liveOffsetSeconds);
        if (!isPlaying) togglePlay();
        setSyncSuccess(true);
        setTimeout(() => {
          setIsSyncing(false);
          setSyncProgress(0);
          setSyncSuccess(false);
        }, 800);
      }
    };

    requestAnimationFrame(animateProgress);
  };

  const handleShareStation = () => {
    triggerHaptic(8);
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSetAlert = (epTitle: string) => {
    triggerHaptic(10);
    setAlertEpisodeTitle(epTitle);
    setTimeout(() => setAlertEpisodeTitle(null), 3500);
  };

  const currentProgressPercent =
    timeline?.onAir?.durationSeconds && timeline.onAir.durationSeconds > 0
      ? (liveOffsetSeconds / timeline.onAir.durationSeconds) * 100
      : 0;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Alert toast for Coming Up Next */}
      <AnimatePresence>
        {alertEpisodeTitle && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-4 z-50 bg-zinc-900 border border-red-600/70 text-zinc-100 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 max-w-sm"
          >
            <div className="w-8 h-8 rounded-full bg-red-600/20 text-red-400 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div className="text-xs">
              <p className="font-bold text-white">Broadcast Reminder Set!</p>
              <p className="text-zinc-300 line-clamp-1">{alertEpisodeTitle}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 24/7 Live Broadcast Hero Section */}
      <div className="bg-[#121520] border border-zinc-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl relative overflow-hidden">
        {/* Subtle crimson ambient glow */}
        <div className="absolute -right-16 -top-16 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Station Status Banner */}
        <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="relative flex items-center justify-center shrink-0">
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-600" />
              <span className="absolute w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-red-500/60 animate-ping" />
            </div>
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-red-500 shrink-0">
              Live Broadcast
            </span>
            <span className="text-zinc-600 hidden xs:inline">•</span>
            <span className="text-[11px] sm:text-xs text-zinc-300 font-medium truncate hidden xs:inline">
              Synchronized 24/7 Global Stream
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Cast Live Stream */}
            <button
              onClick={() => {
                triggerHaptic(8);
                openCastModal();
              }}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer min-h-[44px] ${
                isCasting
                  ? 'bg-emerald-950/80 border-emerald-600/80 text-emerald-300 shadow-md shadow-emerald-950/40'
                  : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700/80 text-zinc-200 hover:text-white'
              }`}
              title={isCasting ? `Casting to ${castDeviceName || 'Wireless Device'}` : 'Cast stream to TV or Speaker'}
              aria-label="Cast live stream"
            >
              <Cast className={`w-4 h-4 ${isCasting ? 'text-emerald-400 animate-pulse' : 'text-zinc-300'}`} />
              <span className="hidden xs:inline">{isCasting ? 'Casting' : 'Cast'}</span>
              {isCasting && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
            </button>

            <button
              onClick={handleShareStation}
              className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs text-zinc-200 font-medium flex items-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
              title="Copy Radio Link"
              aria-label="Share Radio Link"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-zinc-300" />
                  <span className="hidden sm:inline">Share</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* On-Air Program Featured Layout */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-4 sm:gap-6 lg:gap-8">
          {/* Cover Art with Live Equalizer */}
          <div className="relative shrink-0 w-36 h-36 xs:w-44 xs:h-44 sm:w-52 sm:h-52 lg:w-56 lg:h-56 rounded-2xl overflow-hidden shadow-2xl border border-zinc-700/80 group mx-auto lg:mx-0">
            <img
              src={getArtworkUrl(onAirEpisode?.imageUrl)}
              alt="On Air Now"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={handleImageError}
              referrerPolicy="no-referrer"
            />

            {/* Dark gradient vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Live Equalizer indicator */}
            {isPlayingCurrentBroadcast && (
              <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 bg-black/60 backdrop-blur-md px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg flex items-center gap-1 border border-zinc-700/60">
                <span className="w-1 bg-red-500 rounded-full h-3 sm:h-4 eq-bar-1" />
                <span className="w-1 bg-red-500 rounded-full h-3 sm:h-4 eq-bar-2" />
                <span className="w-1 bg-red-500 rounded-full h-3 sm:h-4 eq-bar-3" />
                <span className="w-1 bg-red-500 rounded-full h-3 sm:h-4 eq-bar-4" />
                <span className="text-[10px] sm:text-[11px] font-bold text-red-400 ml-1">LIVE</span>
              </div>
            )}

            {/* Episode Number pill */}
            {onAirEpisode?.episodeNumber && (
              <span className="absolute bottom-2.5 left-2.5 sm:bottom-3 sm:left-3 text-[11px] sm:text-xs font-bold text-white bg-red-600/90 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg backdrop-blur-sm shadow-md">
                EP {onAirEpisode.episodeNumber}
              </span>
            )}
          </div>

          {/* Broadcast Metadata & Controls */}
          <div className="flex-1 w-full text-center lg:text-left space-y-3 sm:space-y-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300 mb-1">
                <Radio className="w-3.5 h-3.5 text-red-500" />
                <span>NOW PLAYING ON AIR</span>
              </div>

              <h2
                onClick={() => onAirEpisode && onOpenEpisode?.(onAirEpisode)}
                className="text-lg sm:text-2xl lg:text-3xl font-bold text-zinc-100 leading-tight hover:text-red-400 transition-colors cursor-pointer"
              >
                {onAirEpisode?.title || 'Connecting to live broadcast...'}
              </h2>

              <p className="text-xs sm:text-sm text-zinc-300 mt-1.5 sm:mt-2 line-clamp-2 max-w-2xl mx-auto lg:mx-0">
                {onAirEpisode?.description?.replace(/<[^>]*>?/gm, '') ||
                  'Streaming from the shuffled 560+ episode master catalog.'}
              </p>
            </div>

            {/* Clean Up Redundant Time Indicators: Standard elapsed on left, remaining on right */}
            <div className="space-y-1.5 max-w-2xl mx-auto lg:mx-0">
              <div
                role="progressbar"
                aria-label="Live broadcast progress"
                aria-valuenow={Math.round(currentProgressPercent)}
                aria-valuemin={0}
                aria-valuemax={100}
                className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-red-600 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(100, Math.max(0, currentProgressPercent))}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-zinc-300 select-none">
                <span>{formatSeconds(liveOffsetSeconds)}</span>
                <span>-{formatSeconds(liveRemainingSeconds)}</span>
              </div>
            </div>

            {/* Tune In Live Call To Action Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 pt-2">
              <button
                onClick={handleTuneInLive}
                disabled={!onAirEpisode}
                aria-pressed={isPlayingCurrentBroadcast}
                className="relative overflow-hidden w-full sm:w-auto min-h-[48px] px-6 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-red-600 hover:from-red-500 hover:to-red-500 active:scale-95 disabled:opacity-50 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-red-950/60 transition-transform cursor-pointer group"
              >
                {/* Ambient Shimmer / Pulse */}
                {isPlayingCurrentBroadcast && (
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-shimmer pointer-events-none" />
                )}

                {isPlayingCurrentBroadcast ? (
                  <div className="flex items-center gap-2">
                    <Pause className="w-5 h-5 fill-current" />
                    <span>Pause Broadcast</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                    <span>Tune In Live</span>
                  </div>
                )}
              </button>

              {/* Sync to Live button with animated morph into progress bar */}
              {(isSyncing || (currentEpisode?.id === onAirEpisode?.id && Math.abs(currentTime - liveOffsetSeconds) > 10)) && (
                <div className="relative overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-800/90 shadow-md">
                  {isSyncing ? (
                    /* Morphed Loading Bar State */
                    <div className="min-h-[48px] min-w-[240px] px-4 py-2.5 flex flex-col justify-center relative select-none">
                      {/* Background fill track */}
                      <motion.div
                        className="absolute inset-0 bg-red-600/40 rounded-2xl"
                        initial={{ width: '0%' }}
                        animate={{ width: `${syncProgress}%` }}
                        transition={{ ease: 'linear', duration: 0.05 }}
                      />

                      {/* Moving glowing leading edge */}
                      <motion.div
                        className="absolute top-0 bottom-0 w-3 bg-red-400 blur-[2px] opacity-80"
                        style={{ left: `calc(${syncProgress}% - 6px)` }}
                      />

                      {/* Text & Icon Status over progress bar */}
                      <div className="relative z-10 flex items-center justify-between gap-3 text-xs font-bold text-white">
                        <div className="flex items-center gap-2">
                          {syncSuccess ? (
                            <Check className="w-4 h-4 text-emerald-400 animate-bounce" />
                          ) : (
                            <RadioTower className="w-4 h-4 text-red-300 animate-pulse" />
                          )}
                          <span>{syncSuccess ? 'Synchronized Live!' : 'Syncing Live Audio...'}</span>
                        </div>
                        <span className="font-mono text-[11px] text-red-200">{syncProgress}%</span>
                      </div>
                    </div>
                  ) : (
                    /* Normal Clickable Button State (48px Touch Target) */
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleResyncToExactLive}
                      className="min-h-[48px] px-4 py-3 text-zinc-100 hover:text-white hover:bg-zinc-700/80 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer w-full"
                      title="Jump to current live broadcast second"
                    >
                      <Clock className="w-4 h-4 text-red-400 group-hover:rotate-45 transition-transform" />
                      <span>Sync to Live ({Math.round(Math.abs(currentTime - liveOffsetSeconds))}s behind)</span>
                    </motion.button>
                  )}
                </div>
              )}

              {/* Sleep Timer Controls (Centralized with 30s exponential volume fade-out) */}
              <div className="flex items-center justify-center sm:justify-start gap-2 sm:ml-auto pt-1 sm:pt-0">
                <Moon className="w-4 h-4 text-zinc-400" />
                <span className="text-xs text-zinc-300 font-semibold">Sleep Timer:</span>
                <select
                  value={sleepTimerMinutes === null ? 'off' : sleepTimerMinutes.toString()}
                  onChange={e => {
                    const v = e.target.value;
                    setSleepTimer(v === 'off' ? null : Number(v));
                  }}
                  className="min-h-[44px] px-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-red-500 cursor-pointer font-medium"
                >
                  <option value="off">Off</option>
                  <option value="15">15 min</option>
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">60 min</option>
                </select>
                {sleepTimerRemaining !== null && (
                  <span className="text-xs font-mono text-red-400 font-bold">
                    {formatSeconds(sleepTimerRemaining)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Program Schedule: Up Next & Just Played */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Up Next in Broadcast with Interactive Actions (Favorite/Bookmark, Alert, Notes) */}
        <div className="bg-[#121520] border border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wide">
                Coming Up Next
              </h3>
            </div>
            <span className="text-xs text-zinc-300 font-medium">Continuous rotation</span>
          </div>

          <div className="space-y-2.5">
            {timeline?.upNext && timeline.upNext.length > 0 ? (
              timeline.upNext.slice(0, 5).map((item, idx) => {
                const isItemFav = isFavorite(item.episode.id);
                return (
                  <div
                    key={item.episode.id + idx}
                    className="p-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/60 border border-zinc-800/60 transition-colors flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 text-center text-xs font-bold text-zinc-400">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {item.episode.episodeNumber && (
                            <span className="text-[9px] font-bold text-red-400 bg-red-950/80 px-1.5 py-0.2 rounded">
                              EP {item.episode.episodeNumber}
                            </span>
                          )}
                          <span className="text-[10px] text-zinc-400 font-mono">
                            Air time: {item.formattedAirTime}
                          </span>
                        </div>
                        <p
                          onClick={() => {
                            triggerHaptic(8);
                            onOpenEpisode?.(item.episode);
                          }}
                          className="text-xs font-semibold text-zinc-200 truncate group-hover:text-red-400 transition-colors cursor-pointer"
                        >
                          {item.episode.title}
                        </p>
                      </div>
                    </div>

                    {/* Interactive Actions for Coming Up Next */}
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs font-mono text-zinc-400 mr-1 hidden sm:inline">
                        {item.episode.duration}
                      </span>

                      {/* Bookmark / Favorite */}
                      <button
                        onClick={() => {
                          triggerHaptic(8);
                          toggleFavorite(item.episode.id);
                        }}
                        className={`w-9 h-9 min-w-[36px] min-h-[36px] rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                          isItemFav ? 'text-red-500 bg-red-950/40' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                        }`}
                        title={isItemFav ? 'Favorited' : 'Bookmark for later'}
                        aria-label="Bookmark episode"
                      >
                        <Heart className={`w-4 h-4 ${isItemFav ? 'fill-current' : ''}`} />
                      </button>

                      {/* Notification Alert */}
                      <button
                        onClick={() => handleSetAlert(item.episode.title)}
                        className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-lg text-zinc-400 hover:text-yellow-400 hover:bg-zinc-800 flex items-center justify-center cursor-pointer transition-colors"
                        title="Alert me when this airs"
                        aria-label="Set air alert"
                      >
                        <Bell className="w-4 h-4" />
                      </button>

                      {/* Preview Notes */}
                      <button
                        onClick={() => {
                          triggerHaptic(8);
                          onOpenEpisode?.(item.episode);
                        }}
                        className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center justify-center cursor-pointer transition-colors"
                        title="Preview show notes"
                        aria-label="Preview show notes"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-zinc-400 py-4 text-center">Loading upcoming schedule...</p>
            )}
          </div>
        </div>

        {/* Just Played / Previous Broadcasts */}
        <div className="bg-[#121520] border border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-zinc-400" />
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wide">
                Recently Broadcasted
              </h3>
            </div>
            <span className="text-xs text-zinc-400">Earlier today</span>
          </div>

          <div className="space-y-2.5">
            {timeline?.justPlayed && timeline.justPlayed.length > 0 ? (
              timeline.justPlayed.slice(0, 5).map((item, idx) => (
                <div
                  key={item.episode.id + idx}
                  className="p-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/60 border border-zinc-800/60 transition-colors flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 text-center text-xs font-bold text-zinc-500">
                      -
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {item.episode.episodeNumber && (
                          <span className="text-[9px] font-bold text-zinc-300 bg-zinc-800 px-1.5 py-0.2 rounded">
                            EP {item.episode.episodeNumber}
                          </span>
                        )}
                      </div>
                      <p
                        onClick={() => {
                          triggerHaptic(8);
                          onOpenEpisode?.(item.episode);
                        }}
                        className="text-xs font-semibold text-zinc-200 truncate group-hover:text-red-400 transition-colors cursor-pointer"
                      >
                        {item.episode.title}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      triggerHaptic(10);
                      playEpisode(item.episode, 0, 'archive');
                    }}
                    className="min-h-[40px] min-w-[40px] p-2 rounded-xl bg-zinc-800 hover:bg-red-600 hover:text-white text-zinc-300 transition-colors cursor-pointer flex items-center justify-center"
                    title="Play this past episode on-demand"
                    aria-label={`Play ${item.episode.title}`}
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-400 py-4 text-center">Station just initialized...</p>
            )}
          </div>
        </div>
      </div>

      {/* About The Radio Station Info Note */}
      <div className="bg-[#121520] border border-zinc-800/80 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-xs text-zinc-300">
        <Info className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-zinc-100">How the 24/7 Live Radio works:</strong> Every listener around the world hears the exact same show at the exact same time. The master schedule shuffles all 560+ episodes across 12+ years of comedy, broadcasting non-stop 24 hours a day, 7 days a week. For listening in chronological order or specific searches, switch to the <span className="text-red-400 font-semibold">Episodes</span> tab.
        </p>
      </div>

      {/* Official Community Channels, Store & Support Cards */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            Official Channels & T-Shirts
          </h3>
          <span className="text-[11px] text-zinc-400">Official Comedy Button Links</span>
        </div>
        <OfficialLinksBar variant="cards" />
      </div>
    </div>
  );
};

