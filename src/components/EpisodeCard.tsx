import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Episode } from '../types';
import { formatDate } from '../utils/format';
import { getArtworkUrl, handleImageError } from '../utils/assets';
import {
  SHOW_NOTES_TOPICS,
  getEpisodeDetectedTopics,
  extractShowNotesSnippet
} from '../utils/showNotesFilter';
import { ActionArrowButton } from './ActionArrowButton';
import {
  Play,
  Pause,
  Clock,
  Calendar,
  Heart,
  FileText,
  Download,
  Check,
  ChevronDown,
  ChevronUp,
  HardDriveDownload,
  Loader2
} from 'lucide-react';
import { ComedyPlayButton } from './ComedyPlayButton';

function HighlightedSnippet({
  snippet,
  highlight
}: {
  snippet: string;
  highlight?: string;
}) {
  if (!highlight || !highlight.trim()) {
    return <span>{snippet}</span>;
  }
  const escaped = highlight.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = snippet.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.trim().toLowerCase() ? (
          <mark
            key={i}
            className="bg-[#ff6355]/30 text-[#ff897a] px-1 py-0.5 rounded font-bold border border-[#ff6355]/40"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
}

interface EpisodeCardProps {
  episode: Episode;
  artworkFallback?: string;
  isCurrent: boolean;
  isEpPlaying: boolean;
  favorited: boolean;
  listened: boolean;
  isNotesExpanded: boolean;
  isOffline: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  selectedTopic: string;
  search: string;
  onPlay: () => void;
  onOpenEpisode: (episode: Episode) => void;
  onToggleFavorite: (id: string) => void;
  onToggleNotes: (id: string) => void;
  onDownloadOffline: (episode: Episode) => void;
  onSelectTopic: (topicId: string) => void;
  onSelectGuest: (guest: string) => void;
}

export const EpisodeCard: React.FC<EpisodeCardProps> = React.memo(({
  episode,
  artworkFallback,
  isCurrent,
  isEpPlaying,
  favorited,
  listened,
  isNotesExpanded,
  isOffline,
  isDownloading,
  downloadProgress,
  selectedTopic,
  search,
  onPlay,
  onOpenEpisode,
  onToggleFavorite,
  onToggleNotes,
  onDownloadOffline,
  onSelectTopic,
}) => {
  const detectedTopics = getEpisodeDetectedTopics(episode);
  const currentTopicObj = SHOW_NOTES_TOPICS.find((t) => t.id === selectedTopic);
  const queryForSnippet = search.trim() || (selectedTopic !== 'all' && currentTopicObj?.keywords[0]) || '';
  const snippetData = extractShowNotesSnippet(episode.description, queryForSnippet);

  return (
    <motion.article
      layout="position"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group bg-[#181a20] hover:bg-[#1f222a] border rounded-[28px] p-4 sm:p-5 transition-all duration-200 flex flex-col justify-between gap-3 shadow-md select-none ${
        isCurrent
          ? 'border-[#ff6355] ring-2 ring-[#ff6355]/30'
          : 'border-white/10 hover:border-white/20'
      }`}
    >
      {/* Main Card Content Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left: Thumbnail + Play Overlay */}
        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1 w-full">
          {/* Rounded-2xl Artwork Badge from reference */}
          <div className="relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-[20px] overflow-hidden border border-white/10 shadow-md bg-zinc-900">
            <img
              src={getArtworkUrl(episode.imageUrl || artworkFallback)}
              alt={episode.title}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              onError={handleImageError}
              referrerPolicy="no-referrer"
            />

            <div
              className={`absolute inset-0 flex items-center justify-center transition-all ${
                isCurrent
                  ? 'bg-black/60 opacity-100'
                  : 'bg-black/40 opacity-0 group-hover:opacity-100'
              }`}
            >
              <ComedyPlayButton
                size="sm"
                isPlaying={isEpPlaying}
                onClick={onPlay}
                title={isEpPlaying ? 'Pause' : 'Play Episode'}
                ariaLabel={isEpPlaying ? 'Pause' : 'Play Episode'}
              />
            </div>
          </div>

          {/* Title, Metadata & Topic Tags */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              {episode.episodeNumber && (
                <span className="text-[10px] font-mono font-bold uppercase bg-[#ff6355] text-white px-2 py-0.5 rounded-full shadow-sm">
                  EP #{episode.episodeNumber}
                </span>
              )}
              {episode.isBonus && (
                <span className="text-[10px] font-heading font-black uppercase bg-[#f4be47] text-zinc-950 px-2 py-0.5 rounded-full">
                  Special
                </span>
              )}
              {listened && (
                <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-full">
                  <Check className="w-3 h-3 text-[#9fe4c9]" /> Played
                </span>
              )}

              {/* Show Notes Detected Topic Badges */}
              {detectedTopics.slice(0, 2).map((top) => (
                <button
                  type="button"
                  key={top.id}
                  onClick={() => onSelectTopic(top.id)}
                  className="text-[10px] font-heading font-bold uppercase bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10 transition-colors flex items-center gap-1 cursor-pointer"
                  title={`Filter episodes by ${top.label}`}
                >
                  <span>{top.emoji}</span>
                  <span>{top.shortLabel}</span>
                </button>
              ))}
            </div>

            <h3
              onClick={() => onOpenEpisode(episode)}
              className={`font-heading font-black text-base sm:text-lg uppercase tracking-tight truncate cursor-pointer transition-colors leading-tight ${
                isCurrent ? 'text-[#ff6355]' : 'text-white hover:text-[#ff897a]'
              }`}
              title={episode.title}
            >
              {episode.title}
            </h3>

            {/* Snippet / Description Preview */}
            <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">
              {snippetData.isMatched ? (
                <span className="text-zinc-300">
                  <span className="text-[#ff6355] font-semibold mr-1">
                    Show notes match:
                  </span>
                  <HighlightedSnippet
                    snippet={snippetData.snippet}
                    highlight={snippetData.matchedText || search}
                  />
                </span>
              ) : (
                episode.description.replace(/<[^>]*>?/gm, '')
              )}
            </p>

            <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-1.5 font-mono">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-zinc-500" />
                {episode.pubDate ? formatDate(episode.pubDate) : 'Archive'}
              </span>
              {episode.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-zinc-500" />
                  {episode.duration}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Actions: Play, Action Arrow Button, Favorite, Notes */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {/* Quick Play CTA */}
          <button
            type="button"
            onClick={onPlay}
            className={`px-3.5 py-2 rounded-full font-heading font-black text-xs uppercase tracking-tight flex items-center gap-1.5 transition-all cursor-pointer ${
              isCurrent
                ? 'bg-[#ff6355] text-white shadow-md'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            {isEpPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isEpPlaying ? 'Pause' : 'Play'}</span>
          </button>

          {/* Favorite Button */}
          <button
            type="button"
            onClick={() => onToggleFavorite(episode.id)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              favorited
                ? 'bg-[#ff6355]/20 text-[#ff6355]'
                : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white'
            }`}
            title={favorited ? 'Favorited' : 'Bookmark Episode'}
            aria-label="Bookmark episode"
          >
            <Heart className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
          </button>

          {/* Download Offline Button */}
          <button
            type="button"
            onClick={() => onDownloadOffline(episode)}
            disabled={isDownloading}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              isOffline
                ? 'bg-[#9fe4c9]/20 text-[#9fe4c9]'
                : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white'
            }`}
            title={isOffline ? 'Downloaded offline' : 'Download for offline playback'}
            aria-label="Download for offline playback"
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#f4be47]" />
            ) : isOffline ? (
              <HardDriveDownload className="w-4 h-4" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </button>

          {/* Toggle Notes expansion */}
          <button
            type="button"
            onClick={() => onToggleNotes(episode.id)}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title={isNotesExpanded ? 'Hide show notes' : 'View show notes preview'}
            aria-label="Toggle show notes preview"
          >
            <FileText className="w-4 h-4" />
          </button>

          {/* Signature Circular Action Arrow Button (from reference) */}
          <ActionArrowButton
            theme="light"
            size="sm"
            title="Open Episode Full View"
            onClick={() => onOpenEpisode(episode)}
          />
        </div>
      </div>

      {/* Expandable Notes Preview */}
      <AnimatePresence>
        {isNotesExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="pt-3 border-t border-white/10 overflow-hidden"
          >
            <div className="bg-black/30 rounded-2xl p-4 text-xs text-zinc-300 leading-relaxed font-sans">
              <div className="flex items-center justify-between mb-2">
                <span className="font-heading font-black uppercase text-[10px] text-[#f4be47]">
                  FULL SHOW NOTES
                </span>
                <button
                  type="button"
                  onClick={() => onOpenEpisode(episode)}
                  className="text-[10px] text-white hover:underline font-bold"
                >
                  Open Dedicated Page ↗
                </button>
              </div>
              <p className="whitespace-pre-line">{episode.description.replace(/<[^>]*>?/gm, '')}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
});
