import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAudio } from '../context/AudioContext';
import { formatSeconds } from '../utils/format';
import { getArtworkUrl, handleImageError } from '../utils/assets';
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
  Maximize2
} from 'lucide-react';

export const AudioPlayer: React.FC<{ onOpenEpisode?: (episode: any) => void }> = ({ onOpenEpisode }) => {
  const {
    currentEpisode,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    volume,
    isMuted,
    togglePlay,
    seek,
    skip,
    setPlaybackRate,
    setVolume,
    toggleMute,
    toggleFavorite,
    isFavorite,
  } = useAudio();

  const [isMinimized, setIsMinimized] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  if (!currentEpisode) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const favorited = isFavorite(currentEpisode.id);
  const speedOptions = [0.8, 1.0, 1.2, 1.5, 1.75, 2.0];

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
            className="fixed inset-0 z-50 sm:hidden bg-black/80 backdrop-blur-xl flex flex-col justify-end"
            onClick={() => setIsMobileExpanded(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#121520] border-t border-zinc-700/80 rounded-t-3xl p-6 flex flex-col max-h-[92vh] overflow-y-auto text-zinc-100 shadow-2xl space-y-5"
            >
              {/* Sheet Drag Handle & Close Bar */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setIsMobileExpanded(false)}
                  className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center cursor-pointer"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
                <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto" />
                <button
                  onClick={() => setIsMobileExpanded(false)}
                  className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Large Mobile Artwork */}
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 mx-auto rounded-2xl overflow-hidden shadow-2xl border border-zinc-700/60 shrink-0">
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
                  {currentEpisode.episodeNumber && (
                    <span className="text-xs font-bold uppercase bg-red-950 text-red-300 border border-red-800/60 px-2 py-0.5 rounded-md">
                      EP {currentEpisode.episodeNumber}
                    </span>
                  )}
                  {currentEpisode.isBonus && (
                    <span className="text-xs font-medium bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-md">
                      Special
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-zinc-100 line-clamp-2 px-2">
                  {currentEpisode.title}
                </h3>
                <p className="text-xs text-zinc-400">The Comedy Button Podcast</p>
              </div>

              {/* Scrubber Progress Bar & Timestamps */}
              <div className="space-y-1.5 px-2">
                <div className="relative flex items-center">
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={(e) => seek(Number(e.target.value))}
                    className="w-full h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-red-600 focus:outline-none"
                    style={{
                      background: `linear-gradient(to right, #dc2626 ${progressPercent}%, #27272a ${progressPercent}%)`
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                  <span>{formatSeconds(currentTime)}</span>
                  <span>{formatSeconds(duration || 0)}</span>
                </div>
              </div>

              {/* Giant Tactile Mobile Playback Controls */}
              <div className="flex items-center justify-center gap-6 py-2">
                {/* Skip -15s */}
                <motion.button
                  whileTap={{ scale: 0.85, rotate: -15 }}
                  onClick={() => skip(-15)}
                  className="w-12 h-12 rounded-full bg-zinc-800/90 text-zinc-200 flex items-center justify-center cursor-pointer active:bg-zinc-700 shadow-md"
                  title="Rewind 15 seconds"
                  aria-label="Rewind 15 seconds"
                >
                  <RotateCcw className="w-5 h-5" />
                </motion.button>

                {/* Main Play/Pause Button */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={togglePlay}
                  className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-colors shadow-xl shadow-red-950/60 cursor-pointer"
                  title={isPlaying ? 'Pause' : 'Play'}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause className="w-7 h-7 fill-current" />
                  ) : (
                    <Play className="w-7 h-7 fill-current ml-1" />
                  )}
                </motion.button>

                {/* Skip +30s */}
                <motion.button
                  whileTap={{ scale: 0.85, rotate: 15 }}
                  onClick={() => skip(30)}
                  className="w-12 h-12 rounded-full bg-zinc-800/90 text-zinc-200 flex items-center justify-center cursor-pointer active:bg-zinc-700 shadow-md"
                  title="Fast forward 30 seconds"
                  aria-label="Fast forward 30 seconds"
                >
                  <RotateCw className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Secondary Utility Controls */}
              <div className="flex items-center justify-around pt-2 border-t border-zinc-800/80 text-xs">
                {/* Speed Toggle */}
                <div className="relative">
                  <button
                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                    className="min-h-[44px] px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700/80 font-mono font-bold text-zinc-300 flex items-center gap-1 cursor-pointer"
                  >
                    <span>{playbackRate}x Speed</span>
                  </button>
                  {showSpeedMenu && (
                    <div className="absolute bottom-full mb-2 left-0 bg-zinc-900 border border-zinc-700 rounded-xl py-1 shadow-2xl z-50 flex flex-col w-24">
                      {speedOptions.map((rate) => (
                        <button
                          key={rate}
                          onClick={() => {
                            setPlaybackRate(rate);
                            setShowSpeedMenu(false);
                          }}
                          className={`px-3 py-2 text-xs text-left font-mono font-semibold ${
                            playbackRate === rate ? 'bg-red-600 text-white' : 'text-zinc-300 hover:bg-zinc-800'
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* View Show Notes Button */}
                <button
                  onClick={() => {
                    setIsMobileExpanded(false);
                    onOpenEpisode?.(currentEpisode);
                  }}
                  className="min-h-[44px] px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-300 hover:text-white flex items-center gap-1.5 font-semibold cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-red-400" />
                  <span>Show Notes</span>
                </button>

                {/* Favorite Toggle */}
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  animate={{ scale: favorited ? [1, 1.3, 1] : 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  onClick={() => toggleFavorite(currentEpisode.id)}
                  className={`min-h-[44px] min-w-[44px] p-2.5 rounded-xl border flex items-center justify-center cursor-pointer ${
                    favorited
                      ? 'bg-red-950/80 border-red-800 text-red-400'
                      : 'bg-zinc-900 border-zinc-700/80 text-zinc-400'
                  }`}
                  title={favorited ? 'Favorited' : 'Add to favorites'}
                >
                  <Heart className={`w-5 h-5 ${favorited ? 'fill-current' : ''}`} />
                </motion.button>

                {/* Download MP3 */}
                <a
                  href={currentEpisode.audioUrl}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-400 flex items-center justify-center cursor-pointer"
                  title="Download MP3"
                >
                  <Download className="w-5 h-5" />
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* DOCKED BOTTOM BAR (Responsive for both Mobile and Desktop)                */}
      {/* ========================================================================= */}
      <aside
        aria-label="Audio playback controls"
        className="fixed bottom-0 left-0 right-0 z-40 bg-[#0e111a]/95 backdrop-blur-xl border-t border-zinc-800 text-zinc-100 shadow-2xl transition-all duration-200"
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
              <div className="flex items-center gap-1 mb-0.5">
                {currentEpisode.episodeNumber && (
                  <span className="text-[9px] font-bold uppercase bg-red-950 text-red-300 px-1 py-0.2 rounded">
                    EP {currentEpisode.episodeNumber}
                  </span>
                )}
                <span className="text-[10px] font-mono text-zinc-400">
                  {formatSeconds(currentTime)} / {formatSeconds(duration || 0)}
                </span>
              </div>
              <p className="text-xs font-semibold text-zinc-100 truncate">
                {currentEpisode.title}
              </p>
            </div>
          </div>

          {/* Quick Mobile Tap Actions: Rewind, Play/Pause, Expand Sheet */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Rewind 15s */}
            <motion.button
              whileTap={{ scale: 0.85, rotate: -15 }}
              onClick={() => skip(-15)}
              className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full text-zinc-400 active:text-white flex items-center justify-center cursor-pointer"
              title="Rewind 15s"
            >
              <RotateCcw className="w-4 h-4" />
            </motion.button>

            {/* Play / Pause */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={togglePlay}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-red-600 active:bg-red-500 text-white flex items-center justify-center cursor-pointer shadow-md shadow-red-950/50"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </motion.button>

            {/* Expand Sheet */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => setIsMobileExpanded(true)}
              className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-lg text-zinc-400 active:text-white flex items-center justify-center cursor-pointer"
              title="Expand player"
            >
              <ChevronUp className="w-4 h-4" />
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
                  className="w-9 h-9 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center cursor-pointer shadow-md shadow-red-950/40"
                  title={isPlaying ? 'Pause' : 'Play'}
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
                  <p className="text-xs text-zinc-400 font-mono">
                    {formatSeconds(currentTime)} / {formatSeconds(duration || 0)}
                  </p>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => setIsMinimized(false)}
                className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
                title="Expand player"
              >
                <ChevronUp className="w-4 h-4" />
              </motion.button>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
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
                      {currentEpisode.episodeNumber && (
                        <span className="text-[10px] font-bold uppercase bg-red-950/80 text-red-300 border border-red-800/60 px-1.5 py-0.2 rounded-md">
                          EP {currentEpisode.episodeNumber}
                        </span>
                      )}
                      {currentEpisode.isBonus && (
                        <span className="text-[10px] font-medium bg-zinc-800 text-zinc-300 px-1.5 py-0.2 rounded-md">
                          Special
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
                    <p className="text-[11px] text-zinc-400 truncate">
                      The Comedy Button
                    </p>
                  </div>
                </div>

                {/* Center: Playback Controls & Progress Bar */}
                <div className="flex-1 max-w-xl flex flex-col items-center gap-1.5">
                  {/* Button Controls */}
                  <div className="flex items-center gap-3 sm:gap-4">
                    {/* Skip -15s */}
                    <motion.button
                      whileTap={{ scale: 0.9, rotate: -15 }}
                      onClick={() => skip(-15)}
                      className="p-2 rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors cursor-pointer"
                      title="Rewind 15 seconds"
                    >
                      <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                    </motion.button>

                    {/* Primary Play/Pause Button */}
                    <motion.button
                      whileTap={{ scale: 0.93 }}
                      onClick={togglePlay}
                      className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-colors shadow-lg shadow-red-950/60 cursor-pointer"
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5 fill-current" />
                      ) : (
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      )}
                    </motion.button>

                    {/* Skip +30s */}
                    <motion.button
                      whileTap={{ scale: 0.9, rotate: 15 }}
                      onClick={() => skip(30)}
                      className="p-2 rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors cursor-pointer"
                      title="Fast forward 30 seconds"
                    >
                      <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
                    </motion.button>

                    {/* Playback Rate Selector */}
                    <div className="relative hidden md:block">
                      <button
                        onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                        className="px-2 py-1 rounded-lg text-xs font-mono font-medium text-zinc-300 bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/60 transition-colors cursor-pointer"
                      >
                        {playbackRate}x
                      </button>
                      {showSpeedMenu && (
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-700 rounded-xl py-1 shadow-xl z-50 flex flex-col w-20 overflow-hidden">
                          {speedOptions.map((rate) => (
                            <button
                              key={rate}
                              onClick={() => {
                                setPlaybackRate(rate);
                                setShowSpeedMenu(false);
                              }}
                              className={`px-3 py-1.5 text-xs text-left font-mono font-medium transition-colors cursor-pointer ${
                                playbackRate === rate
                                  ? 'bg-red-600 text-white'
                                  : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                              }`}
                            >
                              {rate}x
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Scrubber Progress Bar & Timestamps */}
                  <div className="w-full flex items-center gap-2 text-xs font-mono text-zinc-400">
                    <span className="w-10 text-right">{formatSeconds(currentTime)}</span>
                    <div className="relative flex-1 group flex items-center">
                      <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={(e) => seek(Number(e.target.value))}
                        className="w-full h-1.5 bg-zinc-800 group-hover:h-2 rounded-full appearance-none cursor-pointer accent-red-600 focus:outline-none transition-all"
                        style={{
                          background: `linear-gradient(to right, #dc2626 ${progressPercent}%, #27272a ${progressPercent}%)`
                        }}
                      />
                    </div>
                    <span className="w-10">{formatSeconds(duration || 0)}</span>
                  </div>
                </div>

                {/* Right: Actions & Volume */}
                <div className="flex items-center gap-2 sm:gap-3 w-1/4 justify-end">
                  {/* Show Notes shortcut button */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onOpenEpisode?.(currentEpisode)}
                    className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors cursor-pointer"
                    title="View Show Notes"
                  >
                    <FileText className="w-4 h-4" />
                  </motion.button>

                  {/* Favorite */}
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    animate={{ scale: favorited ? [1, 1.3, 1] : 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    onClick={() => toggleFavorite(currentEpisode.id)}
                    className={`p-2 rounded-lg transition-colors cursor-pointer ${
                      favorited
                        ? 'text-red-500 hover:text-red-400'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                    title={favorited ? 'Remove from favorites' : 'Favorite'}
                  >
                    <Heart className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
                  </motion.button>

                  {/* Direct MP3 Download */}
                  <a
                    href={currentEpisode.audioUrl}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors hidden sm:block"
                    title="Download episode audio"
                  >
                    <Download className="w-4 h-4" />
                  </a>

                  {/* Volume Slider */}
                  <div className="items-center gap-2 hidden lg:flex">
                    <button
                      onClick={toggleMute}
                      className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-4 h-4 text-zinc-500" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="w-16 h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-red-600"
                    />
                  </div>

                  {/* Minimize Player */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsMinimized(true)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 cursor-pointer"
                    title="Minimize player"
                  >
                    <ChevronDown className="w-4 h-4" />
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
