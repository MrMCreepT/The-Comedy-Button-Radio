import { useState, useCallback } from 'react';
import { Episode } from '../types';
import { audioEffects } from '../utils/audioEffects';
import { triggerHaptic } from '../utils/haptics';

interface UseAudioEffectsOptions {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  currentEpisodeRef: React.MutableRefObject<Episode | null>;
}

export function useAudioEffects({ audioRef, currentEpisodeRef }: UseAudioEffectsOptions) {
  const [voiceBoostEnabled, setVoiceBoostEnabled] = useState<boolean>(() => {
    return audioEffects.getVoiceBoost();
  });

  const toggleVoiceBoost = useCallback(() => {
    triggerHaptic(15);
    const nextState = !voiceBoostEnabled;
    setVoiceBoostEnabled(nextState);

    const audio = audioRef.current;
    const ep = currentEpisodeRef.current;

    if (audio && ep) {
      const currentPos = audio.currentTime;
      const wasPlaying = !audio.paused;

      if (nextState) {
        // Voice Boost requires CORS headers, so switch to backend proxy
        audio.src = `/api/audio-proxy?url=${encodeURIComponent(ep.audioUrl)}`;
        const onLoaded = () => {
          if (audioRef.current) {
            try {
              audioRef.current.currentTime = currentPos;
            } catch {}
            audioEffects.init(audioRef.current);
            audioEffects.resume();
            audioEffects.setVoiceBoost(true);
            if (wasPlaying) {
              audioRef.current.play().catch(console.warn);
            }
          }
        };
        audio.addEventListener('loadedmetadata', onLoaded, { once: true });
      } else {
        // Disable Voice Boost: restore native CDN streaming
        audioEffects.setVoiceBoost(false);
        audio.removeAttribute('crossOrigin');
        audio.src = ep.audioUrl;
        const onLoaded = () => {
          if (audioRef.current) {
            try {
              audioRef.current.currentTime = currentPos;
            } catch {}
            if (wasPlaying) {
              audioRef.current.play().catch(console.warn);
            }
          }
        };
        audio.addEventListener('loadedmetadata', onLoaded, { once: true });
      }
    } else {
      audioEffects.setVoiceBoost(nextState);
    }

    return nextState;
  }, [audioRef, currentEpisodeRef, voiceBoostEnabled]);

  return {
    voiceBoostEnabled,
    toggleVoiceBoost,
  };
}
