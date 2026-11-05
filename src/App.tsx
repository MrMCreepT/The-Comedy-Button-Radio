import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AudioProvider, useAudio } from './context/AudioContext';
import { CastProvider, useCast } from './context/CastContext';
import { ThemeProvider } from './context/ThemeContext';
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
import { StorageManagerModal } from './components/StorageManagerModal';
import { ThemeIntroModal } from './components/ThemeIntroModal';

function AppContent() {
  const {
    playEpisode,
    currentEpisode,
    setPlaylist,
    startLiveRadio,
    openStatsModal,
    isStatsModalOpen,
    closeStatsModal,
    isCastReceiverOpen,
    closeCastReceiver,
    isStorageModalOpen,
    closeStorageModal
  } = useAudio();

  const { isCastModalOpen } = useCast();

  const [activeTab, setActiveTab] = useState<'stream' | 'archive'>('stream');
  const [meta, setMeta] = useState<PodcastMeta | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  // Theme intro modal state - accessible anytime via the Theme Intro button in the navigation or station
  const [isThemeIntroOpen, setIsThemeIntroOpen] = useState<boolean>(false);

  const handleCloseThemeIntro = (autoStartRadio = false) => {
    setIsThemeIntroOpen(false);
    if (autoStartRadio) {
      startLiveRadio();
    }
  };

  const handleEnterBroadcastFromIntro = () => {
    setIsThemeIntroOpen(false);
    setActiveTab('stream');
    startLiveRadio();
  };

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
    <div className="min-h-screen bg-[var(--theme-canvas-bg,#181519)] text-[var(--theme-canvas-color,#e7e0e5)] flex flex-col selection:bg-[#ff8577] selection:text-[#410003] font-sans antialiased relative overflow-x-hidden w-full max-w-full transition-colors duration-300">
      {/* Top Brand Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onPlayTrueRandom={handlePlayTrueRandom}
        onOpenThemeIntro={() => setIsThemeIntroOpen(true)}
        totalEpisodes={episodes.length}
      />

      {/* Main Content View (24/7 Radio or Complete Episode Archive) */}
      <main className={`flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 ${
        currentEpisode ? 'pb-32 sm:pb-36' : 'pb-20 sm:pb-24'
      }`}>
        {error ? (
          <div className="my-12 p-8 max-w-lg mx-auto rounded-[32px] bg-[#181a20] border border-white/10 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-[#ff6355]/20 text-[#ff6355] flex items-center justify-center mx-auto shadow-md">
              <AlertCircle className="w-7 h-7 stroke-[2.5]" />
            </div>
            <h2 className="font-heading font-black text-xl text-white uppercase tracking-tight">Broadcast Feed Disconnected</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">{error}</p>
            <button
              onClick={loadData}
              className="px-5 py-2.5 bg-white text-zinc-950 font-heading font-black text-xs uppercase rounded-full flex items-center gap-2 mx-auto transition-colors cursor-pointer shadow-md hover:bg-zinc-100"
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
                onOpenThemeIntro={() => setIsThemeIntroOpen(true)}
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

      {/* Code-split Modal Dialogues - Rendered on-demand to guarantee near-instant initial boot */}
      {selectedEpisode && (
        <Suspense fallback={null}>
          <EpisodeModal
            episode={selectedEpisode}
            onClose={() => setSelectedEpisode(null)}
          />
        </Suspense>
      )}

      {isCastModalOpen && (
        <Suspense fallback={null}>
          <CastModal />
        </Suspense>
      )}

      {isStatsModalOpen && (
        <Suspense fallback={null}>
          <ListeningStatsModal
            isOpen={isStatsModalOpen}
            onClose={closeStatsModal}
          />
        </Suspense>
      )}

      {isCastReceiverOpen && (
        <Suspense fallback={null}>
          <CastReceiverScreen
            isOpen={isCastReceiverOpen}
            onClose={closeCastReceiver}
          />
        </Suspense>
      )}

      {isStorageModalOpen && (
        <Suspense fallback={null}>
          <StorageManagerModal
            isOpen={isStorageModalOpen}
            onClose={closeStorageModal}
          />
        </Suspense>
      )}

      {isThemeIntroOpen && (
        <ThemeIntroModal
          isOpen={isThemeIntroOpen}
          onClose={() => handleCloseThemeIntro(false)}
          onEnterBroadcast={handleEnterBroadcastFromIntro}
        />
      )}

      {/* Ambient Mobile PWA Install Banner */}
      <PWABanner />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="The Comedy Button Player" fallbackMessage="An unexpected issue occurred. Click reload to refresh.">
      <ThemeProvider>
        <AudioProvider>
          <CastProvider>
            <AppContent />
          </CastProvider>
        </AudioProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
