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
  Sparkles,
  Users,
  CheckCircle2,
  HardDriveDownload,
  Loader2
} from 'lucide-react';

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
            className="bg-red-500/30 text-red-200 px-1 py-0.5 rounded font-bold border border-red-500/50"
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
  onSelectGuest,
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
      className={`group bg-[#121520] hover:bg-[#161a28] border rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between gap-3 ${
        isCurrent
          ? 'border-red-600/70 shadow-lg shadow-red-950/30'
          : 'border-zinc-800 hover:border-zinc-700/80 shadow-sm'
      }`}
    >
      {/* Main Card Content Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left: Thumbnail + Play Overlay */}
        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1 w-full">
          <div className="relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border border-zinc-700/80 shadow-md">
            <img
              src={getArtworkUrl(episode.imageUrl || artworkFallback)}
              alt={episode.title}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              onError={handleImageError}
              referrerPolicy="no-referrer"
            />

            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.88 }}
              onClick={onPlay}
              className={`absolute inset-0 flex items-center justify-center transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-black/60 opacity-100'
                  : 'bg-black/40 opacity-0 group-hover:opacity-100'
              }`}
              title={isEpPlaying ? 'Pause' : 'Play Episode'}
              aria-label={isEpPlaying ? 'Pause' : 'Play Episode'}
            >
              <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-black/50">
                {isEpPlaying ? (
                  <motion.div
                    key="pause"
                    initial={{ scale: 0.5, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                  >
                    <Pause className="w-4 h-4 fill-current" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="play"
                    initial={{ scale: 0.5, rotate: 45 }}
                    animate={{ scale: 1, rotate: 0 }}
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </motion.div>
                )}
              </div>
            </motion.button>
          </div>

          {/* Title, Metadata & Topic Tags */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              {episode.episodeNumber && (
                <span className="text-[10px] font-bold uppercase bg-red-950/70 text-red-300 border border-red-800/50 px-2 py-0.5 rounded-md">
                  EP {episode.episodeNumber}
                </span>
              )}
              {episode.isBonus && (
                <span className="text-[10px] font-medium bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-md">
                  Special
                </span>
              )}
              {listened && (
                <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                  <Check className="w-3 h-3 text-zinc-500" /> Played
                </span>
              )}

              {/* Show Notes Detected Topic Badges */}
              {detectedTopics.slice(0, 3).map((top) => (
                <button
                  key={top.id}
                  onClick={() => onSelectTopic(top.id)}
                  className="text-[10px] font-medium bg-zinc-900/90 text-zinc-300 hover:text-red-300 hover:bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-700/60 transition-colors flex items-center gap-1 cursor-pointer"
                  title={`Filter episodes by ${top.label}`}
                >
                  <span>{top.emoji}</span>
                  <span>{top.shortLabel}</span>
                </button>
              ))}
            </div>

            <h2
              onClick={() => onOpenEpisode(episode)}
              className={`text-sm sm:text-base font-semibold truncate cursor-pointer transition-colors ${
                isCurrent
                  ? 'text-red-400 font-bold'
                  : 'text-zinc-100 hover:text-red-400'
              }`}
              title={episode.title}
            >
              {episode.title}
            </h2>

            {/* Snippet / Description Preview */}
            <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">
              {snippetData.isMatched ? (
                <span className="text-zinc-300">
                  <span className="text-red-400 font-semibold mr-1">
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

            <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-1.5 font-medium">
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
              {episode.detectedGuests && episode.detectedGuests.length > 0 && (
                <span className="hidden sm:flex items-center gap-1 text-red-300/80">
                  <Users className="w-3 h-3 text-red-400" />
                  <span>Guests: {episode.detectedGuests.join(', ')}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Actions: Play button, Inline Notes Toggle, Details, Favorite, Download */}
        <div className="flex items-center gap-1.5 sm:gap-2 self-end sm:self-center shrink-0">
          {/* Primary Play Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.90 }}
            onClick={onPlay}
            className={`relative overflow-hidden min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer group/btn ${
              isCurrent
                ? 'bg-red-600 text-white shadow-lg shadow-red-950/50 ring-2 ring-red-500/40'
                : 'bg-zinc-800/90 hover:bg-zinc-700 text-zinc-100 hover:text-white'
            }`}
          >
            {isEpPlaying ? (
              <motion.div
                key="playing"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-1.5"
              >
                <Pause className="w-4 h-4 fill-current" />
                <span>Playing</span>
              </motion.div>
            ) : (
              <motion.div
                key="play"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-1.5"
              >
                <Play className="w-4 h-4 fill-current ml-0.5 group-hover/btn:scale-110 transition-transform" />
                <span>Play</span>
              </motion.div>
            )}
          </motion.button>

          {/* Inline Expand Show Notes Toggle Button */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => onToggleNotes(episode.id)}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border ${
              isNotesExpanded
                ? 'bg-red-950/70 border-red-700 text-red-300'
                : 'bg-zinc-900 border-zinc-700/80 text-zinc-300 hover:text-white hover:bg-zinc-800'
            }`}
            title={isNotesExpanded ? 'Collapse Show Notes' : 'Read Show Notes Inline'}
            aria-expanded={isNotesExpanded}
          >
            <FileText className="w-4 h-4 text-red-400" />
            <span className="hidden sm:inline">Notes</span>
            {isNotesExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </motion.button>

          {/* Open Details Modal */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => onOpenEpisode(episode)}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-colors flex items-center justify-center cursor-pointer border border-transparent hover:border-zinc-700/60"
            title="Open Full Episode Overview"
            aria-label="Open Full Episode Overview"
          >
            <Sparkles className="w-4 h-4" />
          </motion.button>

          {/* Favorite with bouncy heart */}
          <motion.button
            whileTap={{ scale: 0.8 }}
            animate={{ scale: favorited ? [1, 1.35, 1] : 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            onClick={() => onToggleFavorite(episode.id)}
            className={`min-h-[44px] min-w-[44px] p-2.5 rounded-xl transition-colors flex items-center justify-center cursor-pointer ${
              favorited
                ? 'text-red-500 hover:text-red-400 bg-red-950/30'
                : 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
            }`}
            title={favorited ? 'Remove from favorites' : 'Favorite'}
            aria-label={favorited ? 'Remove from favorites' : 'Favorite'}
            aria-pressed={favorited}
          >
            <Heart className={`w-4 h-4 ${favorited ? 'fill-current text-red-500' : ''}`} />
          </motion.button>

          {/* Offline PWA IndexedDB Download */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.90 }}
            onClick={() => onDownloadOffline(episode)}
            className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer border ${
              isOffline
                ? 'bg-emerald-950/70 border-emerald-600/70 text-emerald-300 hover:border-red-500 hover:text-red-300'
                : isDownloading
                ? 'bg-zinc-800 border-zinc-600 text-yellow-300'
                : 'bg-zinc-900 border-zinc-700/80 text-zinc-300 hover:text-white hover:bg-zinc-800'
            }`}
            title={
              isOffline
                ? 'Saved to Offline IndexedDB storage (Tap to remove)'
                : isDownloading
                ? `Downloading audio ${downloadProgress}%...`
                : 'Download for Offline PWA listening'
            }
            aria-label="Download for offline"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
                <span className="font-mono text-[11px] font-semibold">{downloadProgress}%</span>
              </>
            ) : isOffline ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="hidden lg:inline text-[11px] font-semibold">Offline</span>
              </>
            ) : (
              <>
                <HardDriveDownload className="w-4 h-4" />
                <span className="hidden xl:inline text-[11px]">Save</span>
              </>
            )}
          </motion.button>

          {/* Direct External MP3 Link */}
          <a
            href={episode.audioUrl}
            target="_blank"
            rel="noreferrer"
            download
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl border border-zinc-700/80 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors hidden 2xl:flex items-center justify-center cursor-pointer"
            title="Direct MP3 Link"
            aria-label="Direct MP3 Link"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Inline Expandable Show Notes Drawer */}
      <AnimatePresence>
        {isNotesExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden pt-3 border-t border-zinc-800/80 text-xs"
          >
            <div className="bg-[#161a28] rounded-xl p-4 border border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-200 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <FileText className="w-3.5 h-3.5 text-red-400" />
                  Official Episode Show Notes
                </span>
                <button
                  onClick={() => onOpenEpisode(episode)}
                  className="text-red-400 hover:text-red-300 font-semibold text-[11px] cursor-pointer"
                >
                  Open in Full Modal →
                </button>
              </div>

              <div
                className="text-zinc-300 leading-relaxed space-y-2 prose prose-invert prose-p:my-1 max-w-none text-xs"
                dangerouslySetInnerHTML={{
                  __html: episode.descriptionHtml || `<p>${episode.description}</p>`
                }}
              />

              {episode.detectedGuests && episode.detectedGuests.length > 0 && (
                <div className="pt-2 border-t border-zinc-800/60 flex flex-wrap items-center gap-1.5">
                  <span className="text-zinc-400 font-semibold text-[11px]">
                    Guests in this episode:
                  </span>
                  {episode.detectedGuests.map((g) => (
                    <button
                      key={g}
                      onClick={() => onSelectGuest(g)}
                      className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 text-[10px] cursor-pointer"
                    >
                      {g}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
});
