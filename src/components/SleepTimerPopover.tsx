import React, { useRef, useEffect } from 'react';
import { Moon } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface SleepTimerPopoverProps {
  sleepTimerMinutes: number | null;
  sleepTimerRemaining: number | null;
  onSelectTimer: (minutes: number | null) => void;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const sleepTimerOptions: Array<{ label: string; val: number | null }> = [
  { label: 'Off', val: null },
  { label: '15m', val: 15 },
  { label: '30m', val: 30 },
  { label: '45m', val: 45 },
  { label: '60m', val: 60 },
];

export const SleepTimerPopover: React.FC<SleepTimerPopoverProps> = ({
  sleepTimerMinutes,
  sleepTimerRemaining,
  onSelectTimer,
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
        className={`w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl flex items-center justify-center text-xs font-mono transition-colors cursor-pointer ${
          sleepTimerMinutes
            ? 'text-red-400 bg-red-950/40 border border-red-800/40'
            : 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
        }`}
        title={
          sleepTimerRemaining
            ? `Sleep timer: ${Math.ceil(sleepTimerRemaining / 60)}m remaining`
            : 'Sleep Timer'
        }
        aria-label="Sleep Timer"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <Moon className="w-4 h-4" />
        {sleepTimerRemaining && (
          <span className="text-[10px] font-bold ml-1 text-red-400">
            {Math.ceil(sleepTimerRemaining / 60)}m
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl py-1 z-50 min-w-[90px] flex flex-col"
          role="menu"
          aria-label="Sleep timer options"
        >
          {sleepTimerOptions.map((opt) => (
            <button
              key={opt.label}
              role="menuitem"
              onClick={() => {
                onSelectTimer(opt.val);
                onClose();
              }}
              className={`px-3 py-2 text-xs text-center font-mono font-medium transition-colors cursor-pointer ${
                sleepTimerMinutes === opt.val
                  ? 'bg-red-600 text-white'
                  : 'text-zinc-200 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
