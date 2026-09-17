import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Episode, LiveTimelineStatus } from '../types';
import { useAudio } from '../context/AudioContext';
import { getStreamTimeline } from '../services/api';
import { formatSeconds } from '../utils/format';
import { getArtworkUrl, handleImageError } from '../utils/assets';
import { OfficialLinksBar } from './OfficialLinksBar';
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
  Timer
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
    setOnEndedCallback
  } = useAudio();

  const [timeline, setTimeline] = useState<LiveTimelineStatus | null>(null);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [liveOffsetSeconds, setLiveOffsetSeconds] = useState(0);
  const [liveRemainingSeconds, setLiveRemainingSeconds] = useState(0);

  const [copiedLink, setCopiedLink] = useState(false);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);

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

  // Sleep timer ticker
  useEffect(() => {
    if (sleepTimerMinutes === null) {
      setSleepTimerRemaining(null);
      return;
    }

    setSleepTimerRemaining(sleepTimerMinutes * 60);
    const interval = setInterval(() => {
      setSleepTimerRemaining(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          if (isPlaying) {
            togglePlay();
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimerMinutes]);

  // Seamless continuous play on ended
  useEffect(() => {
    setOnEndedCallback(() => {
      loadTimeline().then(() => {
        if (timeline?.onAir?.episode) {
          playEpisode(timeline.onAir.episode, liveOffsetSeconds);
        }
      });
    });

    return () => {
      setOnEndedCallback(null);
    };
  }, [timeline, liveOffsetSeconds]);

  const onAirEpisode = timeline?.onAir?.episode;
  const isPlayingCurrentBroadcast = Boolean(
    onAirEpisode && currentEpisode?.id === onAirEpisode.id && isPlaying
  );

  const handleTuneInLive = () => {
    if (!onAirEpisode) return;

    if (currentEpisode?.id === onAirEpisode.id) {
      if (isPlaying) {
        togglePlay();
      } else {
        seek(liveOffsetSeconds);
        togglePlay();
      }
    } else {
      playEpisode(onAirEpisode, liveOffsetSeconds);
    }
  };

  const handleResyncToExactLive = () => {
    if (!onAirEpisode) return;
    seek(liveOffsetSeconds);
    if (!isPlaying) togglePlay();
  };

  const handleShareStation = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const currentProgressPercent =
    timeline?.onAir?.durationSeconds && timeline.onAir.durationSeconds > 0
      ? (liveOffsetSeconds / timeline.onAir.durationSeconds) * 100
      : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* 24/7 Live Broadcast Hero Section */}
      <div className="bg-[#121520] border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Subtle crimson ambient glow */}
        <div className="absolute -right-16 -top-16 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Station Status Banner */}
        <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center">
              <span className="w-3 h-3 rounded-full bg-red-600" />
              <span className="absolute w-4 h-4 rounded-full bg-red-500/60 animate-ping" />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-red-500">
              Live Broadcast
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-xs text-zinc-400 font-medium">
              Synchronized 24/7 Global Stream
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareStation}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs text-zinc-300 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copy Radio Link"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="hidden sm:inline">Share</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* On-Air Program Featured Layout */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 lg:gap-8">
          {/* Cover Art with Live Equalizer */}
          <div className="relative shrink-0 w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden shadow-2xl border border-zinc-700/80 group">
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
              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-lg flex items-center gap-1 border border-zinc-700/60">
                <span className="w-1 bg-red-500 rounded-full h-4 eq-bar-1" />
                <span className="w-1 bg-red-500 rounded-full h-4 eq-bar-2" />
                <span className="w-1 bg-red-500 rounded-full h-4 eq-bar-3" />
                <span className="w-1 bg-red-500 rounded-full h-4 eq-bar-4" />
                <span className="text-[11px] font-bold text-red-400 ml-1">LIVE</span>
              </div>
            )}

            {/* Episode Number pill */}
            {onAirEpisode?.episodeNumber && (
              <span className="absolute bottom-3 left-3 text-xs font-bold text-white bg-red-600/90 px-2.5 py-1 rounded-lg backdrop-blur-sm shadow-md">
                EP {onAirEpisode.episodeNumber}
              </span>
            )}
          </div>

          {/* Broadcast Metadata & Controls */}
          <div className="flex-1 w-full text-center lg:text-left space-y-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 mb-1">
                <Radio className="w-3.5 h-3.5 text-red-500" />
                <span>NOW PLAYING ON AIR</span>
              </div>

              <h2
                onClick={() => onAirEpisode && onOpenEpisode?.(onAirEpisode)}
                className="text-xl sm:text-2xl lg:text-3xl font-bold text-zinc-100 leading-tight hover:text-red-400 transition-colors cursor-pointer"
              >
                {onAirEpisode?.title || 'Connecting to live broadcast...'}
              </h2>

              <p className="text-sm text-zinc-400 mt-2 line-clamp-2 max-w-2xl">
                {onAirEpisode?.description?.replace(/<[^>]*>?/gm, '') ||
                  'Streaming from the shuffled 560+ episode master catalog.'}
              </p>
            </div>

            {/* Live Progress Bar */}
            <div className="space-y-1.5 max-w-2xl">
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-600 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(100, Math.max(0, currentProgressPercent))}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                <span>{formatSeconds(liveOffsetSeconds)} elapsed</span>
                <span className="text-zinc-500">
                  {formatSeconds(liveRemainingSeconds)} remaining in show
                </span>
                <span>{formatSeconds(timeline?.onAir?.durationSeconds || 0)}</span>
              </div>
            </div>

            {/* Tune In Live Call To Action Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleTuneInLive}
                disabled={!onAirEpisode}
                className="w-full sm:w-auto min-h-[48px] px-6 py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-red-950/60 transition-colors cursor-pointer"
              >
                {isPlayingCurrentBroadcast ? (
                  <>
                    <Pause className="w-5 h-5 fill-current" />
                    <span>Pause Broadcast</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                    <span>Tune In Live</span>
                  </>
                )}
              </motion.button>

              {currentEpisode?.id === onAirEpisode?.id && Math.abs(currentTime - liveOffsetSeconds) > 10 && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleResyncToExactLive}
                  className="min-h-[44px] px-4 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  title="Jump to current live second"
                >
                  <Clock className="w-4 h-4 text-red-400" />
                  <span>Sync to Live ({Math.round(Math.abs(currentTime - liveOffsetSeconds))}s behind)</span>
                </motion.button>
              )}

              {/* Sleep Timer */}
              <div className="flex items-center justify-center sm:justify-start gap-1.5 sm:ml-auto pt-1 sm:pt-0">
                <Moon className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-xs text-zinc-400 font-medium">Sleep Timer:</span>
                <select
                  value={sleepTimerMinutes === null ? 'off' : sleepTimerMinutes.toString()}
                  onChange={e => {
                    const v = e.target.value;
                    setSleepTimerMinutes(v === 'off' ? null : Number(v));
                  }}
                  className="min-h-[38px] px-2.5 py-1.5 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-red-500 cursor-pointer"
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
        {/* Up Next in Broadcast */}
        <div className="bg-[#121520] border border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wide">
                Coming Up Next
              </h3>
            </div>
            <span className="text-xs text-zinc-400 font-medium">Continuous rotation</span>
          </div>

          <div className="space-y-2.5">
            {timeline?.upNext && timeline.upNext.length > 0 ? (
              timeline.upNext.slice(0, 5).map((item, idx) => (
                <div
                  key={item.episode.id + idx}
                  className="p-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/60 border border-zinc-800/60 transition-colors flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 text-center text-xs font-bold text-zinc-500">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {item.episode.episodeNumber && (
                          <span className="text-[9px] font-bold text-red-400 bg-red-950/80 px-1.5 py-0.2 rounded">
                            EP {item.episode.episodeNumber}
                          </span>
                        )}
                        <span className="text-[10px] text-zinc-500 font-mono">
                          Air time: {item.formattedAirTime}
                        </span>
                      </div>
                      <p
                        onClick={() => onOpenEpisode?.(item.episode)}
                        className="text-xs font-semibold text-zinc-200 truncate group-hover:text-red-400 transition-colors cursor-pointer"
                      >
                        {item.episode.title}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-mono text-zinc-500 shrink-0">
                    {item.episode.duration}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-500 py-4 text-center">Loading upcoming schedule...</p>
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
            <span className="text-xs text-zinc-500">Earlier today</span>
          </div>

          <div className="space-y-2.5">
            {timeline?.justPlayed && timeline.justPlayed.length > 0 ? (
              timeline.justPlayed.slice(0, 5).map((item, idx) => (
                <div
                  key={item.episode.id + idx}
                  className="p-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/60 border border-zinc-800/60 transition-colors flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 text-center text-xs font-bold text-zinc-600">
                      -
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {item.episode.episodeNumber && (
                          <span className="text-[9px] font-bold text-zinc-400 bg-zinc-800 px-1.5 py-0.2 rounded">
                            EP {item.episode.episodeNumber}
                          </span>
                        )}
                      </div>
                      <p
                        onClick={() => onOpenEpisode?.(item.episode)}
                        className="text-xs font-semibold text-zinc-300 truncate group-hover:text-red-400 transition-colors cursor-pointer"
                      >
                        {item.episode.title}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => playEpisode(item.episode)}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-600 hover:text-white text-zinc-400 transition-colors cursor-pointer"
                    title="Play this past episode on-demand"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-500 py-4 text-center">Station just initialized...</p>
            )}
          </div>
        </div>
      </div>

      {/* About The Radio Station Info Note */}
      <div className="bg-[#121520] border border-zinc-800/80 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-xs text-zinc-400">
        <Info className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-zinc-200">How the 24/7 Live Radio works:</strong> Every listener around the world hears the exact same show at the exact same time. The master schedule shuffles all 560+ episodes across 12+ years of comedy, broadcasting non-stop 24 hours a day, 7 days a week. For listening in chronological order or specific searches, switch to the <span className="text-red-400 font-semibold">Episodes</span> tab.
        </p>
      </div>

      {/* Official Community Channels, Store & Support Cards */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Official Channels & T-Shirts
          </h3>
          <span className="text-[11px] text-zinc-500">Official Comedy Button Links</span>
        </div>
        <OfficialLinksBar variant="cards" />
      </div>
    </div>
  );
};
