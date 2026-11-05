import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Episode, LiveTimelineStatus } from '../types';
import { useAudio } from '../context/AudioContext';
import { useCast } from '../context/CastContext';
import { getStreamTimeline } from '../services/api';
import { formatSeconds } from '../utils/format';
import { getArtworkUrl, handleImageError } from '../utils/assets';
import { triggerHaptic } from '../utils/haptics';
import { ActionArrowButton } from './ActionArrowButton';
import {
  Radio,
  Clock,
  Share2,
  Check,
  Cast,
  Sparkles,
  Heart,
  Bell,
  FileText,
  Volume2,
  Users,
  Flame,
  Calendar,
  Layers
} from 'lucide-react';
import { ComedyPlayButton } from './ComedyPlayButton';

interface RadioStreamStationProps {
  onOpenEpisode?: (episode: Episode) => void;
  onOpenThemeIntro?: () => void;
}

export const RadioStreamStation: React.FC<RadioStreamStationProps> = ({
  onOpenEpisode,
  onOpenThemeIntro,
}) => {
  const {
    currentEpisode,
    isPlaying,
    currentTime,
    playEpisode,
    togglePlay,
    seek,
    setOnEndedCallback,
    toggleFavorite,
    isFavorite,
  } = useAudio();

  const {
    isCasting,
    castDeviceName,
    openCastModal
  } = useCast();

  const [timeline, setTimeline] = useState<LiveTimelineStatus | null>(null);
  const [liveOffsetSeconds, setLiveOffsetSeconds] = useState(0);
  const [liveRemainingSeconds, setLiveRemainingSeconds] = useState(0);

  const [copiedLink, setCopiedLink] = useState(false);
  const [alertEpisodeTitle, setAlertEpisodeTitle] = useState<string | null>(null);

  // Animated states for Sync to Live
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  // Fetch synchronized timeline from server
  const loadTimeline = async () => {
    try {
      const data = await getStreamTimeline();
      setTimeline(data);
      if (data?.onAir) {
        setLiveOffsetSeconds(data.onAir.currentOffsetSeconds);
        setLiveRemainingSeconds(data.onAir.remainingSeconds);
      }
    } catch (err) {
      console.error('Failed to load live broadcast schedule:', err);
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
          loadTimeline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(ticker);
  }, []);

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

    const startTime = performance.now();
    const duration = 400;

    const animateProgress = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(100, Math.round((elapsed / duration) * 100));
      setSyncProgress(progress);

      if (elapsed < duration) {
        requestAnimationFrame(animateProgress);
      } else {
        seek(liveOffsetSeconds);
        if (!isPlaying) togglePlay();
        setTimeout(() => {
          setIsSyncing(false);
          setSyncProgress(0);
        }, 300);
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

  const upNextList = timeline?.upNext || [];
  const justPlayedList = timeline?.justPlayed || [];

  return (
    <div className="space-y-6 sm:space-y-8 select-none max-w-5xl mx-auto">
      {/* Alert toast for Coming Up Next */}
      <AnimatePresence>
        {alertEpisodeTitle && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-4 z-50 bg-[#181a20] border border-[#f4be47] text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 max-w-sm"
          >
            <div className="w-9 h-9 rounded-full bg-[#f4be47] text-zinc-950 flex items-center justify-center shrink-0 font-bold">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div className="text-xs">
              <p className="font-heading font-black uppercase text-[#f4be47]">Broadcast Reminder Set!</p>
              <p className="text-zinc-200 line-clamp-1">{alertEpisodeTitle}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. BROADCAST STATUS HEADER */}
      <div className="bg-[#181a20] border border-white/10 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5 w-full sm:w-auto">
          {/* Animated On-Air Signal Dot */}
          <div className="relative flex items-center justify-center">
            <span className="w-4 h-4 rounded-full bg-[#ff3333] animate-ping opacity-75 absolute" />
            <span className="w-3.5 h-3.5 rounded-full bg-[#ff3333] relative shadow-lg shadow-red-500/50" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-heading font-black text-xs uppercase tracking-wider text-red-500">
                LIVE ON AIR
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 font-bold uppercase">
                Synchronized
              </span>
            </div>
            <p className="text-xs text-zinc-300 font-medium truncate mt-0.5">
              Continuous 24/7 broadcast from the 560+ episode vault
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {onOpenThemeIntro && (
            <button
              type="button"
              onClick={onOpenThemeIntro}
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-zinc-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Watch Intro & Theme Song"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#f4be47]" />
              <span className="hidden sm:inline">Theme Song</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleShareStation}
            className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-zinc-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Share Radio Stream"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copied' : 'Share'}</span>
          </button>

          <button
            type="button"
            onClick={openCastModal}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
              isCasting
                ? 'bg-emerald-500 text-zinc-950 font-black'
                : 'bg-white/10 hover:bg-white/15 text-zinc-200'
            }`}
            title="Cast to TV / Speaker"
          >
            <Cast className="w-3.5 h-3.5" />
            <span>{isCasting ? castDeviceName || 'Casting' : 'Cast'}</span>
          </button>
        </div>
      </div>

      {/* 2. HERO NOW-PLAYING ON-AIR STAGE */}
      <div className="relative bg-gradient-to-br from-[#1c1f28] via-[#15171e] to-[#0d0f14] border border-white/10 rounded-[32px] p-5 sm:p-8 shadow-2xl overflow-hidden">
        {/* Subtle ambient red/warm radial glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-500/5 rounded-full blur-2xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 sm:gap-8">
          {/* Episode Artwork with Vinyl / Radio Indicator */}
          <div className="relative group shrink-0">
            <div className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/15 bg-black">
              <img
                src={getArtworkUrl(onAirEpisode?.imageUrl)}
                alt={onAirEpisode?.title || 'Current Broadcast'}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={handleImageError}
              />

              {/* Pulsing indicator when playing */}
              {isPlayingCurrentBroadcast && (
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-red-600/90 backdrop-blur-md text-white text-[10px] font-heading font-black uppercase flex items-center gap-1.5 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  <span>AIRING</span>
                </div>
              )}
            </div>
          </div>

          {/* Episode Details & Controls */}
          <div className="flex-1 text-center md:text-left min-w-0 w-full space-y-3">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="text-[11px] font-mono uppercase bg-red-500/20 text-red-400 px-2.5 py-0.5 rounded-full font-bold border border-red-500/30">
                ● NOW STREAMING
              </span>
              {onAirEpisode?.episodeNumber && (
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white/10 text-zinc-300 font-bold">
                  EPISODE {onAirEpisode.episodeNumber}
                </span>
              )}
              {onAirEpisode?.pubDate && (
                <span className="text-[11px] text-zinc-400 font-medium">
                  {new Date(onAirEpisode.pubDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>

            <h2
              onClick={() => onAirEpisode && onOpenEpisode?.(onAirEpisode)}
              className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight leading-tight hover:text-red-400 transition-colors cursor-pointer"
            >
              {onAirEpisode?.title || 'The Comedy Button Broadcast'}
            </h2>

            <p className="text-xs sm:text-sm text-zinc-400 line-clamp-2 leading-relaxed">
              {onAirEpisode?.description?.replace(/<[^>]*>?/gm, '') || '560+ Episodes streamed 24/7 without repeat.'}
            </p>

            {/* Synchronized Progress Timeline */}
            <div className="pt-2 space-y-1.5">
              <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(100, Math.max(0, currentProgressPercent))}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{formatSeconds(liveOffsetSeconds)}</span>
                </span>
                <span className="text-zinc-500 font-medium">
                  Next show in <strong className="text-zinc-300 font-bold">{formatSeconds(liveRemainingSeconds)}</strong>
                </span>
              </div>
            </div>

            {/* Action Bar: Hero Play Button + Resync + Details */}
            <div className="pt-3 flex flex-wrap items-center justify-center md:justify-start gap-4">
              <ComedyPlayButton
                size="lg"
                isPlaying={isPlayingCurrentBroadcast}
                onClick={handleTuneInLive}
                disabled={!onAirEpisode}
                title={isPlayingCurrentBroadcast ? 'Pause broadcast' : 'Press to Tune In Live'}
                ariaLabel={isPlayingCurrentBroadcast ? 'Pause broadcast' : 'Tune In Live'}
              />

              <div className="flex items-center gap-2">
                {onAirEpisode && (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(onAirEpisode.id)}
                      className={`p-3 rounded-full border transition-all cursor-pointer ${
                        isFavorite(onAirEpisode.id)
                          ? 'bg-red-500/20 border-red-500/50 text-red-400'
                          : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
                      }`}
                      title={isFavorite(onAirEpisode.id) ? 'Remove Favorite' : 'Save to Favorites'}
                      aria-label="Toggle Favorite"
                    >
                      <Heart className={`w-5 h-5 ${isFavorite(onAirEpisode.id) ? 'fill-red-500' : ''}`} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenEpisode?.(onAirEpisode)}
                      className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-zinc-200 border border-white/10 text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer"
                      title="Show Notes & Details"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Show Notes</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Resync Pill if listener drifted from exact live broadcast */}
            {(isSyncing || (currentEpisode?.id === onAirEpisode?.id && Math.abs(currentTime - liveOffsetSeconds) > 8)) && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleResyncToExactLive}
                  disabled={isSyncing}
                  className="w-full sm:w-auto px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-2 hover:bg-amber-500/30 transition-colors cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {isSyncing
                      ? `Synchronizing (${syncProgress}%)...`
                      : `Catch up to live broadcast (${Math.round(Math.abs(currentTime - liveOffsetSeconds))}s behind)`}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. BROADCAST SCHEDULE: UP NEXT ON AIR */}
      {upNextList.length > 0 && (
        <div className="bg-[#181a20] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-amber-400" />
              <h3 className="font-heading font-black text-base sm:text-lg uppercase tracking-tight text-white">
                COMING UP NEXT ON AIR
              </h3>
            </div>
            <span className="text-xs font-mono text-zinc-400 font-bold uppercase">
              Schedule Queue
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {upNextList.slice(0, 4).map((slot, idx) => {
              const ep = slot.episode;
              const isFirst = idx === 0;
              return (
                <div
                  key={`${ep.id}-${idx}`}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isFirst
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-black/30 border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={getArtworkUrl(ep.imageUrl)}
                      alt={ep.title}
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-white/10"
                      onError={handleImageError}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.2 rounded-full ${
                          isFirst ? 'bg-amber-400 text-zinc-950' : 'bg-white/10 text-zinc-400'
                        }`}>
                          {isFirst ? 'Up Next' : `Slot +${idx + 1}`}
                        </span>
                        {ep.episodeNumber && (
                          <span className="text-[10px] font-mono text-zinc-400">
                            EP {ep.episodeNumber}
                          </span>
                        )}
                      </div>
                      <h4
                        onClick={() => onOpenEpisode?.(ep)}
                        className="text-xs sm:text-sm font-bold text-white truncate cursor-pointer hover:text-amber-300 transition-colors"
                      >
                        {ep.title}
                      </h4>
                      <p className="text-[11px] text-zinc-400">
                        Airs in {formatSeconds(slot.startsInSeconds || 0)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSetAlert(ep.title)}
                      className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-amber-400 transition-colors cursor-pointer"
                      title="Set Reminder Alert"
                      aria-label="Set Reminder Alert"
                    >
                      <Bell className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(ep.id)}
                      className={`p-2 rounded-full transition-colors cursor-pointer ${
                        isFavorite(ep.id)
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-white/5 hover:bg-white/15 text-zinc-300'
                      }`}
                      title="Favorite Episode"
                      aria-label="Favorite Episode"
                    >
                      <Heart className={`w-4 h-4 ${isFavorite(ep.id) ? 'fill-red-500' : ''}`} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. RECENTLY PLAYED ON THE STATION */}
      {justPlayedList.length > 0 && (
        <div className="bg-[#181a20] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-zinc-400" />
              <h3 className="font-heading font-black text-base uppercase tracking-tight text-white">
                JUST AIRED ON THE BROADCAST
              </h3>
            </div>
            <span className="text-xs font-mono text-zinc-400 font-bold uppercase">
              Recent History
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {justPlayedList.slice(0, 3).map((slot, idx) => {
              const ep = slot.episode;
              return (
                <div
                  key={`just-${ep.id}-${idx}`}
                  className="bg-black/30 border border-white/5 rounded-2xl p-3 flex items-center gap-3 hover:border-white/15 transition-all"
                >
                  <img
                    src={getArtworkUrl(ep.imageUrl)}
                    alt={ep.title}
                    className="w-10 h-10 rounded-xl object-cover shrink-0 border border-white/10"
                    onError={handleImageError}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase block">
                      Aired recently
                    </span>
                    <h5
                      onClick={() => onOpenEpisode?.(ep)}
                      className="text-xs font-bold text-zinc-200 truncate cursor-pointer hover:text-white"
                    >
                      {ep.title}
                    </h5>
                  </div>
                  <ActionArrowButton
                    size="sm"
                    theme="dark"
                    title="Play on demand"
                    onClick={() => playEpisode(ep, 0, 'archive')}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
