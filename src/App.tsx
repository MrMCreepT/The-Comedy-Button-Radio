import React, { useState, useEffect } from 'react';
import { AudioProvider, useAudio } from './context/AudioContext';
import { Episode, PodcastMeta } from './types';
import { getPodcastInfo, getEpisodes } from './services/api';
import { pickTrueRandom } from './utils/trueRandom';
import { Navbar } from './components/Navbar';
import { EpisodeArchive } from './components/EpisodeArchive';
import { AudioPlayer } from './components/AudioPlayer';
import { EpisodeModal } from './components/EpisodeModal';
import { RadioStreamStation } from './components/RadioStreamStation';
import { AlertCircle, RefreshCw } from 'lucide-react';

function AppContent() {
  const { playEpisode } = useAudio();
  const [activeTab, setActiveTab] = useState<'stream' | 'archive'>('stream');
  const [meta, setMeta] = useState<PodcastMeta | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [metaData, epData] = await Promise.all([
        getPodcastInfo(),
        getEpisodes()
      ]);
      setMeta(metaData);
      setEpisodes(epData.episodes);
    } catch (err: any) {
      console.error('Failed to load podcast data:', err);
      setError(err.message || 'Failed to fetch episode archive from Libsyn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePlayTrueRandom = () => {
    if (episodes.length === 0) return;
    const chosen = pickTrueRandom(episodes);
    if (chosen) {
      playEpisode(chosen);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0e14] text-zinc-100 flex flex-col selection:bg-red-600 selection:text-white font-sans antialiased relative">
      {/* Top Brand Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onPlayTrueRandom={handlePlayTrueRandom}
        totalEpisodes={episodes.length}
      />

      {/* Main Content View (24/7 Radio or Episode Archive) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28">
        {error ? (
          <div className="my-12 p-8 max-w-lg mx-auto rounded-3xl bg-[#121520] border border-zinc-800 text-center space-y-4 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-red-950/60 text-red-400 border border-red-800/40 flex items-center justify-center mx-auto shadow-md">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-zinc-100">Broadcast Feed Disconnected</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">{error}</p>
            <button
              onClick={loadData}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-xl flex items-center gap-2 mx-auto transition-colors cursor-pointer shadow-md shadow-red-950/40"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Fetching Episodes</span>
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'stream' && (
              <RadioStreamStation
                onOpenEpisode={(ep) => setSelectedEpisode(ep)}
              />
            )}

            {activeTab === 'archive' && (
              <EpisodeArchive
                episodes={episodes}
                meta={meta}
                loading={loading}
                onOpenEpisode={(ep) => setSelectedEpisode(ep)}
                onPlayTrueRandom={handlePlayTrueRandom}
              />
            )}
          </>
        )}
      </main>

      {/* Persistent Bottom Audio Player Bar */}
      <AudioPlayer onOpenEpisode={(ep) => setSelectedEpisode(ep)} />

      {/* Show Notes & Episode Modal */}
      <EpisodeModal
        episode={selectedEpisode}
        onClose={() => setSelectedEpisode(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AudioProvider>
      <AppContent />
    </AudioProvider>
  );
}
