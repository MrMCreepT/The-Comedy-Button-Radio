import React from 'react';
import { ArrowUpRight } from 'lucide-react';

interface ActionArrowButtonProps {
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  theme?: 'dark' | 'light' | 'coral' | 'yellow';
  size?: 'sm' | 'md' | 'lg';
  title?: string;
  ariaLabel?: string;
}

export const ActionArrowButton: React.FC<ActionArrowButtonProps> = ({
  onClick,
  className = '',
  theme = 'light',
  size = 'md',
  title = 'Open details',
  ariaLabel = 'Open details',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  }[size];

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }[size];

  const themeClasses = {
    light: 'bg-white text-zinc-900 hover:bg-zinc-100 shadow-md',
    dark: 'bg-[#181a20] text-white hover:bg-zinc-800 shadow-md border border-white/10',
    coral: 'bg-[#ff6355] text-white hover:bg-[#fa5344] shadow-md',
    yellow: 'bg-[#f4be47] text-zinc-950 hover:bg-[#eab034] shadow-md',
  }[theme];

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
      className={`rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shrink-0 cursor-pointer ${sizeClasses} ${themeClasses} ${className}`}
    >
      <ArrowUpRight className={`${iconSizes} stroke-[2.5]`} />
    </button>
  );
};
