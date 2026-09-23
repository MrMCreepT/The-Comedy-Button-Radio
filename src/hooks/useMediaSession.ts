import { useCallback, useEffect, useRef } from 'react';
import { Episode } from '../types';
import { getArtworkUrl } from '../utils/assets';
import { castService } from '../services/castService';

interface UseMediaSessionOptions {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  currentEpisodeRef: React.MutableRefObject<Episode | null>;
  onPlayPrevious: () => void;
  onPlayNext: () => void;
  onSeek: (time: number) => void;
}

export function useMediaSession({
  audioRef,
  currentEpisodeRef,
  onPlayPrevious,
  onPlayNext,
  onSeek,
}: UseMediaSessionOptions) {
  const onPlayPreviousRef = useRef(onPlayPrevious);
  const onPlayNextRef = useRef(onPlayNext);
  const onSeekRef = useRef(onSeek);

  useEffect(() => {
    onPlayPreviousRef.current = onPlayPrevious;
    onPlayNextRef.current = onPlayNext;
    onSeekRef.current = onSeek;
  });

  // Update native Lock-Screen / Notification MediaSession metadata
  const updateMediaSession = useCallback((episode: Episode | null, playing: boolean) => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator) || !episode) return;

    try {
      const artworkUrl = getArtworkUrl(episode.imageUrl);
      if (typeof (window as any).MediaMetadata === 'function') {
        navigator.mediaSession.metadata = new (window as any).MediaMetadata({
          title: episode.title || 'The Comedy Button',
          artist: 'The Comedy Button',
          album: episode.isBonus
            ? 'Bonus Content'
            : episode.episodeNumber
            ? `Episode ${episode.episodeNumber}`
            : '24/7 Live Radio Stream',
          artwork: [
            { src: artworkUrl, sizes: '96x96', type: 'image/jpeg' },
            { src: artworkUrl, sizes: '128x128', type: 'image/jpeg' },
            { src: artworkUrl, sizes: '192x192', type: 'image/png' },
            { src: artworkUrl, sizes: '256x256', type: 'image/png' },
            { src: artworkUrl, sizes: '512x512', type: 'image/png' },
          ],
        });
      }
      navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
    } catch (e) {
      console.warn('Failed to update MediaSession metadata:', e);
    }
  }, []);

  const updatePositionState = useCallback(
    (position: number, duration: number, playbackRate = 1) => {
      if (
        typeof window !== 'undefined' &&
        'mediaSession' in navigator &&
        typeof (navigator.mediaSession as any).setPositionState === 'function'
      ) {
        try {
          if (!isNaN(duration) && duration > 0) {
            (navigator.mediaSession as any).setPositionState({
              duration,
              playbackRate,
              position: Math.min(position, duration),
            });
          }
        } catch {}
      }
    },
    []
  );

  // Register action handlers on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.setActionHandler('play', () => {
        if (audioRef.current && currentEpisodeRef.current) {
          audioRef.current.play().catch(console.error);
          castService.syncPlayPause(true);
        }
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        if (audioRef.current) {
          audioRef.current.pause();
          castService.syncPlayPause(false);
        }
      });

      navigator.mediaSession.setActionHandler('seekbackward', () => {
        if (audioRef.current) {
          const newTime = Math.max(0, audioRef.current.currentTime - 15);
          audioRef.current.currentTime = newTime;
          onSeekRef.current(newTime);
          castService.syncSeek(newTime);
        }
      });

      navigator.mediaSession.setActionHandler('seekforward', () => {
        if (audioRef.current) {
          const dur = audioRef.current.duration || 0;
          const newTime = Math.min(audioRef.current.currentTime + 30, dur);
          audioRef.current.currentTime = newTime;
          onSeekRef.current(newTime);
          castService.syncSeek(newTime);
        }
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        onPlayPreviousRef.current();
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        onPlayNextRef.current();
      });

      if (typeof (navigator.mediaSession as any).setActionHandler === 'function') {
        navigator.mediaSession.setActionHandler('seekto', (details: any) => {
          if (audioRef.current && typeof details.seekTime === 'number') {
            audioRef.current.currentTime = details.seekTime;
            onSeekRef.current(details.seekTime);
            castService.syncSeek(details.seekTime);
          }
        });
      }
    } catch (e) {
      console.warn('Failed to register MediaSession handlers:', e);
    }

    return () => {
      if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
        const actions = ['play', 'pause', 'seekbackward', 'seekforward', 'previoustrack', 'nexttrack', 'seekto'];
        for (const action of actions) {
          try {
            navigator.mediaSession.setActionHandler(action as any, null);
          } catch {}
        }
      }
    };
  }, [audioRef, currentEpisodeRef]);

  return {
    updateMediaSession,
    updatePositionState,
  };
}
