import React from 'react';
import { motion } from 'motion/react';
import { Radio, Library, Shuffle, ExternalLink } from 'lucide-react';
import { ComedyButtonLogo } from './ComedyButtonLogo';
import { useAudio } from '../context/AudioContext';

interface NavbarProps {
  activeTab: 'stream' | 'archive';
  setActiveTab: (tab: 'stream' | 'archive') => void;
  onPlayTrueRandom?: () => void;
  totalEpisodes: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onPlayTrueRandom,
  totalEpisodes
}) => {
  const { isPlaying } = useAudio();

  return (
    <header className="sticky top-0 z-40 bg-[#0e111a]/95 backdrop-blur-xl border-b border-zinc-800/80 text-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-4">
          {/* Logo & Brand Identity */}
          <div
            className="flex items-center gap-3 cursor-pointer group select-none"
            onClick={() => setActiveTab('stream')}
          >
            <ComedyButtonLogo size="md" />
          </div>

          {/* Clean Segmented Navigation (Radio & Episodes) */}
          <nav className="flex items-center p-1 rounded-xl bg-zinc-900/90 border border-zinc-800/80 shadow-sm">
            <button
              onClick={() => setActiveTab('stream')}
              className={`relative px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'stream'
                  ? 'bg-red-600 text-white shadow-md shadow-red-950/50'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Radio className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-400 animate-ping" />
              </div>
              <span>24/7 Radio</span>
            </button>

            <button
              onClick={() => setActiveTab('archive')}
              className={`relative px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'archive'
                  ? 'bg-red-600 text-white shadow-md shadow-red-950/50'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Library className="w-4 h-4" />
              <span>Episodes</span>
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${
                  activeTab === 'archive'
                    ? 'bg-red-700/80 text-white'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {totalEpisodes || '560+'}
              </span>
            </button>
          </nav>

          {/* Right Action: Quick Random Episode & Store Link */}
          <div className="flex items-center gap-2 sm:gap-3">
            {onPlayTrueRandom && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onPlayTrueRandom}
                className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 hover:text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                title="Play a random episode from the entire 560+ catalog"
              >
                <Shuffle className="w-3.5 h-3.5 text-red-400" />
                <span>Random Episode</span>
              </motion.button>
            )}

            <a
              href="https://store.comedybutton.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 text-xs font-medium transition-colors"
            >
              <span>Merch</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};
