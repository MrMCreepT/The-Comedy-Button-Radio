import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { Episode } from '../types';
import { computeClientStreamTimeline } from '../utils/timelineScheduler';
import { getEpisodes } from '../services/api';
import { getArtworkUrl } from '../utils/assets';
import { castService } from '../services/castService';
import {
  getOfflineEpisodeBlob,
  getAllOfflineEpisodeIds,
  deleteOfflineEpisode,
  saveEpisodeResumePoint,
  getEpisodeResumePoint,
  getEpisodeResumePointSync,
  clearEpisodeResumePoint
} from '../utils/offlineStorage';
import { triggerHaptic } from '../utils/haptics';
import { recordListeningIncrement, recordEpisodeCompleted } from '../utils/listeningStats';
import { useSleepTimer } from '../hooks/useSleepTimer';
import { useMediaSession } from '../hooks/useMediaSession';
import { useAudioEffects } from '../hooks/useAudioEffects';

interface AudioContextType {
  currentEpisode: Episode | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  volume: number;
  isMuted: boolean;
  playMode: 'radio' | 'archive';
  listenedIds: Set<string>;
  favoriteIds: Set<string>;
  offlineDownloadedIds: Set<string>;
  playEpisode: (episode: Episode, startOffsetSeconds?: number, mode?: 'radio' | 'archive') => void;
  playNextEpisode: () => void;
  playPreviousEpisode: () => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  skip: (seconds: number) => void;
  setPlaybackRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleListened: (id: string) => void;
  toggleFavorite: (id: string) => void;
  isListened: (id: string) => boolean;
  isFavorite: (id: string) => boolean;
  isOfflineSaved: (id: string) => boolean;
  refreshOfflineIds: () => Promise<void>;
  removeOfflineEpisode: (id: string) => Promise<void>;
  setPlaylist: (episodes: Episode[]) => void;
  setPlayMode: (mode: 'radio' | 'archive') => void;
  setOnEndedCallback: (cb: (() => void) | null) => void;
  sleepTimerMinutes: number | null;
  sleepTimerRemaining: number | null;
  setSleepTimer: (minutes: number | null) => void;
  voiceBoostEnabled: boolean;
  toggleVoiceBoost: () => boolean;
  isStatsModalOpen: boolean;
  openStatsModal: () => void;
  closeStatsModal: () => void;
  isCastReceiverOpen: boolean;
  openCastReceiver: () => void;
  closeCastReceiver: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setRate] = useState(() => {
    try {
      const saved = localStorage.getItem('cb_playback_rate');
      return saved ? parseFloat(saved) : 1;
    } catch {
      return 1;
    }
  });
  const [volume, setVol] = useState(0.9);
  const [isMuted, setIsMuted] = useState(false);
  const [playMode, setPlayModeState] = useState<'radio' | 'archive'>('radio');

  const [offlineDownloadedIds, setOfflineDownloadedIds] = useState<Set<string>>(new Set());

  const [listenedIds, setListenedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('cb_listened_episodes');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('cb_favorite_episodes');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentObjectUrlRef = useRef<string | null>(null);
  const onEndedCallbackRef = useRef<(() => void) | null>(null);
  const currentEpisodeRef = useRef<Episode | null>(null);
  const playModeRef = useRef<'radio' | 'archive'>('radio');
  const playlistRef = useRef<Episode[]>([]);
  const isPlayingRef = useRef(false);
  const lastResumeSaveTimeRef = useRef<number>(0);
  const lastStatsRecordTimeRef = useRef<number>(0);
  const preDuckVolumeRef = useRef<number | null>(null);

  // Modals state
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isCastReceiverOpen, setIsCastReceiverOpen] = useState(false);

  const openStatsModal = useCallback(() => setIsStatsModalOpen(true), []);
  const closeStatsModal = useCallback(() => setIsStatsModalOpen(false), []);
  const openCastReceiver = useCallback(() => setIsCastReceiverOpen(true), []);
  const closeCastReceiver = useCallback(() => setIsCastReceiverOpen(false), []);

  // Sync refs with state
  currentEpisodeRef.current = currentEpisode;
  playModeRef.current = playMode;
  isPlayingRef.current = isPlaying;

  const { voiceBoostEnabled, toggleVoiceBoost } = useAudioEffects({
    audioRef,
    currentEpisodeRef,
  });

  const playPreviousEpisodeRef = useRef<() => void>(() => {});
  const playNextEpisodeRef = useRef<() => void>(() => {});

  const { updateMediaSession, updatePositionState } = useMediaSession({
    audioRef,
    currentEpisodeRef,
    onPlayPrevious: () => playPreviousEpisodeRef.current(),
    onPlayNext: () => playNextEpisodeRef.current(),
    onSeek: (newTime) => setCurrentTime(newTime),
  });

  const { sleepTimerMinutes, sleepTimerRemaining, setSleepTimer } = useSleepTimer({
    audioRef,
    volume,
    isMuted,
    onTimerComplete: () => setIsPlaying(false),
  });

  const refreshOfflineIds = useCallback(async () => {
    try {
      const ids = await getAllOfflineEpisodeIds();
      setOfflineDownloadedIds(new Set(ids));
    } catch {
      // ignore
    }
  }, []);

  const removeOfflineEpisode = useCallback(async (id: string) => {
    try {
      await deleteOfflineEpisode(id);
      await refreshOfflineIds();
    } catch (e) {
      console.warn('Failed to delete offline episode:', e);
    }
  }, [refreshOfflineIds]);

  useEffect(() => {
    refreshOfflineIds();
  }, [refreshOfflineIds]);


  const setPlaylist = useCallback((episodes: Episode[]) => {
    playlistRef.current = episodes;
  }, []);

  const setPlayMode = useCallback((mode: 'radio' | 'archive') => {
    setPlayModeState(mode);
    playModeRef.current = mode;
  }, []);

  const setOnEndedCallback = (cb: (() => void) | null) => {
    onEndedCallbackRef.current = cb;
  };

  // Pre-load episode dataset for offline/client deterministic calculations
  useEffect(() => {
    getEpisodes().then(({ episodes }) => {
      if (playlistRef.current.length === 0) {
        playlistRef.current = episodes;
      }
    }).catch(console.error);
  }, []);

  // Transition to next episode (synchronous and robust for screen-off mobile background playback)
  const transitionToNextEpisode = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const episodes = playlistRef.current;
    if (!episodes || episodes.length === 0) return;

    if (playModeRef.current === 'radio') {
      // Synchronously compute the on-air episode at this exact second
      try {
        const timeline = computeClientStreamTimeline(episodes);
        const nextEpisode = timeline.onAir.episode;
        const offset = Math.max(0, timeline.onAir.currentOffsetSeconds || 0);

        setCurrentEpisode(nextEpisode);
        castService.setCurrentEpisode(nextEpisode);

        audio.src = nextEpisode.audioUrl;
        try {
          audio.currentTime = offset;
        } catch {}
        try {
          const playPromise = audio.play();
          if (playPromise) {
            playPromise.catch((err) => {
              console.warn('Background radio transition playback note:', err);
            });
          }
        } catch (err) {
          console.warn('audio.play error on transition:', err);
        }

        updateMediaSession(nextEpisode, true);
        castService.loadMediaOnCast(nextEpisode, offset, true);
      } catch (err) {
        console.error('Failed to compute next radio episode on air:', err);
      }
    } else {
      // Archive mode: Advance to next episode in playlist
      const current = currentEpisodeRef.current;
      const currentIndex = episodes.findIndex((e) => e.id === current?.id);
      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % episodes.length : 0;
      const nextEpisode = episodes[nextIndex];

      if (nextEpisode) {
        setCurrentEpisode(nextEpisode);
        castService.setCurrentEpisode(nextEpisode);

        audio.src = nextEpisode.audioUrl;
        try {
          audio.currentTime = 0;
        } catch {}
        try {
          const playPromise = audio.play();
          if (playPromise) {
            playPromise.catch((err) => {
              console.warn('Background archive transition playback note:', err);
            });
          }
        } catch (err) {
          console.warn('audio.play error on transition:', err);
        }

        updateMediaSession(nextEpisode, true);
        castService.loadMediaOnCast(nextEpisode, 0, true);
      }
    }
  }, [updateMediaSession]);

  const playNextEpisode = useCallback(() => {
    transitionToNextEpisode();
  }, [transitionToNextEpisode]);

  const playPreviousEpisode = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // If more than 5 seconds in, restart current episode
    if (audio.currentTime > 5) {
      try {
        audio.currentTime = 0;
      } catch {}
      setCurrentTime(0);
      return;
    }

    const episodes = playlistRef.current;
    if (!episodes || episodes.length === 0) return;

    const current = currentEpisodeRef.current;
    const currentIndex = episodes.findIndex((e) => e.id === current?.id);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : episodes.length - 1;
    const prevEpisode = episodes[prevIndex];

    if (prevEpisode) {
      setCurrentEpisode(prevEpisode);
      castService.setCurrentEpisode(prevEpisode);

      audio.src = prevEpisode.audioUrl;
      try {
        audio.currentTime = 0;
      } catch {}
      try {
        const p = audio.play();
        if (p) p.catch(console.error);
      } catch (err) {
        console.warn('audio.play prev error:', err);
      }

      updateMediaSession(prevEpisode, true);
      castService.loadMediaOnCast(prevEpisode, 0, true);
    }
  }, [updateMediaSession]);

  playNextEpisodeRef.current = playNextEpisode;
  playPreviousEpisodeRef.current = playPreviousEpisode;

  // Initialize audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.setAttribute('x-webkit-airplay', 'allow');
    audioRef.current = audio;

    // Register audio element with Cast service for AirPlay and Remote Playback
    castService.registerAudioElement(audio);

    // Modern Pitch Correction & Preservation (preserves natural voice pitch at 0.5x - 2.5x speed)
    if ('preservesPitch' in audio) {
      (audio as any).preservesPitch = true;
    } else if ('mozPreservesPitch' in audio) {
      (audio as any).mozPreservesPitch = true;
    } else if ('webkitPreservesPitch' in audio) {
      (audio as any).webkitPreservesPitch = true;
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (!isNaN(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }

      // IndexedDB Scrubbing Resume Cache: Save progress timestamp every 5 seconds
      const now = Date.now();
      if (
        playModeRef.current === 'archive' &&
        currentEpisodeRef.current &&
        audio.currentTime > 5 &&
        now - lastResumeSaveTimeRef.current > 5000
      ) {
        lastResumeSaveTimeRef.current = now;
        saveEpisodeResumePoint(currentEpisodeRef.current.id, audio.currentTime, audio.duration || 0);
      }

      // Track listening stats every 5 seconds of active audio playback
      if (currentEpisodeRef.current && now - lastStatsRecordTimeRef.current > 5000) {
        lastStatsRecordTimeRef.current = now;
        recordListeningIncrement(5, currentEpisodeRef.current);
      }

      // Update lock-screen playback position state
      updatePositionState(audio.currentTime, audio.duration, audio.playbackRate);
    };

    const handleLoadedMetadata = () => {
      if (!isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      if (currentEpisodeRef.current) {
        updateMediaSession(currentEpisodeRef.current, true);
      }
    };

    const handlePause = () => {
      setIsPlaying(false);
      if (currentEpisodeRef.current) {
        updateMediaSession(currentEpisodeRef.current, false);
        // Persist resume point immediately on pause
        if (playModeRef.current === 'archive' && audio.currentTime > 5) {
          saveEpisodeResumePoint(currentEpisodeRef.current.id, audio.currentTime, audio.duration || 0);
        }
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (currentEpisodeRef.current) {
        // Clear saved resume point once completed
        clearEpisodeResumePoint(currentEpisodeRef.current.id);
        recordEpisodeCompleted();

        // Mark as listened
        setListenedIds((prev) => {
          const next = new Set(prev);
          if (currentEpisodeRef.current) {
            next.add(currentEpisodeRef.current.id);
            try {
              localStorage.setItem('cb_listened_episodes', JSON.stringify(Array.from(next)));
            } catch {}
          }
          return next;
        });
      }

      // CRITICAL FIX FOR SCREEN-OFF BACKGROUND TRANSITIONS:
      // Synchronously load and start next episode immediately inside the native 'ended' event listener.
      // This ensures mobile browsers (iOS WebKit and Android Chrome) permit continuous background playback.
      transitionToNextEpisode();

      if (onEndedCallbackRef.current) {
        try {
          onEndedCallbackRef.current();
        } catch (e) {
          console.error('Error in onEndedCallback:', e);
        }
      }
    };

    // Audio Ducking and System Interruption Listeners (Phone calls, GPS navigation, Siri/Assistant prompts)
    const handleDuck = () => {
      if (preDuckVolumeRef.current === null && audioRef.current) {
        preDuckVolumeRef.current = audioRef.current.volume;
        // Smoothly duck volume to 25% during system interruptions
        audioRef.current.volume = Math.max(0.05, audioRef.current.volume * 0.25);
      }
    };

    const handleUnduck = () => {
      if (preDuckVolumeRef.current !== null && audioRef.current) {
        audioRef.current.volume = preDuckVolumeRef.current;
        preDuckVolumeRef.current = null;
      }
    };

    // Visibility change / Pagehide: save resume point when user leaves or closes tab
    const handleVisibilityOrPageHide = () => {
      if (
        playModeRef.current === 'archive' &&
        currentEpisodeRef.current &&
        audioRef.current &&
        audioRef.current.currentTime > 5
      ) {
        saveEpisodeResumePoint(
          currentEpisodeRef.current.id,
          audioRef.current.currentTime,
          audioRef.current.duration || 0
        );
      }
    };

    const handleError = () => {
      const audio = audioRef.current;
      const episode = currentEpisodeRef.current;
      if (!audio || !episode || !episode.audioUrl) return;

      const mediaErr = audio.error;
      console.warn('HTMLAudioElement error event:', mediaErr ? `${mediaErr.code} - ${mediaErr.message}` : 'unknown error');

      // If playing direct CDN stream and it failed (e.g. adblocker, Libsyn CDN glitch, CORS),
      // transparently recover by switching to the server audio proxy
      if (!audio.src.includes('/api/audio-proxy')) {
        console.log(`[AudioContext] Attempting proxy fallback for "${episode.title}"...`);
        const fallbackUrl = `/api/audio-proxy?url=${encodeURIComponent(episode.audioUrl)}`;
        const resumePos = audio.currentTime || 0;
        audio.removeAttribute('crossOrigin');
        audio.src = fallbackUrl;

        const onMetadata = () => {
          if (audioRef.current) {
            if (resumePos > 0) {
              try {
                audioRef.current.currentTime = resumePos;
              } catch {}
            }
            audioRef.current.play().catch((playErr) => {
              console.warn('[AudioContext] Proxy playback error:', playErr);
              setIsPlaying(false);
            });
          }
        };
        audio.addEventListener('loadedmetadata', onMetadata, { once: true });
        audio.load();
      } else {
        setIsPlaying(false);
      }
    };

    window.addEventListener('pagehide', handleVisibilityOrPageHide);
    document.addEventListener('visibilitychange', handleVisibilityOrPageHide);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // Audio focus ducking listeners
    audio.addEventListener('duck' as any, handleDuck);
    audio.addEventListener('unduck' as any, handleUnduck);

    return () => {
      window.removeEventListener('pagehide', handleVisibilityOrPageHide);
      document.removeEventListener('visibilitychange', handleVisibilityOrPageHide);
      audio.removeEventListener('duck' as any, handleDuck);
      audio.removeEventListener('unduck' as any, handleUnduck);
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [transitionToNextEpisode, playNextEpisode, playPreviousEpisode, updateMediaSession]);

  const playEpisode = async (episode: Episode, startOffsetSeconds?: number, mode?: 'radio' | 'archive') => {
    if (!audioRef.current || !episode || !episode.audioUrl) {
      console.warn('Cannot play episode: invalid episode or missing audio URL', episode);
      return;
    }

    const targetMode = mode || 'archive';
    setPlayModeState(targetMode);
    playModeRef.current = targetMode;

    try {
      castService.setCurrentEpisode(episode);
    } catch {}

    // Check if this episode is already current
    if (currentEpisodeRef.current?.id === episode.id) {
      if (typeof startOffsetSeconds === 'number' && !isNaN(startOffsetSeconds) && isFinite(startOffsetSeconds)) {
        const safeOffset = Math.max(0, startOffsetSeconds);
        try {
          audioRef.current.currentTime = safeOffset;
        } catch {}
        setCurrentTime(safeOffset);
        castService.syncSeek(safeOffset);
        if (!isPlaying) {
          try {
            const p = audioRef.current.play();
            if (p) p.catch((err) => console.warn('Resume play promise note:', err));
          } catch (e) {
            console.warn('Resume play sync note:', e);
          }
        }
      } else {
        if (isPlaying) {
          try {
            audioRef.current.pause();
            castService.syncPlayPause(false);
          } catch {}
        } else {
          try {
            const p = audioRef.current.play();
            if (p) p.catch((err) => console.warn('Toggle play promise note:', err));
            castService.syncPlayPause(true);
          } catch {}
        }
      }
      return;
    }

    // Revoke previous blob url if any
    if (currentObjectUrlRef.current) {
      try {
        URL.revokeObjectURL(currentObjectUrlRef.current);
      } catch {}
      currentObjectUrlRef.current = null;
    }

    // Direct playback must NOT have crossOrigin set to allow cross-origin CDN media without CORS errors
    if (!voiceBoostEnabled) {
      audioRef.current.removeAttribute('crossOrigin');
    }

    const urlToPlay = voiceBoostEnabled
      ? `/api/audio-proxy?url=${encodeURIComponent(episode.audioUrl)}`
      : episode.audioUrl;

    setCurrentEpisode(episode);
    currentEpisodeRef.current = episode;

    try {
      audioRef.current.src = urlToPlay;
    } catch (e) {
      console.warn('Error setting audio src:', e);
      return;
    }

    if ('preservesPitch' in audioRef.current) {
      (audioRef.current as any).preservesPitch = true;
    }
    audioRef.current.playbackRate = playbackRate;
    audioRef.current.volume = isMuted ? 0 : volume;

    let targetOffset = (typeof startOffsetSeconds === 'number' && !isNaN(startOffsetSeconds) && isFinite(startOffsetSeconds))
      ? Math.max(0, startOffsetSeconds)
      : 0;

    // Check for saved resume point synchronously from localStorage (instant 0ms, zero lag)
    if (targetOffset === 0 && targetMode === 'archive') {
      const savedResume = getEpisodeResumePointSync(episode.id);
      if (typeof savedResume === 'number' && !isNaN(savedResume) && isFinite(savedResume) && savedResume > 10) {
        targetOffset = savedResume;
      }
    }

    if (targetOffset > 0) {
      setCurrentTime(targetOffset);
      const applyOffset = () => {
        if (audioRef.current) {
          try {
            audioRef.current.currentTime = targetOffset;
            setCurrentTime(targetOffset);
          } catch (e) {
            console.warn('Deferred seek warning:', e);
          }
        }
      };
      audioRef.current.addEventListener('loadedmetadata', applyOffset, { once: true });
      audioRef.current.addEventListener('canplay', applyOffset, { once: true });
    } else {
      try {
        audioRef.current.currentTime = 0;
      } catch {}
      setCurrentTime(0);
    }

    // Immediate playback start (synchronous in gesture loop for iOS Safari & Android Chrome)
    try {
      const p = audioRef.current.play();
      if (p !== undefined && typeof p.catch === 'function') {
        p.catch((err) => {
          console.warn('Audio play auto-start note:', err);
        });
      }
    } catch (err) {
      console.warn('audio.play() synchronous exception caught:', err);
    }

    // In background, check if downloaded offline in IndexedDB
    getOfflineEpisodeBlob(episode.id)
      .then((offlineBlob) => {
        if (offlineBlob && currentEpisodeRef.current?.id === episode.id && audioRef.current) {
          const blobUrl = URL.createObjectURL(offlineBlob);
          currentObjectUrlRef.current = blobUrl;
        }
      })
      .catch(() => {});

    updateMediaSession(episode, true);
    try {
      castService.loadMediaOnCast(episode, targetOffset, true);
    } catch (err) {
      console.warn('castService.loadMediaOnCast warning:', err);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    triggerHaptic(10);

    // If no episode is loaded yet, pick first available episode or on-air episode
    if (!currentEpisodeRef.current) {
      if (playlistRef.current && playlistRef.current.length > 0) {
        playEpisode(playlistRef.current[0], 0, 'archive');
      }
      return;
    }

    if (isPlaying) {
      try {
        audioRef.current.pause();
        castService.syncPlayPause(false);
      } catch (e) {
        console.warn('audio.pause error:', e);
      }
    } else {
      try {
        const p = audioRef.current.play();
        if (p !== undefined && typeof p.catch === 'function') {
          p.catch((err) => {
            console.warn('audio.play toggle error:', err);
          });
        }
        castService.syncPlayPause(true);
      } catch (e) {
        console.warn('audio.play toggle sync error:', e);
      }
    }
  };

  const seek = (seconds: number) => {
    if (!audioRef.current) return;
    if (isNaN(seconds) || !isFinite(seconds)) return;
    const dur = !isNaN(duration) && isFinite(duration) && duration > 0 ? duration : (audioRef.current.duration || 0);
    const safeDur = !isNaN(dur) && isFinite(dur) ? dur : 0;
    const clamped = Math.max(0, safeDur > 0 ? Math.min(seconds, safeDur) : seconds);
    try {
      audioRef.current.currentTime = clamped;
    } catch (e) {
      console.warn('Seek error:', e);
    }
    setCurrentTime(clamped);
    castService.syncSeek(clamped);
  };

  const skip = (seconds: number) => {
    if (!audioRef.current) return;
    if (isNaN(seconds) || !isFinite(seconds)) return;
    triggerHaptic(8);
    const audioDur = audioRef.current.duration;
    const dur = !isNaN(audioDur) && isFinite(audioDur) && audioDur > 0 ? audioDur : (duration || 0);
    const safeDur = !isNaN(dur) && isFinite(dur) ? dur : 0;
    const curr = !isNaN(audioRef.current.currentTime) && isFinite(audioRef.current.currentTime)
      ? audioRef.current.currentTime
      : currentTime;
    const newTime = Math.max(0, safeDur > 0 ? Math.min(curr + seconds, safeDur) : Math.max(0, curr + seconds));
    try {
      audioRef.current.currentTime = newTime;
    } catch (e) {
      console.warn('Skip error:', e);
    }
    setCurrentTime(newTime);
    castService.syncSeek(newTime);
  };

  // Global Keyboard Shortcuts (Space = Play/Pause, J/Left = -15s, L/Right = +30s, M = Mute)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input, textarea or contenteditable element
      const activeEl = document.activeElement;
      const isInput =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable);
      if (isInput) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'j' || e.key === 'J' || e.key === 'ArrowLeft') {
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          skip(-15);
        }
      } else if (e.key === 'l' || e.key === 'L' || e.key === 'ArrowRight') {
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          skip(30);
        }
      } else if (e.key === 'm' || e.key === 'M') {
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          toggleMute();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentEpisode, duration, isMuted, volume]);

  const setPlaybackRate = (rate: number) => {
    setRate(rate);
    try {
      localStorage.setItem('cb_playback_rate', String(rate));
    } catch {}
    if (audioRef.current) {
      if ('preservesPitch' in audioRef.current) {
        (audioRef.current as any).preservesPitch = true;
      }
      audioRef.current.playbackRate = rate;
    }
  };

  const setVolume = (newVol: number) => {
    setVol(newVol);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : newVol;
    }
    castService.syncVolume(newVol);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioRef.current.volume = nextMuted ? 0 : volume;
  };

  const toggleListened = (id: string) => {
    setListenedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem('cb_listened_episodes', JSON.stringify(Array.from(next)));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const toggleFavorite = (id: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem('cb_favorite_episodes', JSON.stringify(Array.from(next)));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const isListened = (id: string) => listenedIds.has(id);
  const isFavorite = (id: string) => favoriteIds.has(id);
  const isOfflineSaved = (id: string) => offlineDownloadedIds.has(id);

  return (
    <AudioContext.Provider
      value={{
        currentEpisode,
        isPlaying,
        currentTime,
        duration,
        playbackRate,
        volume,
        isMuted,
        playMode,
        listenedIds,
        favoriteIds,
        offlineDownloadedIds,
        playEpisode,
        playNextEpisode,
        playPreviousEpisode,
        togglePlay,
        seek,
        skip,
        setPlaybackRate,
        setVolume,
        toggleMute,
        toggleListened,
        toggleFavorite,
        isListened,
        isFavorite,
        isOfflineSaved,
        refreshOfflineIds,
        removeOfflineEpisode,
        setPlaylist,
        setPlayMode,
        setOnEndedCallback,
        sleepTimerMinutes,
        sleepTimerRemaining,
        setSleepTimer,
        voiceBoostEnabled,
        toggleVoiceBoost,
        isStatsModalOpen,
        openStatsModal,
        closeStatsModal,
        isCastReceiverOpen,
        openCastReceiver,
        closeCastReceiver,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error('useAudio must be used within AudioProvider');
  return context;
};
