import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AudioProvider, useAudio } from './context/AudioContext';
import { CastProvider } from './context/CastContext';
import { Episode, PodcastMeta } from './types';
import { getPodcastInfo, getEpisodes } from './services/api';
import { pickTrueRandom } from './utils/trueRandom';
import { Navbar } from './components/Navbar';
import { EpisodeArchive } from './components/EpisodeArchive';
import { AudioPlayer } from './components/AudioPlayer';
import { RadioStreamStation } from './components/RadioStreamStation';
import { PWABanner } from './components/PWABanner';
import { Footer } from './components/Footer';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';

// Code-split heavy modal dialogues for near-instant cold load
const EpisodeModal = lazy(() =>
  import('./components/EpisodeModal').then((m) => ({ default: m.EpisodeModal }))
);
const CastModal = lazy(() =>
  import('./components/CastModal').then((m) => ({ default: m.CastModal }))
);
const ListeningStatsModal = lazy(() =>
  import('./components/ListeningStatsModal').then((m) => ({ default: m.ListeningStatsModal }))
);
const CastReceiverScreen = lazy(() =>
  import('./components/CastReceiverScreen').then((m) => ({ default: m.CastReceiverScreen }))
);

function AppContent() {
  const {
    playEpisode,
    currentEpisode,
    setPlaylist,
    isStatsModalOpen,
    closeStatsModal,
    isCastReceiverOpen,
    closeCastReceiver
  } = useAudio();

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
      setPlaylist(epData.episodes);
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
      playEpisode(chosen, 0, 'archive');
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0e14] text-zinc-100 flex flex-col selection:bg-red-600 selection:text-white font-sans antialiased relative overflow-x-hidden w-full max-w-full">
      {/* Top Brand Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onPlayTrueRandom={handlePlayTrueRandom}
        totalEpisodes={episodes.length}
      />

      {/* Main Content View (24/7 Radio or Complete Episode Archive) */}
      <main className={`flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 ${
        currentEpisode ? 'pb-24 sm:pb-28' : 'pb-8 sm:pb-12'
      }`}>
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

      {/* Official Links & Brand Footer */}
      <Footer />

      {/* Persistent Bottom Audio Player Bar */}
      <AudioPlayer onOpenEpisode={(ep) => setSelectedEpisode(ep)} />

      {/* Code-split Modal Dialogues */}
      <Suspense fallback={null}>
        {/* Show Notes & Episode Modal */}
        <EpisodeModal
          episode={selectedEpisode}
          onClose={() => setSelectedEpisode(null)}
        />

        {/* Cast & Audio Output Device Modal */}
        <CastModal />

        {/* Listening Statistics & Year-in-Review Highlights Modal */}
        <ListeningStatsModal
          isOpen={isStatsModalOpen}
          onClose={closeStatsModal}
        />

        {/* Dedicated Cast / TV Receiver Screen with Synchronized Lyrics & Vinyl Disc */}
        <CastReceiverScreen
          isOpen={isCastReceiverOpen}
          onClose={closeCastReceiver}
        />
      </Suspense>

      {/* Ambient Mobile PWA Install Banner */}
      <PWABanner />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="The Comedy Button Player" fallbackMessage="An unexpected issue occurred. Click reload to refresh.">
      <AudioProvider>
        <CastProvider>
          <AppContent />
        </CastProvider>
      </AudioProvider>
    </ErrorBoundary>
  );
}
