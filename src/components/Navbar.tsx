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
  Sparkles,
  BarChart3,
  Tv,
  HardDrive,
  Moon,
  Sun,
  Search,
  SlidersHorizontal,
  Settings,
  Palette
} from 'lucide-react';
import { ComedyButtonLogo } from './ComedyButtonLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { useAudio } from '../context/AudioContext';
import { useTheme } from '../context/ThemeContext';
import { OFFICIAL_LINKS, PodcastLink } from '../data/links';
import { triggerHaptic } from '../utils/haptics';

interface NavbarProps {
  activeTab: 'stream' | 'archive';
  setActiveTab: (tab: 'stream' | 'archive') => void;
  onPlayTrueRandom?: () => void;
  onOpenThemeIntro?: () => void;
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
  onOpenThemeIntro,
  totalEpisodes,
}) => {
  const { openStatsModal, openCastReceiver, openStorageModal } = useAudio();
  const { themeMode, setThemeMode, cycleTheme, isMaterialYou, isOled } = useTheme();
  const [linksOpen, setLinksOpen] = useState(false);
  const linksRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
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
    <header className="sticky top-0 z-40 bg-[#0e1015]/95 backdrop-blur-xl border-b border-white/10 text-zinc-100 select-none">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Official Logo */}
          <div
            className="flex items-center cursor-pointer group shrink-0"
            onClick={() => {
              triggerHaptic(8);
              setActiveTab('stream');
            }}
          >
            <ComedyButtonLogo size="md" />
          </div>

          {/* Center: Clean Segmented Tab Switcher (No duplicate dropdowns) */}
          <div className="flex items-center bg-zinc-900/90 border border-white/10 rounded-full p-1 shadow-inner">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(8);
                setActiveTab('stream');
              }}
              className={`px-3 sm:px-4 py-1.5 rounded-full font-heading font-black text-xs uppercase tracking-tight transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'stream'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${activeTab === 'stream' ? 'bg-white animate-pulse' : 'bg-red-500'}`} />
              <span>Live Radio</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic(8);
                setActiveTab('archive');
              }}
              className={`px-3 sm:px-4 py-1.5 rounded-full font-heading font-black text-xs uppercase tracking-tight transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'archive'
                  ? 'bg-zinc-800 text-white shadow-md border border-white/15'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Library className="w-3.5 h-3.5" />
              <span>Vault</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/10 text-zinc-300">
                {totalEpisodes || '560+'}
              </span>
            </button>
          </div>

          {/* Right: Quick Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Direct Theme Switcher Pill */}
            <button
              type="button"
              onClick={cycleTheme}
              className={`px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm border ${
                themeMode === 'material-you-light'
                  ? 'bg-[#ffdad6] text-[#410002] border-[#b3261e]/30'
                  : themeMode === 'material-you-dark'
                  ? 'bg-[#ff8577]/20 text-[#ff8577] border-[#ff8577]/40'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300'
              }`}
              title="Click to cycle theme (Material You Dark, Material You Light, Studio Dark, OLED)"
              aria-label="Cycle theme mode"
            >
              <Palette className="w-3.5 h-3.5" />
              <span className="font-mono text-[11px] font-black uppercase">
                {themeMode === 'material-you-dark' ? 'M3 Dark' : themeMode === 'material-you-light' ? 'M3 Light' : themeMode === 'oled' ? 'OLED' : 'Studio'}
              </span>
            </button>

            {/* Quick Search */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic(8);
                setActiveTab('archive');
              }}
              className="p-2 sm:px-3 sm:py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
              title="Search Archive"
              aria-label="Search Archive"
            >
              <Search className="w-4 h-4" />
              <span className="hidden md:inline text-xs font-bold">Search</span>
            </button>

            {/* Random Episode Shuffle Dice */}
            {onPlayTrueRandom && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(12);
                  onPlayTrueRandom();
                }}
                className="p-2 sm:px-3 sm:py-2 rounded-full bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 text-red-400 hover:text-red-300 transition-all cursor-pointer flex items-center gap-1.5"
                title="Play True Random Episode"
                aria-label="Play Random Episode"
              >
                <Shuffle className="w-4 h-4 stroke-[2.5]" />
                <span className="hidden md:inline text-xs font-bold">Shuffle</span>
              </button>
            )}

            {/* Links & Player Tools Dropdown */}
            <div className="relative" ref={linksRef}>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(8);
                  setLinksOpen(!linksOpen);
                }}
                className={`p-2 rounded-full border transition-all cursor-pointer ${
                  linksOpen
                    ? 'bg-white text-zinc-950 border-white'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:text-white'
                }`}
                title="Official Links & Settings"
                aria-label="Official Links and Settings"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {linksOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-[#181a20] border border-white/15 shadow-2xl p-3 z-50 space-y-1.5"
                  >
                    <div className="px-3 py-1.5 border-b border-white/10 flex items-center justify-between">
                      <span className="font-heading font-black text-xs uppercase tracking-tight text-white">
                        OFFICIAL COMMUNITY & LINKS
                      </span>
                      <span className="text-[10px] font-mono text-red-400 uppercase font-bold">THE BUTTON</span>
                    </div>

                    <div className="space-y-1 pt-1 max-h-60 overflow-y-auto">
                      {OFFICIAL_LINKS.map((link) => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setLinksOpen(false)}
                          className={`flex items-center gap-3 p-2.5 rounded-xl transition-all group ${
                            link.highlight
                              ? 'bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-white'
                              : 'hover:bg-white/5 border border-transparent text-zinc-200'
                          }`}
                        >
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-white/10 bg-black/40">
                            {renderDropdownIcon(link.iconName)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-white truncate">
                                {link.name}
                              </span>
                              {link.badge && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-400 text-zinc-950 font-bold uppercase">
                                  {link.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-zinc-400 truncate">
                              {link.description}
                            </p>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-200 shrink-0" />
                        </a>
                      ))}
                    </div>

                    {/* In-App Player Tools */}
                    <div className="pt-2 border-t border-white/10 mt-1 flex flex-col gap-1">
                      {onOpenThemeIntro && (
                        <button
                          type="button"
                          onClick={() => {
                            setLinksOpen(false);
                            onOpenThemeIntro();
                          }}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 text-left cursor-pointer transition-colors w-full"
                        >
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-red-500/20 text-red-400">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-bold text-white block truncate">
                              Show Intro & Theme Song
                            </span>
                            <span className="text-[10px] text-zinc-400 block truncate">
                              Host roll call animation
                            </span>
                          </div>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setLinksOpen(false);
                          openStatsModal();
                        }}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 text-left cursor-pointer transition-colors w-full"
                      >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-blue-500/20 text-blue-400">
                          <BarChart3 className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-white block truncate">Listening Stats</span>
                          <span className="text-[10px] text-zinc-400 block truncate">Hours & era breakdown</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setLinksOpen(false);
                          openStorageModal();
                        }}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 text-left cursor-pointer transition-colors w-full"
                      >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-emerald-500/20 text-emerald-400">
                          <HardDrive className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-white block truncate">Offline Storage</span>
                          <span className="text-[10px] text-zinc-400 block truncate">Manage downloaded shows</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setLinksOpen(false);
                          openCastReceiver();
                        }}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 text-left cursor-pointer transition-colors w-full"
                      >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-purple-500/20 text-purple-400">
                          <Tv className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-white block truncate">TV Ambient Display</span>
                          <span className="text-[10px] text-zinc-400 block truncate">Full screen theater receiver</span>
                        </div>
                      </button>

                      {/* Theme Appearance Selector */}
                      <div className="p-2 rounded-xl bg-black/30 border border-white/5 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300">
                          <span className="flex items-center gap-1.5">
                            <Palette className="w-3.5 h-3.5 text-red-400" />
                            <span>Theme Appearance</span>
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400 uppercase">
                            {themeMode}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1 bg-white/5 p-1 rounded-lg">
                          <button
                            type="button"
                            onClick={() => setThemeMode('material-you-dark')}
                            className={`py-1 px-1 rounded-md text-[10px] font-bold transition-all text-center cursor-pointer ${
                              themeMode === 'material-you-dark'
                                ? 'bg-[#ff8577] text-[#410003] font-black shadow-sm'
                                : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            M3 Dark
                          </button>
                          <button
                            type="button"
                            onClick={() => setThemeMode('material-you-light')}
                            className={`py-1 px-1 rounded-md text-[10px] font-bold transition-all text-center cursor-pointer ${
                              themeMode === 'material-you-light'
                                ? 'bg-[#ffdad6] text-[#410002] font-black shadow-sm'
                                : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            M3 Light
                          </button>
                          <button
                            type="button"
                            onClick={() => setThemeMode('studio-dark')}
                            className={`py-1 px-1 rounded-md text-[10px] font-bold transition-all text-center cursor-pointer ${
                              themeMode === 'studio-dark'
                                ? 'bg-zinc-700 text-white shadow-sm'
                                : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            Studio
                          </button>
                          <button
                            type="button"
                            onClick={() => setThemeMode('oled')}
                            className={`py-1 px-1 rounded-md text-[10px] font-bold transition-all text-center cursor-pointer ${
                              themeMode === 'oled'
                                ? 'bg-black text-white border border-white/20 shadow-sm'
                                : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            OLED
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* PWA Install Button */}
            <PWAInstallButton />
          </div>
        </div>
      </div>
    </header>
  );
};
