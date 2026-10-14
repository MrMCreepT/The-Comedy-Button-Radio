import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Volume2,
  VolumeX,
  Sparkles,
  Radio,
  RotateCcw,
  Disc3,
  Flame,
  Zap,
  Music,
  Share2,
  Upload,
  Check,
  FileAudio
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { ComedyPlayButton } from './ComedyPlayButton';

export interface ThemeIntroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnterBroadcast?: () => void;
}

interface HostIntro {
  id: string;
  name: string;
  role: string;
  tagline: string;
  catchphrase: string;
  startTime: number;
  endTime: number;
  icon: string;
  color: string;
  accentBg: string;
}

const HOST_TIMELINE: HostIntro[] = [
  {
    id: 'anthony',
    name: 'Anthony Gallegos',
    role: 'Host & Master of Ceremonies',
    tagline: 'The Voice of Reason & Video Game Lore',
    catchphrase: '"Hello and welcome to The Comedy Button!"',
    startTime: 0.3,
    endTime: 2.2,
    icon: '🎙️',
    color: '#ef4444', // Red
    accentBg: 'from-red-600/30 via-red-950/20 to-transparent',
  },
  {
    id: 'brian',
    name: 'Brian Altano',
    role: 'Co-Host & Jersey Royalty',
    tagline: 'Pizza Connoisseur & Nostalgia Enthusiast',
    catchphrase: '"With me is Brian Altano!"',
    startTime: 2.2,
    endTime: 4.1,
    icon: '🍕',
    color: '#f59e0b', // Amber/Gold
    accentBg: 'from-amber-600/30 via-amber-950/20 to-transparent',
  },
  {
    id: 'scott',
    name: 'Scott Bromley',
    role: 'Host of The Web',
    tagline: 'Master of Chaos, Rants & Internet Antics',
    catchphrase: '"What\'s going on, internet?!"',
    startTime: 4.1,
    endTime: 6.1,
    icon: '🌐',
    color: '#3b82f6', // Blue
    accentBg: 'from-blue-600/30 via-blue-950/20 to-transparent',
  },
  {
    id: 'ryan',
    name: 'Ryan Scott',
    role: 'The Maestro of Audio',
    tagline: 'Golden Voice, Trivia Machine & Archive Master',
    catchphrase: '"Money in the bank!"',
    startTime: 6.1,
    endTime: 8.2,
    icon: '💰',
    color: '#10b981', // Emerald
    accentBg: 'from-emerald-600/30 via-emerald-950/20 to-transparent',
  },
  {
    id: 'max',
    name: 'Max Scoville',
    role: 'Chaos Agent',
    tagline: 'Comic Savant, Weird Facts & Unfiltered Energy',
    catchphrase: '"What\'s up, bitch?!"',
    startTime: 8.2,
    endTime: 10.4,
    icon: '⚡',
    color: '#a855f7', // Purple
    accentBg: 'from-purple-600/30 via-purple-950/20 to-transparent',
  },
];

export const ThemeIntroModal: React.FC<ThemeIntroModalProps> = ({
  isOpen,
  onClose,
  onEnterBroadcast,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(34);
  const [isMuted, setIsMuted] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [activeLoreIndex, setActiveLoreIndex] = useState(0);
  const [audioVersion, setAudioVersion] = useState<number>(() => Date.now());

  // Custom audio file upload state
  const [customAudioName, setCustomAudioName] = useState<string | null>(() => {
    try {
      return localStorage.getItem('cb_custom_audio_name');
    } catch {
      return null;
    }
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [dontShowAgain, setDontShowAgain] = useState(() => {
    try {
      return localStorage.getItem('cb_skip_theme_intro') === 'true';
    } catch {
      return false;
    }
  });

  const [autoStartRadio, setAutoStartRadio] = useState(() => {
    try {
      const stored = localStorage.getItem('cb_autostart_radio_after_intro');
      return stored !== null ? stored === 'true' : true;
    } catch {
      return true;
    }
  });

  const getThemeAudioUrl = () => {
    try {
      const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || './';
      const cleanBase = base.endsWith('/') ? base : `${base}/`;
      return `${cleanBase}audio/theme-tune.mp3`;
    } catch {
      return './audio/theme-tune.mp3';
    }
  };

  const handleToggleAutoStartRadio = () => {
    const nextVal = !autoStartRadio;
    setAutoStartRadio(nextVal);
    try {
      localStorage.setItem('cb_autostart_radio_after_intro', String(nextVal));
    } catch {}
  };

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Sync state with open/close
  useEffect(() => {
    if (isOpen) {
      triggerHaptic(15);
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().then(() => {
          setIsPlaying(true);
          setAutoplayBlocked(false);
        }).catch((err) => {
          console.warn('[TCB] Autoplay prevented, waiting for user click:', err);
          setIsPlaying(false);
          setAutoplayBlocked(true);
        });
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
      setCurrentTime(0);
      setAutoplayBlocked(false);
    }
  }, [isOpen]);

  // Track time via requestAnimationFrame for 60fps smooth sync
  useEffect(() => {
    if (!isPlaying) return;

    const tick = () => {
      if (audioRef.current) {
        const t = audioRef.current.currentTime;
        setCurrentTime(t);
        // Seamlessly transfer into 24/7 radio as soon as 34s is reached
        if (t >= 33.95) {
          handleEnterApp(autoStartRadio);
          return;
        }
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, autoStartRadio]);

  // Rotate lore cards during Phase 3 (18.0s - 26.0s)
  useEffect(() => {
    if (currentTime >= 18 && currentTime < 26) {
      const idx = Math.floor((currentTime - 18) / 2) % 4;
      setActiveLoreIndex(idx);
    }
  }, [currentTime]);

  // Close with Esc key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleDismiss = () => {
    triggerHaptic(10);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    onClose();
  };

  const handleEnterApp = (forceRadio = true) => {
    triggerHaptic(15);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    onClose();
    if ((forceRadio || autoStartRadio) && onEnterBroadcast) {
      onEnterBroadcast();
    }
  };

  const togglePlayState = () => {
    triggerHaptic(12);
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
        setAutoplayBlocked(false);
      }).catch(console.warn);
    }
  };

  const toggleMuteState = () => {
    triggerHaptic(8);
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleRestart = () => {
    triggerHaptic(12);
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrentTime(0);
    audio.play().then(() => {
      setIsPlaying(true);
      setAutoplayBlocked(false);
    }).catch(console.warn);
  };

  const handleSeek = (time: number) => {
    triggerHaptic(8);
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
    if (!isPlaying) {
      audio.play().then(() => {
        setIsPlaying(true);
        setAutoplayBlocked(false);
      }).catch(console.warn);
    }
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    handleSeek(ratio * (duration || 34.0));
  };

  const handleToggleDontShow = () => {
    const nextVal = !dontShowAgain;
    setDontShowAgain(nextVal);
    try {
      localStorage.setItem('cb_skip_theme_intro', String(nextVal));
    } catch {}
  };

  // Upload or select a custom audio file directly
  const handleLoadCustomAudioFile = async (file: File) => {
    if (!file) return;
    triggerHaptic(15);
    setIsUploading(true);
    try {
      const objectUrl = URL.createObjectURL(file);
      if (audioRef.current) {
        audioRef.current.src = objectUrl;
        audioRef.current.currentTime = 0;
        audioRef.current.play().then(() => {
          setIsPlaying(true);
          setAutoplayBlocked(false);
        }).catch(console.warn);
      }
      setCustomAudioName(file.name);
      try {
        localStorage.setItem('cb_custom_audio_name', file.name);
      } catch {}

      // Send to server to overwrite theme-tune.mp3 permanently
      const res = await fetch('/api/theme-audio', {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'audio/mpeg',
        },
        body: file,
      });

      if (res.ok) {
        setUploadSuccess(true);
        setAudioVersion(Date.now());
        setTimeout(() => setUploadSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to load custom theme audio:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleLoadCustomAudioFile(file);
    }
  };

  const handleResetDefaultAudio = () => {
    triggerHaptic(10);
    setCustomAudioName(null);
    try {
      localStorage.removeItem('cb_custom_audio_name');
    } catch {}
    if (audioRef.current) {
      audioRef.current.src = `${getThemeAudioUrl()}?t=${Date.now()}`;
      audioRef.current.currentTime = 0;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.warn);
    }
  };

  if (!isOpen) return null;

  // Active host identification based on exact seconds
  const activeHost = HOST_TIMELINE.find(
    (h) => currentTime >= h.startTime && currentTime <= h.endTime
  );

  // Phases of the song (cut to 34 seconds):
  // Phase 1 (0.0s - 10.4s): Host roll call
  // Phase 2 (10.4s - 18.0s): Title drop & heavy beat drop / button slam
  // Phase 3 (18.0s - 26.0s): Skate punk guitar riff & podcast lore cassette
  // Phase 4 (26.0s - 32.0s): Guitar solo & host squad lineup
  // Phase 5 (32.0s - 34.0s): Finale chord & seamless transition straight into 24/7 radio
  const isHostIntroPhase = currentTime < 10.4;
  const isTitleDropPhase = currentTime >= 10.4 && currentTime < 18.0;
  const isRiffPhase = currentTime >= 18.0 && currentTime < 26.0;
  const isSoloPhase = currentTime >= 26.0 && currentTime < 32.0;
  const isFinalePhase = currentTime >= 32.0;
  const isRocking = currentTime >= 10.4;

  const progressPercent = Math.min(100, (currentTime / (duration || 34.0)) * 100);

  const LORE_ITEMS = [
    {
      title: '560+ Shuffled Episodes',
      desc: '12+ years of uncut, uncensored laughs playing around the clock',
      badge: '24/7 ARCHIVE',
      icon: '📻',
    },
    {
      title: 'Your Aural Canals Are Ours',
      desc: 'Filling ears with unapologetic nonsense since October 2011',
      badge: 'SINCE 2011',
      icon: '🎙️',
    },
    {
      title: 'All-Star Host Chemistry',
      desc: 'Brian, Scott, Anthony, Ryan, Max & Kristin van de Yar',
      badge: 'LEGENDARY SQUAD',
      icon: '⚡',
    },
    {
      title: 'The Sound of Pure Joy',
      desc: 'Horse sounds, New Jersey lore, and video game banter',
      badge: 'COMEDY GOLD',
      icon: '🍕',
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file && (file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|m4a|ogg|flac|aac)$/i))) {
            handleLoadCustomAudioFile(file);
          }
        }}
        className="fixed inset-0 z-50 bg-[#07090e]/95 backdrop-blur-2xl flex flex-col items-center justify-between p-3 sm:p-6 lg:p-8 select-none overflow-hidden"
      >
        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          src={`${getThemeAudioUrl()}?v=${audioVersion}`}
          preload="auto"
          onEnded={() => handleEnterApp(autoStartRadio)}
          onLoadedMetadata={(e) => {
            const dur = (e.target as HTMLAudioElement).duration;
            if (dur && !isNaN(dur) && isFinite(dur)) {
              setDuration(Math.min(dur, 34.0));
            }
          }}
        />

        {/* Hidden File Input for uploading custom audio */}
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac"
          className="hidden"
          onChange={handleFileInputChange}
        />

        {/* Drag-over full overlay visual */}
        {isDragging && (
          <div className="absolute inset-0 z-40 bg-red-950/90 border-4 border-dashed border-red-500 rounded-3xl flex flex-col items-center justify-center p-6 text-center pointer-events-none backdrop-blur-md">
            <Upload className="w-16 h-16 text-amber-400 animate-bounce mb-3" />
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">
              DROP YOUR AUDIO FILE HERE
            </h2>
            <p className="text-sm text-zinc-300 mt-1">
              Supports .mp3, .wav, .m4a, .ogg — will immediately replace and play as the theme tune!
            </p>
          </div>
        )}

        {/* Ambient Animated Theatrical Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
          {/* Dynamic Color Spotlight based on Active Host or Rock Beat */}
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] sm:w-[900px] sm:h-[900px] rounded-full blur-3xl opacity-75 transition-all duration-700 ${
              activeHost
                ? `bg-[radial-gradient(ellipse_at_center,${activeHost.color}35,transparent_70%)]`
                : isRocking
                ? 'bg-gradient-radial from-red-600/25 via-amber-600/15 to-transparent'
                : 'bg-gradient-radial from-red-950/40 via-zinc-900/20 to-transparent'
            }`}
          />

          {/* Skate-Punk Rock Beat Grid Pulse */}
          {isRocking && (
            <motion.div
              animate={{ opacity: [0.15, 0.4, 0.15] }}
              transition={{ repeat: Infinity, duration: 0.428, ease: 'easeInOut' }}
              className="absolute inset-0 bg-[radial-gradient(#dc2626_1px,transparent_1px)] [background-size:24px_24px] opacity-30"
            />
          )}

          {/* Dual Concert Spotlights sweeping during Solo Phase */}
          {isSoloPhase && (
            <>
              <motion.div
                animate={{ rotate: [-35, 35, -35] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                className="absolute top-0 left-1/4 w-32 h-[150vh] origin-top bg-gradient-to-b from-yellow-400/25 via-amber-500/10 to-transparent blur-xl pointer-events-none"
              />
              <motion.div
                animate={{ rotate: [35, -35, 35] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                className="absolute top-0 right-1/4 w-32 h-[150vh] origin-top bg-gradient-to-b from-red-500/25 via-purple-500/10 to-transparent blur-xl pointer-events-none"
              />
            </>
          )}

          {/* Subtle Background Conic Sweep */}
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ repeat: Infinity, duration: 30, ease: 'linear' }}
            className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] opacity-15 bg-[conic-gradient(from_0deg_at_50%_50%,#dc2626_0deg,transparent_60deg,#f59e0b_180deg,transparent_240deg,#a855f7_300deg,transparent_360deg)]"
          />
        </div>

        {/* Top Header Bar: Sound Controls, File Upload & Enter Station */}
        <header className="w-full max-w-5xl flex items-center justify-between gap-2 sm:gap-3 z-20">
          {/* Audio volume & restart */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={toggleMuteState}
              className="p-2 sm:p-2.5 rounded-full bg-zinc-900/90 border border-zinc-700/80 hover:border-zinc-500 text-zinc-300 hover:text-white transition-colors cursor-pointer shadow-sm"
              title={isMuted ? 'Unmute' : 'Mute'}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 sm:w-5 h-4 sm:h-5 text-red-400" /> : <Volume2 className="w-4 sm:w-5 h-4 sm:h-5" />}
            </button>
            <button
              onClick={handleRestart}
              className="p-2 sm:p-2.5 rounded-full bg-zinc-900/90 border border-zinc-700/80 hover:border-zinc-500 text-zinc-300 hover:text-white transition-colors cursor-pointer shadow-sm"
              title="Restart Opening Animation"
              aria-label="Restart Opening Animation"
            >
              <RotateCcw className="w-4 sm:w-5 h-4 sm:h-5" />
            </button>

            {/* Custom Audio Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full bg-zinc-900/90 border border-amber-500/50 hover:border-amber-400 hover:bg-amber-950/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
              title="Upload your exact audio file (.mp3, .wav, .m4a)"
            >
              {uploadSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline text-emerald-400">Audio Loaded!</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Use Your Audio</span>
                  <span className="sm:hidden">Upload</span>
                </>
              )}
            </button>
          </div>

          {/* Center Title or Custom File Name */}
          <div className="hidden md:flex items-center gap-2">
            {customAudioName ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-600/60 text-emerald-300 text-[11px] font-semibold">
                <FileAudio className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate max-w-[220px]">Using: {customAudioName}</span>
                <button
                  onClick={handleResetDefaultAudio}
                  className="hover:text-white underline cursor-pointer text-[10px] ml-1 shrink-0"
                  title="Reset to default theme"
                >
                  Reset
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/70 border border-red-800/60 text-[11px] font-extrabold text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>THE COMEDY BUTTON OPENING THEME</span>
              </div>
            )}
          </div>

          {/* Quick Scene Jump Buttons */}
          <div className="hidden lg:flex items-center gap-1 bg-zinc-900/70 p-1 rounded-full border border-zinc-800 text-[11px] font-semibold text-zinc-400">
            {HOST_TIMELINE.map((host) => (
              <button
                key={host.id}
                onClick={() => handleSeek(host.startTime)}
                className={`px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                  activeHost?.id === host.id
                    ? 'text-white font-bold shadow-xs'
                    : 'hover:text-zinc-200'
                }`}
                style={
                  activeHost?.id === host.id
                    ? { backgroundColor: host.color }
                    : undefined
                }
              >
                {host.name.split(' ')[0]}
              </button>
            ))}
            <span className="text-zinc-600 px-0.5">|</span>
            <button
              onClick={() => handleSeek(10.4)}
              className={`px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                isTitleDropPhase ? 'bg-red-600 text-white font-bold' : 'hover:text-zinc-200'
              }`}
            >
              Drop!
            </button>
            <button
              onClick={() => handleSeek(32.0)}
              className={`px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                isSoloPhase ? 'bg-amber-500 text-black font-bold' : 'hover:text-zinc-200'
              }`}
            >
              Solo!
            </button>
          </div>

          {/* Enter Radio / Close */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleEnterApp(true)}
              className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-red-950/60 cursor-pointer"
            >
              <span>Enter Radio</span>
              <Radio className="w-4 h-4" />
            </motion.button>
            <button
              onClick={handleDismiss}
              className="p-2 sm:p-2.5 rounded-full bg-zinc-900/90 border border-zinc-700/80 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Close Intro (Esc)"
              aria-label="Close Intro"
            >
              <X className="w-4 sm:w-5 h-4 sm:h-5" />
            </button>
          </div>
        </header>

        {/* Center Stage: The 3D Comedy Button & Multi-Phase Animation */}
        <main className="w-full max-w-3xl flex-1 flex flex-col items-center justify-center text-center py-3 relative z-10">
          {/* Autoplay blocked or initial prompt banner */}
          {autoplayBlocked && !isPlaying && (
            <motion.div
              initial={{ scale: 0.9, y: -15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              className="mb-3 px-4 py-2 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg"
            >
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              <span>Tap The Comedy Button below to launch the opening animation!</span>
            </motion.div>
          )}

          {/* Prompt to upload user's exact audio if not playing */}
          {!customAudioName && (
            <div className="mb-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 hover:border-amber-400 text-zinc-400 hover:text-amber-300 text-[11px] transition-colors cursor-pointer shadow-sm"
              >
                <Upload className="w-3 h-3 text-amber-400" />
                <span>Have your custom audio file? Click here or drop it to play</span>
              </button>
            </div>
          )}

          {/* Iconic 3D Comedy Button Core with Dynamic Animations */}
          <div className="relative mb-5">
            <motion.div
              animate={
                isRocking
                  ? {
                      scale: [1, 1.07, 0.97, 1.03, 1],
                      rotate: [0, -1.5, 1.5, -0.5, 0],
                    }
                  : {
                      scale: [0.96, 1.02, 0.98],
                    }
              }
              transition={
                isRocking
                  ? { repeat: Infinity, duration: 0.428, ease: 'easeInOut' }
                  : { repeat: Infinity, duration: 2.2, ease: 'easeInOut' }
              }
              className="relative"
            >
              <ComedyPlayButton
                size="xl"
                isPlaying={isPlaying}
                onClick={togglePlayState}
                title={isPlaying ? 'Pause Theme' : 'Play Opening Theme'}
                ariaLabel={isPlaying ? 'Pause Theme' : 'Play Opening Theme'}
                showGlow={true}
              />
            </motion.div>

            {/* Shockwave Energy Rings radiating on Rock Beat */}
            {isRocking && (
              <>
                <motion.div
                  animate={{
                    scale: [1, 2.5],
                    opacity: [0.85, 0],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.856,
                    ease: 'easeOut',
                  }}
                  className="absolute inset-0 rounded-full border-2 border-red-500 pointer-events-none -z-10"
                />
                <motion.div
                  animate={{
                    scale: [1, 3.2],
                    opacity: [0.65, 0],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.856,
                    delay: 0.428,
                    ease: 'easeOut',
                  }}
                  className="absolute inset-0 rounded-full border border-amber-500 pointer-events-none -z-10"
                />
              </>
            )}

            {/* Floating comic sound effect badge during Drop */}
            {isTitleDropPhase && (
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: [1, 1.15, 1], rotate: [-12, -8, -12] }}
                transition={{ repeat: Infinity, duration: 0.6 }}
                className="absolute -top-3 -right-6 px-3 py-1 rounded-xl bg-amber-400 text-black font-black text-xs uppercase tracking-wider shadow-xl border-2 border-white pointer-events-none"
              >
                POW! 💥
              </motion.div>
            )}
          </div>

          {/* DYNAMIC SCENE DISPLAY BASED ON TIMELINE */}
          <div className="w-full min-h-[150px] sm:min-h-[175px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {/* PHASE 1: Host Voice Roll Call Cards */}
              {isHostIntroPhase && activeHost && (
                <motion.div
                  key={activeHost.id}
                  initial={{ scale: 0.7, y: 30, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.8, y: -25, opacity: 0 }}
                  transition={{ type: 'spring', damping: 18, stiffness: 350 }}
                  className="flex flex-col items-center space-y-2 px-6 sm:px-8 py-4 sm:py-5 rounded-3xl bg-[#121622]/90 border border-zinc-700/80 shadow-2xl backdrop-blur-md max-w-md mx-auto"
                >
                  <div className="flex items-center gap-2 text-3xl">
                    <span className="filter drop-shadow-md">{activeHost.icon}</span>
                    <h3
                      className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white"
                      style={{ textShadow: `0 0 25px ${activeHost.color}` }}
                    >
                      {activeHost.name}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-zinc-300">
                    {activeHost.tagline}
                  </p>
                  <div
                    className="px-4 py-1.5 rounded-full text-xs sm:text-sm font-extrabold text-white mt-1 border shadow-md"
                    style={{
                      backgroundColor: `${activeHost.color}25`,
                      borderColor: activeHost.color,
                    }}
                  >
                    {activeHost.catchphrase}
                  </div>
                </motion.div>
              )}

              {/* PHASE 1 (pre-roll): Welcome Intro Title */}
              {isHostIntroPhase && !activeHost && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2 text-center"
                >
                  <h2 className="text-2xl sm:text-4xl font-black uppercase text-white tracking-tight">
                    THE COMEDY BUTTON
                  </h2>
                  <p className="text-xs sm:text-sm font-medium text-zinc-400">
                    Anthony Gallegos • Brian Altano • Scott Bromley • Ryan Scott • Max Scoville
                  </p>
                </motion.div>
              )}

              {/* PHASE 2: The Title Drop & Drum Roll Climax */}
              {isTitleDropPhase && (
                <motion.div
                  key="title-drop"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: [1, 1.05, 1], opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-3 max-w-lg"
                >
                  <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 bg-amber-950/80 border border-amber-800/60 px-3.5 py-1 rounded-full shadow-sm">
                    ⚡ 24/7 INTERNET RADIO BROADCAST
                  </span>
                  <h2 className="text-3xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-400 to-red-500 uppercase tracking-tight drop-shadow-xl">
                    THE COMEDY BUTTON
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-300 font-semibold">
                    YOUR AURAL CANALS ARE OURS!
                  </p>
                </motion.div>
              )}

              {/* PHASE 3: Skate-Punk Guitar Riff & Analog Cassette Lore */}
              {isRiffPhase && (
                <motion.div
                  key={`lore-${activeLoreIndex}`}
                  initial={{ scale: 0.85, opacity: 0, y: 15 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: -15 }}
                  transition={{ type: 'spring', damping: 20 }}
                  className="p-5 sm:p-6 rounded-3xl bg-[#121622]/90 border border-zinc-700/80 shadow-2xl backdrop-blur-md max-w-lg mx-auto space-y-2.5"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl">{LORE_ITEMS[activeLoreIndex].icon}</span>
                    <span className="text-[10px] font-black tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-red-950/80 border border-red-800/60 text-red-400">
                      {LORE_ITEMS[activeLoreIndex].badge}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-2xl font-black text-white uppercase tracking-tight">
                    {LORE_ITEMS[activeLoreIndex].title}
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-300 font-medium">
                    {LORE_ITEMS[activeLoreIndex].desc}
                  </p>
                </motion.div>
              )}

              {/* PHASE 4: Guitar Solo & All-Star Host Lineup Grid */}
              {isSoloPhase && (
                <motion.div
                  key="solo-lineup"
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', damping: 20 }}
                  className="space-y-3 max-w-2xl mx-auto"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-amber-400">
                      GUITAR SOLO &bull; ALL-STAR ROSTER
                    </span>
                    <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
                  </div>

                  <div className="grid grid-cols-5 gap-2 sm:gap-3 pt-1">
                    {HOST_TIMELINE.map((h) => (
                      <div
                        key={h.id}
                        className="p-2 sm:p-3 rounded-2xl border text-center transition-all bg-zinc-900/80 shadow-md"
                        style={{ borderColor: `${h.color}80` }}
                      >
                        <div className="text-xl sm:text-2xl mb-1">{h.icon}</div>
                        <div className="text-[10px] sm:text-xs font-black text-white truncate">
                          {h.name.split(' ')[0]}
                        </div>
                        <div
                          className="text-[9px] font-bold truncate mt-0.5"
                          style={{ color: h.color }}
                        >
                          {h.role.split('&')[0]}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* PHASE 5: Grand Finale & Seamless Enter Broadcast */}
              {isFinalePhase && (
                <motion.div
                  key="finale"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 20 }}
                  className="space-y-4 max-w-md mx-auto"
                >
                  <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
                    WELCOME TO THE SHOW
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-300">
                    The 24/7 Radio Station is streaming live right now.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleEnterApp(true)}
                    className="w-full px-6 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-amber-600 to-red-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xl shadow-red-950/80 cursor-pointer"
                  >
                    <Radio className="w-5 h-5 animate-pulse" />
                    <span>TUNE IN TO 24/7 BROADCAST</span>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Rhythmic Dancing Equalizer Visualizer Cluster during Rock Beat */}
          {isRocking && (
            <div className="flex items-end justify-center gap-1 sm:gap-1.5 h-10 sm:h-12 pt-3">
              {[12, 28, 42, 35, 48, 22, 40, 48, 30, 44, 20, 36, 48, 24, 38, 46, 26, 42, 32, 40].map((maxH, idx) => (
                <motion.span
                  key={idx}
                  animate={{
                    height: [8, maxH, 12, maxH * 0.85, 8],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.428,
                    delay: (idx * 0.035) % 0.428,
                    ease: 'easeInOut',
                  }}
                  className="w-1 sm:w-1.5 bg-gradient-to-t from-red-600 via-amber-500 to-yellow-300 rounded-full"
                />
              ))}
            </div>
          )}
        </main>

        {/* Bottom Bar: Interactive Timeline Scrubber & Options */}
        <footer className="w-full max-w-3xl space-y-3 z-20">
          {/* Interactive Scrubbable Timeline Bar */}
          <div className="space-y-1.5">
            <div
              onClick={handleTimelineClick}
              className="relative w-full h-3 bg-zinc-800/90 rounded-full overflow-hidden cursor-pointer group hover:h-3.5 transition-all"
              title="Click anywhere to jump to that moment in the opening theme"
            >
              <motion.div
                className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 relative"
                style={{ width: `${progressPercent}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md transform translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>

              {/* Host Marker Dots along timeline */}
              {HOST_TIMELINE.map((h) => (
                <div
                  key={h.id}
                  style={{ left: `${(h.startTime / (duration || 34.0)) * 100}%` }}
                  className="absolute top-0 bottom-0 w-0.5 bg-white/40 pointer-events-none"
                  title={h.name}
                />
              ))}
              {/* Drop Marker */}
              <div
                style={{ left: `${(10.4 / (duration || 34.0)) * 100}%` }}
                className="absolute top-0 bottom-0 w-1 bg-amber-400 pointer-events-none"
                title="Beat Drop"
              />
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                {Math.floor(currentTime)}s / {Math.floor(duration)}s
              </span>
              <span className="text-[11px] text-zinc-500 hidden sm:inline">
                Click timeline to seek to any host or the beat drop
              </span>
              <button
                onClick={handleRestart}
                className="hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Replay</span>
              </button>
            </div>
          </div>

          {/* Footer Controls: Toggle Auto-Play on Startup & Auto-Start Radio */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400 pt-2 border-t border-zinc-800/80">
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer hover:text-zinc-200 transition-colors select-none">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={handleToggleDontShow}
                  className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-red-600 focus:ring-red-500 focus:ring-offset-0 cursor-pointer"
                />
                <span>Don&apos;t show intro on startup</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:text-zinc-200 transition-colors select-none">
                <input
                  type="checkbox"
                  checked={autoStartRadio}
                  onChange={handleToggleAutoStartRadio}
                  className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-0 cursor-pointer"
                />
                <span>Auto-start 24/7 Radio when intro finishes</span>
              </label>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => handleEnterApp(true)}
                className="text-amber-400 font-bold hover:text-amber-300 transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Skip straight to 24/7 Radio</span>
                <Radio className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </footer>
      </motion.div>
    </AnimatePresence>
  );
};
