import { useState, useEffect, useRef, useCallback } from 'react';
import { triggerHaptic } from '../utils/haptics';

interface UseSleepTimerOptions {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  volume: number;
  isMuted: boolean;
  onTimerComplete: () => void;
}

export function useSleepTimer({
  audioRef,
  volume,
  isMuted,
  onTimerComplete,
}: UseSleepTimerOptions) {
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const isFadingOutRef = useRef(false);

  const setSleepTimer = useCallback((minutes: number | null) => {
    triggerHaptic(12);
    setSleepTimerMinutes(minutes);

    if (minutes === null || minutes <= 0) {
      setSleepTimerRemaining(null);
      isFadingOutRef.current = false;
      if (audioRef.current) {
        audioRef.current.volume = isMuted ? 0 : volume;
      }
    } else {
      setSleepTimerRemaining(minutes * 60);
      isFadingOutRef.current = false;
    }
  }, [audioRef, volume, isMuted]);

  useEffect(() => {
    if (sleepTimerRemaining === null || sleepTimerRemaining <= 0) return;

    const interval = setInterval(() => {
      setSleepTimerRemaining((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          // Timer finished: pause playback & restore volume setting for next time
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.volume = isMuted ? 0 : volume;
          }
          onTimerComplete();
          setSleepTimerMinutes(null);
          isFadingOutRef.current = false;
          return null;
        }

        const next = prev - 1;
        // If within last 30 seconds, perform smooth exponential volume fade-out
        if (next <= 30 && audioRef.current && !isMuted) {
          isFadingOutRef.current = true;
          const factor = Math.pow(Math.max(0, next) / 30, 2);
          audioRef.current.volume = Math.max(0, volume * factor);
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimerRemaining, audioRef, volume, isMuted, onTimerComplete]);

  return {
    sleepTimerMinutes,
    sleepTimerRemaining,
    setSleepTimer,
  };
}
