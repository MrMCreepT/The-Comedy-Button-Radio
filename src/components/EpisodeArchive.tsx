import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Episode, PodcastMeta } from '../types';
import { useAudio } from '../context/AudioContext';
import { formatDate } from '../utils/format';
import {
  Search,
  Play,
  Pause,
  Clock,
  Calendar,
  Heart,
  FileText,
  Download,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check,
  Headphones,
  SlidersHorizontal,
  X
} from 'lucide-react';

interface EpisodeArchiveProps {
  episodes: Episode[];
  meta: PodcastMeta | null;
  loading: boolean;
  onOpenEpisode: (episode: Episode) => void;
  onPlayTrueRandom?: () => void;
}

export const EpisodeArchive: React.FC<EpisodeArchiveProps> = ({
  episodes,
  meta,
  loading,
  onOpenEpisode,
  onPlayTrueRandom
}) => {
  const {
    currentEpisode,
    isPlaying,
    playEpisode,
    togglePlay,
    toggleFavorite,
    isFavorite,
    isListened,
    toggleListened
  } = useAudio();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unplayed' | 'favorites' | 'specials'>('all');
  const [selectedEra, setSelectedEra] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'longest' | 'shortest'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Filter & Sort Pipeline
  const filteredEpisodes = useMemo(() => {
    let result = [...episodes];

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(ep =>
        ep.title.toLowerCase().includes(q) ||
        ep.description.toLowerCase().includes(q) ||
        (ep.episodeNumber && ep.episodeNumber.toString() === q)
      );
    }

    // Filter type
    if (filterType === 'unplayed') {
      result = result.filter(ep => !isListened(ep.id));
    } else if (filterType === 'favorites') {
      result = result.filter(ep => isFavorite(ep.id));
    } else if (filterType === 'specials') {
      result = result.filter(ep => ep.isBonus || ep.isSpecial || !ep.episodeNumber);
    }

    // Era filter
    if (selectedEra !== 'all') {
      if (selectedEra === 'anthony') {
        result = result.filter(ep => ep.episodeNumber && ep.episodeNumber <= 177);
      } else if (selectedEra === 'kristin') {
        result = result.filter(ep => ep.episodeNumber && ep.episodeNumber > 177 && ep.episodeNumber < 500);
      } else if (selectedEra === 'finale') {
        result = result.filter(ep => ep.episodeNumber && ep.episodeNumber >= 500);
      }
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.pubDate).getTime() - new Date(b.pubDate).getTime();
      }
      if (sortBy === 'longest') {
        return (b.durationSeconds || 0) - (a.durationSeconds || 0);
      }
      if (sortBy === 'shortest') {
        return (a.durationSeconds || 0) - (b.durationSeconds || 0);
      }
      return 0;
    });

    return result;
  }, [episodes, search, filterType, selectedEra, sortBy, isListened, isFavorite]);

  // Pagination
  const totalPages = Math.ceil(filteredEpisodes.length / itemsPerPage) || 1;
  const paginatedEpisodes = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEpisodes.slice(start, start + itemsPerPage);
  }, [filteredEpisodes, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 280, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Show Header & Brand Overview */}
      <div className="bg-[#121520] border border-zinc-800 rounded-2xl p-5 sm:p-7 shadow-lg relative overflow-hidden">
        {/* Subtle red ambient glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
          {/* Official Album Art */}
          <div className="relative shrink-0 w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden shadow-2xl border border-zinc-700/60 group">
            <img
              src="/assets/cover.jpg"
              alt="The Comedy Button Official Artwork"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
            <span className="absolute bottom-2 left-2 right-2 text-center text-[10px] font-bold text-zinc-300 uppercase tracking-wider bg-black/70 py-0.5 rounded backdrop-blur-sm">
              Official Archive
            </span>
          </div>

          {/* Show Details */}
          <div className="flex-1 text-center md:text-left space-y-3">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-950/60 border border-red-800/40 text-red-400 text-xs font-semibold">
              <Headphones className="w-3.5 h-3.5" />
              <span>Full Comedy Button Library</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-zinc-100 tracking-tight">
              The Comedy Button
            </h1>

            <p className="text-sm text-zinc-300/90 leading-relaxed max-w-3xl line-clamp-2 sm:line-clamp-3">
              {meta?.description ||
                "Prepare for some of the most insane rambling about everything from life, to sex, to what passes for 21st-century Internet culture. Courtesy of Brian Altano, Scott Bromley, Anthony Gallegos, Ryan Scott, Max Scoville, and Kristin Van De Yar."}
            </p>

            {/* Metadata Badges & Quick Action */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1 text-xs text-zinc-400">
              <span className="bg-zinc-800/90 px-3 py-1 rounded-lg border border-zinc-700/60 text-zinc-200 font-medium">
                {episodes.length} Episodes
              </span>
              <span className="bg-zinc-800/90 px-3 py-1 rounded-lg border border-zinc-700/60 text-zinc-300">
                12+ Seasons
              </span>
              <span className="bg-zinc-800/90 px-3 py-1 rounded-lg border border-zinc-700/60 text-zinc-300">
                Weekly Releases (2011–2026)
              </span>

              {onPlayTrueRandom && (
                <button
                  onClick={onPlayTrueRandom}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors shadow-md shadow-red-950/40 cursor-pointer ml-auto"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Shuffle Archive</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Filters & Sort */}
      <div className="bg-[#121520] border border-zinc-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search 560+ episodes by title, topic, or episode number..."
              className="w-full pl-10 pr-9 py-2.5 bg-zinc-900/90 border border-zinc-700/80 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-3 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs font-medium text-zinc-200 focus:outline-none focus:border-red-500 cursor-pointer w-full sm:w-auto"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="longest">Longest Duration</option>
              <option value="shortest">Shortest Duration</option>
            </select>
          </div>
        </div>

        {/* Filter Pills & Eras */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-800/80 text-xs">
          {/* Status Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All' },
              { id: 'unplayed', label: 'Unplayed' },
              { id: 'favorites', label: 'Favorites' },
              { id: 'specials', label: 'Specials' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => {
                  setFilterType(f.id as any);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  filterType === f.id
                    ? 'bg-zinc-100 text-zinc-900 font-semibold shadow-sm'
                    : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Era Filter Chips */}
          <div className="flex items-center gap-1.5 text-zinc-400">
            <span className="text-[11px] font-medium hidden md:inline">Era:</span>
            {[
              { id: 'all', label: 'All Eras' },
              { id: 'anthony', label: 'Anthony (Ep 1–177)' },
              { id: 'kristin', label: 'Kristin (Ep 178–499)' },
              { id: 'finale', label: 'Finale (Ep 500+)' }
            ].map(era => (
              <button
                key={era.id}
                onClick={() => {
                  setSelectedEra(era.id);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] transition-colors cursor-pointer ${
                  selectedEra === era.id
                    ? 'bg-red-950 text-red-300 border border-red-700/60 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {era.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Episode Count & Results Status */}
      <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
        <span>
          Showing {filteredEpisodes.length} episode{filteredEpisodes.length === 1 ? '' : 's'}
          {search && ` matching "${search}"`}
        </span>
        <span>Page {currentPage} of {totalPages}</span>
      </div>

      {/* Episodes List View */}
      {loading ? (
        <div className="py-16 text-center text-zinc-400 space-y-3">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium">Loading episode catalog...</p>
        </div>
      ) : paginatedEpisodes.length === 0 ? (
        <div className="py-16 text-center bg-[#121520] border border-zinc-800 rounded-2xl p-8">
          <p className="text-base text-zinc-300 font-semibold mb-1">No episodes found</p>
          <p className="text-xs text-zinc-500 mb-4">Try adjusting your search keywords or active filters</p>
          <button
            onClick={() => {
              setSearch('');
              setFilterType('all');
              setSelectedEra('all');
            }}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedEpisodes.map(episode => {
            const isCurrent = currentEpisode?.id === episode.id;
            const isEpPlaying = isCurrent && isPlaying;
            const favorited = isFavorite(episode.id);
            const listened = isListened(episode.id);

            return (
              <motion.article
                key={episode.id}
                layout="position"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`group bg-[#121520] hover:bg-[#161a28] border rounded-2xl p-4 transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isCurrent
                    ? 'border-red-600/80 shadow-md shadow-red-950/20'
                    : 'border-zinc-800/80 hover:border-zinc-700/80'
                }`}
              >
                {/* Left: Play Trigger & Thumbnail & Details */}
                <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                  {/* Artwork / Play Action */}
                  <div className="relative shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-700/60">
                    <img
                      src={episode.imageUrl || "/assets/cover.jpg"}
                      alt={episode.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />

                    <button
                      onClick={() => {
                        if (isCurrent) {
                          togglePlay();
                        } else {
                          playEpisode(episode);
                        }
                      }}
                      className={`absolute inset-0 flex items-center justify-center transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-black/60 opacity-100'
                          : 'bg-black/40 opacity-0 group-hover:opacity-100'
                      }`}
                      title={isEpPlaying ? 'Pause' : 'Play Episode'}
                    >
                      <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
                        {isEpPlaying ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        )}
                      </div>
                    </button>
                  </div>

                  {/* Title & Metadata */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
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

                    <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">
                      {episode.description.replace(/<[^>]*>?/gm, '')}
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
                    </div>
                  </div>
                </div>

                {/* Right Actions: Play button (mobile), Notes, Favorite, Download */}
                <div className="flex items-center gap-1 sm:gap-2 self-end sm:self-center shrink-0">
                  {/* Primary Play Button on Desktop */}
                  <button
                    onClick={() => {
                      if (isCurrent) {
                        togglePlay();
                      } else {
                        playEpisode(episode);
                      }
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isCurrent
                        ? 'bg-red-600 text-white shadow-md shadow-red-950/40'
                        : 'bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200'
                    }`}
                  >
                    {isEpPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>Playing</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        <span>Play</span>
                      </>
                    )}
                  </button>

                  {/* Show Notes */}
                  <button
                    onClick={() => onOpenEpisode(episode)}
                    className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors cursor-pointer"
                    title="View Show Notes"
                  >
                    <FileText className="w-4 h-4" />
                  </button>

                  {/* Favorite */}
                  <button
                    onClick={() => toggleFavorite(episode.id)}
                    className={`p-2 rounded-xl transition-colors cursor-pointer ${
                      favorited
                        ? 'text-red-500 hover:text-red-400'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                    }`}
                    title={favorited ? 'Remove from favorites' : 'Favorite'}
                  >
                    <Heart className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
                  </button>

                  {/* Download MP3 */}
                  <a
                    href={episode.audioUrl}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors hidden md:block"
                    title="Direct MP3 Link"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1 text-xs font-semibold">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, idx) => {
              let pageNum = idx + 1;
              if (totalPages > 7 && currentPage > 4) {
                pageNum = currentPage - 4 + idx;
                if (pageNum > totalPages) pageNum = totalPages - (6 - idx);
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-8 h-8 rounded-lg transition-colors cursor-pointer ${
                    currentPage === pageNum
                      ? 'bg-red-600 text-white'
                      : 'bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
