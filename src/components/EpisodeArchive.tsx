import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Episode, PodcastMeta } from '../types';
import { useAudio } from '../context/AudioContext';
import { formatDate } from '../utils/format';
import { getArtworkUrl, handleImageError } from '../utils/assets';
import {
  SHOW_NOTES_TOPICS,
  POPULAR_GUEST_NAMES,
  episodeMatchesTopic
} from '../utils/showNotesFilter';
import { downloadEpisodeForOffline } from '../utils/offlineStorage';
import { EpisodeCard } from './EpisodeCard';
import { EpisodePagination } from './EpisodePagination';
import {
  Search,
  Shuffle,
  ChevronDown,
  X,
  SlidersHorizontal,
  FileText,
  RotateCcw,
  Plus
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

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
    toggleListened,
    isOfflineSaved,
    refreshOfflineIds,
    removeOfflineEpisode,
    offlineDownloadedIds
  } = useAudio();

  const [downloadingEpisodes, setDownloadingEpisodes] = useState<Record<string, number>>({});
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownloadOffline = async (ep: Episode) => {
    if (downloadingEpisodes[ep.id] !== undefined) return;

    if (isOfflineSaved(ep.id)) {
      await removeOfflineEpisode(ep.id);
      return;
    }

    try {
      setDownloadingEpisodes((prev) => ({ ...prev, [ep.id]: 0 }));
      await downloadEpisodeForOffline(ep, (progress) => {
        setDownloadingEpisodes((prev) => ({ ...prev, [ep.id]: progress }));
      });
      await refreshOfflineIds();
    } catch (err: any) {
      console.error('Failed to download episode offline:', err);
      setDownloadError(`Could not cache offline: ${err.message || 'Network error'}`);
      setTimeout(() => setDownloadError(null), 4000);
    } finally {
      setDownloadingEpisodes((prev) => {
        const next = { ...prev };
        delete next[ep.id];
        return next;
      });
    }
  };

  const [search, setSearch] = useState('');
  const [searchScope, setSearchScope] = useState<'all' | 'notes' | 'title'>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedGuest, setSelectedGuest] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'unplayed' | 'favorites' | 'downloaded' | 'specials'>('all');
  const [selectedEra, setSelectedEra] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'longest' | 'shortest'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedNotesEpisodeId, setExpandedNotesEpisodeId] = useState<string | null>(null);
  const itemsPerPage = 20;

  // Filter & Sort Pipeline
  const filteredEpisodes = useMemo(() => {
    let result = [...episodes];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((ep) => {
        const titleMatch =
          ep.title.toLowerCase().includes(q) ||
          (ep.episodeNumber && ep.episodeNumber.toString() === q);
        const notesMatch = (ep.description || '').toLowerCase().includes(q);

        if (searchScope === 'notes') return notesMatch;
        if (searchScope === 'title') return titleMatch;
        return titleMatch || notesMatch;
      });
    }

    if (selectedTopic !== 'all') {
      result = result.filter((ep) =>
        episodeMatchesTopic(ep, selectedTopic, selectedGuest)
      );
    } else if (selectedGuest !== 'all') {
      result = result.filter((ep) => {
        const guests = ep.detectedGuests || [];
        if (guests.includes(selectedGuest)) return true;
        return (ep.description || '').toLowerCase().includes(selectedGuest.toLowerCase());
      });
    }

    if (filterType === 'unplayed') {
      result = result.filter((ep) => !isListened(ep.id));
    } else if (filterType === 'favorites') {
      result = result.filter((ep) => isFavorite(ep.id));
    } else if (filterType === 'downloaded') {
      result = result.filter((ep) => isOfflineSaved(ep.id));
    } else if (filterType === 'specials') {
      result = result.filter((ep) => ep.isBonus || ep.isSpecial || !ep.episodeNumber);
    }

    if (selectedEra !== 'all') {
      if (selectedEra === 'anthony') {
        result = result.filter((ep) => ep.episodeNumber && ep.episodeNumber <= 177);
      } else if (selectedEra === 'kristin') {
        result = result.filter(
          (ep) => ep.episodeNumber && ep.episodeNumber > 177 && ep.episodeNumber < 500
        );
      } else if (selectedEra === 'finale') {
        result = result.filter((ep) => ep.episodeNumber && ep.episodeNumber >= 500);
      }
    }

    result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
      if (sortBy === 'oldest') return new Date(a.pubDate).getTime() - new Date(b.pubDate).getTime();
      if (sortBy === 'longest') return (b.durationSeconds || 0) - (a.durationSeconds || 0);
      if (sortBy === 'shortest') return (a.durationSeconds || 0) - (b.durationSeconds || 0);
      return 0;
    });

    return result;
  }, [
    episodes,
    search,
    searchScope,
    selectedTopic,
    selectedGuest,
    filterType,
    selectedEra,
    sortBy,
    isListened,
    isFavorite,
    isOfflineSaved,
    offlineDownloadedIds
  ]);

  const totalPages = Math.ceil(filteredEpisodes.length / itemsPerPage);
  const paginatedEpisodes = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEpisodes.slice(start, start + itemsPerPage);
  }, [filteredEpisodes, currentPage, itemsPerPage]);

  const handleResetAllFilters = () => {
    triggerHaptic(8);
    setSearch('');
    setSearchScope('all');
    setSelectedTopic('all');
    setSelectedGuest('all');
    setFilterType('all');
    setSelectedEra('all');
    setSortBy('newest');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 sm:space-y-8 select-none relative pb-16">
      {/* 1. ARCHIVE HEADER ROW (Styled like "REPORTS" in reference) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-black text-2xl sm:text-4xl uppercase tracking-tight text-white leading-none">
            EPISODE ARCHIVE
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Complete 560+ show master catalog · 12+ seasons
          </p>
        </div>

        {/* Dropdown Filters (White pills from reference: all operations ▾, all experience ▾) */}
        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
          {/* Era filter */}
          <div className="relative">
            <select
              value={selectedEra}
              onChange={(e) => {
                setSelectedEra(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white hover:bg-zinc-100 text-zinc-950 font-heading font-black text-xs uppercase tracking-tight py-2 px-3.5 pr-8 rounded-full shadow-sm appearance-none cursor-pointer focus:outline-none"
            >
              <option value="all">All Eras</option>
              <option value="anthony">Anthony Era (Ep 1–177)</option>
              <option value="kristin">Kristin Era (Ep 178–499)</option>
              <option value="finale">Final Era (Ep 500+)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-900 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.5]" />
          </div>

          {/* Sort filter */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white hover:bg-zinc-100 text-zinc-950 font-heading font-black text-xs uppercase tracking-tight py-2 px-3.5 pr-8 rounded-full shadow-sm appearance-none cursor-pointer focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="longest">Longest Duration</option>
              <option value="shortest">Shortest Duration</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-900 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.5]" />
          </div>

          {/* Type filter */}
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value as any);
                setCurrentPage(1);
              }}
              className="bg-white hover:bg-zinc-100 text-zinc-950 font-heading font-black text-xs uppercase tracking-tight py-2 px-3.5 pr-8 rounded-full shadow-sm appearance-none cursor-pointer focus:outline-none"
            >
              <option value="all">All Shows</option>
              <option value="favorites">Bookmarked</option>
              <option value="downloaded">Downloaded</option>
              <option value="unplayed">Unplayed Only</option>
              <option value="specials">Bonus Specials</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-900 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* 2. SEARCH BAR WITH SOUNDWAVE ICON (Matching "Search by name or type" in "REPORTS" reference) */}
      <div className="space-y-3">
        <div className="relative flex items-center bg-[#181a20] border border-white/10 rounded-full px-5 py-3 shadow-lg focus-within:border-white/30 transition-all">
          <Search className="w-4 h-4 text-zinc-400 shrink-0 mr-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by episode title, show notes, or jokes..."
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-zinc-500 font-sans focus:outline-none"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="p-1 text-zinc-400 hover:text-white mr-2"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Equalizer Waveform Sound Bars icon from reference */}
          <div className="flex items-center gap-0.5 shrink-0 pl-2 border-l border-white/10 text-[#ff6355]">
            <span className="w-0.5 h-2.5 bg-[#ff6355] rounded-full eq-bar-1" />
            <span className="w-0.5 h-4 bg-[#ff6355] rounded-full eq-bar-2" />
            <span className="w-0.5 h-3 bg-[#ff6355] rounded-full eq-bar-3" />
            <span className="w-0.5 h-5 bg-[#ff6355] rounded-full eq-bar-4" />
          </div>
        </div>

        {/* Results Count Line (like "101 reports found" in reference) */}
        <div className="flex items-center justify-between px-2 text-xs font-mono text-zinc-400">
          <span>{filteredEpisodes.length} episodes found</span>
          {(search || selectedTopic !== 'all' || filterType !== 'all' || selectedEra !== 'all') && (
            <button
              type="button"
              onClick={handleResetAllFilters}
              className="text-[#ff6355] hover:underline flex items-center gap-1 font-bold cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset filters</span>
            </button>
          )}
        </div>

        {/* Quick Topic Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            type="button"
            onClick={() => {
              setSelectedTopic('all');
              setCurrentPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-heading font-black uppercase tracking-tight shrink-0 transition-colors cursor-pointer ${
              selectedTopic === 'all'
                ? 'bg-white text-zinc-950 shadow-sm'
                : 'bg-[#181a20] text-zinc-400 hover:text-white border border-white/10'
            }`}
          >
            All Topics
          </button>
          {SHOW_NOTES_TOPICS.slice(0, 8).map((top) => (
            <button
              type="button"
              key={top.id}
              onClick={() => {
                setSelectedTopic(top.id);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-heading font-black uppercase tracking-tight shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer ${
                selectedTopic === top.id
                  ? 'bg-[#f4be47] text-zinc-950 shadow-sm'
                  : 'bg-[#181a20] text-zinc-400 hover:text-white border border-white/10'
              }`}
            >
              <span>{top.emoji}</span>
              <span>{top.shortLabel}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. EPISODE LIST (Cards styled like "PRIME COST REPORT" in reference) */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="p-12 text-center text-zinc-400 font-heading font-black text-sm uppercase">
            Loading episode master vault...
          </div>
        ) : paginatedEpisodes.length > 0 ? (
          paginatedEpisodes.map((episode) => {
            const isCurrent = currentEpisode?.id === episode.id;
            const isEpPlaying = isCurrent && isPlaying;
            return (
              <EpisodeCard
                key={episode.id}
                episode={episode}
                isCurrent={isCurrent}
                isEpPlaying={isEpPlaying}
                favorited={isFavorite(episode.id)}
                listened={isListened(episode.id)}
                isNotesExpanded={expandedNotesEpisodeId === episode.id}
                isOffline={isOfflineSaved(episode.id)}
                isDownloading={downloadingEpisodes[episode.id] !== undefined}
                downloadProgress={downloadingEpisodes[episode.id] || 0}
                selectedTopic={selectedTopic}
                search={search}
                onPlay={() => {
                  triggerHaptic(10);
                  if (isCurrent) {
                    togglePlay();
                  } else {
                    playEpisode(episode, 0, 'archive');
                  }
                }}
                onOpenEpisode={onOpenEpisode}
                onToggleFavorite={toggleFavorite}
                onToggleNotes={(id) => {
                  triggerHaptic(6);
                  setExpandedNotesEpisodeId(expandedNotesEpisodeId === id ? null : id);
                }}
                onDownloadOffline={handleDownloadOffline}
                onSelectTopic={(t) => {
                  setSelectedTopic(t);
                  setCurrentPage(1);
                }}
                onSelectGuest={(g) => {
                  setSelectedGuest(g);
                  setCurrentPage(1);
                }}
              />
            );
          })
        ) : (
          <div className="bg-[#181a20] border border-white/10 rounded-[28px] p-8 text-center text-zinc-400">
            <p className="font-heading font-black text-base uppercase text-white mb-1">
              No matching episodes found
            </p>
            <p className="text-xs">Try searching for other words or reset your filters.</p>
            <button
              type="button"
              onClick={handleResetAllFilters}
              className="mt-4 px-4 py-2 bg-white text-zinc-950 font-heading font-black text-xs uppercase rounded-full shadow-md hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* 4. PAGINATION */}
      {totalPages > 1 && (
        <EpisodePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* 5. FLOATING CORAL "+" ACTION BUTTON (Matching the circular orange/coral "+" button in reference) */}
      {onPlayTrueRandom && (
        <div className="fixed bottom-20 right-6 z-40">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              triggerHaptic(14);
              onPlayTrueRandom();
            }}
            className="w-14 h-14 rounded-full bg-[#ff6355] text-white shadow-2xl flex items-center justify-center font-bold text-2xl hover:bg-[#fa5344] transition-colors cursor-pointer border-2 border-white/20"
            title="Shuffle & Play True Random Episode"
            aria-label="Play Random Episode"
          >
            <Shuffle className="w-6 h-6 stroke-[2.5]" />
          </motion.button>
        </div>
      )}
    </div>
  );
};
