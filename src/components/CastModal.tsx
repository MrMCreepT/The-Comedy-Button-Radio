import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCast } from '../context/CastContext';
import { useAudio } from '../context/AudioContext';
import { getArtworkUrl } from '../utils/assets';
import {
  Cast,
  Airplay,
  Speaker,
  X,
  CheckCircle2,
  PowerOff,
  Wifi,
  Tv,
  Sliders,
  Palette,
  Users,
  Hash,
  Info
} from 'lucide-react';
import { useModalA11y } from '../hooks/useModalA11y';

export const CastModal: React.FC = () => {
  const {
    isCastModalOpen,
    closeCastModal,
    isCasting,
    castDeviceName,
    castType,
    displayOptions,
    setDisplayOptions,
    triggerGoogleCast,
    triggerAirPlay,
    triggerRemotePlayback,
    endCast,
    isGoogleCastAvailable,
    isAirPlayAvailable,
  } = useCast();

  const { currentEpisode, isPlaying, playMode, currentTime, duration } = useAudio();
  const [activeTab, setActiveTab] = useState<'devices' | 'appearance'>('devices');

  const modalRef = useModalA11y<HTMLDivElement>({
    isOpen: isCastModalOpen,
    onClose: closeCastModal,
  });

  if (!isCastModalOpen) return null;

  const handleCastGoogle = async () => {
    await triggerGoogleCast();
  };

  const handleAirPlay = async () => {
    await triggerAirPlay();
  };

  const handleRemotePlayback = async () => {
    await triggerRemotePlayback();
  };

  const artwork = currentEpisode ? getArtworkUrl(currentEpisode.imageUrl) : '';
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
        onClick={closeCastModal}
      >
        <motion.div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cast-modal-title"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          className="relative w-full max-w-lg bg-[#121520] border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-zinc-100 overflow-hidden my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Crimson ambient glow in corner */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-red-600/15 rounded-full blur-2xl pointer-events-none" />

          {/* Modal Header */}
          <div className="flex items-center justify-between pb-3 sm:pb-4 mb-3 sm:mb-4 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-950/80 border border-red-800/60 flex items-center justify-center text-red-400 shadow-sm">
                <Cast className="w-5 h-5" />
              </div>
              <div>
                <h3 id="cast-modal-title" className="text-base font-bold text-zinc-100">Cast & Audio Output</h3>
                <p className="text-xs text-zinc-400">Stream audio to speakers & televisions</p>
              </div>
            </div>
            <button
              onClick={closeCastModal}
              className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close cast modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Selector: Devices vs TV Appearance */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-900/90 rounded-2xl border border-zinc-800 mb-4">
            <button
              onClick={() => setActiveTab('devices')}
              className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'devices'
                  ? 'bg-red-600 text-white shadow-md shadow-red-950/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Cast className="w-4 h-4" />
              <span>Connect Device</span>
            </button>
            <button
              onClick={() => setActiveTab('appearance')}
              className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'appearance'
                  ? 'bg-red-600 text-white shadow-md shadow-red-950/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Tv className="w-4 h-4" />
              <span>TV Appearance</span>
            </button>
          </div>

          {activeTab === 'devices' && (
            <>
              {/* Current Playing Preview */}
              {currentEpisode && (
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 mb-4">
                  <img
                    src={getArtworkUrl(currentEpisode.imageUrl)}
                    alt={currentEpisode.title}
                    className="w-12 h-12 rounded-xl object-cover border border-zinc-700/60 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-red-400">
                        {playMode === 'radio' ? '24/7 Live Radio' : 'Episode'}
                      </span>
                      {isPlaying && (
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs font-semibold text-zinc-200 truncate">
                      {currentEpisode.title}
                    </p>
                    <p className="text-[11px] text-zinc-400">The Comedy Button</p>
                  </div>
                </div>
              )}

              {/* Connected Device Status */}
              {isCasting ? (
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/50 mb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                        Connected
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-zinc-400 capitalize">
                      {castType === 'google-cast' ? 'Google Cast' : castType === 'airplay' ? 'AirPlay' : 'Remote'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-100">
                        {castDeviceName || 'Wireless Speaker'}
                      </h4>
                      <p className="text-xs text-zinc-400">Audio playing on external device</p>
                    </div>
                    <button
                      onClick={endCast}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl bg-red-600/90 hover:bg-red-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-red-950/50"
                    >
                      <PowerOff className="w-3.5 h-3.5" />
                      Disconnect
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Cast Target Options */}
              <div className="space-y-2.5 mb-4">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">
                  Select Output Device
                </p>

                {/* Google Cast / Chromecast */}
                <button
                  onClick={handleCastGoogle}
                  className="w-full min-h-[56px] flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-700/70 hover:border-zinc-600 transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-950/60 border border-blue-800/40 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                      <Cast className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                        Google Cast / Chromecast
                        {isGoogleCastAvailable && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        )}
                      </h4>
                      <p className="text-xs text-zinc-400">
                        Nest Audio, Google Home, Smart TVs, Android TV
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-red-400 group-hover:text-red-300">
                    Connect
                  </span>
                </button>

                {/* Apple AirPlay */}
                <button
                  onClick={handleAirPlay}
                  className="w-full min-h-[56px] flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-700/70 hover:border-zinc-600 transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-800/40 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                      <Airplay className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                        Apple AirPlay
                        {isAirPlayAvailable && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        )}
                      </h4>
                      <p className="text-xs text-zinc-400">
                        HomePod, Apple TV, Sonos, Mac & iPad
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-red-400 group-hover:text-red-300">
                    Connect
                  </span>
                </button>

                {/* Remote Playback / Bluetooth Audio Output */}
                <button
                  onClick={handleRemotePlayback}
                  className="w-full min-h-[56px] flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-700/70 hover:border-zinc-600 transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                      <Speaker className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-100">
                        Bluetooth & Remote Audio
                      </h4>
                      <p className="text-xs text-zinc-400">
                        System device selector, headphones, car audio
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-red-400 group-hover:text-red-300">
                    Switch
                  </span>
                </button>
              </div>

              {/* Wi-Fi & Device Tips footer */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/60 text-zinc-400 text-[11px]">
                <Wifi className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                <p>
                  Make sure your speakers or Chromecast are powered on and connected to the same Wi-Fi network as this device.
                </p>
              </div>
            </>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-4">
              {/* Simulated 16:9 TV Receiver Screen Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    TV / Smart Display Preview (16:9)
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                    Google Cast Receiver
                  </span>
                </div>

                {/* 16:9 TV Bezel Frame */}
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden border-2 border-zinc-700/80 bg-black shadow-2xl flex flex-col justify-between p-4">
                  {/* Ambient Backdrop Artwork Blur */}
                  {artwork && (
                    <div
                      className="absolute inset-0 bg-cover bg-center filter blur-xl scale-125 opacity-35"
                      style={{ backgroundImage: `url(${artwork})` }}
                    />
                  )}

                  {/* Backdrop Theme Overlay */}
                  <div
                    className={`absolute inset-0 pointer-events-none transition-colors duration-500 ${
                      displayOptions.backdropTheme === 'crimson'
                        ? 'bg-gradient-to-t from-black via-red-950/30 to-black/80'
                        : displayOptions.backdropTheme === 'glass'
                        ? 'bg-gradient-to-t from-black/80 via-zinc-900/40 to-black/90'
                        : 'bg-black/85'
                    }`}
                  />

                  {/* TV Screen Top Bar */}
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-red-400 font-mono">
                        {playMode === 'radio' ? '24/7 LIVE STREAM' : 'ON DEMAND EPISODE'}
                      </span>
                    </div>
                    <span className="text-[10px] font-medium text-zinc-400">The Comedy Button</span>
                  </div>

                  {/* TV Screen Center: Album Art & Title */}
                  <div className="relative z-10 flex items-center gap-4 my-auto">
                    {artwork && (
                      <img
                        src={artwork}
                        alt="TV Preview"
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shadow-2xl border border-white/20 shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-extrabold text-white line-clamp-1 drop-shadow-md">
                        {currentEpisode?.title || 'The Comedy Button'}
                      </h4>
                      <p className="text-[10px] sm:text-xs text-zinc-300 line-clamp-1 font-medium mt-0.5">
                        {[
                          displayOptions.showEpisodeNumber && currentEpisode?.episodeNumber
                            ? `Episode ${currentEpisode.episodeNumber}`
                            : 'The Comedy Button',
                          displayOptions.showHosts
                            ? 'Brian, Scott, Ryan, Max'
                            : null
                        ]
                          .filter(Boolean)
                          .join(' • ')}
                      </p>
                    </div>
                  </div>

                  {/* TV Screen Bottom Bar: Progress Indicator */}
                  <div className="relative z-10 space-y-1">
                    <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Cast Display Customization Options */}
              <div className="space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">
                  On-Screen Information
                </p>

                {/* Toggle: Show Host Credits */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-200">Show Host Names on TV</p>
                      <p className="text-[11px] text-zinc-400">Brian Altano, Scott Bromley, Ryan Scott, Max Scoville</p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setDisplayOptions({ showHosts: !displayOptions.showHosts })
                    }
                    className={`min-w-[48px] min-h-[32px] px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                      displayOptions.showHosts
                        ? 'bg-red-600 text-white'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {displayOptions.showHosts ? 'ON' : 'OFF'}
                  </button>
                </div>

                {/* Toggle: Show Episode Number */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300">
                      <Hash className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-200">Show Episode Number</p>
                      <p className="text-[11px] text-zinc-400">Displays official episode number badge</p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setDisplayOptions({ showEpisodeNumber: !displayOptions.showEpisodeNumber })
                    }
                    className={`min-w-[48px] min-h-[32px] px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                      displayOptions.showEpisodeNumber
                        ? 'bg-red-600 text-white'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {displayOptions.showEpisodeNumber ? 'ON' : 'OFF'}
                  </button>
                </div>

                {/* TV Backdrop Theme */}
                <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-zinc-400" />
                    <p className="text-xs font-bold text-zinc-200">Backdrop Ambience Theme</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(['crimson', 'dark', 'glass'] as const).map((theme) => (
                      <button
                        key={theme}
                        onClick={() => setDisplayOptions({ backdropTheme: theme })}
                        className={`min-h-[40px] px-2 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                          displayOptions.backdropTheme === theme
                            ? 'bg-red-600 text-white shadow-md shadow-red-950/40'
                            : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {theme}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Informative Note */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-400 text-[11px] leading-relaxed">
                <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                <p>
                  Google Cast devices (Chromecast with Google TV, Nest Hub) and Apple TV render metadata and high-resolution artwork transmitted by this player. Any preferences changed here are instantly formatted and dispatched to your television or smart display.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
