import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Episode } from '../types';

interface AudioContextType {
  currentEpisode: Episode | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  volume: number;
  isMuted: boolean;
  listenedIds: Set<string>;
  favoriteIds: Set<string>;
  playEpisode: (episode: Episode, startOffsetSeconds?: number) => void;
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
  setOnEndedCallback: (cb: (() => void) | null) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setRate] = useState(1);
  const [volume, setVol] = useState(0.9);
  const [isMuted, setIsMuted] = useState(false);

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
  const onEndedCallbackRef = useRef<(() => void) | null>(null);

  const setOnEndedCallback = (cb: (() => void) | null) => {
    onEndedCallbackRef.current = cb;
  };

  // Initialize audio element once
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (!isNaN(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    const handleLoadedMetadata = () => {
      if (!isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      if (currentEpisode) {
        toggleListened(currentEpisode.id);
      }
      if (onEndedCallbackRef.current) {
        onEndedCallbackRef.current();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const playEpisode = async (episode: Episode, startOffsetSeconds?: number) => {
    if (!audioRef.current) return;
    if (currentEpisode?.id === episode.id) {
      if (typeof startOffsetSeconds === 'number') {
        audioRef.current.currentTime = Math.max(0, startOffsetSeconds);
        setCurrentTime(startOffsetSeconds);
        if (!isPlaying) {
          audioRef.current.play().catch(console.error);
        }
      } else {
        if (isPlaying) {
          audioRef.current.pause();
        } else {
          audioRef.current.play().catch(console.error);
        }
      }
      return;
    }

    let urlToPlay = episode.audioUrl;

    setCurrentEpisode({ ...episode, audioUrl: urlToPlay });
    audioRef.current.src = urlToPlay;
    audioRef.current.playbackRate = playbackRate;
    audioRef.current.volume = isMuted ? 0 : volume;

    const targetOffset = typeof startOffsetSeconds === 'number' ? Math.max(0, startOffsetSeconds) : 0;
    if (targetOffset > 0) {
      const applyOffset = () => {
        if (audioRef.current) {
          try {
            audioRef.current.currentTime = targetOffset;
            setCurrentTime(targetOffset);
          } catch (e) {
            console.warn('Deferred timeline sync seek warning:', e);
          }
        }
      };
      audioRef.current.addEventListener('loadedmetadata', applyOffset, { once: true });
      audioRef.current.addEventListener('canplay', applyOffset, { once: true });
      try {
        audioRef.current.currentTime = targetOffset;
      } catch {}
    } else {
      audioRef.current.currentTime = 0;
    }

    audioRef.current.play().catch(console.error);
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentEpisode) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
  };

  const seek = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(seconds, duration || 0));
    setCurrentTime(audioRef.current.currentTime);
  };

  const skip = (seconds: number) => {
    if (!audioRef.current) return;
    const newTime = Math.max(0, Math.min(audioRef.current.currentTime + seconds, duration || 0));
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const setPlaybackRate = (rate: number) => {
    setRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const setVolume = (newVol: number) => {
    setVol(newVol);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : newVol;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioRef.current.volume = nextMuted ? 0 : volume;
  };

  const toggleListened = (id: string) => {
    setListenedIds(prev => {
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
    setFavoriteIds(prev => {
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
        listenedIds,
        favoriteIds,
        playEpisode,
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
        setOnEndedCallback,
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
