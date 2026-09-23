import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAudio } from '../context/AudioContext';
import { useCast } from '../context/CastContext';
import { getArtworkUrl } from '../utils/assets';
import { formatSeconds } from '../utils/format';
import {
  Maximize2,
  Minimize2,
  X,
  Radio,
  Play,
  Pause,
  Disc3,
  Sparkles,
  Volume2,
  Tv
} from 'lucide-react';

interface CastReceiverScreenProps {
  isOpen?: boolean;
  onClose: () => void;
}

export const CastReceiverScreen: React.FC<CastReceiverScreenProps> = ({ isOpen = true, onClose }) => {
  if (!isOpen) return null;
  const {
    currentEpisode,
    isPlaying,
    currentTime,
    duration,
    playMode,
    togglePlay,
    voiceBoostEnabled
  } = useAudio();

  const { isCasting, castDeviceName } = useCast();
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const artwork = currentEpisode ? getArtworkUrl(currentEpisode.imageUrl) : '';
  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-[#07090e] text-zinc-100 flex flex-col justify-between p-6 sm:p-12 overflow-hidden select-none">
      {/* Dynamic Ambient Blur Backdrop */}
      {artwork && (
        <div
          className="absolute -inset-10 bg-cover bg-center filter blur-3xl scale-125 opacity-30 transition-all duration-1000"
          style={{ backgroundImage: `url(${artwork})` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-[#07090e]/70 to-[#07090e]/90 pointer-events-none" />

      {/* Top Bar / Header */}
      <header className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-900/50">
            <Radio className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-black uppercase tracking-wider text-white">
              The Comedy Button
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 font-medium">
              {isCasting ? `Streaming to ${castDeviceName || 'Connected Display'}` : 'TV Receiver Mode'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {voiceBoostEnabled && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 text-xs font-bold shadow-sm">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Voice Boost Active</span>
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-950/80 border border-red-800/60 text-red-400 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>{playMode === 'radio' ? '24/7 Live Stream' : 'On-Demand'}</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-2xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Toggle Fullscreen"
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          <button
            onClick={onClose}
            className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-2xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Exit TV Display"
            aria-label="Exit TV Display"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Center Stage: Vinyl Disc Animation & Large Cover + Metadata */}
      <main className="relative z-10 flex flex-col lg:flex-row items-center justify-center gap-8 sm:gap-16 my-auto max-w-6xl mx-auto w-full">
        {/* Vinyl Assembly (Jacket + Spinning Disc) */}
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 shrink-0">
          {/* Animated Vinyl Disc */}
          <div
            className={`absolute top-2 w-[95%] h-[95%] rounded-full bg-zinc-950 border border-zinc-700/80 shadow-2xl flex items-center justify-center transition-all duration-700 ${
              isPlaying
                ? 'left-[38%] animate-[spin_18s_linear_infinite]'
                : 'left-4'
            }`}
          >
            {/* Vinyl Grooves */}
            <div className="w-[88%] h-[88%] rounded-full border border-zinc-800/80 flex items-center justify-center">
              <div className="w-[72%] h-[72%] rounded-full border border-zinc-800 flex items-center justify-center">
                {/* Center Record Label */}
                <div className="w-[36%] h-[36%] rounded-full overflow-hidden border-2 border-red-600 shadow-md">
                  {artwork && (
                    <img src={artwork} alt="Vinyl Center" className="w-full h-full object-cover" />
                  )}
                </div>
              </div>
            </div>
            {/* Center Spindle Hole */}
            <div className="absolute w-3 h-3 bg-black rounded-full border border-zinc-600" />
          </div>

          {/* Album Cover Jacket */}
          <div className="relative z-10 w-full h-full rounded-3xl overflow-hidden border-2 border-white/15 shadow-2xl bg-zinc-900 shadow-red-950/40">
            {artwork && (
              <img
                src={artwork}
                alt={currentEpisode?.title || 'Episode Artwork'}
                className="w-full h-full object-cover"
              />
            )}
            {/* Play/Pause Overlay on Click */}
            <button
              onClick={togglePlay}
              className="absolute inset-0 bg-black/30 hover:bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
              aria-label="Toggle Play"
            >
              <div className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl">
                {isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
              </div>
            </button>
          </div>
        </div>

        {/* High-Contrast Synchronized Episode Information & Notes */}
        <div className="flex-1 min-w-0 flex flex-col justify-center space-y-4 max-w-xl text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-2">
            {currentEpisode?.episodeNumber ? (
              <span className="px-2.5 py-1 rounded-lg bg-red-950/90 border border-red-800 text-red-400 font-mono font-bold text-xs uppercase tracking-wider">
                Episode {currentEpisode.episodeNumber}
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg bg-red-950/90 border border-red-800 text-red-400 font-mono font-bold text-xs uppercase tracking-wider">
                Special Edition
              </span>
            )}
            <span className="text-xs text-zinc-400 font-mono">
              The Comedy Button
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight drop-shadow-md line-clamp-2">
            {currentEpisode?.title || 'The Comedy Button Broadcast'}
          </h1>

          <div className="flex items-center justify-center lg:justify-start gap-2 text-sm sm:text-base font-semibold text-zinc-300">
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs font-bold uppercase">
              Starring
            </span>
            <span>Brian Altano • Scott Bromley • Ryan Scott • Max Scoville</span>
          </div>

          {/* High-contrast synchronized show notes ticker */}
          {currentEpisode?.description && (
            <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-zinc-300 text-xs sm:text-sm leading-relaxed max-h-36 overflow-y-auto backdrop-blur-md shadow-inner text-left">
              {currentEpisode.description.replace(/<[^>]*>?/gm, '')}
            </div>
          )}
        </div>
      </main>

      {/* Footer: TV Progress Bar & Elapsed Time */}
      <footer className="relative z-10 flex flex-col gap-2 max-w-4xl mx-auto w-full pt-4">
        <div className="w-full h-2 sm:h-2.5 bg-white/15 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full transition-all duration-300 shadow-lg shadow-red-600/50"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between font-mono text-xs sm:text-sm font-bold text-zinc-400">
          <span>{formatSeconds(currentTime)}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="text-xs font-bold uppercase text-zinc-300 hover:text-white px-3 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 cursor-pointer"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
          </div>
          <span>{duration > 0 ? formatSeconds(duration) : 'Live'}</span>
        </div>
      </footer>
    </div>
  );
};
