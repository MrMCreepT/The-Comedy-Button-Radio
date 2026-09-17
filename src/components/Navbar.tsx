import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Radio,
  Library,
  Shuffle,
  ExternalLink,
  Shirt,
  Globe,
  Headphones,
  Heart,
  MessageSquare,
  ChevronDown,
  Compass,
} from 'lucide-react';
import { ComedyButtonLogo } from './ComedyButtonLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { useAudio } from '../context/AudioContext';
import { OFFICIAL_LINKS, PodcastLink } from '../data/links';

interface NavbarProps {
  activeTab: 'stream' | 'archive';
  setActiveTab: (tab: 'stream' | 'archive') => void;
  onPlayTrueRandom?: () => void;
  totalEpisodes: number;
}

const renderDropdownIcon = (iconName: PodcastLink['iconName']) => {
  switch (iconName) {
    case 'Globe':
      return <Globe className="w-4 h-4 text-red-400" />;
    case 'Shirt':
      return <Shirt className="w-4 h-4 text-amber-400" />;
    case 'ApplePodcast':
      return <Headphones className="w-4 h-4 text-purple-400" />;
    case 'Spotify':
      return <Radio className="w-4 h-4 text-emerald-400" />;
    case 'Patreon':
      return <Heart className="w-4 h-4 text-rose-400" />;
    case 'Discord':
      return <MessageSquare className="w-4 h-4 text-indigo-400" />;
    default:
      return <ExternalLink className="w-4 h-4" />;
  }
};

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onPlayTrueRandom,
  totalEpisodes,
}) => {
  const [linksOpen, setLinksOpen] = useState(false);
  const linksRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (linksRef.current && !linksRef.current.contains(event.target as Node)) {
        setLinksOpen(false);
      }
    };
    if (linksOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [linksOpen]);

  return (
    <header className="sticky top-0 z-40 bg-[#0e111a]/95 backdrop-blur-xl border-b border-zinc-800/80 text-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-3 sm:gap-4">
          {/* Logo & Brand Identity */}
          <div
            className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
            onClick={() => setActiveTab('stream')}
          >
            <ComedyButtonLogo size="md" />
          </div>

          {/* Clean Segmented Navigation (Radio & Episodes) */}
          <nav className="flex items-center p-1 rounded-xl bg-zinc-900/90 border border-zinc-800/80 shadow-sm relative shrink-0">
            <button
              onClick={() => setActiveTab('stream')}
              className={`relative min-h-[40px] px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer z-10 ${
                activeTab === 'stream' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {activeTab === 'stream' && (
                <motion.div
                  layoutId="navbarActiveIndicator"
                  className="absolute inset-0 bg-red-600 rounded-lg shadow-md shadow-red-950/60"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}
              <div className="relative z-10 flex items-center justify-center">
                <Radio className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-300 animate-ping" />
              </div>
              <span className="relative z-10">24/7 Radio</span>
            </button>

            <button
              onClick={() => setActiveTab('archive')}
              className={`relative min-h-[40px] px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer z-10 ${
                activeTab === 'archive' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {activeTab === 'archive' && (
                <motion.div
                  layoutId="navbarActiveIndicator"
                  className="absolute inset-0 bg-red-600 rounded-lg shadow-md shadow-red-950/60"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}
              <Library className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Episodes</span>
              <span
                className={`relative z-10 text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-full font-medium transition-colors ${
                  activeTab === 'archive'
                    ? 'bg-red-700/80 text-white'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {totalEpisodes || '560+'}
              </span>
            </button>
          </nav>

          {/* Right Action: T-Shirts, Links Dropdown, PWA, Shuffle */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Direct T-Shirts Store Link */}
            <motion.a
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              href="https://store.comedybutton.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold shadow-sm transition-colors"
              title="Official Comedy Button T-Shirts & Merch"
            >
              <Shirt className="w-3.5 h-3.5 text-amber-400" />
              <span>T-Shirts</span>
              <ExternalLink className="w-2.5 h-2.5 text-amber-400/70" />
            </motion.a>

            {/* Official Links Dropdown Menu */}
            <div className="relative" ref={linksRef}>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setLinksOpen(!linksOpen)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 min-h-[40px] rounded-xl border text-xs font-semibold shadow-sm transition-colors cursor-pointer ${
                  linksOpen
                    ? 'bg-zinc-800 border-zinc-600 text-white'
                    : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700/80 text-zinc-300 hover:text-white'
                }`}
                title="Official Links, Store, Discord & Platforms"
              >
                <Compass className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden md:inline">Links</span>
                <ChevronDown
                  className={`w-3 h-3 text-zinc-400 transition-transform duration-200 ${
                    linksOpen ? 'rotate-180' : ''
                  }`}
                />
              </motion.button>

              {/* Dropdown Card */}
              <AnimatePresence>
                {linksOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-[#121520] border border-zinc-700/90 shadow-2xl p-2.5 z-50 space-y-1"
                  >
                    <div className="px-2.5 py-1.5 border-b border-zinc-800/80 flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                        Official Channels & Gear
                      </span>
                      <span className="text-[10px] text-zinc-500 font-medium">The Comedy Button</span>
                    </div>

                    <div className="space-y-1 pt-1">
                      {OFFICIAL_LINKS.map((link) => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setLinksOpen(false)}
                          className={`flex items-center gap-3 p-2 rounded-xl transition-all group ${
                            link.highlight
                              ? 'bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30'
                              : 'hover:bg-zinc-800/80 border border-transparent'
                          }`}
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-zinc-700/60"
                            style={{ backgroundColor: `${link.accentColor}15` }}
                          >
                            {renderDropdownIcon(link.iconName)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-zinc-200 group-hover:text-white truncate">
                                {link.name}
                              </span>
                              {link.badge && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                                  {link.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-zinc-400 truncate">
                              {link.description}
                            </p>
                          </div>
                          <ExternalLink className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* PWA In-App Install Button */}
            <PWAInstallButton />

            {/* Shuffle Button */}
            {onPlayTrueRandom && (
              <>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onPlayTrueRandom}
                  className="hidden sm:flex items-center gap-2 px-3.5 py-2 min-h-[40px] rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 hover:text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  title="Play a random episode from the entire 560+ catalog"
                >
                  <motion.div whileTap={{ rotate: 180 }} transition={{ duration: 0.3 }}>
                    <Shuffle className="w-3.5 h-3.5 text-red-400" />
                  </motion.div>
                  <span>Random</span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.85, rotate: 180 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  onClick={onPlayTrueRandom}
                  className="sm:hidden flex items-center justify-center w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl bg-zinc-900 border border-zinc-700/80 text-red-400 active:text-white cursor-pointer shadow-sm"
                  title="Play a random episode"
                  aria-label="Play random episode"
                >
                  <Shuffle className="w-4 h-4" />
                </motion.button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
