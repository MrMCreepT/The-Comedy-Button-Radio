import React, { useRef, useEffect } from 'react';
import { triggerHaptic } from '../utils/haptics';

interface PlaybackSpeedPopoverProps {
  playbackRate: number;
  onSelectRate: (rate: number) => void;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const speedOptions = [0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.5, 1.75, 2.0];

export const PlaybackSpeedPopover: React.FC<PlaybackSpeedPopoverProps> = ({
  playbackRate,
  onSelectRate,
  isOpen,
  onToggle,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          triggerHaptic(8);
          onToggle();
        }}
        className={`w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl flex items-center justify-center text-xs font-mono font-bold transition-colors cursor-pointer ${
          playbackRate !== 1
            ? 'text-red-400 bg-red-950/40 border border-red-800/40'
            : 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
        }`}
        title={`Playback Speed: ${playbackRate}x`}
        aria-label={`Playback Speed: ${playbackRate}x`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {playbackRate}x
      </button>

      {isOpen && (
        <div
          className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl py-1 z-50 min-w-[80px] max-h-48 overflow-y-auto flex flex-col"
          role="menu"
          aria-label="Playback speed options"
        >
          {speedOptions.map((rate) => (
            <button
              key={rate}
              role="menuitem"
              onClick={() => {
                onSelectRate(rate);
                onClose();
              }}
              className={`px-3 py-2 text-xs text-left font-mono font-medium transition-colors cursor-pointer ${
                playbackRate === rate
                  ? 'bg-red-600 text-white'
                  : 'text-zinc-200 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
