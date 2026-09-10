import React from 'react';
import { motion } from 'motion/react';
import { Episode } from '../types';
import { useAudio } from '../context/AudioContext';
import { formatDate } from '../utils/format';
import { getArtworkUrl, handleImageError } from '../utils/assets';
import {
  isAnthonyEpisode,
  isKristinEpisode,
  detectEpisodeGuests
} from '../utils/podcastEras';
import {
  X,
  Play,
  Pause,
  Download,
  Check,
  Heart,
  ExternalLink,
  Users,
  Calendar,
  Clock
} from 'lucide-react';

interface EpisodeModalProps {
  episode: Episode | null;
  onClose: () => void;
}

export const EpisodeModal: React.FC<EpisodeModalProps> = ({ episode, onClose }) => {
  const {
    currentEpisode,
    isPlaying,
    playEpisode,
    togglePlay,
    toggleListened,
    toggleFavorite,
    isListened,
    isFavorite,
  } = useAudio();

  // Handle ESC key to close modal
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!episode) return null;

  const isCurrentPlaying = currentEpisode?.id === episode.id && isPlaying;
  const listened = isListened(episode.id);
  const favorited = isFavorite(episode.id);

  const isAnthony = isAnthonyEpisode(episode);
  const isKristin = isKristinEpisode(episode);
  const num = episode.episodeNumber;
  const isFinale = num && num >= 500 && num <= 550;

  let eraLabel = 'Classic Core Era (2014–2017)';
  if (isAnthony) {
    eraLabel = 'OG Anthony Gallegos Era (2011–2014)';
  } else if (isFinale) {
    eraLabel = 'Grand Finale Era (Ep 500+)';
  } else if (isKristin) {
    eraLabel = 'Kristin Van De Yar Era (2017–2022)';
  } else if (episode.isBonus || episode.isSpecial) {
    eraLabel = 'Special Episode & Commentary';
  }

  const eraHosts = isAnthony
    ? 'Brian Altano, Scott Bromley, Anthony Gallegos, Ryan Scott, Max Scoville'
    : isKristin
    ? 'Brian Altano, Scott Bromley, Kristin Van De Yar, Ryan Scott, Max Scoville'
    : 'Brian Altano, Scott Bromley, Ryan Scott, Max Scoville';

  const guests = episode.detectedGuests && episode.detectedGuests.length > 0
    ? episode.detectedGuests
    : detectEpisodeGuests(episode);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className="bg-[#121520] border-t sm:border border-zinc-700/80 rounded-t-3xl sm:rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl text-zinc-100 flex flex-col max-h-[92vh] sm:max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Handle Indicator */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center bg-[#161a28]">
          <div className="w-12 h-1.5 bg-zinc-700 rounded-full" />
        </div>

        {/* Header with Artwork & Title */}
        <div className="p-4 sm:p-6 border-b border-zinc-800 bg-[#161a28] flex items-start justify-between gap-3 sm:gap-4">
          <div className="flex gap-3.5 sm:gap-4 items-start min-w-0">
            <img
              src={getArtworkUrl(episode.imageUrl)}
              alt={episode.title}
              className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl border border-zinc-700 shadow-md object-cover shrink-0"
              onError={handleImageError}
              referrerPolicy="no-referrer"
            />
            <div className="space-y-1 sm:space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                {episode.episodeNumber ? (
                  <span className="text-[10px] sm:text-xs font-bold bg-red-950/90 text-red-300 border border-red-800/60 px-2 py-0.5 rounded-md">
                    EPISODE #{episode.episodeNumber}
                  </span>
                ) : (
                  <span className="text-[10px] sm:text-xs font-semibold bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-md">
                    SPECIAL
                  </span>
                )}
                <span className="text-[11px] sm:text-xs text-zinc-400 font-medium">
                  {eraLabel}
                </span>
              </div>

              <h2 className="text-sm sm:text-lg font-bold text-zinc-100 leading-snug line-clamp-2">
                {episode.title}
              </h2>

              {guests.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 pt-0.5">
                  <span className="text-[10px] sm:text-[11px] font-semibold text-zinc-400">Guests:</span>
                  {guests.map((g) => (
                    <span
                      key={g}
                      className="text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Metadata row */}
        <div className="px-4 sm:px-6 py-2.5 bg-[#0e111a] border-b border-zinc-800 flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-medium text-zinc-400">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
            {formatDate(episode.pubDate)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            {episode.duration}
          </span>
          <span className="hidden sm:flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-zinc-500" />
            <span className="truncate max-w-xs">{eraHosts}</span>
          </span>
        </div>

        {/* Action button bar */}
        <div className="px-4 sm:px-6 py-3 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2.5 bg-[#141824]">
          <div className="flex items-center gap-2 flex-wrap">
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                if (currentEpisode?.id === episode.id) {
                  togglePlay();
                } else {
                  playEpisode(episode);
                }
              }}
              className="min-h-[42px] px-4 sm:px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors shadow-md shadow-red-950/50 cursor-pointer"
            >
              {isCurrentPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                  <span>Play Episode</span>
                </>
              )}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => toggleListened(episode.id)}
              className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                listened
                  ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 border-zinc-800'
              }`}
            >
              <Check className="w-3.5 h-3.5 text-red-400" />
              <span>{listened ? 'Listened' : 'Mark Listened'}</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.85 }}
              animate={{ scale: favorited ? [1, 1.3, 1] : 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              onClick={() => toggleFavorite(episode.id)}
              className={`min-h-[42px] min-w-[42px] p-2.5 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
                favorited
                  ? 'bg-red-950/80 border-red-800 text-red-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
              title="Favorite"
            >
              <Heart className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
            </motion.button>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={episode.audioUrl}
              target="_blank"
              rel="noreferrer"
              download
              className="min-h-[42px] min-w-[42px] p-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center justify-center"
              title="Download MP3"
            >
              <Download className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Show notes body */}
        <div className="p-4 sm:p-6 max-h-[48vh] overflow-y-auto space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Show Notes & Overview
          </h3>
          <div
            className="text-zinc-300 text-xs sm:text-sm leading-relaxed space-y-3 prose prose-invert prose-p:my-2 prose-a:text-red-400"
            dangerouslySetInnerHTML={{ __html: episode.descriptionHtml || `<p>${episode.description}</p>` }}
          />

          <div className="pt-4 mt-6 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
            <span>Official Libsyn Feed Archive</span>
            <a
              href={episode.link}
              target="_blank"
              rel="noreferrer"
              className="text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold"
            >
              <span>View Source</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
