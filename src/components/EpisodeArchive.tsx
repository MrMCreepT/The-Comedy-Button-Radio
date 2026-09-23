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
import { OfficialLinksBar } from './OfficialLinksBar';
import { EpisodeCard } from './EpisodeCard';
import { EpisodePagination } from './EpisodePagination';
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
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Users,
  RotateCcw,
  CheckCircle2,
  HardDriveDownload,
  Trash2,
  Loader2
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

  // Precomputed episode counts for all show notes topics
  const topicCounts = useMemo(() => {
    const counts: Record<string, number> = { all: episodes.length };
    for (const topic of SHOW_NOTES_TOPICS) {
      counts[topic.id] = episodes.filter((ep) => episodeMatchesTopic(ep, topic.id)).length;
    }
    return counts;
  }, [episodes]);

  // Precomputed guest counts from show notes and metadata
  const guestCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const g of POPULAR_GUEST_NAMES) {
      counts[g] = episodes.filter((ep) => {
        const guests = ep.detectedGuests || [];
        if (guests.includes(g)) return true;
        return (ep.description || '').toLowerCase().includes(g.toLowerCase());
      }).length;
    }
    return counts;
  }, [episodes]);

  // Filter & Sort Pipeline
  const filteredEpisodes = useMemo(() => {
    let result = [...episodes];

    // Search query with scope awareness
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((ep) => {
        const titleMatch =
          ep.title.toLowerCase().includes(q) ||
          (ep.episodeNumber && ep.episodeNumber.toString() === q);
        const notesMatch = (ep.description || '').toLowerCase().includes(q);

        if (searchScope === 'notes') {
          return notesMatch;
        }
        if (searchScope === 'title') {
          return titleMatch;
        }
        return titleMatch || notesMatch;
      });
    }

    // Show notes topic filtering
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

    // Filter type (playback status / downloaded / specials)
    if (filterType === 'unplayed') {
      result = result.filter((ep) => !isListened(ep.id));
    } else if (filterType === 'favorites') {
      result = result.filter((ep) => isFavorite(ep.id));
    } else if (filterType === 'downloaded') {
      result = result.filter((ep) => isOfflineSaved(ep.id));
    } else if (filterType === 'specials') {
      result = result.filter((ep) => ep.isBonus || ep.isSpecial || !ep.episodeNumber);
    }

    // Era filter
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

  // Check if any filters are active
  const hasActiveFilters =
    Boolean(search.trim()) ||
    searchScope !== 'all' ||
    selectedTopic !== 'all' ||
    selectedGuest !== 'all' ||
    filterType !== 'all' ||
    selectedEra !== 'all';

  const handleResetAllFilters = () => {
    setSearch('');
    setSearchScope('all');
    setSelectedTopic('all');
    setSelectedGuest('all');
    setFilterType('all');
    setSelectedEra('all');
    setCurrentPage(1);
  };

  // Pagination
  const totalPages = Math.ceil(filteredEpisodes.length / itemsPerPage) || 1;
  const paginatedEpisodes = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEpisodes.slice(start, start + itemsPerPage);
  }, [filteredEpisodes, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 320, behavior: 'smooth' });
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
              src={getArtworkUrl(meta?.imageUrl)}
              alt="The Comedy Button Official Artwork"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={handleImageError}
              referrerPolicy="no-referrer"
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

            {/* Official Channels, Store & Community Links */}
            <div className="pt-2 border-t border-zinc-800/80">
              <OfficialLinksBar variant="pills" />
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Show Notes Filter & Sort */}
      <div className="bg-[#121520] border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        {/* Row 1: Search Input + Search Scope + Sort */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={
                searchScope === 'notes'
                  ? 'Search words strictly in show notes (e.g., Chuck E. Cheese, hot spring, hobo wine)...'
                  : searchScope === 'title'
                  ? 'Search episode titles or episode # (e.g. Episode 550, Special)...'
                  : 'Search titles & show notes by topic, joke, guest, or episode #...'
              }
              className="w-full pl-10 pr-9 py-2.5 bg-zinc-900/90 border border-zinc-700/80 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search Scope Segmented Control */}
          <div className="flex items-center gap-1 bg-zinc-900/90 p-1 border border-zinc-700/80 rounded-xl text-xs shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setSearchScope('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                searchScope === 'all'
                  ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Search both episode titles and show notes"
            >
              All Fields
            </button>
            <button
              onClick={() => setSearchScope('notes')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                searchScope === 'notes'
                  ? 'bg-red-600 text-white font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Search strictly inside episode descriptions & show notes"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Show Notes Only</span>
            </button>
            <button
              onClick={() => setSearchScope('title')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                searchScope === 'title'
                  ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Search only episode titles"
            >
              Titles Only
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs font-medium text-zinc-200 focus:outline-none focus:border-red-500 cursor-pointer w-full sm:w-auto"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="longest">Longest Duration</option>
              <option value="shortest">Shortest Duration</option>
            </select>
          </div>
        </div>

        {/* Row 2: Show Notes Topics Filter Bar */}
        <div className="space-y-2 pt-2 border-t border-zinc-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-red-500" />
              Filter by Show Notes Topics
            </span>
            {selectedTopic !== 'all' && (
              <span className="text-xs text-zinc-400">
                {SHOW_NOTES_TOPICS.find((t) => t.id === selectedTopic)?.description}
              </span>
            )}
          </div>

          {/* Topic Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 -mx-2 px-2 sm:mx-0 sm:px-0 sm:flex-wrap">
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                setSelectedTopic('all');
                setSelectedGuest('all');
                setCurrentPage(1);
              }}
              className={`shrink-0 min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedTopic === 'all'
                  ? 'bg-zinc-100 text-zinc-950 font-bold shadow-md'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              <span>✨ All Topics</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedTopic === 'all' ? 'bg-zinc-300 text-zinc-900' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {topicCounts.all}
              </span>
            </motion.button>

            {SHOW_NOTES_TOPICS.map((topic) => {
              const isActive = selectedTopic === topic.id;
              const count = topicCounts[topic.id] || 0;
              return (
                <motion.button
                  key={topic.id}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => {
                    setSelectedTopic(isActive ? 'all' : topic.id);
                    if (topic.id !== 'guests') setSelectedGuest('all');
                    setCurrentPage(1);
                  }}
                  className={`shrink-0 min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-red-600 text-white font-bold shadow-md shadow-red-950/40 border border-red-500'
                      : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
                  }`}
                  title={topic.description}
                >
                  <span>{topic.emoji}</span>
                  <span>{topic.shortLabel}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {count}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Guest Stars Sub-Bar (Shown when Guests topic is active or a guest is selected) */}
        {(selectedTopic === 'guests' || selectedGuest !== 'all') && (
          <div className="bg-[#161a28] border border-red-900/30 rounded-xl p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-red-400" />
                Filter by Guest Star Mentioned in Notes:
              </span>
              {selectedGuest !== 'all' && (
                <button
                  onClick={() => setSelectedGuest('all')}
                  className="text-red-400 hover:text-red-300 underline text-[11px]"
                >
                  Clear Guest Filter
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => {
                  setSelectedGuest('all');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  selectedGuest === 'all'
                    ? 'bg-red-600 text-white font-bold'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                All Guests ({topicCounts.guests || 0})
              </button>
              {POPULAR_GUEST_NAMES.map((guest) => {
                const isGuestActive = selectedGuest === guest;
                const count = guestCounts[guest] || 0;
                if (count === 0) return null;
                return (
                  <button
                    key={guest}
                    onClick={() => {
                      setSelectedGuest(isGuestActive ? 'all' : guest);
                      setSelectedTopic('guests');
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                      isGuestActive
                        ? 'bg-red-600 text-white font-bold shadow-sm'
                        : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    }`}
                  >
                    <span>{guest}</span>
                    <span className="text-[10px] text-zinc-400">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Row 3: Status Filters & Era Filter Chips */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/80 text-xs">
          {/* Status Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All Episodes' },
              { id: 'unplayed', label: 'Unplayed' },
              { id: 'favorites', label: 'Favorites' },
              { id: 'downloaded', label: `Offline Saved (${offlineDownloadedIds.size})` },
              { id: 'specials', label: 'Specials & Bonus' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setFilterType(f.id as any);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  filterType === f.id
                    ? 'bg-zinc-100 text-zinc-900 font-bold shadow-sm'
                    : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                {f.id === 'downloaded' && <HardDriveDownload className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{f.label}</span>
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
            ].map((era) => (
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

        {/* Active Filter Chips Bar (with reset) */}
        {hasActiveFilters && (
          <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-zinc-400 text-[11px] font-semibold">Active filters:</span>

              {search && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-200 text-[11px] font-medium border border-zinc-700">
                  <span>Search: "{search}"</span>
                  <button onClick={() => setSearch('')} className="hover:text-red-400 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {searchScope !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-200 text-[11px] font-medium border border-zinc-700">
                  <span>Scope: {searchScope === 'notes' ? 'Show Notes Only' : 'Titles Only'}</span>
                  <button onClick={() => setSearchScope('all')} className="hover:text-red-400 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedTopic !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-950 text-red-300 text-[11px] font-medium border border-red-800/60">
                  <span>Topic: {SHOW_NOTES_TOPICS.find((t) => t.id === selectedTopic)?.label || selectedTopic}</span>
                  <button
                    onClick={() => {
                      setSelectedTopic('all');
                      setSelectedGuest('all');
                    }}
                    className="hover:text-red-100 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedGuest !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-950 text-red-300 text-[11px] font-medium border border-red-800/60">
                  <span>Guest: {selectedGuest}</span>
                  <button onClick={() => setSelectedGuest('all')} className="hover:text-red-100 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {filterType !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-200 text-[11px] font-medium border border-zinc-700">
                  <span>Status: {filterType}</span>
                  <button onClick={() => setFilterType('all')} className="hover:text-red-400 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedEra !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-200 text-[11px] font-medium border border-zinc-700">
                  <span>Era: {selectedEra}</span>
                  <button onClick={() => setSelectedEra('all')} className="hover:text-red-400 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>

            <button
              onClick={handleResetAllFilters}
              className="text-red-400 hover:text-red-300 flex items-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Episode Count & Results Status */}
      <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
        <span>
          Showing {filteredEpisodes.length} episode{filteredEpisodes.length === 1 ? '' : 's'}
          {selectedTopic !== 'all' && ` in "${SHOW_NOTES_TOPICS.find((t) => t.id === selectedTopic)?.label}"`}
          {selectedGuest !== 'all' && ` with guest "${selectedGuest}"`}
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
        <div className="py-16 text-center bg-[#121520] border border-zinc-800 rounded-2xl p-8 space-y-3">
          <p className="text-base text-zinc-300 font-semibold mb-1">No episodes found</p>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            No show notes matched your current search query or active topic filter. Try expanding your search terms or resetting filters.
          </p>
          <button
            onClick={handleResetAllFilters}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-md shadow-red-950/40 inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedEpisodes.map((episode) => (
            <EpisodeCard
              key={episode.id}
              episode={episode}
              artworkFallback={meta?.imageUrl}
              isCurrent={currentEpisode?.id === episode.id}
              isEpPlaying={currentEpisode?.id === episode.id && isPlaying}
              favorited={isFavorite(episode.id)}
              listened={isListened(episode.id)}
              isNotesExpanded={expandedNotesEpisodeId === episode.id}
              isOffline={isOfflineSaved(episode.id)}
              isDownloading={downloadingEpisodes[episode.id] !== undefined}
              downloadProgress={downloadingEpisodes[episode.id] || 0}
              selectedTopic={selectedTopic}
              search={search}
              onPlay={() => {
                if (currentEpisode?.id === episode.id) {
                  togglePlay();
                } else {
                  playEpisode(episode, 0, 'archive');
                }
              }}
              onOpenEpisode={onOpenEpisode}
              onToggleFavorite={toggleFavorite}
              onToggleNotes={(id) =>
                setExpandedNotesEpisodeId(expandedNotesEpisodeId === id ? null : id)
              }
              onDownloadOffline={handleDownloadOffline}
              onSelectTopic={(topicId) => {
                setSelectedTopic(topicId);
                setCurrentPage(1);
              }}
              onSelectGuest={(guest) => {
                setSelectedTopic('guests');
                setSelectedGuest(guest);
                setCurrentPage(1);
              }}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      <EpisodePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};
